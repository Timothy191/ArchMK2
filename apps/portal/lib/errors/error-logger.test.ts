/**
 * @jest-environment node
 */
/* eslint-disable no-console */
import {
  logError,
  withErrorLogging,
  withServerActionLogging,
} from "./error-logger";

describe("logError", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("logs a generic error without throwing", async () => {
    const err = new Error("something broke");
    await expect(logError(err)).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });

  it("logs with optional context (url, method)", async () => {
    const err = new Error("route error");
    await expect(
      logError(err, { url: "/api/test", method: "POST" }),
    ).resolves.toBeUndefined();
  });

  it("logs AppError with statusCode determining severity", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { ValidationError } = await import("@repo/errors");
    const err = new ValidationError("bad input", { field: "email" });
    await logError(err, { url: "/api/users" });
    warnSpy.mockRestore();
  });

  it("uses warn for 4xx status codes", async () => {
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
    const { AuthError } = await import("@repo/errors");
    const err = new AuthError("Unauthorized");
    await logError(err);
    warnSpy.mockRestore();
  });
});

describe("withErrorLogging", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("returns handler result when no error is thrown", async () => {
    const req = new Request("http://localhost/api/test", { method: "GET" });
    const result = await withErrorLogging(req, async () => "ok");
    expect(result).toBe("ok");
  });

  it("re-throws after logging when handler throws", async () => {
    const req = new Request("http://localhost/api/test", { method: "POST" });
    await expect(
      withErrorLogging(req, async () => {
        throw new Error("handler failed");
      }),
    ).rejects.toThrow("handler failed");
    expect(console.error).toHaveBeenCalled();
  });

  it("re-throws non-Error objects without calling logError", async () => {
    const req = new Request("http://localhost/api/test", { method: "POST" });
    await expect(
      withErrorLogging(req, async () => {
        throw "string error";
      }),
    ).rejects.toBe("string error");
  });

  it("passes userId and sessionId to context", async () => {
    const req = new Request("http://localhost/api/test", { method: "GET" });
    await expect(
      withErrorLogging(
        req,
        async () => {
          throw new Error("context error");
        },
        { userId: "u-1", sessionId: "s-1" },
      ),
    ).rejects.toThrow("context error");
  });
});

describe("withServerActionLogging", () => {
  beforeEach(() => jest.spyOn(console, "error").mockImplementation(() => {}));
  afterEach(() => jest.restoreAllMocks());

  it("returns handler result on success", async () => {
    const result = await withServerActionLogging(async () => 42, "createUser");
    expect(result).toBe(42);
  });

  it("re-throws and logs on error", async () => {
    await expect(
      withServerActionLogging(async () => {
        throw new Error("action failed");
      }, "deleteRecord"),
    ).rejects.toThrow("action failed");
    expect(console.error).toHaveBeenCalled();
  });

  it("re-throws non-Error without calling logError", async () => {
    await expect(
      withServerActionLogging(async () => {
        throw "non-error thrown";
      }, "someAction"),
    ).rejects.toBe("non-error thrown");
  });
});
