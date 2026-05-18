/**
 * @jest-environment node
 */
import {
  AIPrompts,
  generateAIResponse,
  generateAIResponseWithSearch,
  generateAIResponseWithGoogleAI,
  continueGoogleAIConversation,
  searchMaps,
  searchNews,
  searchVideos,
  searchShopping,
  generateDepartmentAIResponse,
  streamAIResponse,
  type AIRequest,
} from "./ai-service";
import { RateLimitError, APIError } from "@repo/errors";

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

jest.mock("@repo/redis/cache", () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("@repo/redis/client", () => ({
  getRedisClient: jest.fn().mockRejectedValue(new Error("Redis not available")),
}));

jest.mock("./serpapi", () => ({
  searchGoogle: jest.fn(),
  searchGoogleAI: jest.fn(),
  searchGoogleMaps: jest.fn(),
  searchGoogleNews: jest.fn(),
  searchYouTube: jest.fn(),
  searchGoogleShopping: jest.fn(),
  formatSearchResults: jest.fn().mockReturnValue("Search Results:\n1. Test result"),
  formatAIResponse: jest.fn().mockReturnValue("AI response text"),
}));

const { cacheGet, cacheSet } = jest.requireMock("@repo/redis/cache");
const {
  searchGoogle,
  searchGoogleAI,
  searchGoogleMaps,
  searchGoogleNews,
  searchYouTube,
  searchGoogleShopping,
  formatAIResponse,
} = jest.requireMock("./serpapi");

// ---------------------------------------------------------------------------
// Global fetch mock
// ---------------------------------------------------------------------------

const mockFetch = jest.fn();
global.fetch = mockFetch;

function mockSuccessResponse(content: string, tokens = 100) {
  return {
    ok: true,
    json: jest.fn().mockResolvedValue({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 50, completion_tokens: 50, total_tokens: tokens },
    }),
  };
}

function mockErrorResponse(status: number, statusText: string) {
  return {
    ok: false,
    status,
    statusText,
    text: jest.fn().mockResolvedValue(`Error: ${statusText}`),
  };
}

// ---------------------------------------------------------------------------
// AIPrompts
// ---------------------------------------------------------------------------

describe("AIPrompts", () => {
  describe("predictiveMaintenance", () => {
    it("returns system + user messages", () => {
      const result = AIPrompts.predictiveMaintenance("vibration=high");
      expect(result.system).toContain("maintenance");
      expect(result.user).toContain("vibration=high");
    });

    it("user prompt asks for JSON output", () => {
      const result = AIPrompts.predictiveMaintenance("temp=95");
      expect(result.user).toContain("risk");
      expect(result.user).toContain("actions");
    });
  });

  describe("shiftHandoff", () => {
    it("returns system + user messages with shift data", () => {
      const result = AIPrompts.shiftHandoff("shift: 12h, machines: 3");
      expect(result.system).toContain("shift");
      expect(result.user).toContain("shift: 12h, machines: 3");
    });
  });

  describe("safetyCompliance", () => {
    it("includes safety review instructions", () => {
      const result = AIPrompts.safetyCompliance("log data here");
      expect(result.system).toContain("safety");
      expect(result.user).toContain("log data here");
    });

    it("asks for structured JSON output", () => {
      const result = AIPrompts.safetyCompliance("logs");
      expect(result.user).toContain("violations");
    });
  });

  describe("equipmentManual", () => {
    it("returns question without context prefix when no context", () => {
      const result = AIPrompts.equipmentManual("How to replace filter?");
      expect(result.user).toContain("How to replace filter?");
      expect(result.user).not.toContain("Context:");
    });

    it("includes context prefix when context provided", () => {
      const result = AIPrompts.equipmentManual("Oil change steps?", "Engine manual v2");
      expect(result.user).toContain("Context: Engine manual v2");
      expect(result.user).toContain("Question: Oil change steps?");
    });
  });

  describe("translate", () => {
    it("includes target language in system prompt", () => {
      const result = AIPrompts.translate("Hello world", "French");
      expect(result.user).toContain("French");
      expect(result.user).toContain("Hello world");
    });
  });
});

// ---------------------------------------------------------------------------
// generateAIResponse
// ---------------------------------------------------------------------------

describe("generateAIResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheGet.mockResolvedValue(null);
    cacheSet.mockResolvedValue(undefined);
    delete process.env.GROQ_API_KEY_1;
    delete process.env.GROQ_API_KEY_2;
    delete process.env.GROQ_API_KEY_3;
  });

  const request: AIRequest = {
    messages: [{ role: "user", content: "Hello" }],
  };

  it("returns cached response when cache hit", async () => {
    const cached = { content: "cached result", provider: "groq", keyIndex: 0, cached: true };
    cacheGet.mockResolvedValue(cached);

    const result = await generateAIResponse(request, true);
    expect(result).toEqual(cached);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("calls Groq API with first available key", async () => {
    process.env.GROQ_API_KEY_1 = "test-key-1";
    mockFetch.mockResolvedValue(mockSuccessResponse("AI response"));

    const result = await generateAIResponse(request, false);
    expect(result.content).toBe("AI response");
    expect(result.provider).toBe("groq");
    expect(result.keyIndex).toBe(0);
  });

  it("stores response in cache when useCache=true", async () => {
    process.env.GROQ_API_KEY_1 = "test-key-1";
    mockFetch.mockResolvedValue(mockSuccessResponse("cached response"));

    await generateAIResponse(request, true);
    expect(cacheSet).toHaveBeenCalledWith(
      expect.stringContaining("ai:response:"),
      expect.objectContaining({ content: "cached response" }),
      86400,
    );
  });

  it("skips key when API key is missing", async () => {
    // No keys set — all three keys unavailable
    await expect(generateAIResponse(request, false)).rejects.toThrow(RateLimitError);
  });

  it("tries next key when first key returns error response", async () => {
    process.env.GROQ_API_KEY_1 = "key-1";
    process.env.GROQ_API_KEY_2 = "key-2";
    mockFetch
      .mockResolvedValueOnce(mockErrorResponse(429, "Rate Limited"))
      .mockResolvedValueOnce(mockSuccessResponse("Success from key 2"));

    const result = await generateAIResponse(request, false);
    expect(result.content).toBe("Success from key 2");
    expect(result.keyIndex).toBe(1);
  });

  it("throws RateLimitError when all keys fail", async () => {
    process.env.GROQ_API_KEY_1 = "key-1";
    process.env.GROQ_API_KEY_2 = "key-2";
    process.env.GROQ_API_KEY_3 = "key-3";
    mockFetch.mockResolvedValue(mockErrorResponse(429, "Rate Limited"));

    await expect(generateAIResponse(request, false)).rejects.toThrow(RateLimitError);
  });

  it("includes usage stats in response when available", async () => {
    process.env.GROQ_API_KEY_1 = "test-key";
    mockFetch.mockResolvedValue(mockSuccessResponse("Response with usage", 150));

    const result = await generateAIResponse(request, false);
    expect(result.usage).toEqual({
      promptTokens: 50,
      completionTokens: 50,
      totalTokens: 150,
    });
  });

  it("handles API response with no content gracefully", async () => {
    process.env.GROQ_API_KEY_1 = "key-1";
    process.env.GROQ_API_KEY_2 = "key-2";
    process.env.GROQ_API_KEY_3 = "key-3";
    mockFetch.mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({ choices: [{ message: { content: null } }], usage: {} }),
    });

    await expect(generateAIResponse(request, false)).rejects.toThrow(RateLimitError);
  });

  it("handles network error and tries next key", async () => {
    process.env.GROQ_API_KEY_1 = "key-1";
    process.env.GROQ_API_KEY_2 = "key-2";
    mockFetch
      .mockRejectedValueOnce(new Error("Network error"))
      .mockResolvedValueOnce(mockSuccessResponse("Fallback response"));

    const result = await generateAIResponse(request, false);
    expect(result.content).toBe("Fallback response");
  });

  it("respects custom temperature and maxTokens", async () => {
    process.env.GROQ_API_KEY_1 = "test-key";
    mockFetch.mockResolvedValue(mockSuccessResponse("Custom params response"));

    await generateAIResponse({ ...request, temperature: 0.2, maxTokens: 512 }, false);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.temperature).toBe(0.2);
    expect(callBody.max_tokens).toBe(512);
  });
});

// ---------------------------------------------------------------------------
// generateAIResponseWithSearch
// ---------------------------------------------------------------------------

describe("generateAIResponseWithSearch", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    cacheGet.mockResolvedValue(null);
    cacheSet.mockResolvedValue(undefined);
    delete process.env.GROQ_API_KEY_1;
  });

  it("uses search results to augment the AI request", async () => {
    process.env.GROQ_API_KEY_1 = "test-key";
    searchGoogle.mockResolvedValue({
      organic_results: [{ title: "Mining safety", snippet: "Key information", link: "http://example.com", position: 1, displayed_link: "example.com" }],
    });
    mockFetch.mockResolvedValue(mockSuccessResponse("Augmented AI response"));

    const result = await generateAIResponseWithSearch("mining safety tips");
    expect(result.content).toBe("Augmented AI response");

    // The AI call should include search context in the message
    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.messages[0].role).toBe("system");
    expect(callBody.messages[1].content).toContain("mining safety tips");
  });

  it("falls back to LLM-only when search fails", async () => {
    process.env.GROQ_API_KEY_1 = "test-key";
    searchGoogle.mockRejectedValue(new APIError("SerpApi error", { statusCode: 500 }));
    mockFetch.mockResolvedValue(mockSuccessResponse("LLM fallback response"));

    const result = await generateAIResponseWithSearch("test query");
    expect(result.content).toBe("LLM fallback response");
  });
});

// ---------------------------------------------------------------------------
// generateAIResponseWithGoogleAI
// ---------------------------------------------------------------------------

describe("generateAIResponseWithGoogleAI", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns response and token from Google AI mode", async () => {
    searchGoogleAI.mockResolvedValue({
      ai_overview: { text_blocks: [{ snippet: "AI overview content" }] },
      subsequent_request_token: "token-abc",
    });
    formatAIResponse.mockReturnValue("Formatted AI response");

    const result = await generateAIResponseWithGoogleAI("what is mining?");
    expect(result.response).toBe("Formatted AI response");
    expect(result.token).toBe("token-abc");
  });

  it("throws APIError when searchGoogleAI fails", async () => {
    searchGoogleAI.mockRejectedValue(new Error("API down"));

    await expect(generateAIResponseWithGoogleAI("test")).rejects.toThrow(APIError);
  });
});

// ---------------------------------------------------------------------------
// continueGoogleAIConversation
// ---------------------------------------------------------------------------

describe("continueGoogleAIConversation", () => {
  beforeEach(() => jest.clearAllMocks());

  it("delegates to generateAIResponseWithGoogleAI with token", async () => {
    searchGoogleAI.mockResolvedValue({
      ai_overview: {},
      subsequent_request_token: "next-token",
    });
    formatAIResponse.mockReturnValue("Continued response");

    const result = await continueGoogleAIConversation("follow-up", "prev-token");
    expect(result.response).toBe("Continued response");
    expect(searchGoogleAI).toHaveBeenCalledWith(
      "follow-up",
      expect.objectContaining({ subsequentRequestToken: "prev-token" }),
    );
  });
});

// ---------------------------------------------------------------------------
// searchMaps / searchNews / searchVideos / searchShopping
// ---------------------------------------------------------------------------

describe("searchMaps", () => {
  it("delegates to searchGoogleMaps", async () => {
    const mockResult = { search_metadata: { id: "1" } };
    searchGoogleMaps.mockResolvedValue(mockResult);

    const result = await searchMaps("mine location");
    expect(result).toBe(mockResult);
    expect(searchGoogleMaps).toHaveBeenCalledWith("mine location", {});
  });
});

describe("searchNews", () => {
  it("delegates to searchGoogleNews", async () => {
    const mockResult = { search_metadata: { id: "2" } };
    searchGoogleNews.mockResolvedValue(mockResult);

    const result = await searchNews("mining safety");
    expect(result).toBe(mockResult);
    expect(searchGoogleNews).toHaveBeenCalledWith("mining safety", {});
  });
});

describe("searchVideos", () => {
  it("delegates to searchYouTube", async () => {
    const mockResult = { search_metadata: { id: "3" } };
    searchYouTube.mockResolvedValue(mockResult);

    const result = await searchVideos("drill operation tutorial");
    expect(result).toBe(mockResult);
    expect(searchYouTube).toHaveBeenCalledWith("drill operation tutorial", {});
  });
});

describe("searchShopping", () => {
  it("delegates to searchGoogleShopping", async () => {
    const mockResult = { search_metadata: { id: "4" } };
    searchGoogleShopping.mockResolvedValue(mockResult);

    const result = await searchShopping("drill bit");
    expect(result).toBe(mockResult);
    expect(searchGoogleShopping).toHaveBeenCalledWith("drill bit", {});
  });
});

// ---------------------------------------------------------------------------
// generateDepartmentAIResponse
// ---------------------------------------------------------------------------

describe("generateDepartmentAIResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GROQ_API_KEY_1 = "test-key";
    searchGoogle.mockResolvedValue({ organic_results: [] });
    searchGoogleShopping.mockResolvedValue({ shopping_results: [] });
    searchGoogleNews.mockResolvedValue({ news_results: [] });
    searchYouTube.mockResolvedValue({ video_results: [] });
    searchGoogleMaps.mockResolvedValue({ local_results: [] });
    mockFetch.mockResolvedValue(mockSuccessResponse("Dept AI response"));
  });

  it("handles engineering department", async () => {
    const result = await generateDepartmentAIResponse("engineering", "best drill bits");
    expect(result.sources).toContain("patents");
    expect(result.sources).toContain("shopping");
    expect(typeof result.response).toBe("string");
  });

  it("handles drilling department (same as engineering)", async () => {
    const result = await generateDepartmentAIResponse("drilling", "maintenance");
    expect(result.sources).toContain("patents");
  });

  it("handles safety department", async () => {
    const result = await generateDepartmentAIResponse("safety", "ppe requirements");
    expect(result.sources).toContain("news");
    expect(result.sources).toContain("videos");
  });

  it("handles training department", async () => {
    const result = await generateDepartmentAIResponse("training", "forklift operation");
    expect(result.sources).toContain("videos");
    expect(result.sources).toContain("scholar");
  });

  it("handles access-control department", async () => {
    const result = await generateDepartmentAIResponse("access-control", "gate procedures");
    expect(result.sources).toContain("maps");
    expect(result.sources).toContain("local");
  });

  it("handles control-room department", async () => {
    const result = await generateDepartmentAIResponse("control-room", "dispatch query");
    expect(result.sources).toContain("maps");
  });

  it("handles unknown/default department", async () => {
    const result = await generateDepartmentAIResponse("production", "shift update");
    expect(result.sources).toContain("search");
  });

  it("falls back to LLM-only when all searches fail", async () => {
    searchGoogle.mockRejectedValue(new Error("Network error"));
    searchGoogleShopping.mockRejectedValue(new Error("Network error"));

    const result = await generateDepartmentAIResponse("engineering", "drill bits");
    expect(typeof result.response).toBe("string");
  });
});

// ---------------------------------------------------------------------------
// streamAIResponse
// ---------------------------------------------------------------------------

describe("streamAIResponse", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.GROQ_API_KEY_1;
  });

  it("yields fallback message when no keys available", async () => {
    const chunks: string[] = [];
    for await (const chunk of streamAIResponse({ messages: [{ role: "user", content: "Hi" }] })) {
      chunks.push(chunk);
    }
    expect(chunks.join("")).toContain("temporarily unavailable");
  });

  it("yields content tokens from streaming response", async () => {
    process.env.GROQ_API_KEY_1 = "test-key";

    const encoder = new TextEncoder();
    const streamChunks = [
      'data: {"choices":[{"delta":{"content":"Hello"}}]}\n\n',
      'data: {"choices":[{"delta":{"content":" world"}}]}\n\n',
      "data: [DONE]\n\n",
    ];

    let chunkIdx = 0;
    const mockReader = {
      read: jest.fn().mockImplementation(() => {
        if (chunkIdx < streamChunks.length) {
          return Promise.resolve({
            done: false,
            value: encoder.encode(streamChunks[chunkIdx++]),
          });
        }
        return Promise.resolve({ done: true, value: undefined });
      }),
    };

    mockFetch.mockResolvedValue({
      ok: true,
      body: { getReader: () => mockReader },
    });

    const chunks: string[] = [];
    for await (const chunk of streamAIResponse({ messages: [{ role: "user", content: "Hi" }] })) {
      chunks.push(chunk);
    }
    expect(chunks).toContain("Hello");
    expect(chunks).toContain(" world");
  });
});
