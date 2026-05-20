/**
 * Cost Tracker — Per-request AI usage logging and spend estimation.
 *
 * Integrates with the LangGraph agent in agent-graph.ts. After each LLM call,
 * the saveMemoryNode awaits the usage object from streamText and logs it here.
 *
 * Cost estimates are approximate and based on public pricing. They are useful
 * for spend visibility and alerting, not for billing.
 */

import { createServerSupabaseClient } from "@repo/supabase/server";
import { DatabaseError } from "@repo/errors";
import { logError } from "@/lib/errors/error-logger";

export interface TokenUsage {
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  totalTokens: number | undefined;
}

export interface UsageRecord {
  id: string;
  sessionId: string;
  userId: string;
  provider: string;
  model: string;
  inputTokens: number | undefined;
  outputTokens: number | undefined;
  totalTokens: number | undefined;
  estimatedCostUsd: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pricing map — USD per 1M tokens (input / output)
// Sources: Groq 2025-05, OpenRouter 2025-05
// ---------------------------------------------------------------------------
const COST_PER_1M_TOKENS: Record<string, { input: number; output: number }> = {
  "llama-3.1-8b-instant": { input: 0.05, output: 0.08 },
  "meta-llama/llama-3.1-8b-instruct": { input: 0.06, output: 0.1 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "claude-sonnet-4-20250514": { input: 3.0, output: 15.0 },
};

const DEFAULT_COST = { input: 0.1, output: 0.1 };

function resolveModelName(provider: string): string {
  return provider === "primary"
    ? "llama-3.1-8b-instant"
    : "meta-llama/llama-3.1-8b-instruct";
}

function estimateCost(model: string, usage: TokenUsage): number {
  const rates = COST_PER_1M_TOKENS[model] ?? DEFAULT_COST;
  const inputCost = ((usage.inputTokens ?? 0) * rates.input) / 1_000_000;
  const outputCost = ((usage.outputTokens ?? 0) * rates.output) / 1_000_000;
  return Number((inputCost + outputCost).toFixed(6));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Log a single AI request's token usage and estimated cost.
 */
export async function trackUsage(
  sessionId: string,
  userId: string,
  provider: string,
  usage: TokenUsage,
  metadata?: Record<string, unknown>,
): Promise<void> {
  const model = resolveModelName(provider);
  const estimatedCost = estimateCost(model, usage);

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from("ai_usage_logs").insert({
    session_id: sessionId,
    user_id: userId,
    provider,
    model,
    prompt_tokens: usage.inputTokens ?? 0,
    completion_tokens: usage.outputTokens ?? 0,
    total_tokens: usage.totalTokens ?? 0,
    estimated_cost_usd: estimatedCost,
    metadata: metadata ?? {},
  });

  if (error) {
    logError(new Error(error.message), {
      context: "cost_tracker_insert",
      table: "ai_usage_logs",
    });
    // Non-fatal: don't crash the chat flow for a logging failure
  }
}

/**
 * Aggregate spend for a user over a date range.
 */
export async function getUsageSummary(
  userId: string,
  startDate: Date,
  endDate: Date,
): Promise<{
  totalCostUsd: number;
  totalTokens: number;
  requestCount: number;
}> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_usage_logs")
    .select("estimated_cost_usd, total_tokens")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) {
    logError(new Error(error.message), { context: "cost_tracker_summary" });
    throw new DatabaseError("Failed to load usage summary", {
      operation: "select",
      table: "ai_usage_logs",
    });
  }

  const rows = data ?? [];
  const totalCostUsd = rows.reduce(
    (sum, r) => sum + Number(r.estimated_cost_usd),
    0,
  );
  const totalTokens = rows.reduce((sum, r) => sum + (r.total_tokens ?? 0), 0);

  return {
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
    totalTokens,
    requestCount: rows.length,
  };
}

/**
 * Retrieve recent usage records for a session (for debugging / audit).
 */
export async function getSessionUsage(
  sessionId: string,
  limit = 50,
): Promise<UsageRecord[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("ai_usage_logs")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    logError(new Error(error.message), { context: "cost_tracker_session" });
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    sessionId: row.session_id,
    userId: row.user_id,
    provider: row.provider,
    model: row.model,
    inputTokens: row.prompt_tokens,
    outputTokens: row.completion_tokens,
    totalTokens: row.total_tokens,
    estimatedCostUsd: Number(row.estimated_cost_usd),
    metadata: row.metadata as Record<string, unknown>,
    createdAt: row.created_at,
  }));
}
