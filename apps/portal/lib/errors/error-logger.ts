/**
 * Error Logging Utility
 * 
 * Provides structured error logging for both AppError instances
 * and generic errors. Integrates with monitoring systems.
 */

import { isAppError, AppError } from "@repo/errors";

/**
 * Error severity levels
 */
export type ErrorSeverity = "debug" | "info" | "warn" | "error" | "fatal";

/**
 * Structured error log entry
 */
export interface ErrorLogEntry {
  timestamp: string;
  severity: ErrorSeverity;
  code?: string;
  statusCode?: number;
  message: string;
  context?: Record<string, unknown>;
  cause?: unknown;
  stack?: string;
  url?: string;
  method?: string;
  userId?: string;
  sessionId?: string;
}

/**
 * Determine error severity based on status code and error type
 */
function getSeverity(error: Error, statusCode?: number): ErrorSeverity {
  if (!statusCode) return "error";
  if (statusCode >= 500) return "error";
  if (statusCode >= 400) return "warn";
  return "info";
}

/**
 * Create a structured error log entry
 */
function createErrorLog(
  error: Error,
  context?: {
    url?: string;
    method?: string;
    userId?: string;
    sessionId?: string;
    [key: string]: unknown;
  }
): ErrorLogEntry {
  const timestamp = new Date().toISOString();
  
  if (isAppError(error)) {
    return {
      timestamp,
      severity: getSeverity(error, error.statusCode),
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
      context: { ...error.context, ...context },
      cause: error.cause,
      stack: error.stack,
      url: context?.url,
      method: context?.method,
      userId: context?.userId,
      sessionId: context?.sessionId,
    };
  }

  // Generic error handling
  return {
    timestamp,
    severity: "error",
    message: error.message,
    stack: error.stack,
    url: context?.url,
    method: context?.method,
    userId: context?.userId,
    sessionId: context?.sessionId,
  };
}

/**
 * Send error to monitoring service
 * 
 * Currently logs to console. Replace with your monitoring service:
 * - Sentry
 * - DataDog
 * - LogRocket
 * - Custom endpoint
 */
async function sendToMonitoring(entry: ErrorLogEntry): Promise<void> {
  // TODO: Replace with your error monitoring service
  // Examples:
  // await Sentry.captureException(entry);
  // await fetch('/api/log', { method: 'POST', body: JSON.stringify(entry) });
  
  // For now, just log to console with structured format
  // eslint-disable-next-line no-console
  const logMethod = entry.severity === "error" || entry.severity === "fatal" 
    ? console.error  // eslint-disable-line no-console
    : console.warn;  // eslint-disable-line no-console
  
  logMethod(`[${entry.severity.toUpperCase()}] ${entry.code || "UNKNOWN"}: ${entry.message}`, {
    timestamp: entry.timestamp,
    statusCode: entry.statusCode,
    context: entry.context,
    url: entry.url,
    method: entry.method,
  });
}

/**
 * Main error logger function
 * 
 * Usage:
 * ```typescript
 * try {
 *   await someOperation();
 * } catch (error) {
 *   await logError(error, { url: req.url, method: req.method });
 * }
 * ```
 */
export async function logError(
  error: Error,
  context?: {
    url?: string;
    method?: string;
    userId?: string;
    sessionId?: string;
    [key: string]: unknown;
  }
): Promise<void> {
  const entry = createErrorLog(error, context);
  await sendToMonitoring(entry);
}

/**
 * Create an API route error handler
 * 
 * Wraps API route handlers with automatic error logging
 * 
 * Usage:
 * ```typescript
 * export async function POST(req: Request) {
 *   return withErrorLogging(req, async () => {
 *     // Your route logic
 *   });
 * }
 * ```
 */
export async function withErrorLogging<T>(
  req: Request,
  handler: () => Promise<T>,
  options?: {
    userId?: string;
    sessionId?: string;
  }
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof Error) {
      await logError(error, {
        url: req.url,
        method: req.method,
        userId: options?.userId,
        sessionId: options?.sessionId,
      });
    }
    throw error; // Re-throw for error boundaries
  }
}

/**
 * Server action error logger
 * 
 * Usage in server actions:
 * ```typescript
 * "use server";
 * 
 * export async function createUser(data: UserData) {
 *   return await withServerActionLogging(async () => {
 *     // Your action logic
 *   });
 * }
 * ```
 */
export async function withServerActionLogging<T>(
  handler: () => Promise<T>,
  actionName: string
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof Error) {
      await logError(error, {
        action: actionName,
      });
    }
    throw error;
  }
}
