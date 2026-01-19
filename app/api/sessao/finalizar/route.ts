import { NextResponse } from "next/server";
import {
  requireUserAuth,
  AuthenticatedRequest,
} from "@/backend/auth/middleware";
import {
  sessaoEstudoService,
  SessaoEstudoValidationError,
  SessaoEstudoNotFoundError,
} from "@/backend/services/sessao-estudo";
import { SessaoEstudo } from "@/types/sessao-estudo";

function serialize(sessao: SessaoEstudo) {
  const s = sessao as unknown as Record<string, unknown>;
  return {
    id: s.id,
    aluno_id: s.aluno_id || s.alunoId,
    disciplina_id: s.disciplina_id || s.disciplinaId,
    frente_id: s.frente_id || s.frenteId,
    modulo_id: s.modulo_id || s.moduloId,
    atividade_relacionada_id:
      s.atividade_relacionada_id || s.atividadeRelacionadaId,
    inicio: s.inicio,
    fim: s.fim,
    tempo_total_bruto_segundos:
      s.tempo_total_bruto_segundos || s.tempoTotalBrutoSegundos,
    tempo_total_liquido_segundos:
      s.tempo_total_liquido_segundos || s.tempoTotalLiquidoSegundos,
    log_pausas: s.log_pausas || s.logPausas,
    metodo_estudo: s.metodo_estudo || s.metodoEstudo,
    nivel_foco: s.nivel_foco || s.nivelFoco,
    status: s.status,
    created_at: s.created_at || s.createdAt,
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

    console.error("[sessao/finalizar]", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export const PATCH = requireUserAuth(handler);
