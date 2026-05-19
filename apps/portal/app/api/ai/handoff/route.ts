import { generateText } from "ai";
import { withFailover } from "@/lib/ai/providers";
import { systemPrompts } from "@/lib/ai/prompts";
import { logError } from "@/lib/errors/error-logger";

export async function POST(req: Request) {
  const { shiftData }: { shiftData: string } = await req.json();

  if (!shiftData) {
    return new Response(JSON.stringify({ error: "shiftData is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await withFailover((model) =>
      generateText({
        model,
        system: systemPrompts.shiftHandoff,
        prompt: `Generate a shift handoff report from this data:\n\n${shiftData}\n\nInclude:\n- Key accomplishments\n- Ongoing issues\n- Critical alerts\n- Recommended priorities for next shift\n\nKeep it brief and actionable.`,
        temperature: 0.5,
        maxOutputTokens: 1024,
      }),
    );

    return Response.json({ content: result.text });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "shift_handoff" });
    return new Response(
      JSON.stringify({ error: "Failed to generate shift handoff report" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
