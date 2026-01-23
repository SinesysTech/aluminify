import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/server";
import { createTurmaService } from "@/backend/services/turma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: turmaId } = await context.params;
    const turmaService = createTurmaService(supabase);

    const alunos = await turmaService.getAlunosDaTurma(turmaId);

    return NextResponse.json({ data: alunos });
  } catch (error) {
    console.error("Error getting alunos da turma:", error);

    if (error instanceof Error && error.message.includes("não encontrada")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar alunos" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, context: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: turmaId } = await context.params;
    const body = await request.json();

    const turmaService = createTurmaService(supabase);

    // Support both single aluno and array of alunos
    if (Array.isArray(body.alunoIds)) {
      const result = await turmaService.vincularAlunos(turmaId, body.alunoIds);
      return NextResponse.json({ data: result }, { status: 201 });
    }

    if (!body.alunoId) {
      return NextResponse.json(
        { error: "alunoId é obrigatório" },
        { status: 400 }
      );
    }

    await turmaService.vincularAluno(turmaId, body.alunoId, body.dataEntrada);

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error vinculando aluno:", error);

    if (error instanceof Error) {
      if (error.message.includes("não encontrada")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("já está vinculado")) {
        return NextResponse.json({ error: error.message }, { status: 409 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao vincular aluno" },
      { status: 500 }
    );
  }
}
