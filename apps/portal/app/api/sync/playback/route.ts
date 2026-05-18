import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/lib/errors/error-logger";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { idempotencyKey, actionType, payload, departmentId } = await req.json();

    if (!idempotencyKey || !actionType || !payload || !departmentId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }


    // ============================================
    // Playback Branch: breakdowns
    // ============================================
    if (actionType === "ADD_BREAKDOWN") {
      // 1. Stripe Idempotency Check: check if already exists
      const { data: existing } = await supabase
        .from("breakdowns")
        .select("id")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, bypassed: true });
      }

      // 2. Perform write
      const { error } = await supabase.from("breakdowns").insert({
        department_id: departmentId,
        fleet_id: payload.fleetId,
        machine_type: payload.machineType,
        date_in: payload.dateIn,
        time_in: payload.timeIn || "00:00",
        reason: payload.reason,
        status: "active",
        idempotency_key: idempotencyKey,
        sync_status: "synced",
      });

      if (error) throw error;
      revalidatePath("/[department]/breakdowns", "page");
    }

    else if (actionType === "RESOLVE_BREAKDOWN") {
      const { error } = await supabase
        .from("breakdowns")
        .update({
          status: "completed",
          date_out: new Date().toISOString().split("T")[0],
          time_out: new Date().toLocaleTimeString("en-US", { hour12: false }),
          sync_status: "synced",
        })
        .eq("id", payload.id);

      if (error) throw error;
      revalidatePath("/[department]/breakdowns", "page");
    }

    // ============================================
    // Playback Branch: safety_incidents
    // ============================================
    else if (actionType === "ADD_SAFETY_INCIDENT") {
      const { data: existing } = await supabase
        .from("safety_incidents")
        .select("id")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, bypassed: true });
      }

      const { error } = await supabase.from("safety_incidents").insert({
        department_id: departmentId,
        incident_date: payload.incidentDate,
        shift_type: payload.shiftType,
        incident_type: payload.incidentType,
        description: payload.description,
        location: payload.location,
        status: "open",
        idempotency_key: idempotencyKey,
        sync_status: "synced",
      });

      if (error) throw error;
      revalidatePath("/[department]/safety", "page");
    }

    // ============================================
    // Playback Branch: daily_logs
    // ============================================
    else if (actionType === "ADD_DAILY_LOG") {
      const { data: existing } = await supabase
        .from("daily_logs")
        .select("id")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ success: true, bypassed: true });
      }

      const { error } = await supabase.from("daily_logs").insert({
        department_id: departmentId,
        log_date: payload.logDate,
        shift: payload.shift,
        notes: payload.notes,
        idempotency_key: idempotencyKey,
        sync_status: "synced",
      });

      if (error) throw error;
      revalidatePath("/[department]/daily-log", "page");
    }

    else {
      return NextResponse.json({ error: `Unknown action type: ${actionType}` }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    logError(err instanceof Error ? err : new Error(String(err)), { context: "sync_playback" }).catch(() => {});
    return NextResponse.json({ error: err.message || "Internal Server Error" }, { status: 500 });
  }
}
