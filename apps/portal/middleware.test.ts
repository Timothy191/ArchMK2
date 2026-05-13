import { normalizeRole } from "./middleware";

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
