import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/shared/core/server";
import { createTurmaService } from "@/app/[tenant]/(modules)/curso/services/turma";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const cursoId = searchParams.get("cursoId");
    const ativo = searchParams.get("ativo");

    const turmaService = createTurmaService(supabase);

    if (cursoId) {
      // List turmas for a specific course
      const turmas = await turmaService.listByCurso(cursoId);
      return NextResponse.json({ data: turmas });
    }

    // List all turmas for the empresa (filtered by RLS)
    const filters: { ativo?: boolean } = {};
    if (ativo !== null) {
      filters.ativo = ativo === "true";
    }

    const turmas = await turmaService.listByEmpresa();
    return NextResponse.json({ data: turmas });
  } catch (error) {
    console.error("Error listing turmas:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao listar turmas" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    if (!body.cursoId) {
      return NextResponse.json(
        { error: "cursoId é obrigatório" },
        { status: 400 }
      );
    }

    if (!body.nome || body.nome.trim().length === 0) {
      return NextResponse.json(
        { error: "nome é obrigatório" },
        { status: 400 }
      );
    }

    const turmaService = createTurmaService(supabase);

    const turma = await turmaService.create({
      cursoId: body.cursoId,
      nome: body.nome.trim(),
      dataInicio: body.dataInicio ?? null,
      dataFim: body.dataFim ?? null,
      acessoAposTermino: body.acessoAposTermino ?? false,
      diasAcessoExtra: body.diasAcessoExtra ?? 0,
    });

    return NextResponse.json({ data: turma }, { status: 201 });
  } catch (error) {
    console.error("Error creating turma:", error);

    if (error instanceof Error) {
      if (error.message.includes("não encontrado")) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      if (error.message.includes("obrigatório") || error.message.includes("não pode ser")) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro ao criar turma" },
      { status: 500 }
    );
  }
}
