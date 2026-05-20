import { getDepartmentContext } from "~/lib/dept-context";
import { GlassCard } from "@repo/ui/GlassCard";
import { createReadReplicaClient } from "@repo/supabase/read-replica";
import nextDynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/components/ui/skeleton";

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

const DashboardKPIGrid = nextDynamic(
  () => import("./components/DashboardKPIGrid"),
  { loading: () => <Skeleton className="h-[140px] w-full" /> },
);
const DashboardChartsRow = nextDynamic(
  () => import("./components/DashboardChartsRow"),
  { loading: () => <Skeleton className="h-[260px] w-full" /> },
);
const DashboardActivityFeed = nextDynamic(
  () => import("./components/DashboardActivityFeed"),
  { loading: () => <Skeleton className="h-[360px] w-full" /> },
);
const DashboardEntityStatus = nextDynamic(
  () => import("./components/DashboardEntityStatus"),
  { loading: () => <Skeleton className="h-[360px] w-full" /> },
);

export default async function AccessControlDashboardPage() {
  const { deptId, today } = await getDepartmentContext({
    department: "access-control",
  });

  const { activeBadges, activeVisitors, alertCount } =
    await getAccessControlDashboardData(deptId, today);

  return (
    <div className="space-y-6">
      {/* Top summary row bridging real DB data with template KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <span className="text-emerald-400 font-bold text-sm">BADGES</span>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                Active Badges
              </p>
              <p className="text-2xl font-bold text-[var(--text-heading)] mt-1">
                {activeBadges}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-400/10 rounded-lg">
              <span className="text-cyan-400 font-bold text-sm">VISITORS</span>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                Active Visitors
              </p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">
                {activeVisitors}
              </p>
            </div>
          </div>
        </GlassCard>
        <GlassCard>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400/10 rounded-lg">
              <span className="text-amber-400 font-bold text-sm">ALERTS</span>
            </div>
            <div>
              <p className="text-[var(--text-muted)] text-xs font-medium uppercase tracking-wider">
                Alerts Today
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {alertCount}
              </p>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Template KPI Bento Grid */}
      <DashboardKPIGrid />

      {/* Charts Row */}
      <DashboardChartsRow />

      {/* Bottom Row: Activity Feed + Entity Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2">
          <DashboardActivityFeed />
        </div>
        <div className="xl:col-span-1">
          <DashboardEntityStatus />
        </div>
      </div>
    </div>
  );
}
