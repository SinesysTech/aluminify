export class CronogramaValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CronogramaValidationError';
  }
}

export class CronogramaTempoInsuficienteError extends Error {
  constructor(
    message: string,
    public readonly detalhes: {
      // Detalhes clássicos (viabilidade total)
      horas_necessarias?: number;
      horas_disponiveis?: number;
      horas_dia_necessarias?: number;
      horas_dia_atual?: number;

      // Detalhes adicionais (viabilidade semanal / novas regras)
      minimo_semanal_necessario_minutos?: number;
      capacidade_semanal_minutos?: number;
      total_frentes?: number;
      total_disciplinas?: number;
      regra?: string;

      [key: string]: unknown;
    },
  ) {
    super(message);
    this.name = 'CronogramaTempoInsuficienteError';
  }
}

export class CronogramaNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CronogramaNotFoundError';
  }
}

export class CronogramaConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CronogramaConflictError';
  }
}

