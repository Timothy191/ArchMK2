/**
 * @jest-environment node
 *
 * Reproducer for P0 #1: /api/c66 header-only auth bypass.
 *
 * The middleware short-circuits the c66 endpoint entirely (no Supabase session
 * check). The route handler relies on an `x-scanner-source` header compared
 * against a hard-coded allowlist that ships as the documented default in
 * `apps/portal/.env.example` (C66-HARDWARE, C66-SCANNER, GATE-TERMINAL).
 *
 * Net effect: a remote attacker who reads the public repo can forge any
 * `x-scanner-source` value, send an arbitrary badge code, and either enumerate
 * personnel/visitor names or pollute the access_logs table — without ever
 * holding a Supabase session or a real magic token.
 *
 * Each test below is an "exploit" — it asserts that the bypass STILL WORKS
 * today. The fix is the responsibility of the next session; this test pins
 * the current (broken) behaviour so we know when the fix has actually taken
 * effect.
 */

import { POST } from "./route";

// `createServiceRoleClient` is the only external dep the route uses. We mock
// it with a chainable Supabase client so the handler reaches the auth/lookup
// path and the test can observe the actual bypass.
jest.mock("@repo/supabase/service-role", () => ({
  createServiceRoleClient: jest.fn(),
}));

jest.mock("@/lib/errors/error-logger", () => ({
  logError: jest.fn(),
}));

const { createServiceRoleClient } = jest.requireMock(
  "@repo/supabase/service-role",
);
// Track the most recent client returned by the service-role factory so
// assertions can inspect what the route did with it.
let lastServiceRoleClient: ReturnType<typeof buildServiceRoleMock> | null =
  null;

const PUBLICLY_DOCUMENTED_SCANNER_SOURCES = [
  "C66-HARDWARE",
  "C66-SCANNER",
  "GATE-TERMINAL",
];

/**
 * Build a service-role client whose badge/personnel/visitor lookups return
 * realistic data. The point is to exercise the route past the (trivial)
 * `x-scanner-source` check.
 */
function buildServiceRoleMock() {
  const badge = {
    id: "badge-1",
    is_active: true,
    entity_type: "personnel",
    personnel_id: "person-1",
    visitor_id: null,
  };
  const person = { first_name: "Test", surname: "User", status: "Active" };

  const mock = {
    from: jest.fn().mockImplementation((table: string) => {
      if (table === "badges") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest.fn().mockResolvedValue({ data: badge, error: null }),
            }),
          }),
        };
      }
      if (table === "personnel") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockReturnValue({
              single: jest
                .fn()
                .mockResolvedValue({ data: person, error: null }),
            }),
          }),
        };
      }
      if (table === "access_logs") {
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
        insert: jest.fn().mockResolvedValue({ error: null }),
      };
    }),
  };
  createServiceRoleClient.mockReturnValue(mock);
  lastServiceRoleClient = mock;
  return mock;
}

function makeRequest(opts: {
  source?: string | null;
  body?: unknown;
  raw?: string;
}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (opts.source !== null && opts.source !== undefined) {
    headers["x-scanner-source"] = opts.source;
  }
  const init: RequestInit = {
    method: "POST",
    headers,
  };
  if (opts.raw !== undefined) {
    init.body = opts.raw;
  } else {
    init.body = JSON.stringify(opts.body ?? { barcode: "TEST-CODE" });
  }
  return new Request("http://localhost/api/c66", init);
}

beforeEach(() => {
  jest.clearAllMocks();
  buildServiceRoleMock();
});

// ---------------------------------------------------------------------------
// THE P0: a remote attacker with no Supabase session can call /api/c66 by
// sending any of the three header values that are committed to the public
// repo (see apps/portal/.env.example line 45).
// ---------------------------------------------------------------------------

describe("P0 /api/c66 header-only auth bypass (RED — must fail once fixed)", () => {
  it.each(PUBLICLY_DOCUMENTED_SCANNER_SOURCES)(
    "forged x-scanner-source=%s succeeds WITHOUT a Supabase session (bypass)",
    async (source) => {
      // No Supabase auth header, no API key, no service-role context — just
      // a header value lifted from the public .env.example file.
      const res = await POST(makeRequest({ source }));

      // The bypass is real as long as the route reaches the success branch.
      // When the fix lands, the route should reject unauthenticated callers
      // (e.g. 401/403) and these tests will fail — which is the desired RED
      // → GREEN signal.
      const body = await res.json();
      expect(res.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.name).toBe("Test User");
    },
  );

  it("no x-scanner-source header at all is currently accepted as 'unknown' (still bypasses middleware)", async () => {
    // The route maps the missing header to the literal string "unknown",
    // which is NOT in the default allowlist — so this should return 403.
    // We assert that to pin the *current* behaviour, because changing this
    // branch is part of the fix.
    const res = await POST(makeRequest({ source: null }));
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized scanner source");
  });

  it("a forged but wrong header value is rejected with 403", async () => {
    const res = await POST(makeRequest({ source: "ATTACKER-FORGED" }));
    expect(res.status).toBe(403);
  });

  it("read-replica / read-only route does not exist — c66 is a mutating endpoint that writes access_logs", async () => {
    // Defence-in-depth assertion: confirm the route actually does call
    // supabase.from('access_logs').insert when the bypass succeeds. If the
    // fix turns the endpoint into a no-op, this assertion will fail — which
    // is correct: the fix MUST keep the legitimate hardware path working.
    const res = await POST(makeRequest({ source: "C66-HARDWARE" }));
    expect(res.status).toBe(200);
    expect(lastServiceRoleClient).not.toBeNull();
    expect(lastServiceRoleClient!.from).toHaveBeenCalledWith("access_logs");
  });
});
