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
      horas_necessarias: number;
      horas_disponiveis: number;
      horas_dia_necessarias: number;
      horas_dia_atual: number;
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

