"use server";
import { logError } from "@/lib/errors/error-logger";
import { chat, DEFAULT_MODEL } from "@/lib/ai/providers";

export async function POST(req: Request) {
  try {
    const { shiftData }: { shiftData: string } = await req.json();
    if (!shiftData) {
      return new Response(JSON.stringify({ error: "shiftData is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const text = await chat(
      [
        { role: "system", content: "You are a shift supervisor AI for an industrial operations portal. Summarize the shift concisely: key accomplishments, ongoing issues, critical alerts, and recommended priorities for the next shift. Be brief and actionable." },
        { role: "user", content: `Generate a shift handoff report from this data:\n\n${shiftData}` },
      ],
      { model: DEFAULT_MODEL, temperature: 0.5, maxTokens: 1024 },
    );

    return Response.json({ content: text });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "shift_handoff" });
    return new Response(
      JSON.stringify({ error: "Failed to generate shift handoff report" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
