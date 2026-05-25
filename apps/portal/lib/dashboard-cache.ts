import { unstable_cache } from "next/cache";
import { createServerSupabaseClient } from "@repo/supabase/server";

type DashboardQueryResult = {
  dailyLogsResult: { data: Array<{ id: string; log_date: string; shift: string }> | null };
  machinesResult: { count: number | null };
  operationsResult: { data: Array<{ hours_worked: number | null; end_time: string | null }> | null };
  delaysResult: { data: Array<{ delay_minutes: number | null; status: string | null }> | null };
  loadsResult: { data: Array<{ total_loads: number | null }> | null };
};

/** Fetch dashboard data with 60s Next.js cache to eliminate repeated Supabase queries. */
export const getCachedDashboardData = unstable_cache(
  async (deptId: string, today: string): Promise<DashboardQueryResult> => {
    const supabase = await createServerSupabaseClient();
    const [
      dailyLogsResult,
      machinesResult,
      operationsResult,
      delaysResult,
      loadsResult,
    ] = await Promise.all([
      supabase
        .from("daily_logs")
        .select("id, log_date, shift")
        .eq("department_id", deptId)
        .eq("log_date", today)
        .order("shift"),
      supabase
        .from("machines")
        .select("*", { count: "exact", head: true })
        .eq("department_id", deptId)
        .eq("active", true),
      supabase
        .from("machine_operations")
        .select("hours_worked, end_time")
        .eq("department_id", deptId)
        .eq("shift_date", today),
      supabase
        .from("operational_delays")
        .select("delay_minutes, status")
        .eq("department_id", deptId)
        .eq("delay_date", today),
      supabase
        .from("hourly_loads")
        .select("total_loads")
        .eq("department_id", deptId)
        .eq("load_date", today),
    ]);
    return { dailyLogsResult, machinesResult, operationsResult, delaysResult, loadsResult };
  },
  ["dashboard-data"],
  { revalidate: 60 },
);
