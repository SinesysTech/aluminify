import { NextRequest, NextResponse } from "next/server";
import {
  atividadeService,
  AtividadeNotFoundError,
  AtividadeValidationError,
} from "@/app/[tenant]/(modules)/sala-de-estudos/services/atividades";
import { requireAuth, AuthenticatedRequest } from "@/app/[tenant]/auth/middleware";

const serializeAtividade = (
  atividade: Awaited<ReturnType<typeof atividadeService.getById>>,
) => {
  const a = atividade as unknown as Record<string, unknown>;
  return {
    id: a.id as string,
    moduloId: (a.moduloId || a.modulo_id) as string,
    tipo: a.tipo as string,
    titulo: a.titulo as string,
    arquivoUrl: (a.arquivoUrl || a.arquivo_url) as string,
    gabaritoUrl: (a.gabaritoUrl || a.gabarito_url) as string,
    linkExterno: (a.linkExterno || a.link_externo) as string,
    obrigatorio: a.obrigatorio as boolean,
    ordemExibicao: (a.ordemExibicao || a.ordem_exibicao) as number,
    createdAt:
      (a.createdAt as { toISOString?: () => string })?.toISOString?.() ||
      (a.created_at as string),
    updatedAt:
      (a.updatedAt as { toISOString?: () => string })?.toISOString?.() ||
      (a.updated_at as string),
  };
};

function handleError(error: unknown) {
  if (error instanceof AtividadeNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  if (error instanceof AtividadeValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET - Buscar atividade por ID
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const atividade = await atividadeService.getById(params.id);
    return NextResponse.json({ data: serializeAtividade(atividade) });
  } catch (error) {
    return handleError(error);
  }
}

// PATCH - Atualizar atividade (especialmente arquivo_url após upload direto)
async function patchHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  if (
    request.user &&
    request.user.role !== "usuario" &&
    request.user.role !== "superadmin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    const atividade = await atividadeService.update(params.id, {
      arquivoUrl: body?.arquivoUrl,
      gabaritoUrl: body?.gabaritoUrl,
      linkExterno: body?.linkExterno,
      titulo: body?.titulo,
      obrigatorio: body?.obrigatorio,
      ordemExibicao: body?.ordemExibicao,
    });

    return NextResponse.json({ data: serializeAtividade(atividade) });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => patchHandler(req, params))(request);
}

async function deleteHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  if (
    request.user &&
    request.user.role !== "usuario" &&
    request.user.role !== "superadmin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await atividadeService.delete(params.id);
    return NextResponse.json({ message: "Atividade removida com sucesso" });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => deleteHandler(req, params))(request);
}
