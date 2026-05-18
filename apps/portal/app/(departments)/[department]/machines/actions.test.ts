/**
 * @jest-environment node
 */
import { addMachine } from "./actions";

jest.mock("@repo/supabase/server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

const { createServerSupabaseClient } = jest.requireMock("@repo/supabase/server");

function buildMock(overrides: { insertData?: unknown; insertError?: unknown } = {}) {
  const mock = {
    from: jest.fn().mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: overrides.insertData ?? { id: "machine-1" },
            error: overrides.insertError ?? null,
          }),
        }),
      }),
    }),
  };
  createServerSupabaseClient.mockResolvedValue(mock);
  return mock;
}

function makeFormData(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    fd.append(k, v);
  }
  return fd;
}

describe("addMachine", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns error when required fields are missing", async () => {
    buildMock();
    const fd = makeFormData({ department_id: "dept-1", name: "Excavator A" }); // missing machine_type
    const result = await addMachine(fd);
    expect(result).toEqual({ error: "Name and type are required." });
  });

  it("returns error when department_id is missing", async () => {
    buildMock();
    const fd = makeFormData({ name: "Drill Rig", machine_type: "Drill" });
    const result = await addMachine(fd);
    expect(result).toEqual({ error: "Name and type are required." });
  });

  it("returns new machine id on success", async () => {
    buildMock({ insertData: { id: "machine-xyz" } });
    const fd = makeFormData({ department_id: "dept-1", name: "Drill Rig 1", machine_type: "Drill" });
    const result = await addMachine(fd);
    expect(result).toEqual({ id: "machine-xyz" });
  });

  it("returns error message when DB insert fails", async () => {
    buildMock({ insertError: { message: "Unique constraint violated" } });
    const fd = makeFormData({ department_id: "dept-1", name: "Excavator B", machine_type: "Excavator" });
    const result = await addMachine(fd);
    expect(result).toEqual({ error: "Unique constraint violated" });
  });
});
