import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/errors/error-logger";
import { chat, DEFAULT_MODEL } from "@/lib/ai/providers";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { withRateLimit } from "@/lib/api/rate-limit-middleware";

async function handleHandoffRequest(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { shiftData }: { shiftData: string } = await req.json();
    if (!shiftData) {
      return NextResponse.json(
        { error: "shiftData is required" },
        { status: 400 },
      );
    }

    const text = await chat(
      [
        {
          role: "system",
          content:
            "You are a shift supervisor AI for an industrial operations portal. Summarize the shift concisely: key accomplishments, ongoing issues, critical alerts, and recommended priorities for the next shift. Be brief and actionable.",
        },
        {
          role: "user",
          content: `Generate a shift handoff report from this data:\n\n${shiftData}`,
        },
      ],
      { model: DEFAULT_MODEL, temperature: 0.5, maxTokens: 1024 },
    );

    return NextResponse.json({ content: text });
  } catch (error) {
    logError(error instanceof Error ? error : new Error(String(error)), {
      context: "shift_handoff",
    });
    return NextResponse.json(
      { error: "Failed to generate shift handoff report" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return withRateLimit(req, () => handleHandoffRequest(req));
}
