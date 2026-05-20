import { NextRequest, NextResponse } from "next/server";
import { inngest, syncPlaybackEvent } from "@repo/utils/inngest";
import { logError } from "@/lib/errors/error-logger";

export async function POST(req: NextRequest) {
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
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "sync_playback",
    });
    return NextResponse.json(
      { error: err.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
