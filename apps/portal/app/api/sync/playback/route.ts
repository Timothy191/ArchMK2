import { NextRequest, NextResponse } from "next/server";
import { inngest, syncPlaybackEvent } from "@repo/utils/inngest";
import { logError } from "@/lib/errors/error-logger";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { withRateLimit } from "@/lib/api/rate-limit-middleware";

async function handlePlaybackRequest(req: NextRequest): Promise<NextResponse> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { idempotencyKey, actionType, payload, departmentId } = body;

    if (!idempotencyKey || !actionType || !payload || !departmentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    await inngest.send({
      name: syncPlaybackEvent,
      data: { idempotencyKey, actionType, payload, departmentId },
    });

    return NextResponse.json({ success: true, queued: true });
  } catch (err: unknown) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "sync_playback",
    });
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  return withRateLimit(req, () => handlePlaybackRequest(req));
}
