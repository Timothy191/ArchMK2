import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { z } from "zod";
import { models } from "@/lib/ai/providers";
import { systemPrompts } from "@/lib/ai/prompts";
import { aiTools } from "@/lib/ai/tools";
import { createServerSupabaseClient } from "@repo/supabase/server";
import {
  storeMemory,
  retrieveRelevantMemories,
  formatMemoriesForContext,
} from "@/lib/ai/memory";
import { logError } from "@/lib/errors/error-logger";
import { checkRateLimit } from "./limiter";

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
  if (!checkRateLimit(ip)) {
    return new Response("Rate limited", { status: 429 });
  }

  // Authenticate user
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

  const userId = user.id;

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

  const { messages, context, sessionId: clientSessionId } = parsed.data;
  const sessionId = clientSessionId ?? generateSessionId();

  // Get the latest user message for memory storage and retrieval
  const latestUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  let memoryContext = "";

  if (latestUserMessage) {
    try {
      // Store user message as episodic memory
      await storeMemory({
        sessionId,
        userId,
        content: `User: ${latestUserMessage.content}`,
        memoryType: "episodic",
        metadata: {
          message_id: latestUserMessage.id,
          role: "user",
          ip,
        },
      });

      // Retrieve relevant memories (same session + semantic facts)
      const [sessionMemories, semanticMemories] = await Promise.all([
        retrieveRelevantMemories({
          userId,
          query: latestUserMessage.content,
          sessionId,
          memoryType: "episodic",
          limit: 10,
          useHybridSearch: true,
        }).catch((err) => {
          logError(err instanceof Error ? err : new Error(String(err)), { context: "chat_session_memory_retrieval" }).catch(() => {});
          return [];
        }),
        retrieveRelevantMemories({
          userId,
          query: latestUserMessage.content,
          memoryType: "semantic",
          limit: 5,
          useHybridSearch: true,
        }).catch((err) => {
          logError(err instanceof Error ? err : new Error(String(err)), { context: "chat_semantic_memory_retrieval" }).catch(() => {});
          return [];
        }),
      ]);

      const combinedMemories = [...sessionMemories, ...semanticMemories]
        .sort((a, b) => (b.combinedScore ?? 0) - (a.combinedScore ?? 0))
        .slice(0, 10);

      memoryContext = formatMemoriesForContext(combinedMemories);
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), { context: "chat_memory_system" }).catch(() => {});
      // Continue without memory if retrieval fails
    }
  }

  const convertedMessages = await convertToModelMessages(
    messages.map((m) => ({ ...m, parts: m.parts ?? [] })),
  );

  try {
    const result = streamText({
      model: models.primary,
      system: systemPrompts.chat(context, memoryContext),
      messages: convertedMessages,
      tools: aiTools,
      stopWhen: stepCountIs(5),
    });

    // Fire-and-forget: store assistant response when streaming completes
    Promise.resolve(result.text)
      .then(async (assistantText) => {
        const text = typeof assistantText === "string" ? assistantText : "";
        if (text.trim().length > 0) {
          await storeMemory({
            sessionId,
            userId,
            content: `Assistant: ${text}`,
            memoryType: "episodic",
            metadata: { role: "assistant", provider: "primary" },
          });
        }
      })
      .catch((err: unknown) => {
        logError(err instanceof Error ? err : new Error(String(err)), { context: "chat_store_assistant_memory_primary" }).catch(() => {});
      });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "chat_primary_provider_failed" }).catch(() => {});

    try {
      const result = streamText({
        model: models.secondary,
        system: systemPrompts.chat(context, memoryContext),
        messages: convertedMessages,
        tools: aiTools,
        stopWhen: stepCountIs(5),
      });

      Promise.resolve(result.text)
        .then(async (assistantText) => {
          const text = typeof assistantText === "string" ? assistantText : "";
          if (text.trim().length > 0) {
            await storeMemory({
              sessionId,
              userId,
              content: `Assistant: ${text}`,
              memoryType: "episodic",
              metadata: { role: "assistant", provider: "secondary" },
            });
          }
        })
        .catch((err: unknown) => {
          logError(err instanceof Error ? err : new Error(String(err)), { context: "chat_store_assistant_memory_secondary" }).catch(() => {});
        });

      return result.toUIMessageStreamResponse();
    } catch (secondaryError) {
      logError(secondaryError instanceof Error ? secondaryError : new Error(String(secondaryError)), { context: "chat_streaming_error" }).catch(() => {});
      return new Response(
        JSON.stringify({ error: "Failed to generate response" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }
}
