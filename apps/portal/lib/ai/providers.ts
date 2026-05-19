import { groq } from "@ai-sdk/groq";
import { openrouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { logError } from "@/lib/errors/error-logger";

export const models: { primary: LanguageModel; secondary: LanguageModel } = {
  primary: groq("llama-3.1-8b-instant"),
  secondary: openrouter("meta-llama/llama-3.1-8b-instruct"),
};

/**
 * Execute function with Groq model
 * Note: Multi-key rotation is handled in ai-service.ts at the API level
 */
export async function withFailover<T>(
  fn: (_model: LanguageModel) => Promise<T>,
  modelList: LanguageModel[] = [models.primary],
): Promise<T> {
  let lastError: Error | undefined;
  for (const model of modelList) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      logError(lastError, { context: "groq_model_failover" });
    }
  }
  throw lastError ?? new Error("Groq provider failed");
}
