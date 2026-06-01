import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/errors/error-logger";
import { riskAssessmentSchema, type RiskAssessment } from "@/lib/ai/schemas";
import { chat, DEFAULT_MODEL } from "@/lib/ai/providers";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { withRateLimit } from "@/lib/api/rate-limit-middleware";

const SYSTEM_PROMPT = `You are an industrial maintenance AI for an industrial operations portal.
Analyse the machine data provided and produce a structured risk assessment.
Hours worked and recent issues are the strongest urgency signals.
Respond ONLY with valid JSON — no markdown fences, no prose — matching this schema:
{
  "risk": "low" | "medium" | "high",
  "actions": ["string"],
  "timeEstimate": "string",
  "summary": "string"
}`;

async function handlePredictRequest(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { machineData }: { machineData: string } = await req.json();
    if (!machineData) {
      return NextResponse.json(
        { error: "machineData is required" },
        { status: 400 },
      );
    }

    const raw = await chat(
      [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyse this machine data and provide a risk assessment:\n\n${machineData}\nConsider hours worked, time since last maintenance, and recent issues when assessing risk level.\nReturn ONLY valid JSON — no extra text, no markdown fences.`,
        },
      ],
      { model: DEFAULT_MODEL, temperature: 0.3, maxTokens: 1024 },
    );

    const parsed = riskAssessmentSchema.safeParse(JSON.parse(raw ?? "{}"));
    if (!parsed.success) {
      return NextResponse.json(
        {
          risk: "low",
          actions: [],
          timeEstimate: "unknown",
          summary: raw ?? "",
        } satisfies RiskAssessment,
        { status: 200 },
      );
    }

    return NextResponse.json(parsed.data);
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "predictive_maintenance",
    });
    return NextResponse.json(
      { error: "Failed to analyse machine data" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return withRateLimit(req, () => handlePredictRequest(req));
}
