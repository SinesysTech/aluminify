import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import { createClient } from "@/app/shared/core/server";
import { UsuarioRepositoryImpl } from "@/app/[tenant]/(dashboard)/usuario/services";
import { PapelRepositoryImpl } from "@/app/[tenant]/(dashboard)/admin/services";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/app/shared/core/middleware/empresa-context";
import type { CreateUsuarioInput } from "@/types/shared/entities/usuario";

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY!;

  return createSupabaseClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/empresas/[id]/usuarios
 * Lista todos os usuários (staff) da empresa
 */
export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Check permission to view usuarios
    if (!user.isSuperAdmin && !user.permissions?.usuarios?.view) {
      return NextResponse.json(
        { error: "Sem permissão para visualizar usuários" },
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const includeInactive = url.searchParams.get("includeInactive") === "true";

    const repository = new UsuarioRepositoryImpl(supabase);
    const usuarios = await repository.listByEmpresaWithPapel(id, includeInactive);

    return NextResponse.json(usuarios);
  } catch (error) {
    console.error("Error listing usuarios:", error);
    return NextResponse.json(
      { error: "Erro ao listar usuários" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/empresas/[id]/usuarios
 * Cria um novo usuário (staff) para a empresa
 */
export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    // Check permission to create usuarios
    if (!user.isSuperAdmin && !user.permissions?.usuarios?.create) {
      return NextResponse.json(
        { error: "Sem permissão para criar usuários" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      email,
      nomeCompleto,
      papelId,
      password,
      cpf,
      telefone,
      chavePix,
      biografia,
      especialidade,
    } = body;

    if (!email || !nomeCompleto || !papelId || !password) {
      return NextResponse.json(
        { error: "email, nomeCompleto, papelId e password são obrigatórios" },
        { status: 400 }
      );
    }

    // Verify papel exists and belongs to empresa or is system
    const papelRepository = new PapelRepositoryImpl(supabase);
    const papel = await papelRepository.findById(papelId);
    if (!papel) {
      return NextResponse.json(
        { error: "Papel não encontrado" },
        { status: 404 }
      );
    }

    if (papel.empresaId !== null && papel.empresaId !== id) {
      return NextResponse.json(
        { error: "Papel não pertence a esta empresa" },
        { status: 400 }
      );
    }

    // Create auth user
    const adminClient = createAdminClient();
    const { data: newUser, error: userError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "usuario",
          full_name: nomeCompleto,
          empresa_id: id,
        },
      });

    if (userError) {
      throw userError;
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: "Erro ao criar usuário de autenticação" },
        { status: 500 }
      );
    }

    // Create usuario record
    const usuarioRepository = new UsuarioRepositoryImpl(supabase);
    const input: CreateUsuarioInput = {
      id: newUser.user.id,
      empresaId: id,
      papelId,
      nomeCompleto,
      email,
      cpf,
      telefone,
      chavePix,
      biografia,
      especialidade,
    };

    const usuario = await usuarioRepository.create(input);

    return NextResponse.json(usuario, { status: 201 });
  } catch (error) {
    console.error("Error creating usuario:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar usuário";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
