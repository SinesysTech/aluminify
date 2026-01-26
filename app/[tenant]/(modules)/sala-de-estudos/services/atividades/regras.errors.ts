export class RegraAtividadeValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RegraAtividadeValidationError';
  }
}

export class RegraAtividadeNotFoundError extends Error {
  constructor(id: string) {
    super(`Regra de atividade ${id} não encontrada`);
    this.name = 'RegraAtividadeNotFoundError';
  }
}
