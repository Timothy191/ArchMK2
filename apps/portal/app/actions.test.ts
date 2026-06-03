/**
 * @jest-environment node
 */
import { logout, speculativeEmbedShiftLog } from "./actions";

jest.mock("@repo/supabase/server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));

jest.mock("@repo/utils/inngest", () => ({
  inngest: {
    send: jest.fn().mockResolvedValue({}),
  },
  aiGenerateEmbeddingEvent: "ai/generate-embedding",
}));

const { createServerSupabaseClient } = jest.requireMock(
  "@repo/supabase/server",
);

const { inngest } = jest.requireMock("@repo/utils/inngest");

describe("actions", () => {
  beforeEach(() => jest.clearAllMocks());

  describe("logout", () => {
    it("calls signOut and redirects to /login", async () => {
      const signOut = jest.fn().mockResolvedValue({});
      createServerSupabaseClient.mockResolvedValue({ auth: { signOut } });

      await expect(logout()).rejects.toThrow("NEXT_REDIRECT");
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });

  describe("speculativeEmbedShiftLog", () => {
    it("throws error if user is not authenticated", async () => {
      createServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
        },
      });

      await expect(
        speculativeEmbedShiftLog("test shift log note"),
      ).rejects.toThrow("Unauthorized");
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it("does not generate embedding if text is empty", async () => {
      createServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
          }),
        },
      });

      await speculativeEmbedShiftLog("");
      expect(inngest.send).not.toHaveBeenCalled();
    });

    it("generates embedding for valid text when user is authenticated", async () => {
      createServerSupabaseClient.mockResolvedValue({
        auth: {
          getUser: jest.fn().mockResolvedValue({
            data: { user: { id: "user-123" } },
          }),
        },
      });

      await speculativeEmbedShiftLog("valid log entry");
      expect(inngest.send).toHaveBeenCalledWith({
        name: "ai/generate-embedding",
        data: {
          text: "valid log entry",
          userId: "user-123",
        },
      });
    });
  });
});
