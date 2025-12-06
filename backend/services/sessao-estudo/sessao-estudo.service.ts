import {
  CalculoTempoResultado,
  FinalizarSessaoInput,
  IniciarSessaoInput,
  LogPausa,
  SessaoEstudo,
} from '@/types/sessao-estudo';
import { SessaoEstudoRepository } from './sessao-estudo.repository';
import { SessaoEstudoNotFoundError, SessaoEstudoValidationError } from './errors';

function isISODate(value: string): boolean {
  return !Number.isNaN(Date.parse(value));
}

function parseLogPausas(logs: LogPausa[]): LogPausa[] {
  if (!Array.isArray(logs)) {
    throw new SessaoEstudoValidationError('log_pausas deve ser um array');
  }

  return logs.map((log, index) => {
    if (!log || typeof log !== 'object') {
      throw new SessaoEstudoValidationError(`log_pausas[${index}] inválido`);
    }
    if (!log.inicio || !log.fim) {
      throw new SessaoEstudoValidationError(`log_pausas[${index}] precisa de inicio e fim`);
    }
    if (!isISODate(log.inicio) || !isISODate(log.fim)) {
      throw new SessaoEstudoValidationError(`log_pausas[${index}] deve usar datas ISO`);
    }
    if (log.tipo !== 'manual' && log.tipo !== 'distracao') {
      throw new SessaoEstudoValidationError(`log_pausas[${index}].tipo inválido`);
    }

    return {
      inicio: log.inicio,
      fim: log.fim,
      tipo: log.tipo,
    };
  });
}

function calcularTempos(
  inicioIso: string,
  fimIso: string,
  logPausas: LogPausa[],
): CalculoTempoResultado {
  if (!isISODate(inicioIso) || !isISODate(fimIso)) {
    throw new SessaoEstudoValidationError('Datas de início e fim devem estar em ISO válido');
  }

  const inicioMs = Date.parse(inicioIso);
  const fimMs = Date.parse(fimIso);

  if (fimMs <= inicioMs) {
    throw new SessaoEstudoValidationError('Fim deve ser maior que início');
  }

  const brutoMs = fimMs - inicioMs;
  let totalPausasMs = 0;

  for (const pausa of logPausas) {
    const pausaInicio = Date.parse(pausa.inicio);
    const pausaFim = Date.parse(pausa.fim);

    if (Number.isNaN(pausaInicio) || Number.isNaN(pausaFim) || pausaFim <= pausaInicio) {
      throw new SessaoEstudoValidationError('Intervalo de pausa inválido');
    }

    // Clamping para evitar que pausas extrapolem os limites da sessão
    const clampedInicio = Math.max(pausaInicio, inicioMs);
    const clampedFim = Math.min(pausaFim, fimMs);

    if (clampedFim > clampedInicio) {
      totalPausasMs += clampedFim - clampedInicio;
    }
  }

  const tempoTotalBrutoSegundos = Math.round(brutoMs / 1000);
  const tempoTotalLiquidoSegundos = Math.max(
    0,
    tempoTotalBrutoSegundos - Math.round(totalPausasMs / 1000),
  );

  return {
    tempoTotalBrutoSegundos,
    tempoTotalLiquidoSegundos,
  };
}

export class SessaoEstudoService {
  constructor(private readonly repository: SessaoEstudoRepository) {}

  async iniciarSessao(alunoId: string, input: IniciarSessaoInput): Promise<SessaoEstudo> {
    if (!alunoId) {
      throw new SessaoEstudoValidationError('aluno_id é obrigatório');
    }
    if (input.inicioIso && !isISODate(input.inicioIso)) {
      throw new SessaoEstudoValidationError('inicio deve ser uma data ISO válida');
    }

    return this.repository.create({
      alunoId,
      disciplinaId: input.disciplinaId,
      frenteId: input.frenteId,
      atividadeRelacionadaId: input.atividadeRelacionadaId,
      metodoEstudo: input.metodoEstudo,
      inicioIso: input.inicioIso,
    });
  }

  async finalizarSessao(alunoId: string, input: FinalizarSessaoInput): Promise<SessaoEstudo> {
    if (!alunoId) {
      throw new SessaoEstudoValidationError('aluno_id é obrigatório');
    }
    if (!input.sessaoId) {
      throw new SessaoEstudoValidationError('sessao_id é obrigatório');
    }

    const sessao = await this.repository.findById(input.sessaoId);
    if (!sessao || sessao.alunoId !== alunoId) {
      throw new SessaoEstudoNotFoundError(input.sessaoId);
    }
    if (sessao.status === 'concluido' || sessao.status === 'descartado') {
      throw new SessaoEstudoValidationError('Sessão já finalizada');
    }

    const fimIso = input.fimIso ?? new Date().toISOString();
    const logPausas = parseLogPausas(input.logPausas ?? []);
    const { tempoTotalBrutoSegundos, tempoTotalLiquidoSegundos } = calcularTempos(
      sessao.inicio,
      fimIso,
      logPausas,
    );

    return this.repository.updateFinalizacao(input.sessaoId, alunoId, {
      fimIso,
      logPausas,
      tempoTotalBrutoSegundos,
      tempoTotalLiquidoSegundos,
      nivelFoco: input.nivelFoco,
      status: input.status ?? 'concluido',
    });
  }

  async heartbeat(alunoId: string, sessaoId: string): Promise<void> {
    if (!alunoId) {
      throw new SessaoEstudoValidationError('aluno_id é obrigatório');
    }
    if (!sessaoId) {
      throw new SessaoEstudoValidationError('sessao_id é obrigatório');
    }

    const sessao = await this.repository.findById(sessaoId);
    if (!sessao || sessao.alunoId !== alunoId) {
      throw new SessaoEstudoNotFoundError(sessaoId);
    }
    if (sessao.status === 'concluido' || sessao.status === 'descartado') {
      throw new SessaoEstudoValidationError('Sessão já finalizada');
    }

    await this.repository.heartbeat(sessaoId, alunoId);
  }
}

export const sessaoEstudoService = new SessaoEstudoService(new SessaoEstudoRepository());
