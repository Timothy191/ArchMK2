/**
 * @jest-environment node
 */
import { POST } from "./route";
import { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

jest.mock("@repo/supabase/server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const { createServerSupabaseClient } = jest.requireMock("@repo/supabase/server");

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost/api/sync/playback", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function buildSupabaseMock(overrides: {
  existingData?: unknown;
  insertError?: unknown;
  updateError?: unknown;
} = {}) {
  const mock = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: overrides.existingData ?? null }),
        }),
      }),
      insert: jest.fn().mockResolvedValue({ error: overrides.insertError ?? null }),
      update: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: overrides.updateError ?? null }),
      }),
    }),
  };
  createServerSupabaseClient.mockResolvedValue(mock);
  return mock;
}

// ---------------------------------------------------------------------------
// Missing fields validation
// ---------------------------------------------------------------------------

describe("POST /api/sync/playback – validation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns 400 when idempotencyKey is missing", async () => {
    buildSupabaseMock();
    const req = makeRequest({ actionType: "ADD_BREAKDOWN", payload: {}, departmentId: "dept-1" });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Missing required fields");
  });

  it("returns 400 when actionType is missing", async () => {
    buildSupabaseMock();
    const req = makeRequest({ idempotencyKey: "key-1", payload: {}, departmentId: "dept-1" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 for unknown action type", async () => {
    buildSupabaseMock();
    const req = makeRequest({
      idempotencyKey: "key-1",
      actionType: "UNKNOWN_ACTION",
      payload: { fleetId: "exc-01" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("UNKNOWN_ACTION");
  });
});

// ---------------------------------------------------------------------------
// ADD_BREAKDOWN
// ---------------------------------------------------------------------------

describe("POST /api/sync/playback – ADD_BREAKDOWN", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts breakdown and returns success", async () => {
    buildSupabaseMock();
    const req = makeRequest({
      idempotencyKey: "idem-1",
      actionType: "ADD_BREAKDOWN",
      payload: { fleetId: "EXC-01", machineType: "Excavator", dateIn: "2026-05-17", reason: "Hydraulic leak" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("bypasses insert when breakdown already synced (idempotency)", async () => {
    buildSupabaseMock({ existingData: { id: "bd-existing" } });
    const req = makeRequest({
      idempotencyKey: "idem-duplicate",
      actionType: "ADD_BREAKDOWN",
      payload: { fleetId: "EXC-01", machineType: "Excavator", dateIn: "2026-05-17", reason: "Test" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.bypassed).toBe(true);
  });

  it("returns 500 when insert fails", async () => {
    buildSupabaseMock({ insertError: { message: "Insert failed" } });
    const req = makeRequest({
      idempotencyKey: "idem-fail",
      actionType: "ADD_BREAKDOWN",
      payload: { fleetId: "EXC-01", machineType: "Excavator", dateIn: "2026-05-17", reason: "Test" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// RESOLVE_BREAKDOWN
// ---------------------------------------------------------------------------

describe("POST /api/sync/playback – RESOLVE_BREAKDOWN", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates breakdown status to completed", async () => {
    buildSupabaseMock();
    const req = makeRequest({
      idempotencyKey: "idem-resolve",
      actionType: "RESOLVE_BREAKDOWN",
      payload: { id: "bd-1" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  it("returns 500 when update fails", async () => {
    buildSupabaseMock({ updateError: { message: "Update failed" } });
    const req = makeRequest({
      idempotencyKey: "idem-resolve-fail",
      actionType: "RESOLVE_BREAKDOWN",
      payload: { id: "bd-1" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// ADD_SAFETY_INCIDENT
// ---------------------------------------------------------------------------

describe("POST /api/sync/playback – ADD_SAFETY_INCIDENT", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts safety incident and returns success", async () => {
    buildSupabaseMock();
    const req = makeRequest({
      idempotencyKey: "si-1",
      actionType: "ADD_SAFETY_INCIDENT",
      payload: { incidentDate: "2026-05-17", shiftType: "day", incidentType: "near_miss", description: "Slipped", location: "Pit A" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("bypasses when safety incident already synced", async () => {
    buildSupabaseMock({ existingData: { id: "si-existing" } });
    const req = makeRequest({
      idempotencyKey: "si-duplicate",
      actionType: "ADD_SAFETY_INCIDENT",
      payload: { incidentDate: "2026-05-17", shiftType: "day", incidentType: "near_miss", description: "Test", location: "Pit A" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.bypassed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// ADD_DAILY_LOG
// ---------------------------------------------------------------------------

describe("POST /api/sync/playback – ADD_DAILY_LOG", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts daily log and returns success", async () => {
    buildSupabaseMock();
    const req = makeRequest({
      idempotencyKey: "dl-1",
      actionType: "ADD_DAILY_LOG",
      payload: { logDate: "2026-05-17", shift: "day", notes: "All good" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).success).toBe(true);
  });

  it("bypasses when daily log already synced", async () => {
    buildSupabaseMock({ existingData: { id: "dl-existing" } });
    const req = makeRequest({
      idempotencyKey: "dl-duplicate",
      actionType: "ADD_DAILY_LOG",
      payload: { logDate: "2026-05-17", shift: "day", notes: "Dupe" },
      departmentId: "dept-1",
    });
    const res = await POST(req);
    const body = await res.json();
    expect(body.bypassed).toBe(true);
  });
});
