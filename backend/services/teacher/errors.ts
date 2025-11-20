export class TeacherValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeacherValidationError';
  }
}

export class TeacherConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeacherConflictError';
  }
}

export class TeacherNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeacherNotFoundError';
  }
}

