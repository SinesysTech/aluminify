export class EnrollmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnrollmentValidationError';
  }
}

export class EnrollmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnrollmentConflictError';
  }
}

export class EnrollmentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnrollmentNotFoundError';
  }
}

