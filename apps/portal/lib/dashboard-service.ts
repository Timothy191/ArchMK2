"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import { cacheWrap } from "@repo/redis";
import { DatabaseError } from "@repo/errors";
import { logError } from "@/lib/errors/error-logger";

export interface MonolithizedDashboardPayload {
  department_id: string;
  daily_logs: Array<{
    id: string;
    log_date: string;
    shift: "day" | "night";
    notes: string | null;
    sync_status: "pending" | "synced" | "failed";
    idempotency_key: string;
    last_synced_at: string;
  }>;
  breakdowns: Array<{
    id: string;
    fleet_id: string;
    machine_type: string;
    date_in: string;
    date_out: string | null;
    reason: string;
    status: "active" | "completed";
    sync_status: "pending" | "synced" | "failed";
    idempotency_key: string;
    last_synced_at: string;
  }>;
  safety_incidents: Array<{
    id: string;
    incident_date: string;
    shift_type: "day" | "night";
    incident_type: "near-miss" | "incident" | "lost-time" | "equipment-damage";
    description: string;
    status: "open" | "under-investigation" | "resolved" | "closed";
    sync_status: "pending" | "synced" | "failed";
    idempotency_key: string;
    last_synced_at: string;
  }>;
}

/**
 * Get highly optimized, monolithized department dashboard data payload.
 * Pulls from local in-memory L1 cache first, falls back to Redis L2, 
 * and on miss, queries PostgreSQL C-Native pre-aggregated JSONB in exactly ONE database roundtrip.
 */
export async function getMonolithizedDashboard(departmentId: string): Promise<MonolithizedDashboardPayload> {
  const cacheKey = `dept:dashboard:monolith:${departmentId}`;

  // Wrap query in hybrid L1/L2 cache with a conservative 15-second TTL
  return cacheWrap<MonolithizedDashboardPayload>(
    cacheKey,
    async () => {
      const supabase = await createServerSupabaseClient();

      const { data, error } = await supabase.rpc(
        "get_monolithized_department_dashboard_payload",
        { dept_id: departmentId }
      );

      if (error) {
        logError(new Error(error.message), { context: "dashboard_rpc" }).catch(() => {});
        throw new DatabaseError("Failed to query dashboard data", {
          operation: "query",
          context: { error: error.message },
        });
      }

      // Return raw parsed JSONB payload
      return data as unknown as MonolithizedDashboardPayload;
    },
    15
  );
}
