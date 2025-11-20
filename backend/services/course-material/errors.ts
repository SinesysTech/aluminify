export class CourseMaterialValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseMaterialValidationError';
  }
}

export class CourseMaterialNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseMaterialNotFoundError';
  }
}

