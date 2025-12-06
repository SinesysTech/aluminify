import { NextRequest, NextResponse } from 'next/server';
import {
  regraAtividadeService,
  RegraAtividadeValidationError,
} from '@/backend/services/regras-atividade';
import { requireAuth, AuthenticatedRequest } from '@/backend/auth/middleware';

const serializeRegra = (regra: Awaited<ReturnType<typeof regraAtividadeService.getById>>) => ({
  id: regra.id,
  cursoId: regra.cursoId,
  tipoAtividade: regra.tipoAtividade,
  nomePadrao: regra.nomePadrao,
  frequenciaModulos: regra.frequenciaModulos,
  comecarNoModulo: regra.comecarNoModulo,
  acumulativo: regra.acumulativo,
  gerarNoUltimo: regra.gerarNoUltimo,
  createdAt: regra.createdAt.toISOString(),
  updatedAt: regra.updatedAt.toISOString(),
});

function handleError(error: unknown) {
  if (error instanceof RegraAtividadeValidationError) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  console.error(error);

  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

async function ensureProfessor(request: AuthenticatedRequest) {
  if (request.user && request.user.role !== 'professor' && request.user.role !== 'superadmin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

async function getHandler(request: AuthenticatedRequest) {
  const forbidden = await ensureProfessor(request);
  if (forbidden) return forbidden;

  try {
    const { searchParams } = new URL(request.url);
    const cursoId = searchParams.get('curso_id');

    if (!cursoId) {
      return NextResponse.json({ error: 'curso_id é obrigatório' }, { status: 400 });
    }

    const regras = await regraAtividadeService.listByCurso(cursoId);
    return NextResponse.json({ data: regras.map(serializeRegra) });
  } catch (error) {
    return handleError(error);
  }
}

async function postHandler(request: AuthenticatedRequest) {
  const forbidden = await ensureProfessor(request);
  if (forbidden) return forbidden;

  try {
    const body = await request.json();
    const regra = await regraAtividadeService.create({
      cursoId: body?.curso_id,
      tipoAtividade: body?.tipo_atividade,
      nomePadrao: body?.nome_padrao,
      frequenciaModulos: body?.frequencia_modulos,
      comecarNoModulo: body?.comecar_no_modulo,
      acumulativo: body?.acumulativo,
      gerarNoUltimo: body?.gerar_no_ultimo,
    });

    return NextResponse.json({ data: serializeRegra(regra) }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}

export const GET = requireAuth(getHandler);
export const POST = requireAuth(postHandler);
