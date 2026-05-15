import { groq } from "@ai-sdk/groq";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";

export const groqProvider = groq;

export const openrouterProvider = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const models: { primary: LanguageModel; secondary: LanguageModel } = {
  primary: groq("llama-3.1-8b-instant"),
  secondary: openrouterProvider("google/gemma-2-9b-it:free"),
};

export type ModelKey = keyof typeof models;

export async function withFailover<T>(
  fn: (model: LanguageModel) => Promise<T>,
  modelList: LanguageModel[] = [models.primary, models.secondary],
): Promise<T> {
  let lastError: Error | undefined;
  for (const model of modelList) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Provider failed, trying next:`, lastError.message);
    }
  }
  throw lastError ?? new Error("All providers failed");
}
