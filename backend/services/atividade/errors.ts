export class AtividadeNotFoundError extends Error {
  constructor(id?: string) {
    super(id ? `Atividade with id ${id} not found` : 'Atividade not found');
    this.name = 'AtividadeNotFoundError';
  }
}

export class AtividadeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtividadeValidationError';
  }
}

export class AtividadeConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AtividadeConflictError';
  }
}

