"use server";
import { logError } from "@/lib/errors/error-logger";
import {
  complianceResultSchema,
  type ComplianceResult,
} from "@/lib/ai/schemas";
import { chat, DEFAULT_MODEL } from "@/lib/ai/providers";

const SYSTEM_PROMPT = `You are a safety compliance officer AI for an industrial operations portal.
Review shift logs for safety violations, near-misses, and concerns.
Assign an overall safety score from 1 to 10.

Respond ONLY with valid JSON — no markdown fences, no prose — matching this schema:
{
  "violations": ["string"],
  "concerns": ["string"],
  "score": number,
  "summary": "string"
}`;

export async function POST(req: Request) {
  try {
    const { logData }: { logData: string } = await req.json();
    if (!logData) {
      return new Response(JSON.stringify({ error: "logData is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const raw = await chat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Review these shift logs for safety compliance:\n\n${logData}\n\nReturn ONLY valid JSON, no extra text, no markdown fences.` },
      ],
      { model: DEFAULT_MODEL, temperature: 0.3, maxTokens: 1024 },
    );

    const parsed = complianceResultSchema.safeParse(
      JSON.parse(raw ?? "{}"),
    );
    if (!parsed.success) {
      return Response.json(
        { violations: [], concerns: [], score: 0, summary: raw ?? "" } satisfies ComplianceResult,
        { status: 200 },
      );
    }

    return Response.json(parsed.data);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "safety_compliance" });
    return new Response(
      JSON.stringify({ error: "Failed to analyze safety compliance" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
