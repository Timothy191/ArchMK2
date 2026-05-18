/**
 * @jest-environment node
 */
import { normalizeRole, middleware } from "./middleware";
import { NextRequest } from "next/server";

jest.mock("@repo/supabase/middleware", () => ({
  createMiddlewareClient: jest.fn(),
}));

jest.mock("@repo/redis/cache", () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
}));

const { createMiddlewareClient } = jest.requireMock("@repo/supabase/middleware");
const { cacheGet } = jest.requireMock("@repo/redis/cache");

function buildMiddlewareMock(overrides: {
  user?: unknown;
  employee?: unknown;
  deptData?: unknown;
} = {}) {
  const user = overrides.user !== undefined ? overrides.user : { id: "auth-1" };
  const employee = overrides.employee !== undefined
    ? overrides.employee
    : { role: "operator", department_id: "dept-uuid-1", accessible_departments: [] };
  const deptData = overrides.deptData !== undefined ? overrides.deptData : { id: "dept-uuid-1" };

  const mockResponse = { headers: new Headers() };

  const supabase = {
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user } }),
    },
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "employees") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: employee }),
            }),
          }),
        };
      }
      if (table === "departments") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: deptData }),
            }),
          }),
        };
      }
      return {};
    }),
  };

  createMiddlewareClient.mockResolvedValue({ supabase, response: mockResponse });
  return { supabase, mockResponse };
}

function makeRequest(path: string) {
  return new NextRequest(`http://localhost${path}`);
}

describe("normalizeRole", () => {
  it("returns the role as-is for valid non-empty strings", () => {
    expect(normalizeRole("admin")).toBe("admin");
    expect(normalizeRole("control_room_operator")).toBe(
      "control_room_operator",
    );
    expect(normalizeRole("supervisor")).toBe("supervisor");
  });

  it("returns 'operator' for empty string", () => {
    expect(normalizeRole("")).toBe("operator");
  });

  it("returns 'operator' for undefined", () => {
    expect(normalizeRole(undefined)).toBe("operator");
  });

  it("returns 'operator' for null", () => {
    expect(normalizeRole(null)).toBe("operator");
  });

  it("returns 'operator' for non-string values", () => {
    expect(normalizeRole(42)).toBe("operator");
    expect(normalizeRole({})).toBe("operator");
    expect(normalizeRole([])).toBe("operator");
    expect(normalizeRole(true)).toBe("operator");
  });
});

describe("middleware", () => {
  beforeEach(() => jest.clearAllMocks());

  it("passes through static file requests", async () => {
    buildMiddlewareMock();
    const req = makeRequest("/logo.png");
    const res = await middleware(req);
    expect(res).toBeDefined();
    // Should return the raw response (not a redirect)
    expect(res.status).not.toBe(307);
  });

  it("redirects authenticated user away from /login to /", async () => {
    buildMiddlewareMock({ user: { id: "auth-1" } });
    const req = makeRequest("/login");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/");
  });

  it("passes /login through for unauthenticated users", async () => {
    buildMiddlewareMock({ user: null });
    const req = makeRequest("/login");
    const res = await middleware(req);
    // Returns the raw middleware response (not a redirect)
    expect(res.status).not.toBe(307);
  });

  it("redirects unauthenticated users to /login with redirect param", async () => {
    buildMiddlewareMock({ user: null });
    const req = makeRequest("/drilling");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login");
  });

  it("redirects non-admin users accessing /admin to error page", async () => {
    buildMiddlewareMock({
      employee: { role: "operator", department_id: "dept-1", accessible_departments: [] },
    });
    const req = makeRequest("/admin");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("unauthorized_department");
  });

  it("allows admin to access /admin", async () => {
    buildMiddlewareMock({
      employee: { role: "admin", department_id: "dept-1", accessible_departments: [] },
    });
    (cacheGet as jest.Mock).mockResolvedValue(null);
    const req = makeRequest("/admin");
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
  });

  it("redirects non-admin/supervisor to /control-room", async () => {
    buildMiddlewareMock({
      employee: { role: "operator", department_id: "dept-1", accessible_departments: [] },
    });
    const req = makeRequest("/control-room");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("unauthorized_department");
  });

  it("allows control_room_operator to access /control-room with matching dept", async () => {
    buildMiddlewareMock({
      employee: { role: "control_room_operator", department_id: "dept-uuid-cr", accessible_departments: [] },
      deptData: { id: "dept-uuid-cr" },
    });
    (cacheGet as jest.Mock).mockResolvedValue(null);
    const req = makeRequest("/control-room");
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
  });

  it("redirects user to unknown_department when dept UUID not found", async () => {
    buildMiddlewareMock({
      employee: { role: "operator", department_id: "dept-1", accessible_departments: [] },
      deptData: null,
    });
    (cacheGet as jest.Mock).mockResolvedValue(null);
    const req = makeRequest("/drilling");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("unknown_department");
  });

  it("redirects user without dept access to unauthorized_department", async () => {
    buildMiddlewareMock({
      employee: { role: "operator", department_id: "dept-other", accessible_departments: [] },
      deptData: { id: "dept-uuid-1" },
    });
    (cacheGet as jest.Mock).mockResolvedValue(null);
    const req = makeRequest("/drilling");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("unauthorized_department");
  });

  it("uses cached dept UUID when available", async () => {
    buildMiddlewareMock({
      employee: { role: "operator", department_id: "cached-uuid", accessible_departments: [] },
    });
    (cacheGet as jest.Mock).mockResolvedValue("cached-uuid");
    const req = makeRequest("/drilling");
    const res = await middleware(req);
    // operator with matching dept should pass through
    expect(res.status).not.toBe(307);
  });

  it("allows user with accessible_departments to access dept routes", async () => {
    buildMiddlewareMock({
      employee: { role: "operator", department_id: "dept-other", accessible_departments: ["dept-uuid-1"] },
      deptData: { id: "dept-uuid-1" },
    });
    (cacheGet as jest.Mock).mockResolvedValue(null);
    const req = makeRequest("/drilling");
    const res = await middleware(req);
    expect(res.status).not.toBe(307);
  });

  it("redirects non-supervisor to dept tools", async () => {
    buildMiddlewareMock({
      employee: { role: "operator", department_id: "dept-uuid-1", accessible_departments: [] },
      deptData: { id: "dept-uuid-1" },
    });
    (cacheGet as jest.Mock).mockResolvedValue(null);
    const req = makeRequest("/drilling/tools");
    const res = await middleware(req);
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("unauthorized_department");
  });
});
