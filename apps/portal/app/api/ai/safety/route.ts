import { generateObject } from "ai";
import { withFailover } from "@/lib/ai/providers";
import { systemPrompts } from "@/lib/ai/prompts";
import { complianceResultSchema } from "@/lib/ai/schemas";
import { logError } from "@/lib/errors/error-logger";

export async function POST(req: Request) {
  const { logData }: { logData: string } = await req.json();

  if (!logData) {
    return new Response(JSON.stringify({ error: "logData is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await withFailover((model) =>
      generateObject({
        model,
        schema: complianceResultSchema,
        system: systemPrompts.safetyCompliance,
        prompt: `Review these shift logs for safety compliance:\n\n${logData}\n\nIdentify safety violations, near-misses, concerns, and provide an overall safety score from 1-10.`,
        temperature: 0.3,
        maxOutputTokens: 1024,
      }),
    );

    return Response.json(result.object);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "safety_compliance" });
    return new Response(
      JSON.stringify({ error: "Failed to analyze safety compliance" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
