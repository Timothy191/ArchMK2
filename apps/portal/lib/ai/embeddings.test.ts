/**
 * @jest-environment node
 */
import { EMBEDDING_DIMENSIONS, clearEmbeddingCache } from "./embeddings";

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

function makeOpenAIEmbeddingResponse(vectors: number[][]) {
  return {
    data: vectors.map((embedding) => ({ embedding })),
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
    jest.resetModules();
    clearEmbeddingCache();
  });

  it("returns embedding vector from OpenAI when key is set", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    const vector = Array(1536).fill(0.1);
    mockCreate.mockResolvedValue(makeOpenAIEmbeddingResponse([vector]));

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

  it("throws when OpenAI fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    mockCreate.mockRejectedValue(new Error("OpenAI down"));

    const { generateEmbedding: gen } = await import("./embeddings");
    await expect(gen("text")).rejects.toThrow("OpenAI down");
  });

  it("returns cached value on second call with same text", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    const vector = Array(1536).fill(0.1);
    mockCreate.mockResolvedValue(makeOpenAIEmbeddingResponse([vector]));

    const { generateEmbedding: gen } = await import("./embeddings");
    const result1 = await gen("cache test");
    const result2 = await gen("cache test");

    expect(result1).toEqual(vector);
    expect(result2).toEqual(vector);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// batchGenerateEmbeddings
// ---------------------------------------------------------------------------

describe("batchGenerateEmbeddings", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    clearEmbeddingCache();
  });

  it("returns empty array for empty input without calling API", async () => {
    const { batchGenerateEmbeddings: batch } = await import("./embeddings");
    const result = await batch([]);
    expect(result).toEqual([]);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("returns batch embeddings from OpenAI", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    const vectors = [Array(1536).fill(0.1), Array(1536).fill(0.2)];
    mockCreate.mockResolvedValue(makeOpenAIEmbeddingResponse(vectors));

    const { batchGenerateEmbeddings: batch } = await import("./embeddings");
    const result = await batch(["text one", "text two"]);

    expect(result).toEqual(vectors);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ input: ["text one", "text two"] }),
    );
  });

  it("falls back to individual calls when batch provider fails", async () => {
    process.env.OPENAI_API_KEY = "sk-test";

    const singleVector = Array(1536).fill(0.5);
    mockCreate
      .mockRejectedValueOnce(new Error("Batch failed"))
      .mockResolvedValue(makeOpenAIEmbeddingResponse([singleVector]));

    const { batchGenerateEmbeddings: batch } = await import("./embeddings");
    const result = await batch(["text a", "text b"]);

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual(singleVector);
    expect(result[1]).toEqual(singleVector);
  });
});
