"use server";

/**
 * AI Chat API — Graph-native agent orchestration.
 *
 * Nodes: authenticate → rateLimit → resolveContext → loadMemory → gatherContext → callLLM → output → (post-stream: saveMemory)
 * Conditional edges: primary failure → retry with secondary provider.
 */

import { z } from "zod";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { logError } from "@/lib/errors/error-logger";
import { createInitialAgentState } from "@/lib/ai/agent-state";
import { runAgentGraph, finalizeAgentGraph } from "@/lib/ai/agent-graph";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().min(1).max(128),
        role: z.enum(["user", "assistant", "system"]),
        content: z.string().max(32_768),
        parts: z.any().optional(),
      }),
    )
    .max(50),
  context: z.string().max(4_096).optional(),
  sessionId: z.string().min(1).max(256).optional(),
});

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";

  // Authenticate early so we have a userId for the graph
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const body = await req.json();
  const parsed = ChatRequestSchema.safeParse(body);

  if (!parsed.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request",
        details: parsed.error.issues,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }

  const {
    messages: rawMessages,
    context,
    sessionId: clientSessionId,
  } = parsed.data;
  const sessionId = clientSessionId ?? generateSessionId();

  // Normalize messages to satisfy UIMessage type (parts required)
  const messages = rawMessages.map((m) => ({
    ...m,
    parts: m.parts ?? [],
  }));

  const initialState = createInitialAgentState(
    user.id,
    sessionId,
    ip,
    messages,
    context,
  );

  try {
    const { response, finalState } = await runAgentGraph(initialState);

    // If we streamed successfully, queue memory finalization.
    // In Vercel Edge, use waitUntil if available; otherwise the
    // client should send the sessionId back on the next request
    // and we'll save memory then (idempotent).
    if (finalState.nextNode === "saveMemory") {
      finalizeAgentGraph(finalState).catch((err: unknown) => {
        logError(err instanceof Error ? err : new Error(String(err)), {
          context: "chat_finalize_memory",
        });
      });
    }

    return response;
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "chat_agent_graph_unhandled",
    });
    return new Response(
      JSON.stringify({ error: "Failed to process request" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
