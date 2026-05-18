/**
 * Groq Multi-Key AI Service for Arch-Systems Portal
 * Uses 3 Groq API keys for rotation to increase free tier capacity
 * Each key: 30 req/min, 1440 req/day
 * Total with 3 keys: 90 req/min, 4320 req/day
 *
 * Integrated with SerpApi for web search augmentation
 */

import { APIError, RateLimitError } from "@repo/errors";
import { logError } from "@/lib/errors/error-logger";

interface ProviderConfig {
  name: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay: number;
}

const GROQ_CONFIG: ProviderConfig = {
  name: "Groq",
  baseUrl: "https://api.groq.com/openai/v1",
  model: "llama-3.1-8b-instant",
  maxTokens: 4096,
  requestsPerMinute: 30,
  tokensPerMinute: 6000,
  requestsPerDay: 1440,
};

export interface AIResponse {
  content: string;
  provider: string;
  keyIndex: number;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cached?: boolean;
}

export interface AIRequest {
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  context?: string;
  temperature?: number;
  maxTokens?: number;
}

// Rate limiting state (in-memory, per-key)
const rateLimitState: Array<{
  count: number;
  windowStart: number;
  tokenCount: number;
  lastReset: number;
}> = [
  { count: 0, windowStart: Date.now(), tokenCount: 0, lastReset: Date.now() },
  { count: 0, windowStart: Date.now(), tokenCount: 0, lastReset: Date.now() },
  { count: 0, windowStart: Date.now(), tokenCount: 0, lastReset: Date.now() },
];

/**
 * Safe helper to import and connect to the Redis client
 */
async function getRedisSafe() {
  try {
    const { getRedisClient } = await import("@repo/redis/client");
    return await getRedisClient();
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "redis_connection" }).catch(() => {});
    return null;
  }
}

/**
 * Check if key is rate limited (distributed via Redis with in-memory fallback)
 */
async function isRateLimited(keyIndex: number): Promise<boolean> {
  const config = GROQ_CONFIG;
  const redis = await getRedisSafe();

  if (redis) {
    try {
      const rpmKey = `ai:ratelimit:groq:key:${keyIndex}:rpm`;
      const tpmKey = `ai:ratelimit:groq:key:${keyIndex}:tpm`;
      const rpdKey = `ai:ratelimit:groq:key:${keyIndex}:rpd`;

      const [rpmStr, tpmStr, rpdStr] = await Promise.all([
        redis.get(rpmKey),
        redis.get(tpmKey),
        redis.get(rpdKey),
      ]);

      const rpmVal = rpmStr ? parseInt(rpmStr, 10) : 0;
      const tpmVal = tpmStr ? parseInt(tpmStr, 10) : 0;
      const rpdVal = rpdStr ? parseInt(rpdStr, 10) : 0;

      return (
        rpmVal >= config.requestsPerMinute ||
        tpmVal >= config.tokensPerMinute ||
        rpdVal >= config.requestsPerDay
      );
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), { context: "redis_rate_limit_check" }).catch(() => {});
    }
  }

  // Memory fallback
  const state = rateLimitState[keyIndex];
  if (!state) return true;
  const now = Date.now();

  if (now - state.windowStart > 60000) {
    state.count = 0;
    state.tokenCount = 0;
    state.windowStart = now;
  }

  if (now - state.lastReset > 86400000) {
    state.count = 0;
    state.lastReset = now;
  }

  return (
    state.count >= config.requestsPerMinute ||
    state.tokenCount >= config.tokensPerMinute ||
    state.count >= config.requestsPerDay
  );
}

/**
 * Update rate limit counters for specific key (distributed via Redis with in-memory fallback)
 */
async function updateRateLimit(keyIndex: number, tokens: number): Promise<void> {
  // Update local memory fallback
  const state = rateLimitState[keyIndex];
  if (state) {
    state.count++;
    state.tokenCount += tokens;
  }

  // Update global Redis counters
  const redis = await getRedisSafe();
  if (redis) {
    try {
      const rpmKey = `ai:ratelimit:groq:key:${keyIndex}:rpm`;
      const tpmKey = `ai:ratelimit:groq:key:${keyIndex}:tpm`;
      const rpdKey = `ai:ratelimit:groq:key:${keyIndex}:rpd`;

      const rpmCount = await redis.incr(rpmKey);
      if (rpmCount === 1) {
        await redis.expire(rpmKey, 60);
      }

      const tpmCount = await redis.incrBy(tpmKey, tokens);
      if (tpmCount === tokens) {
        await redis.expire(tpmKey, 60);
      }

      const rpdCount = await redis.incr(rpdKey);
      if (rpdCount === 1) {
        await redis.expire(rpdKey, 86400);
      }
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), { context: "redis_rate_limit_update" }).catch(() => {});
    }
  }
}

/**
 * Get API key by index from environment
 */
function getApiKey(keyIndex: number): string | undefined {
  const envVar = `GROQ_API_KEY_${keyIndex + 1}`;
  return process.env[envVar];
}

/**
 * Cache key generator
 */
function generateCacheKey(request: AIRequest): string {
  const content = JSON.stringify(request.messages);
  return btoa(content).slice(0, 64);
}

import { cacheGet, cacheSet } from "@repo/redis/cache";
import {
  searchGoogle,
  searchGoogleAI,
  searchGoogleMaps,
  searchGoogleNews,
  searchYouTube,
  searchGoogleShopping,
  formatSearchResults,
  formatAIResponse,
  type SerpApiSearchOptions,
  type SerpApiAIOptions,
  type SerpApiResponse,
  type GoogleMapsOptions,
  type GoogleNewsOptions,
  type YouTubeSearchOptions,
  type GoogleShoppingOptions,
} from "./serpapi";

/**
 * Check cache for existing AI response
 */
async function checkCache(key: string): Promise<AIResponse | null> {
  return cacheGet<AIResponse>(`ai:response:${key}`);
}

/**
 * Store AI response in cache
 */
async function storeCache(key: string, response: AIResponse) {
  await cacheSet(`ai:response:${key}`, response, 86400); // 24 hours
}

/**
 * Make API call to specific Groq key
 */
async function callProvider(
  keyIndex: number,
  request: AIRequest,
): Promise<AIResponse | null> {
  const config = GROQ_CONFIG;
  const apiKey = getApiKey(keyIndex);

  if (!apiKey) {
    logError(new Error(`No API key for Groq key ${keyIndex + 1}`), { context: "groq_missing_key", keyIndex }).catch(() => {});
    return null;
  }

  if (await isRateLimited(keyIndex)) {
    logError(new Error(`Groq key ${keyIndex + 1} rate limited`), { context: "groq_rate_limited", keyIndex }).catch(() => {});
    return null;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: config.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? config.maxTokens,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logError(new Error(`Groq key ${keyIndex + 1} API error: ${errorText}`), { context: "groq_api_error", keyIndex }).catch(() => {});
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    const usage = data.usage;
    await updateRateLimit(keyIndex, usage?.total_tokens || 0);

    return {
      content,
      provider: "groq",
      keyIndex,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "groq_request_failed", keyIndex }).catch(() => {});
    return null;
  }
}

/**
 * Main AI request function with key rotation
 */
export async function generateAIResponse(
  request: AIRequest,
  useCache = true,
): Promise<AIResponse> {
  const cacheKey = generateCacheKey(request);

  // Check cache first
  if (useCache) {
    const cached = await checkCache(cacheKey);
    if (cached) {
      return cached;
    }
  }

  // Try keys in order (rotation for rate limit distribution)
  for (let keyIndex = 0; keyIndex < 3; keyIndex++) {
    const response = await callProvider(keyIndex, request);
    if (response) {
      // Store in cache
      if (useCache) {
        await storeCache(cacheKey, response);
      }
      return response;
    }
  }

  // All keys failed
  throw new RateLimitError("All Groq API keys unavailable or rate limited. Please try again later.", {
    context: { reason: "all_keys_rate_limited", provider: "groq" },
  });
}

/**
 * Stream AI response for chat interface with key rotation
 */
export async function* streamAIResponse(
  request: AIRequest,
): AsyncGenerator<string, void, unknown> {
  const config = GROQ_CONFIG;

  // Try keys in order for streaming
  for (let keyIndex = 0; keyIndex < 3; keyIndex++) {
    const apiKey = getApiKey(keyIndex);

    if (!apiKey || (await isRateLimited(keyIndex))) {
      continue; // Try next key
    }

    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? config.maxTokens,
          stream: true,
        }),
      });

      if (!response.ok) {
        continue; // Try next key
      }

      const reader = response.body?.getReader();
      if (!reader) {
        continue; // Try next key
      }

      const decoder = new TextDecoder();
      let buffer = "";
      let hasContent = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") return;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                hasContent = true;
                yield content;
              }
            } catch {
              // Ignore parse errors for incomplete chunks
            }
          }
        }
      }

      // If we got content, return successfully
      if (hasContent) return;

    } catch (error) {
      logError(error instanceof Error ? error : new Error(String(error)), { context: "groq_streaming_error", keyIndex }).catch(() => {});
      continue; // Try next key
    }
  }

  // All keys failed
  yield "AI service temporarily unavailable. Please try again later.";
}

/**
 * Pre-built prompts for different use cases
 */
export const AIPrompts = {
  predictiveMaintenance: (machineData: string) => ({
    system:
      "You are an industrial maintenance AI. Analyze machine data and provide risk assessment. Output JSON only.",
    user: `Analyze this machine data and provide:
1. Risk level (low/medium/high)
2. Recommended actions
3. Estimated time to maintenance

Data: ${machineData}

Output format: {"risk": "low|medium|high", "actions": ["action1", "action2"], "timeEstimate": "X hours/days"}`,
  }),

  shiftHandoff: (shiftData: string) => ({
    system:
      "You are a shift supervisor AI. Summarize shift activities concisely for the next shift.",
    user: `Generate a shift handoff report from this data:
${shiftData}

Include:
- Key accomplishments
- Ongoing issues
- Critical alerts
- Recommended priorities for next shift

Keep it brief and actionable.`,
  }),

  safetyCompliance: (logData: string) => ({
    system:
      "You are a safety compliance officer AI. Review logs for safety violations and concerns.",
    user: `Review these shift logs for safety compliance:
${logData}

Identify:
1. Any safety violations or concerns
2. Near-misses
3. Recommendations for improvement
4. Overall safety score (1-10)

Output format: {"violations": ["..."], "concerns": ["..."], "score": N}`,
  }),

  equipmentManual: (question: string, context?: string) => ({
    system:
      "You are a technical support AI. Answer equipment questions based on manuals and best practices.",
    user: context
      ? `Context: ${context}\n\nQuestion: ${question}`
      : `Question: ${question}`,
  }),

  translate: (text: string, targetLang: string) => ({
    system: `You are a professional translator. Translate accurately while preserving technical terminology.`,
    user: `Translate this text to ${targetLang}:

${text}`,
  }),
};

/**
 * Generate AI response with web search context
 * Searches Google first, then uses results to augment the LLM response
 */
export async function generateAIResponseWithSearch(
  query: string,
  searchOptions: SerpApiSearchOptions = {},
  aiOptions: Omit<AIRequest, "messages"> = {},
): Promise<AIResponse> {
  try {
    // Perform web search
    const searchResults = await searchGoogle(query, searchOptions);
    const formattedResults = formatSearchResults(searchResults);

    // Augment prompt with search results
    const augmentedRequest: AIRequest = {
      messages: [
        {
          role: "system",
          content:
            "You are an AI assistant with access to web search results. Use the provided search results to answer the user's question accurately. If the search results don't contain relevant information, use your general knowledge.",
        },
        {
          role: "user",
          content: `Search Results:\n${formattedResults}\n\nUser Question: ${query}`,
        },
      ],
      ...aiOptions,
    };

    return generateAIResponse(augmentedRequest, true);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "search_augmentation_failed" }).catch(() => {});
    // Fallback to LLM-only response
    const fallbackRequest: AIRequest = {
      messages: [
        {
          role: "user",
          content: query,
        },
      ],
      ...aiOptions,
    };
    return generateAIResponse(fallbackRequest, true);
  }
}

/**
 * Use Google AI Mode directly (multi-turn capable)
 * Returns the AI Mode response with optional follow-up token
 */
export async function generateAIResponseWithGoogleAI(
  query: string,
  options: SerpApiAIOptions = {},
): Promise<{ response: string; token?: string }> {
  try {
    const results = await searchGoogleAI(query, options);
    const responseText = formatAIResponse(results);

    return {
      response: responseText,
      token: results.subsequent_request_token,
    };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "google_ai_mode_failed" }).catch(() => {});
    throw new APIError("Google AI Mode unavailable", {
      statusCode: 503,
      context: { provider: "google_ai", reason: "service_unavailable" },
      cause: error instanceof Error ? error : undefined,
    });
  }
}

/**
 * Multi-turn conversation using Google AI Mode
 * Use the token from previous response to continue the conversation
 */
export async function continueGoogleAIConversation(
  query: string,
  previousToken: string,
  options: Omit<SerpApiAIOptions, "subsequentRequestToken"> = {},
): Promise<{ response: string; token?: string }> {
  return generateAIResponseWithGoogleAI(query, {
    ...options,
    subsequentRequestToken: previousToken,
  });
}

/**
 * Phase 1: Search Google Maps for locations, routing
 */
export async function searchMaps(
  query: string,
  options: GoogleMapsOptions = {},
): Promise<SerpApiResponse> {
  return searchGoogleMaps(query, options);
}

/**
 * Phase 1: Search Google News for industry alerts, safety updates
 */
export async function searchNews(
  query: string,
  options: GoogleNewsOptions = {},
): Promise<SerpApiResponse> {
  return searchGoogleNews(query, options);
}

/**
 * Phase 1: Search YouTube for training videos, tutorials
 */
export async function searchVideos(
  query: string,
  options: YouTubeSearchOptions = {},
): Promise<SerpApiResponse> {
  return searchYouTube(query, options);
}

/**
 * Phase 1: Search Google Shopping for equipment procurement
 */
export async function searchShopping(
  query: string,
  options: GoogleShoppingOptions = {},
): Promise<SerpApiResponse> {
  return searchGoogleShopping(query, options);
}

/**
 * Department-specific AI with context augmentation
 * Combines multiple SerpApi sources based on department needs
 */
export async function generateDepartmentAIResponse(
  department: string,
  query: string,
): Promise<{ response: string; sources: string[] }> {
  const sources: string[] = [];
  let context = "";

  try {
    // Department-specific search strategies
    switch (department) {
      case "engineering":
      case "drilling":
        // Search patents and shopping for equipment
        const [patentResults, shoppingResults] = await Promise.all([
          searchGoogle(query, { num: 3 }),
          searchGoogleShopping(query, { num: 3 }),
        ]);
        sources.push("patents", "shopping");
        context += formatSearchResults(patentResults);
        break;

      case "safety":
        // Search news and videos
        const [newsResults, videoResults] = await Promise.all([
          searchGoogleNews(query, { num: 3 }),
          searchYouTube(query, { num: 3 }),
        ]);
        sources.push("news", "videos");
        context += formatSearchResults(newsResults);
        break;

      case "training":
        // Search videos and scholar
        const [trainingVideos, scholarResults] = await Promise.all([
          searchYouTube(query, { num: 5 }),
          searchGoogle(query, { num: 3 }),
        ]);
        sources.push("videos", "scholar");
        context += formatSearchResults(trainingVideos);
        break;

      case "access-control":
      case "control-room":
        // Search maps and local services
        const [mapsResults, localResults] = await Promise.all([
          searchGoogleMaps(query, { num: 3 }),
          searchGoogle(query, { num: 3 }),
        ]);
        sources.push("maps", "local");
        context += formatSearchResults(mapsResults);
        break;

      default:
        // General search
        const generalResults = await searchGoogle(query, { num: 5 });
        sources.push("search");
        context += formatSearchResults(generalResults);
    }

    // Augment with context if available
    if (context) {
      const augmentedRequest: AIRequest = {
        messages: [
          {
            role: "system",
            content: `You are an AI assistant for the ${department} department. Use the provided search results to answer accurately.`,
          },
          {
            role: "user",
            content: `Search Results:\n${context}\n\nUser Question: ${query}`,
          },
        ],
      };
      const response = await generateAIResponse(augmentedRequest, true);
      return { response: response.content, sources };
    }

    // Fallback without context
    const fallbackRequest: AIRequest = {
      messages: [{ role: "user", content: query }],
    };
    const response = await generateAIResponse(fallbackRequest, true);
    return { response: response.content, sources };
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "department_ai_failed" }).catch(() => {});
    // Ultimate fallback
    const fallbackRequest: AIRequest = {
      messages: [{ role: "user", content: query }],
    };
    const response = await generateAIResponse(fallbackRequest, true);
    return { response: response.content, sources };
  }
}
