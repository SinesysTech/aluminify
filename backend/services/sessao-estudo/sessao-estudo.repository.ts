import { getDatabaseClient } from '@/backend/clients/database';
import {
  MetodoEstudo,
  SessaoEstudo,
  SessaoStatus,
  LogPausa,
} from '@/types/sessao-estudo';

type SessaoEstudoRow = {
  id: string;
  aluno_id: string;
  disciplina_id: string | null;
  frente_id: string | null;
  atividade_relacionada_id: string | null;
  inicio: string;
  fim: string | null;
  tempo_total_bruto_segundos: number | null;
  tempo_total_liquido_segundos: number | null;
  log_pausas: LogPausa[] | null;
  metodo_estudo: MetodoEstudo | null;
  nivel_foco: number | null;
  status: SessaoStatus;
  created_at: string;
};

function mapRowToModel(row: SessaoEstudoRow): SessaoEstudo {
  return {
    id: row.id,
    alunoId: row.aluno_id,
    disciplinaId: row.disciplina_id,
    frenteId: row.frente_id,
    atividadeRelacionadaId: row.atividade_relacionada_id,
    inicio: row.inicio,
    fim: row.fim,
    tempoTotalBrutoSegundos: row.tempo_total_bruto_segundos,
    tempoTotalLiquidoSegundos: row.tempo_total_liquido_segundos,
    logPausas: (row.log_pausas ?? []) as LogPausa[],
    metodoEstudo: row.metodo_estudo,
    nivelFoco: row.nivel_foco,
    status: row.status,
    createdAt: row.created_at,
  };
}

export class SessaoEstudoRepository {
  constructor(private readonly table = 'sessoes_estudo') {}

  async create(input: {
    alunoId: string;
    disciplinaId?: string;
    frenteId?: string;
    atividadeRelacionadaId?: string;
    metodoEstudo?: MetodoEstudo;
    inicioIso?: string;
  }): Promise<SessaoEstudo> {
    const client = getDatabaseClient();
    const { data, error } = await client
      .from(this.table)
      .insert({
        aluno_id: input.alunoId,
        disciplina_id: input.disciplinaId ?? null,
        frente_id: input.frenteId ?? null,
        atividade_relacionada_id: input.atividadeRelacionadaId ?? null,
        metodo_estudo: input.metodoEstudo ?? null,
        inicio: input.inicioIso ?? new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao criar sessão de estudo: ${error.message}`);
    }

    return mapRowToModel(data as SessaoEstudoRow);
  }

  async findById(id: string): Promise<SessaoEstudo | null> {
    const client = getDatabaseClient();
    const { data, error } = await client.from(this.table).select('*').eq('id', id).maybeSingle();
    if (error) {
      throw new Error(`Erro ao buscar sessão de estudo: ${error.message}`);
    }
    return data ? mapRowToModel(data as SessaoEstudoRow) : null;
  }

  async updateFinalizacao(
    id: string,
    alunoId: string,
    payload: {
      fimIso: string;
      logPausas: LogPausa[];
      tempoTotalBrutoSegundos: number;
      tempoTotalLiquidoSegundos: number;
      nivelFoco?: number;
      status?: SessaoStatus;
    },
  ): Promise<SessaoEstudo> {
    const client = getDatabaseClient();
    const { data, error } = await client
      .from(this.table)
      .update({
        fim: payload.fimIso,
        log_pausas: payload.logPausas,
        tempo_total_bruto_segundos: payload.tempoTotalBrutoSegundos,
        tempo_total_liquido_segundos: payload.tempoTotalLiquidoSegundos,
        nivel_foco: payload.nivelFoco ?? null,
        status: payload.status ?? 'concluido',
      })
      .eq('id', id)
      .eq('aluno_id', alunoId)
      .select()
      .single();

    if (error) {
      throw new Error(`Erro ao finalizar sessão de estudo: ${error.message}`);
    }

    return mapRowToModel(data as SessaoEstudoRow);
  }

  async heartbeat(id: string, alunoId: string): Promise<void> {
    const client = getDatabaseClient();
    const { error } = await client
      .from(this.table)
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('aluno_id', alunoId);

    if (error) {
      throw new Error(`Erro ao registrar heartbeat: ${error.message}`);
    }
  }
}




