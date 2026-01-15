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
  modulo_id: string | null;
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
    moduloId: row.modulo_id,
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
    moduloId?: string;
    atividadeRelacionadaId?: string;
    metodoEstudo?: MetodoEstudo;
    inicioIso?: string;
  }): Promise<SessaoEstudo> {
    const client = getDatabaseClient();

    // Derivar modulo_id quando não vier explicitamente, mas houver atividade relacionada.
    // Isso melhora a qualidade do analytics por módulo sem exigir mudanças imediatas no front.
    let moduloId = input.moduloId ?? null;
    if (!moduloId && input.atividadeRelacionadaId) {
      const { data: atividade, error: atividadeError } = await client
        .from('atividades')
        .select('modulo_id')
        .eq('id', input.atividadeRelacionadaId)
        .maybeSingle<{ modulo_id: string | null }>();

      if (!atividadeError && atividade?.modulo_id) {
        moduloId = atividade.modulo_id;
      }
    }

    const baseInsert = {
      aluno_id: input.alunoId,
      disciplina_id: input.disciplinaId ?? null,
      frente_id: input.frenteId ?? null,
      atividade_relacionada_id: input.atividadeRelacionadaId ?? null,
      metodo_estudo: input.metodoEstudo ?? null,
      inicio: input.inicioIso ?? new Date().toISOString(),
    };

    // Observação: alguns ambientes ainda não aplicaram a migration de `modulo_id`.
    // Tentamos inserir com `modulo_id` e, se o schema cache não conhecer a coluna, fazemos fallback sem ela.
    let data: unknown;
    let error: { message: string } | null = null;

    {
      const attempt = await client
        .from(this.table)
        .insert({ ...baseInsert, modulo_id: moduloId })
        .select()
        .single();
      data = attempt.data;
      error = attempt.error as { message: string } | null;
    }

    if (
      error &&
      typeof error.message === 'string' &&
      error.message.includes("modulo_id") &&
      error.message.includes('schema cache')
    ) {
      const attempt = await client.from(this.table).insert(baseInsert).select().single();
      data = attempt.data;
      error = attempt.error as { message: string } | null;
    }

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

    // Fallback para ambientes sem coluna updated_at (migration não aplicada)
    if (
      error &&
      typeof error.message === 'string' &&
      error.message.includes('updated_at') &&
      error.message.includes('schema cache')
    ) {
      return;
    }

    if (error) {
      throw new Error(`Erro ao registrar heartbeat: ${error.message}`);
    }
  }
}





















