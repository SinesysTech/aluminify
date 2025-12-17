export class SessaoEstudoNotFoundError extends Error {
  constructor(id: string) {
    super(`Sessão de estudo ${id} não encontrada`);
    this.name = 'SessaoEstudoNotFoundError';
  }
}

export class SessaoEstudoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SessaoEstudoValidationError';
  }
}



















