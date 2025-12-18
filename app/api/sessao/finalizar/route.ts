import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import {
  sessaoEstudoService,
  SessaoEstudoValidationError,
  SessaoEstudoNotFoundError,
} from '@/backend/services/sessao-estudo';
import { SessaoEstudo } from '@/types/sessao-estudo';

function serialize(sessao: SessaoEstudo) {
  return {
    id: sessao.id,
    aluno_id: sessao.alunoId,
    disciplina_id: sessao.disciplinaId,
    frente_id: sessao.frenteId,
    atividade_relacionada_id: sessao.atividadeRelacionadaId,
    inicio: sessao.inicio,
    fim: sessao.fim,
    tempo_total_bruto_segundos: sessao.tempoTotalBrutoSegundos,
    tempo_total_liquido_segundos: sessao.tempoTotalLiquidoSegundos,
    log_pausas: sessao.logPausas,
    metodo_estudo: sessao.metodoEstudo,
    nivel_foco: sessao.nivelFoco,
    status: sessao.status,
    created_at: sessao.createdAt,
  };
}

async function handler(request: AuthenticatedRequest) {
  try {
    const body = await request.json();
    const sessao = await sessaoEstudoService.finalizarSessao(request.user!.id, {
      sessaoId: body?.sessao_id,
      logPausas: body?.log_pausas ?? [],
      fimIso: body?.fim ?? undefined,
      nivelFoco: body?.nivel_foco ?? undefined,
      status: body?.status ?? undefined,
    });

    return NextResponse.json({ data: serialize(sessao) });
  } catch (error) {
    if (error instanceof SessaoEstudoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof SessaoEstudoNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    console.error('[sessao/finalizar]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export const PATCH = requireUserAuth(handler);




















