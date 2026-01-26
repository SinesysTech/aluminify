import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { StudentRepositoryImpl } from "@/app/[tenant]/(modules)/usuario/services";
import { getAuthUser } from "@/app/[tenant]/auth/middleware";
import {
  getEmpresaContext,
  validateEmpresaAccess,
} from "@/app/shared/core/middleware/empresa-context";

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
      return NextResponse.json(
        { error: "Acesso negado. Apenas admin da empresa pode ver alunos." },
        { status: 403 },
      );
    }

    const repository = new StudentRepositoryImpl(supabase);
    const alunos = await repository.findByEmpresa(id);

    return NextResponse.json(alunos);
  } catch (error) {
    console.error("Error listing alunos:", error);
    return NextResponse.json(
      { error: "Erro ao listar alunos" },
      { status: 500 },
    );
  }
}

// GET /api/empresas/[id]/alunos - Listar alunos matriculados em cursos da empresa
export async function GET(request: NextRequest, context: RouteContext) {
  return getHandler(request, context);
}
