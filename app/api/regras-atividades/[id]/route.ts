import { NextRequest, NextResponse } from "next/server";
import {
  regraAtividadeService,
  RegraAtividadeNotFoundError,
  RegraAtividadeValidationError,
} from "@/app/[tenant]/(dashboard)/atividades/services";
import {
  requireAuth,
  AuthenticatedRequest,
} from "@/app/[tenant]/auth/middleware";

const serializeRegra = (
  regra: Awaited<ReturnType<typeof regraAtividadeService.getById>>,
) => ({
  id: regra.id,
  cursoId: regra.cursoId,
  tipoAtividade: regra.tipoAtividade,
  nomePadrao: regra.nomePadrao,
  frequenciaModulos: regra.frequenciaModulos,
  comecarNoModulo: regra.comecarNoModulo,
  acumulativo: regra.acumulativo,
  acumulativoDesdeInicio: regra.acumulativoDesdeInicio,
  gerarNoUltimo: regra.gerarNoUltimo,
  createdAt: regra.createdAt.toISOString(),
  updatedAt: regra.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof RegraAtividadeValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (error instanceof RegraAtividadeNotFoundError) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  console.error(error);

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}

async function ensureProfessor(request: AuthenticatedRequest) {
  if (
    request.user &&
    request.user.role !== "usuario" &&
    request.user.role !== "superadmin"
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

interface RouteContext {
  params: Promise<{ id: string }>;
}

async function patchHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  const forbidden = await ensureProfessor(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const regra = await regraAtividadeService.update(params.id, {
      tipoAtividade: body?.tipo_atividade,
      nomePadrao: body?.nome_padrao,
      frequenciaModulos: body?.frequencia_modulos,
      comecarNoModulo: body?.comecar_no_modulo,
      acumulativo: body?.acumulativo,
      acumulativoDesdeInicio: body?.acumulativo_desde_inicio,
      gerarNoUltimo: body?.gerar_no_ultimo,
    });

    return NextResponse.json({ data: serializeRegra(regra) });
  } catch (error) {
    return handleError(error);
  }
}

async function deleteHandler(
  request: AuthenticatedRequest,
  params: { id: string },
) {
  const forbidden = await ensureProfessor(request);
  if (forbidden) return forbidden;

  try {
    await regraAtividadeService.delete(params.id);
    return NextResponse.json({ message: "Regra removida com sucesso" });
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => patchHandler(req, params))(request);
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const params = await context.params;
  return requireAuth((req) => deleteHandler(req, params))(request);
}
