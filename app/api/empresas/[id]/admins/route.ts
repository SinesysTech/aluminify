import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/backend/middleware/empresa-context";

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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

    const { data: admins, error } = await supabase
      .from("empresa_admins")
      .select("*, professores:user_id(*)")
      .eq("empresa_id", id);

    if (error) {
      throw error;
    }

    return NextResponse.json(admins);
  } catch (error) {
    console.error("Error listing admins:", error);
    return NextResponse.json(
      { error: "Erro ao listar admins" },
      { status: 500 },
    );
  }
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }

    const supabase = await createClient();

    const body = await request.json();
    const { professorId } = body;

    if (!professorId) {
      return NextResponse.json(
        { error: "professorId é obrigatório" },
        { status: 400 },
      );
    }

    const context = await getEmpresaContext(supabase, user.id, request, user);

    // Verificar se é owner ou superadmin
    const { data: isOwner } = await supabase
      .from("empresa_admins")
      .select("is_owner")
      .eq("empresa_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (
      !context.isSuperAdmin &&
      (!validateEmpresaAccess(context, id) || !isOwner?.is_owner)
    ) {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas owner ou superadmin pode adicionar admins.",
        },
        { status: 403 },
      );
    }

    // Verificar se professor pertence à empresa
    const { data: professor } = await supabase
      .from("professores")
      .select("empresa_id")
      .eq("id", professorId)
      .eq("empresa_id", id)
      .maybeSingle();

    if (!professor) {
      return NextResponse.json(
        { error: "Professor não encontrado ou não pertence à empresa" },
        { status: 404 },
      );
    }

    // Adicionar como admin
    const { error: insertError } = await supabase
      .from("empresa_admins")
      .insert({
        empresa_id: id,
        user_id: professorId,
        is_owner: false,
        permissoes: {},
      });

    if (insertError) {
      throw insertError;
    }

    // Atualizar is_admin na tabela professores
    await supabase
      .from("professores")
      .update({ is_admin: true })
      .eq("id", professorId);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error adding admin:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Erro ao adicionar admin";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET /api/empresas/[id]/admins - Listar admins da empresa
export async function GET(request: NextRequest, context: RouteContext) {
  return getHandler(request, context);
}

// POST /api/empresas/[id]/admins - Adicionar admin
export async function POST(request: NextRequest, context: RouteContext) {
  return postHandler(request, context);
}
