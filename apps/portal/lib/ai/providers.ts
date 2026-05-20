import { groq } from "@ai-sdk/groq";
import { openrouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { withSpan } from "@repo/supabase";
import { logError } from "@/lib/errors/error-logger";

export const models: { primary: LanguageModel; secondary: LanguageModel } = {
  primary: groq("llama-3.1-8b-instant"),
  secondary: openrouter("meta-llama/llama-3.1-8b-instruct"),
};

/**
 * Execute function with failover across models.
 * Wraps each attempt in an OTel span for latency tracking.
 */
export async function withFailover<T>(
  fn: (_model: LanguageModel) => Promise<T>,
  modelList: LanguageModel[] = [models.primary],
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < modelList.length; i++) {
    const model = modelList[i];
    if (!model) continue;

    const modelName =
      model === models.primary
        ? "llama-3.1-8b-instant"
        : "meta-llama/llama-3.1-8b-instruct";
    const provider = model === models.primary ? "groq" : "openrouter";

    try {
      return await withSpan("ai.llm.attempt", async () => fn(model), {
        attempt: i + 1,
        model: modelName,
        provider,
      });
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logError(lastError, {
        context: "groq_model_failover",
        attempt: i + 1,
        model: modelName,
        provider,
      });
    }
  }

  throw lastError ?? new Error("All LLM providers failed");
}
