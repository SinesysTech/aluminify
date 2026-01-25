import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { createTurmaService } from "@/app/[tenant]/(dashboard)/curso/services/turma";

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

    const { id } = await context.params;
    const turmaService = createTurmaService(supabase);

    const turma = await turmaService.getById(id);

    if (!turma) {
      return NextResponse.json({ error: "Turma não encontrada" }, { status: 404 });
    }

    return NextResponse.json({ data: turma });
  } catch (error) {
    console.error("Error getting turma:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao buscar turma" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteParams) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const turmaService = createTurmaService(supabase);

    const turma = await turmaService.update(id, {
      nome: body.nome,
      dataInicio: body.dataInicio,
      dataFim: body.dataFim,
      acessoAposTermino: body.acessoAposTermino,
      diasAcessoExtra: body.diasAcessoExtra,
      ativo: body.ativo,
    });

    return NextResponse.json({ data: turma });
  } catch (error) {
    console.error("Error updating turma:", error);

    if (error instanceof Error) {
      if (error.message.includes("não encontrada")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("não pode ser")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao atualizar turma" },
      { status: 500 }
    );
  }
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

    const { id } = await context.params;
    const turmaService = createTurmaService(supabase);

    await turmaService.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting turma:", error);

    if (error instanceof Error && error.message.includes("não encontrada")) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao excluir turma" },
      { status: 500 }
    );
  }
}
