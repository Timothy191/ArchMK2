/**
 * @repo/errors - Standardized error handling for Arch Systems
 *
 * Domain-specific error classes with HTTP status mapping and error codes.
 * Use these instead of generic Error for better error handling.
 */

/**
 * Base application error class
 * All domain errors extend this class
 */
export class AppError extends Error {
  /**
   * Machine-readable error code
   * @example 'VALIDATION_ERROR', 'AUTH_ERROR', 'API_ERROR'
   */
  readonly code: string;

  /**
   * HTTP status code for API responses
   * @example 400, 401, 403, 404, 500
   */
  readonly statusCode?: number;

  /**
   * Additional context for the error
   * @example { field: 'email', value: 'invalid' }
   */
  readonly context?: Record<string, unknown>;

  /**
   * Original error that caused this error (for error chaining)
   */
  readonly cause?: Error;

  constructor(
    message: string,
    code: string,
    options?: {
      statusCode?: number;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = options?.statusCode;
    this.context = options?.context;
    this.cause = options?.cause;

    // Maintain proper stack trace in V8 environments
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convert error to a JSON-serializable object
   * Safe to send to clients (no stack traces)
   */
  toJSON(): {
    name: string;
    code: string;
    message: string;
    statusCode?: number;
    context?: Record<string, unknown>;
  } {
    return {
      name: this.name,
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
    };
  }
}

/**
 * Validation error - invalid input data
 * HTTP 400 Bad Request
 */
export class ValidationError extends AppError {
  constructor(
    message: string,
    options?: {
      field?: string;
      value?: unknown;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, "VALIDATION_ERROR", {
      statusCode: 400,
      context: {
        ...options?.context,
        ...(options?.field && { field: options.field }),
        ...(options?.value !== undefined && { value: options.value }),
      },
    });
  }
}

/**
 * Authentication error - user not authenticated
 * HTTP 401 Unauthorized
 */
export class AuthError extends AppError {
  constructor(
    message: string = "Unauthorized",
    options?: {
      context?: Record<string, unknown>;
    },
  ) {
    super(message, "AUTH_ERROR", {
      statusCode: 401,
      context: options?.context,
    });
  }
}

/**
 * Authorization error - user lacks permissions
 * HTTP 403 Forbidden
 */
export class ForbiddenError extends AppError {
  constructor(
    message: string = "Forbidden",
    options?: {
      resource?: string;
      action?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, "FORBIDDEN_ERROR", {
      statusCode: 403,
      context: {
        ...options?.context,
        ...(options?.resource && { resource: options.resource }),
        ...(options?.action && { action: options.action }),
      },
    });
  }
}

/**
 * Not found error - resource doesn't exist
 * HTTP 404 Not Found
 */
export class NotFoundError extends AppError {
  constructor(
    message: string = "Not found",
    options?: {
      resource?: string;
      id?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, "NOT_FOUND_ERROR", {
      statusCode: 404,
      context: {
        ...options?.context,
        ...(options?.resource && { resource: options.resource }),
        ...(options?.id && { id: options.id }),
      },
    });
  }
}

/**
 * Conflict error - resource already exists or state conflict
 * HTTP 409 Conflict
 */
export class ConflictError extends AppError {
  constructor(
    message: string = "Conflict",
    options?: {
      resource?: string;
      field?: string;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, "CONFLICT_ERROR", {
      statusCode: 409,
      context: {
        ...options?.context,
        ...(options?.resource && { resource: options.resource }),
        ...(options?.field && { field: options.field }),
      },
    });
  }
}

/**
 * API error - external API failures
 * HTTP 500+ or custom status codes
 */
export class APIError extends AppError {
  constructor(
    message: string,
    options?: {
      statusCode?: number;
      endpoint?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, "API_ERROR", {
      statusCode: options?.statusCode ?? 500,
      context: {
        ...options?.context,
        ...(options?.endpoint && { endpoint: options.endpoint }),
      },
      cause: options?.cause,
    });
  }
}

/**
 * Database error - database operations failures
 * HTTP 500 Internal Server Error
 */
export class DatabaseError extends AppError {
  constructor(
    message: string = "Database error",
    options?: {
      operation?: string;
      table?: string;
      context?: Record<string, unknown>;
      cause?: Error;
    },
  ) {
    super(message, "DATABASE_ERROR", {
      statusCode: 500,
      context: {
        ...options?.context,
        ...(options?.operation && { operation: options.operation }),
        ...(options?.table && { table: options.table }),
      },
      cause: options?.cause,
    });
  }
}

/**
 * Rate limit error - too many requests
 * HTTP 429 Too Many Requests
 */
export class RateLimitError extends AppError {
  constructor(
    message: string = "Rate limit exceeded",
    options?: {
      retryAfter?: number; // seconds
      limit?: number;
      context?: Record<string, unknown>;
    },
  ) {
    super(message, "RATE_LIMIT_ERROR", {
      statusCode: 429,
      context: {
        ...options?.context,
        ...(options?.retryAfter && { retryAfter: options.retryAfter }),
        ...(options?.limit && { limit: options.limit }),
      },
    });
  }
}

/**
 * Type guard to check if an error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if an error is a specific error type
 */
export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}

export function isAPIError(error: unknown): error is APIError {
  return error instanceof APIError;
}
