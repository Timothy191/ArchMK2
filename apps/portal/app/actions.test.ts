/**
 * @jest-environment node
 */
import { logout } from "./actions";

jest.mock("@repo/supabase/server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => { throw new Error("NEXT_REDIRECT"); }),
}));

const { createServerSupabaseClient } = jest.requireMock("@repo/supabase/server");

describe("logout", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls signOut and redirects to /login", async () => {
    const signOut = jest.fn().mockResolvedValue({});
    createServerSupabaseClient.mockResolvedValue({ auth: { signOut } });

    await expect(logout()).rejects.toThrow("NEXT_REDIRECT");
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
