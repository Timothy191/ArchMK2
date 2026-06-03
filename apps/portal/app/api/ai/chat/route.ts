/**
 * AI Chat API — Graph-native agent orchestration.
 *
 * Nodes: authenticate → rateLimit → resolveContext → loadMemory → gatherContext → executeTools → callLLM → output → saveMemory
 *
 * Serverless memory handshake:
 *   - On streaming response, the graph attaches `x-arch-memory-session-id` header.
 *   - If the client sends this header back on the NEXT request, we finalize
 *     the previous response's memory save before processing the new request.
 *   - If waitUntil is available (platform supports it), use that instead.
 */

import { z } from "zod";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { logError } from "@/lib/errors/error-logger";
import { createInitialAgentState } from "@/lib/ai/agent-state";
import { runAgentGraph, finalizeAgentGraph } from "@/lib/ai/agent-graph";
import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api/rate-limit-middleware";

// Track pending memory finalizations by session ID.
// In serverless, this is best-effort — the real handshake is the echo header.
const pendingFinalizations = new Map<string, Promise<void>>();

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
  model: z.string().max(128).optional(),
});

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Finalize any pending memory for a session.
 * Called before processing a new request if the client echoes the session ID.
 */
async function finalizePendingMemory(sessionId: string): Promise<void> {
  const pending = pendingFinalizations.get(sessionId);
  if (pending) {
    try {
      await pending;
    } catch {
      // Swallow — memory finalization is best-effort
    } finally {
      pendingFinalizations.delete(sessionId);
    }
  }
}

async function handleChatRequest(req: Request) {
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

  // Serverless memory handshake: if the client echoes the previous session ID,
  // finalize its pending memory save before handling the new request.
  const previousSessionId = req.headers.get("x-arch-memory-session-id");
  if (previousSessionId) {
    // Fire-and-forget the pending finalization — it'll clean up on its own.
    finalizePendingMemory(previousSessionId);
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
    model,
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
    model,
  );

  try {
    const { response, finalState } = await runAgentGraph(initialState);

    // If we streamed successfully, queue memory finalization.
    if (finalState.nextNode === "saveMemory") {
      // Try waitUntil if available (platform-specific)
      // eslint-disable-next-line no-undef
      const g = globalThis as any;
      if (typeof g.waitUntil === "function") {
        g.waitUntil(finalizeAgentGraph(finalState));
      } else {
        // Fall back to best-effort promise tracking.
        // The client will echo x-arch-memory-session-id on the next request
        // and the server will finalize then.
        const memPromise = finalizeAgentGraph(finalState).catch(
          (err: unknown) => {
            logError(err instanceof Error ? err : new Error(String(err)), {
              context: "chat_finalize_memory",
            });
          },
        );
        pendingFinalizations.set(sessionId, memPromise);
      }
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

export async function POST(req: Request) {
  return withRateLimit(
    req,
    () => handleChatRequest(req) as Promise<NextResponse>,
  );
}
