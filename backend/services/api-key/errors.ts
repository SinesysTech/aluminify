export class ApiKeyValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyValidationError';
  }
}

export class ApiKeyNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyNotFoundError';
  }
}

export class ApiKeyExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyExpiredError';
  }
}

export class ApiKeyInactiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyInactiveError';
  }
}

