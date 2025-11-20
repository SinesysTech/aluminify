export class DisciplineValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisciplineValidationError';
  }
}

export class DisciplineConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisciplineConflictError';
  }
}

export class DisciplineNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DisciplineNotFoundError';
  }
}


