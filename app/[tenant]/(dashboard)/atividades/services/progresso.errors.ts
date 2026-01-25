export class ProgressoNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressoNotFoundError';
  }
}

export class ProgressoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressoValidationError';
  }
}

export class ProgressoConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProgressoConflictError';
  }
}



