/**
 * @jest-environment node
 */

import { POST } from "./route";
import { resetRateLimits } from "@/lib/ai/rate-limiter";

jest.mock("@repo/supabase/server", () => ({
  createServerSupabaseClient: jest.fn().mockResolvedValue({
    auth: {
      getUser: jest
        .fn()
        .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
    },
  }),
}));

jest.mock("@/lib/ai/ollama", () => ({
  ollamaChatStream: jest.fn().mockResolvedValue(
    (async function* () {
      yield "Hello";
    })(),
  ),
  ollamaChat: jest.fn().mockResolvedValue("Hello"),
  ollamaEmbed: jest.fn().mockResolvedValue([[0.1, 0.2]]),
  DEFAULT_MODEL: "gemma4:latest",
}));

jest.mock("@/lib/ai/providers", () => ({
  models: {
    primary: { id: "primary-model" },
    secondary: { id: "secondary-model" },
  },
}));

jest.mock("@/lib/ai/prompts", () => ({
  systemPrompts: {
    chat: jest.fn((ctx?: string) => `system prompt: ${ctx || "default"}`),
  },
}));

jest.mock("@/lib/ai/tools", () => ({
  aiTools: { machineStatus: {} },
}));

jest.mock("@/lib/ai/memory", () => ({
  storeMemory: jest.fn().mockResolvedValue(undefined),
  retrieveRelevantMemories: jest.fn().mockResolvedValue([]),
  formatMemoriesForContext: jest.fn().mockReturnValue(""),
}));

// In-memory mock for Redis cache so rate limiter state is fully controllable
const mockCache = new Map<string, unknown>();
jest.mock("@repo/redis/cache", () => ({
  cacheGet: jest.fn(async (key: string) => mockCache.get(key) ?? null),
  cacheSet: jest.fn(async (key: string, value: unknown) => {
    mockCache.set(key, value);
  }),
  cacheDelete: jest.fn(async (key: string) => {
    mockCache.delete(key);
  }),
}));

const { createServerSupabaseClient } = jest.requireMock(
  "@repo/supabase/server",
);
const { storeMemory, retrieveRelevantMemories } =
  jest.requireMock("@/lib/ai/memory");
const { ollamaChatStream } = jest.requireMock("@/lib/ai/ollama");
describe("POST /api/ai/chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCache.clear();
    resetRateLimits();
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest
          .fn()
          .mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      },
    });
    ollamaChatStream.mockResolvedValue(
      (async function* () {
        yield "Hello";
      })(),
    );
  });

  function createRequest(body: unknown, headers?: Record<string, string>) {
    return new Request("http://localhost/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "127.0.0.1",
        ...headers,
      },
      body: JSON.stringify(body),
    });
  }

  it("rejects malformed input with 400", async () => {
    const req = createRequest({ messages: "not-an-array" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid request");
    expect(json.details).toBeDefined();
  });

  it("accepts valid input and returns stream response", async () => {
    const req = createRequest({
      messages: [{ id: "1", role: "user", content: "Hello" }],
      context: "test-context",
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(ollamaChatStream).toHaveBeenCalledTimes(1);
  });

  it("rate limits after 30 requests from the same IP", async () => {
    const body = {
      messages: [{ id: "1", role: "user", content: "Hello" }],
    };

    // 30 requests should succeed
    for (let i = 0; i < 30; i++) {
      const req = createRequest(body);
      const res = await POST(req);
      // Each request re-auths via agent graph; ollama is mocked so 200
      expect(res.status).toBe(200);
    }

    // 31st request should be rate limited
    const req = createRequest(body);
    const res = await POST(req);
    expect(res.status).toBe(429);
    expect(await res.json()).toEqual(
      expect.objectContaining({ error: "Rate limit exceeded" }),
    );
  });

  it("resets rate limit window after 60 seconds", async () => {
    jest.useFakeTimers();
    const body = {
      messages: [{ id: "1", role: "user", content: "Hello" }],
    };

    // Exhaust the rate limit
    for (let i = 0; i < 30; i++) {
      const req = createRequest(body);
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    const blockedReq = createRequest(body);
    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);

    // Advance time past the window
    jest.advanceTimersByTime(61_000);

    const nextReq = createRequest(body);
    const nextRes = await POST(nextReq);
    expect(nextRes.status).toBe(200);

    jest.useRealTimers();
  });

  it("rejects messages with invalid roles", async () => {
    const req = createRequest({
      messages: [{ id: "1", role: "invalid-role", content: "Hello" }],
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("rejects more than 50 messages", async () => {
    const messages = Array.from({ length: 51 }, (_, i) => ({
      id: String(i),
      role: "user" as const,
      content: "hi",
    }));

    const req = createRequest({ messages });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 500 when Ollama fails", async () => {
    ollamaChatStream.mockRejectedValue(new Error("Ollama down"));

    const req = createRequest({
      messages: [{ id: "1", role: "user", content: "Hello" }],
    });

    const res = await POST(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("Failed to generate response");
  });

  it("returns 401 when user is not authenticated", async () => {
    createServerSupabaseClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("Not authenticated"),
        }),
      },
    });

    const req = createRequest({
      messages: [{ id: "1", role: "user", content: "Hello" }],
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("stores and retrieves memories for user message", async () => {
    const req = createRequest({
      messages: [
        { id: "msg-1", role: "user", content: "Tell me about mining" },
      ],
      sessionId: "session-abc",
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(storeMemory).toHaveBeenCalledWith(
      expect.objectContaining({
        sessionId: "session-abc",
        content: expect.stringContaining("Tell me about mining"),
        memoryType: "episodic",
      }),
    );
    expect(retrieveRelevantMemories).toHaveBeenCalledTimes(2);
  });

  it("generates a session ID when none provided", async () => {
    const req = createRequest({
      messages: [{ id: "msg-1", role: "user", content: "Hello" }],
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    // sessionId is generated internally and passed to storeMemory
    expect(storeMemory).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: expect.stringMatching(/^sess_/) }),
    );
  });

  it("continues when memory retrieval fails", async () => {
    retrieveRelevantMemories.mockRejectedValue(
      new Error("Memory service down"),
    );

    const req = createRequest({
      messages: [{ id: "msg-1", role: "user", content: "Hello" }],
    });

    const res = await POST(req);
    // Should still succeed despite memory failure
    expect(res.status).toBe(200);
  });
});
