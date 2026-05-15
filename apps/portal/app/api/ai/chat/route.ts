import { streamText, convertToModelMessages, stepCountIs, UIMessage } from "ai";
import { z } from "zod";
import { models } from "@/lib/ai/providers";
import { systemPrompts } from "@/lib/ai/prompts";
import { aiTools } from "@/lib/ai/tools";

const ChatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        id: z.string().min(1).max(128),
        role: z.enum(["user", "assistant", "system", "data"]),
        content: z.string().max(32_768),
        parts: z.any().optional(),
      }),
    )
    .max(50),
  context: z.string().max(4_096).optional(),
});

const rateLimits = new Map<string, { count: number; windowStart: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimits.set(ip, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= MAX_REQUESTS) return false;
  entry.count++;
  return true;
}

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response("Rate limited", { status: 429 });
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

  const { messages, context } = parsed.data;

  const convertedMessages = await convertToModelMessages(messages);

  try {
    const result = streamText({
      model: models.primary,
      system: systemPrompts.chat(context),
      messages: convertedMessages,
      tools: aiTools,
      stopWhen: stepCountIs(5),
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    // Try secondary provider if primary fails
    console.warn("Primary provider failed, trying secondary:", error);

    try {
      const result = streamText({
        model: models.secondary,
        system: systemPrompts.chat(context),
        messages: convertedMessages,
        tools: aiTools,
        stopWhen: stepCountIs(5),
      });

      return result.toUIMessageStreamResponse();
    } catch (secondaryError) {
      console.error("Chat streaming error:", secondaryError);
      return new Response(
        JSON.stringify({ error: "Failed to generate response" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }
}
