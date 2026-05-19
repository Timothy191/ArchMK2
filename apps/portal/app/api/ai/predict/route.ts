import { generateObject } from "ai";
import { withFailover } from "@/lib/ai/providers";
import { systemPrompts } from "@/lib/ai/prompts";
import { riskAssessmentSchema } from "@/lib/ai/schemas";
import { logError } from "@/lib/errors/error-logger";

export async function POST(req: Request) {
  const { machineData }: { machineData: string } = await req.json();

  if (!machineData) {
    return new Response(JSON.stringify({ error: "machineData is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const result = await withFailover((model) =>
      generateObject({
        model,
        schema: riskAssessmentSchema,
        system: systemPrompts.predictiveMaintenance,
        prompt: `Analyze this machine data and provide a risk assessment:\n\n${machineData}\n\nConsider hours worked, time since last maintenance, and recent issues when assessing risk level.`,
        temperature: 0.3,
        maxOutputTokens: 1024,
      }),
    );

    return Response.json(result.object);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), { context: "predictive_maintenance" });
    return new Response(
      JSON.stringify({ error: "Failed to analyze machine data" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
