/**
 * Simple error classes to replace @repo/errors package
 */
/* AGENT-TRACE: File-level eslint-disable for no-unused-vars
 * These public constructor parameters define the error interface but are flagged as unused by ESLint
 * This is intentional - they are part of the public API for the error classes
 * If modifying error handling, maintain this pattern or consider re-integrating @repo/errors
 */
/* eslint-disable no-unused-vars */

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>,
    public cause?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class APIError extends AppError {
  constructor(
    message: string,
    code: string = "API_ERROR",
    statusCode: number = 500,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context);
  }
}

export class AuthError extends AppError {
  constructor(
    message: string = "Authentication failed",
    code: string = "AUTH_ERROR",
    statusCode: number = 401,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context);
  }
}

export class DatabaseError extends AppError {
  constructor(
    message: string,
    code: string = "DATABASE_ERROR",
    statusCode: number = 500,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    code: string = "VALIDATION_ERROR",
    statusCode: number = 400,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context);
  }
}

export class NotFoundError extends AppError {
  constructor(
    message: string = "Resource not found",
    code: string = "NOT_FOUND",
    statusCode: number = 404,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context);
  }
}

export class ConflictError extends AppError {
  constructor(
    message: string = "Resource conflict",
    code: string = "CONFLICT",
    statusCode: number = 409,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context);
  }
}

export class ForbiddenError extends AppError {
  constructor(
    message: string = "Access forbidden",
    code: string = "FORBIDDEN",
    statusCode: number = 403,
    context?: Record<string, unknown>,
  ) {
    super(message, code, statusCode, context);
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

export function isNotFoundError(error: unknown): error is NotFoundError {
  return error instanceof NotFoundError;
}
