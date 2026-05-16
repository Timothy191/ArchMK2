/**
 * Multi-Provider AI Service for Arch-Systems Portal
 * Supports Groq (primary), OpenRouter (secondary), Together AI (backup)
 * All providers have free tiers with no credit card required
 */

// Provider types
export type AIProvider = "groq" | "openrouter" | "together";

interface ProviderConfig {
  name: string;
  baseUrl: string;
  model: string;
  maxTokens: number;
  requestsPerMinute: number;
  tokensPerMinute: number;
  requestsPerDay: number;
}

const PROVIDERS: Record<AIProvider, ProviderConfig> = {
  groq: {
    name: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    model: "llama-3.1-8b-instant",
    maxTokens: 4096,
    requestsPerMinute: 30,
    tokensPerMinute: 6000,
    requestsPerDay: 1440, // 30 * 48 (30 per min = 1440 per day)
  },
  openrouter: {
    name: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "google/gemma-2-9b-it:free",
    maxTokens: 4096,
    requestsPerMinute: 0, // N/A
    tokensPerMinute: 0,
    requestsPerDay: 60,
  },
  together: {
    name: "Together AI",
    baseUrl: "https://api.together.xyz/v1",
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    maxTokens: 4096,
    requestsPerMinute: 0,
    tokensPerMinute: 60,
    requestsPerDay: 60,
  },
};

export interface AIResponse {
  content: string;
  provider: AIProvider;
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

// Rate limiting state (in-memory, per-instance)
const rateLimitState: Record<
  AIProvider,
  { count: number; windowStart: number; tokenCount: number; lastReset: number }
> = {
  groq: {
    count: 0,
    windowStart: Date.now(),
    tokenCount: 0,
    lastReset: Date.now(),
  },
  openrouter: {
    count: 0,
    windowStart: Date.now(),
    tokenCount: 0,
    lastReset: Date.now(),
  },
  together: {
    count: 0,
    windowStart: Date.now(),
    tokenCount: 0,
    lastReset: Date.now(),
  },
};

/**
 * Check if provider is rate limited
 */
function isRateLimited(provider: AIProvider): boolean {
  const state = rateLimitState[provider];
  const config = PROVIDERS[provider];
  const now = Date.now();

  // Reset counters if window expired
  if (provider === "groq") {
    // Per minute window
    if (now - state.windowStart > 60000) {
      state.count = 0;
      state.tokenCount = 0;
      state.windowStart = now;
    }
    return (
      state.count >= config.requestsPerMinute ||
      state.tokenCount >= config.tokensPerMinute
    );
  } else {
    // Per day window
    if (now - state.lastReset > 86400000) {
      state.count = 0;
      state.lastReset = now;
    }
    return state.count >= config.requestsPerDay;
  }
}

/**
 * Update rate limit counters
 */
function updateRateLimit(provider: AIProvider, tokens: number) {
  rateLimitState[provider].count++;
  rateLimitState[provider].tokenCount += tokens;
}

/**
 * Get API key from environment
 */
function getApiKey(provider: AIProvider): string | undefined {
  const envVar =
    provider === "groq"
      ? "GROQ_API_KEY"
      : provider === "openrouter"
        ? "OPENROUTER_API_KEY"
        : "TOGETHER_API_KEY";
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
 * Make API call to specific provider
 */
async function callProvider(
  provider: AIProvider,
  request: AIRequest,
): Promise<AIResponse | null> {
  const config = PROVIDERS[provider];
  const apiKey = getApiKey(provider);

  if (!apiKey) {
    console.warn(`No API key for ${config.name}`);
    return null;
  }

  if (isRateLimited(provider)) {
    console.warn(`${config.name} rate limited`);
    return null;
  }

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    // OpenRouter specific headers
    if (provider === "openrouter") {
      headers["HTTP-Referer"] =
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      headers["X-Title"] = "Arch-Systems Portal";
    }

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
      const error = await response.text();
      console.error(`${config.name} API error:`, error);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return null;
    }

    const usage = data.usage;
    updateRateLimit(provider, usage?.total_tokens || 0);

    return {
      content,
      provider,
      usage: usage
        ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    console.error(`${config.name} request failed:`, error);
    return null;
  }
}

/**
 * Main AI request function with failover
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

  // Try providers in order of preference
  const providers: AIProvider[] = ["groq", "openrouter", "together"];

  for (const provider of providers) {
    const response = await callProvider(provider, request);
    if (response) {
      // Store in cache
      if (useCache) {
        await storeCache(cacheKey, response);
      }
      return response;
    }
  }

  // All providers failed
  throw new Error("All AI providers unavailable. Please try again later.");
}

/**
 * Stream AI response for chat interface
 */
export async function* streamAIResponse(
  request: AIRequest,
): AsyncGenerator<string, void, unknown> {
  const provider: AIProvider = "groq"; // Streaming only with Groq for now
  const config = PROVIDERS[provider];
  const apiKey = getApiKey(provider);

  if (!apiKey || isRateLimited(provider)) {
    yield "AI service temporarily unavailable. Please try again later.";
    return;
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
      yield "Unable to connect to AI service.";
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield "Unable to read AI response.";
      return;
    }

    const decoder = new TextDecoder();
    let buffer = "";

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
              yield content;
            }
          } catch {
            // Ignore parse errors for incomplete chunks
          }
        }
      }
    }
  } catch (error) {
    console.error("Streaming error:", error);
    yield "Error while generating response.";
  }
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
