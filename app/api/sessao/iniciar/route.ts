import { NextResponse } from 'next/server';
import { requireUserAuth, AuthenticatedRequest } from '@/backend/auth/middleware';
import {
  sessaoEstudoService,
  SessaoEstudoValidationError,
} from '@/backend/services/sessao-estudo';
import { SessaoEstudo } from '@/types/sessao-estudo';

function serialize(sessao: SessaoEstudo) {
  return {
    id: sessao.id,
    aluno_id: sessao.alunoId,
    disciplina_id: sessao.disciplinaId,
    frente_id: sessao.frenteId,
    modulo_id: sessao.moduloId,
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
    const sessao = await sessaoEstudoService.iniciarSessao(request.user!.id, {
      disciplinaId: body?.disciplina_id ?? undefined,
      frenteId: body?.frente_id ?? undefined,
      moduloId: body?.modulo_id ?? undefined,
      atividadeRelacionadaId: body?.atividade_relacionada_id ?? undefined,
      metodoEstudo: body?.metodo_estudo ?? undefined,
      inicioIso: body?.inicio ?? undefined,
    });

    return NextResponse.json({ data: serialize(sessao) }, { status: 201 });
  } catch (error) {
    if (error instanceof SessaoEstudoValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.error('[sessao/iniciar]', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export const POST = requireUserAuth(handler);





















