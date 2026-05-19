import OpenAI from "openai";
import { APIError } from "@repo/errors";
import { logError } from "@/lib/errors/error-logger";

/**
 * Embedding service for the AI memory system.
 * Primary: OpenAI text-embedding-3-small (1536 dims, cheap, high quality)
 * Fallback: Together AI BAAI/bge-large-en-v1.5 (1024 dims)
 */

const EMBEDDING_DIMENSIONS = 1536;

interface EmbeddingProvider {
  name: string;
  generate(_text: string): Promise<number[]>;
  batchGenerate(_texts: string[]): Promise<number[][]>;
}

class OpenAIProvider implements EmbeddingProvider {
  name = "openai";
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new APIError("OPENAI_API_KEY is not set", {
        statusCode: 500,
        context: { reason: "missing_api_key", provider: "openai" },
      });
    }
    this.client = new OpenAI({ apiKey });
  }

  async generate(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    const first = response.data[0];
    if (!first) {
      throw new APIError("OpenAI returned empty embedding data", {
        statusCode: 502,
        context: { provider: "openai", reason: "empty_response" },
      });
    }
    return first.embedding;
  }

  async batchGenerate(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const response = await this.client.embeddings.create({
      model: "text-embedding-3-small",
      input: texts,
      dimensions: EMBEDDING_DIMENSIONS,
    });
    return response.data.map((d) => d.embedding);
  }
}

class TogetherProvider implements EmbeddingProvider {
  name = "together";
  private apiKey: string;
  private baseUrl = "https://api.together.xyz/v1/embeddings";

  constructor() {
    const apiKey = process.env.TOGETHER_API_KEY;
    if (!apiKey) {
      throw new APIError("TOGETHER_API_KEY is not set", {
        statusCode: 500,
        context: { reason: "missing_api_key", provider: "together" },
      });
    }
    this.apiKey = apiKey;
  }

  async generate(text: string): Promise<number[]> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "BAAI/bge-large-en-v1.5",
        input: text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(`Together embedding failed: ${errorText}`, {
        statusCode: response.status,
        context: { provider: "together", endpoint: "embeddings", statusText: response.statusText },
      });
    }

    const data = await response.json();
    return data.data[0].embedding;
  }

  async batchGenerate(texts: string[]): Promise<number[][]> {
    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "BAAI/bge-large-en-v1.5",
        input: texts,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new APIError(`Together embedding failed: ${errorText}`, {
        statusCode: response.status,
        context: { provider: "together", endpoint: "embeddings", statusText: response.statusText },
      });
    }

    const data = await response.json();
    return data.data.map((d: { embedding: number[] }) => d.embedding);
  }
}

let primaryProvider: EmbeddingProvider | null = null;
let fallbackProvider: EmbeddingProvider | null = null;

function getPrimaryProvider(): EmbeddingProvider {
  if (!primaryProvider) {
    try {
      primaryProvider = new OpenAIProvider();
    } catch {
      primaryProvider = null;
    }
  }
  if (!primaryProvider) {
    throw new APIError(
      "No embedding provider available. Set OPENAI_API_KEY or TOGETHER_API_KEY.",
      {
        statusCode: 503,
        context: { reason: "no_provider_available" },
      }
    );
  }
  return primaryProvider;
}

function getFallbackProvider(): EmbeddingProvider | null {
  if (!fallbackProvider) {
    try {
      fallbackProvider = new TogetherProvider();
    } catch {
      fallbackProvider = null;
    }
  }
  return fallbackProvider;
}

/**
 * Generate an embedding vector for a single text string.
 * Tries primary provider, falls back on failure.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    return await getPrimaryProvider().generate(text);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), { context: "embedding_primary_failed" });
    const fallback = getFallbackProvider();
    if (fallback) {
      return await fallback.generate(text);
    }
    throw err;
  }
}

/**
 * Generate embeddings for multiple texts in one batch call.
 * Falls back to individual calls if batch fails.
 */
export async function batchGenerateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    return await getPrimaryProvider().batchGenerate(texts);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), { context: "embedding_batch_primary_failed" });
    const fallback = getFallbackProvider();
    if (fallback) {
      try {
        return await fallback.batchGenerate(texts);
      } catch (fallbackErr) {
        logError(fallbackErr instanceof Error ? fallbackErr : new Error(String(fallbackErr)), { context: "embedding_batch_fallback_failed" });
      }
    }
    // Fallback: generate individually
    return Promise.all(texts.map((t) => generateEmbedding(t)));
  }
}

export { EMBEDDING_DIMENSIONS };
