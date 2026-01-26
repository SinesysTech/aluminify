import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { createTurmaService, type AlunoTurmaStatus } from "@/app/[tenant]/(modules)/curso/services/turma";

interface RouteParams {
  params: Promise<{ id: string; alunoId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: turmaId, alunoId } = await context.params;

    // Get optional status from query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status") as AlunoTurmaStatus | null;

    const turmaService = createTurmaService(supabase);

    await turmaService.desvincularAluno(turmaId, alunoId, status ?? undefined);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error desvinculando aluno:", error);

    if (error instanceof Error && error.message.includes("não encontrada")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao desvincular aluno" },
      { status: 500 }
    );
  }
}
