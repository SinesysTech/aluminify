import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/app/shared/core/database.types";
import { createClient } from "@/app/shared/core/server";
import { TeacherRepositoryImpl } from "@/app/[tenant]/(dashboard)/professor/services";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/backend/middleware/empresa-context";

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

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const repository = new TeacherRepositoryImpl(supabase);
    const professores = await repository.findByEmpresa(id);

    return NextResponse.json(professores);
  } catch (error) {
    console.error("Error listing professores:", error);
    return NextResponse.json(
      { error: "Erro ao listar professores" },
      { status: 500 }
    );
  }
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const context = await getEmpresaContext(supabase, user.id, request, user);
    if (!validateEmpresaAccess(context, id) && !context.isSuperAdmin) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas admin da empresa pode adicionar professores.",
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, fullName, password, isAdmin } = body;

    if (!email || !fullName || !password) {
      return NextResponse.json(
        { error: "email, fullName e password são obrigatórios" },
        { status: 400 }
      );
    }

    // Usar cliente admin para criar usuário (requer service_role key)
    const adminClient = createAdminClient();
    const { data: newUser, error: userError } =
      await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role: "professor",
          full_name: fullName,
          empresa_id: id,
          is_admin: isAdmin || false,
        },
      });

    if (userError) {
      throw userError;
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: "Erro ao criar usuário" },
        { status: 500 }
      );
    }

    // O registro de professor será criado automaticamente pela trigger handle_new_user
    // Aguardar um pouco para a trigger completar e tentar buscar o professor
    const repository = new TeacherRepositoryImpl(supabase);

    // Retry logic: tentar buscar até 3 vezes com delay
    let professor = null;
    for (let i = 0; i < 3; i++) {
      professor = await repository.findById(newUser.user.id);
      if (professor) break;

      // Aguardar antes de tentar novamente
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    if (!professor) {
      console.error("Professor record not created by trigger after retries", {
        userId: newUser.user.id,
        email,
        empresaId: id,
      });
      return NextResponse.json(
        {
          error:
            "Usuário criado mas registro de professor não foi criado automaticamente. Entre em contato com o suporte.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(professor, { status: 201 });
  } catch (error) {
    console.error("Error creating professor:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao criar professor";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET /api/empresas/[id]/professores - Listar professores da empresa
export async function GET(request: NextRequest, context: RouteContext) {
  return getHandler(request, context);
}

// POST /api/empresas/[id]/professores - Adicionar professor
export async function POST(request: NextRequest, context: RouteContext) {
  return postHandler(request, context);
}
