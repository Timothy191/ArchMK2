import { getDepartmentContext } from "~/lib/dept-context";
import { GlassCard } from "@repo/ui/GlassCard";
import { createReadReplicaClient } from "@repo/supabase/read-replica";
import { ShieldCheck, Users, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

async function getAccessControlDashboardData(deptId: string, today: string) {
  const db = await createReadReplicaClient();

  const [
    { data: todayLogs },
    { count: activeBadges },
    { data: todayVisitors },
    { data: accessAlerts },
  ] = await Promise.all([
    db
      .from("daily_logs")
      .select("id, log_date, shift")
      .eq("department_id", deptId)
      .eq("log_date", today)
      .order("shift"),
    db
      .from("access_badges")
      .select("*", { count: "exact", head: true })
      .eq("department_id", deptId)
      .eq("status", "active"),
    db
      .from("visitors")
      .select("id, full_name, status")
      .eq("department_id", deptId)
      .eq("visit_date", today),
    db
      .from("access_logs")
      .select("id, event_type")
      .eq("department_id", deptId)
      .eq("event_date", today)
      .in("event_type", ["unauthorized", "tailgating", "expired_badge"]),
  ]);

  const shiftCount = todayLogs?.length ?? 0;
  const latestShift = todayLogs?.[todayLogs.length - 1]?.shift;

  const activeVisitors =
    todayVisitors?.filter((v) => v.status === "checked_in").length || 0;

  const alertCount = accessAlerts?.length || 0;

  return {
    shiftCount,
    latestShift,
    activeBadges: activeBadges ?? 0,
    activeVisitors,
    alertCount,
  };
}

export default async function AccessControlDashboardPage() {
  const { deptId, today } = await getDepartmentContext({
    department: "access-control",
  });

  const { shiftCount, latestShift, activeBadges, activeVisitors, alertCount } =
    await getAccessControlDashboardData(deptId, today);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[var(--text-heading)]">
          Access Control Dashboard
        </h2>
        <p className="text-[var(--text-muted)] text-sm">
          {new Date().toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[var(--accent-blue)]" />
            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
              Today's Log
            </p>
          </div>
          <p className="text-2xl font-bold text-[var(--text-heading)] mt-2">
            {shiftCount > 0
              ? `${shiftCount} shift${shiftCount > 1 ? "s" : ""} logged`
              : "Not logged"}
          </p>
          {latestShift && (
            <p className="text-[var(--text-muted)] text-xs mt-1">
              Latest: {latestShift}
            </p>
          )}
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
              Active Badges
            </p>
          </div>
          <p className="text-2xl font-bold text-[var(--text-heading)] mt-2">
            {activeBadges}
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
              Active Visitors
            </p>
          </div>
          <p className="text-2xl font-bold text-cyan-400 mt-2">
            {activeVisitors}
          </p>
        </GlassCard>

        <GlassCard>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
              Alerts Today
            </p>
          </div>
          <p className="text-2xl font-bold text-amber-400 mt-2">{alertCount}</p>
        </GlassCard>
      </div>
    </div>
  );
}
