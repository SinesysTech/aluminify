export class StudentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudentValidationError';
  }
}

export class StudentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudentConflictError';
  }
}

export class StudentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StudentNotFoundError';
  }
}

