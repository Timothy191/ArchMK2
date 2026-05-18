/**
 * @jest-environment node
 */
import { EMBEDDING_DIMENSIONS } from "./embeddings";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockCreate = jest.fn();
jest.mock("openai", () => {
  return jest.fn().mockImplementation(() => ({
    embeddings: {
      create: mockCreate,
    },
  }));
});

const mockFetch = jest.fn();
global.fetch = mockFetch;

function makeOpenAIEmbeddingResponse(vectors: number[][]) {
  return {
    data: vectors.map((embedding) => ({ embedding })),
  };
}

function makeFetchEmbeddingResponse(vectors: number[][], ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "Internal Server Error",
    text: jest.fn().mockResolvedValue("Error body"),
    json: jest.fn().mockResolvedValue({
      data: vectors.map((embedding) => ({ embedding })),
    }),
  };
}

// ---------------------------------------------------------------------------
// EMBEDDING_DIMENSIONS constant
// ---------------------------------------------------------------------------

describe("EMBEDDING_DIMENSIONS", () => {
  it("is 1536", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });
});

// ---------------------------------------------------------------------------
// generateEmbedding — OpenAI primary provider
// ---------------------------------------------------------------------------

describe("generateEmbedding", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset provider singletons between tests
    jest.resetModules();
  });

  it("returns embedding vector from OpenAI when key is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    delete process.env.TOGETHER_API_KEY;

    const vector = Array(1536).fill(0.1);
    mockCreate.mockResolvedValue(makeOpenAIEmbeddingResponse([vector]));

    // Re-import to get fresh module state
    const { generateEmbedding: gen } = await import("./embeddings");
    const result = await gen("test text");

    expect(result).toEqual(vector);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "text-embedding-3-small",
        input: "test text",
        dimensions: 1536,
      }),
    );
  });

  it("falls back to Together AI when OpenAI fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.TOGETHER_API_KEY = "together-test";

    const togetherVector = Array(1024).fill(0.2);
    mockCreate.mockRejectedValue(new Error("OpenAI rate limit"));
    mockFetch.mockResolvedValue(makeFetchEmbeddingResponse([togetherVector]));

    const { generateEmbedding: gen } = await import("./embeddings");
    const result = await gen("test text");

    expect(result).toEqual(togetherVector);
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.together.xyz/v1/embeddings",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("throws when primary fails and no fallback is available", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    delete process.env.TOGETHER_API_KEY;

    mockCreate.mockRejectedValue(new Error("OpenAI down"));

    const { generateEmbedding: gen } = await import("./embeddings");
    await expect(gen("text")).rejects.toThrow("OpenAI down");
  });
});

// ---------------------------------------------------------------------------
// batchGenerateEmbeddings
// ---------------------------------------------------------------------------

describe("batchGenerateEmbeddings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns empty array for empty input without calling API", async () => {
    const { batchGenerateEmbeddings: batch } = await import("./embeddings");
    const result = await batch([]);
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns batch embeddings from OpenAI", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    delete process.env.TOGETHER_API_KEY;

    const vectors = [Array(1536).fill(0.1), Array(1536).fill(0.2)];
    mockCreate.mockResolvedValue(makeOpenAIEmbeddingResponse(vectors));

    const { batchGenerateEmbeddings: batch } = await import("./embeddings");
    const result = await batch(["text one", "text two"]);

    expect(result).toEqual(vectors);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ input: ["text one", "text two"] }),
    );
  });

  it("falls back to Together batch when OpenAI batch fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.TOGETHER_API_KEY = "together-test";

    const vectors = [Array(1024).fill(0.3), Array(1024).fill(0.4)];
    mockCreate.mockRejectedValue(new Error("OpenAI batch failed"));
    mockFetch.mockResolvedValue(makeFetchEmbeddingResponse(vectors));

    const { batchGenerateEmbeddings: batch } = await import("./embeddings");
    const result = await batch(["a", "b"]);

    expect(result).toEqual(vectors);
  });

  it("falls back to individual calls when both batch providers fail", async () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.TOGETHER_API_KEY = "together-test";

    const singleVector = Array(1536).fill(0.5);
    mockCreate
      .mockRejectedValueOnce(new Error("Batch failed")) // primary batch fails
      .mockResolvedValue(makeOpenAIEmbeddingResponse([singleVector])); // individual calls succeed
    mockFetch.mockResolvedValue(makeFetchEmbeddingResponse([], false)); // together batch fails

    const { batchGenerateEmbeddings: batch } = await import("./embeddings");
    const result = await batch(["text a", "text b"]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(singleVector);
  });
});
