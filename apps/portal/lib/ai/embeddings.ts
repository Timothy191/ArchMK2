import OpenAI from "openai";
import { APIError } from "@repo/errors";
import { logError } from "@/lib/errors/error-logger";

/**
 * Embedding service for the AI memory system.
 *
 * Primary: OpenAI text-embedding-3-small (1536 dims — matches pgvector schema)
 *
 * A per-process cache (Map, size-capped at 512) eliminates redundant API
 * calls within a single request, e.g. when the agent graph embeds the same
 * user message 3× during one turn (store + 2 retrievals).
 */

const EMBEDDING_DIMENSIONS = 1536;

// ------------------------------------------------------------------
// Per-process embedding cache (text → vector).
// ------------------------------------------------------------------

const EMBEDDING_CACHE_MAX = 512;
const embeddingCache = new Map<string, number[]>();

function getCachedEmbedding(text: string): number[] | undefined {
  return embeddingCache.get(text);
}

function setCachedEmbedding(text: string, vector: number[]): void {
  if (embeddingCache.size >= EMBEDDING_CACHE_MAX && !embeddingCache.has(text)) {
    const firstKey = embeddingCache.keys().next().value;
    if (firstKey !== undefined) embeddingCache.delete(firstKey);
  }
  embeddingCache.set(text, vector);
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

// ------------------------------------------------------------------
// Primary provider
// ------------------------------------------------------------------

class OpenAIProvider {
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

let primaryProvider: OpenAIProvider | null = null;

function getPrimaryProvider(): OpenAIProvider {
  if (!primaryProvider) {
    try {
      primaryProvider = new OpenAIProvider();
    } catch {
      primaryProvider = null;
    }
  }
  if (!primaryProvider) {
    throw new APIError("No embedding provider available. Set OPENAI_API_KEY.", {
      statusCode: 503,
      context: { reason: "no_provider_available" },
    });
  }
  return primaryProvider;
}

// ------------------------------------------------------------------
// Public API
// ------------------------------------------------------------------

/**
 * Generate an embedding vector for a single text string.
 * Per-process cache eliminates redundant API calls within the same request.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const cached = getCachedEmbedding(text);
  if (cached !== undefined) return cached;

  try {
    const vector = await getPrimaryProvider().generate(text);
    setCachedEmbedding(text, vector);
    return vector;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "embedding_primary_failed",
    });
    throw err;
  }
}

/**
 * Generate embeddings for multiple texts in one batch call.
 * Individual calls are cached via generateEmbedding() fallback.
 */
export async function batchGenerateEmbeddings(
  texts: string[],
): Promise<number[][]> {
  if (texts.length === 0) return [];

  try {
    // Deduplicate against the per-process cache to minimise API spend
    const uncached: string[] = [];
    const cacheHits: number[][] = [];
    for (const text of texts) {
      const hit = getCachedEmbedding(text);
      if (hit !== undefined) {
        cacheHits.push(hit);
      } else {
        uncached.push(text);
      }
    }

    if (uncached.length > 0) {
      const fresh = await getPrimaryProvider().batchGenerate(uncached);
      uncached.forEach((text, i) => {
        if (text !== undefined && fresh[i] !== undefined) {
          setCachedEmbedding(text, fresh[i]);
        }
      });
      return [...cacheHits, ...fresh];
    }

    return cacheHits;
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "embedding_batch_primary_failed",
    });
    // Graceful per-item fallback (each goes through the cache)
    return Promise.all(texts.map((t) => generateEmbedding(t)));
  }
}

export { EMBEDDING_DIMENSIONS };
