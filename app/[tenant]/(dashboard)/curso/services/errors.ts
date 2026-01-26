export class CourseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseValidationError';
  }
}

export class CourseConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseConflictError';
  }
}

export class CourseNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseNotFoundError';
  }
}

export class CourseMaterialNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseMaterialNotFoundError';
  }
}

export class CourseMaterialValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'CourseMaterialValidationError';
  }
}
