import { streamText, convertToModelMessages, stepCountIs, UIMessage } from "ai";
import { models } from "@/lib/ai/providers";
import { systemPrompts } from "@/lib/ai/prompts";
import { aiTools } from "@/lib/ai/tools";

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

  const { messages, context }: { messages: UIMessage[]; context?: string } =
    await req.json();

  if (!messages || !Array.isArray(messages)) {
    return new Response(JSON.stringify({ error: "Messages array required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

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
