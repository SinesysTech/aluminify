export class SegmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SegmentValidationError';
  }
}

export class SegmentConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SegmentConflictError';
  }
}

export class SegmentNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SegmentNotFoundError';
  }
}

