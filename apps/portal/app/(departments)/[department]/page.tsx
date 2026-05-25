import dynamic from "next/dynamic";
import { GlassCard } from "@repo/ui/GlassCard";
import { getDepartmentContext } from "~/lib/dept-context";

const ScadaPanel = dynamic(
  () =>
    import("@/features/departments/components/control-room/ScadaPanel").then(
      (mod) => mod.ScadaPanel,
    ),
  {
    loading: () => (
      <div className="h-[400px] animate-pulse bg-[var(--bg-tertiary)] rounded-2xl" />
    ),
  },
);

const AlertPanel = dynamic(
  () =>
    import("@/features/departments/components/control-room/AlertPanel").then(
      (mod) => mod.AlertPanel,
    ),
  {
    loading: () => (
      <div className="h-[400px] animate-pulse bg-[var(--bg-tertiary)] rounded-2xl" />
    ),
  },
);

const ControlRoomActivityFeed = dynamic(
  () =>
    import(
      "@/features/departments/components/control-room/ControlRoomActivityFeed"
    ).then((mod) => mod.ControlRoomActivityFeed),
  {
    loading: () => (
      <div className="h-[400px] animate-pulse bg-[var(--bg-tertiary)] rounded-2xl" />
    ),
  },
);

const WeatherWidget = dynamic(
  () =>
    import("@/components/weather/WeatherWidget").then(
      (mod) => mod.WeatherWidget,
    ),
  {
    loading: () => (
      <div className="h-32 animate-pulse bg-[var(--bg-tertiary)] rounded-2xl" />
    ),
  },
);

const ShiftCoverageWidget = dynamic(
  () =>
    import(
      "@/features/departments/components/control-room/ShiftCoverageWidget"
    ).then((mod) => mod.ShiftCoverageWidget),
  {
    loading: () => (
      <div className="h-64 animate-pulse bg-[var(--bg-tertiary)] rounded-2xl" />
    ),
  },
);

const SatelliteMonitoringDashboard = dynamic(
  () =>
    import(
      "@/features/departments/components/satellite/SatelliteMonitoringDashboard"
    ).then((mod) => mod.SatelliteMonitoringDashboard),
  {
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin" />
      </div>
    ),
  },
);

const SafetyDashboard = dynamic(
  () =>
    import("@/features/departments/components/safety/SafetyDashboard").then(
      (mod) => mod.SafetyDashboard,
    ),
  {
    loading: () => (
      <div className="fixed inset-0 flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    ),
  },
);

export default async function DepartmentDashboard({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department: deptSlug } = await params;
  const { dept, deptId, supabase, today } = await getDepartmentContext({
    department: deptSlug,
  });

  // 1. Early returns for satellite and safety — skip shared queries entirely
  if (dept.type === "satellite") {
    return <SatelliteMonitoringDashboard />;
  }

  if (dept.type === "safety") {
    return <SafetyDashboard deptId={deptId} />;
  }

  const isControlRoom = dept.type === "control_room";

  // 2. Shared queries for all standard departments
  const { data: todayLogs } = await supabase
    .from("daily_logs")
    .select("id, log_date, shift")
    .eq("department_id", deptId)
    .eq("log_date", today)
    .order("shift");

  const shiftCount = todayLogs?.length ?? 0;
  const latestShift = todayLogs?.[shiftCount - 1]?.shift;

  const { count: machineCount } = await supabase
    .from("machines")
    .select("*", { count: "exact", head: true })
    .eq("department_id", deptId)
    .eq("active", true);

  // 3. Control Room specific data — isolated in conditional + Promise.all
  let totalHours = 0;
  let activeOperations = 0;
  let delayCount = 0;
  let delayMinutes = 0;
  let totalLoads = 0;

  if (isControlRoom) {
    const [todayOperations, todayDelays, todayLoads] = await Promise.all([
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

    totalHours =
      todayOperations.data?.reduce((sum, op) => sum + (op.hours_worked || 0), 0) || 0;
    activeOperations =
      todayOperations.data?.filter((op) => op.end_time === null).length || 0;

    delayCount = todayDelays.data?.length || 0;
    delayMinutes =
      todayDelays.data?.reduce((sum, d) => sum + (d.delay_minutes || 0), 0) || 0;

    totalLoads =
      todayLoads.data?.reduce((sum, l) => sum + (l.total_loads || 0), 0) || 0;
  }

  return (
    <div className="space-y-6">
      {isControlRoom ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium text-[var(--text-heading)]">
              Control Room Dashboard
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

          {/* Control Room Summary Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <GlassCard>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
                Hours Today
              </p>
              <p className="text-2xl font-bold text-[var(--accent-cyan)] mt-1">
                {totalHours.toFixed(1)}h
              </p>
              {activeOperations > 0 && (
                <p className="text-amber-400 text-xs mt-1">
                  {activeOperations} in progress
                </p>
              )}
            </GlassCard>
            <GlassCard>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
                Total Loads
              </p>
              <p className="text-2xl font-bold text-[var(--text-heading)] mt-1">
                {totalLoads.toLocaleString()}
              </p>
            </GlassCard>
            <GlassCard>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
                Delays
              </p>
              <p className="text-2xl font-bold text-amber-400 mt-1">
                {delayCount}
              </p>
              {delayMinutes > 0 && (
                <p className="text-[var(--text-muted)] text-xs mt-1">
                  {delayMinutes} min lost
                </p>
              )}
            </GlassCard>
            <GlassCard>
              <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
                Machines
              </p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {machineCount ?? 0}
              </p>
              <p className="text-[var(--text-muted)] text-xs mt-1">Active</p>
            </GlassCard>
          </div>

          {/* Weather Conditions */}
          <WeatherWidget variant="compact" />

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <a
              href={`/${deptSlug}/machine-operations`}
              className="px-4 py-2 bg-[var(--accent-cyan)] text-[var(--bg-secondary)] font-medium rounded-lg hover:bg-[var(--accent-cyan)] transition-colors text-sm"
            >
              + Log Operation
            </a>
            <a
              href={`/${deptSlug}/operational-delays`}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-heading)] font-medium rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
            >
              + Add Note
            </a>
            <a
              href={`/${deptSlug}/hourly-loads`}
              className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-heading)] font-medium rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
            >
              Update Loads
            </a>
          </div>

          <ShiftCoverageWidget departmentId={deptId} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScadaPanel departmentId={deptId} />
            <AlertPanel departmentId={deptId} />
          </div>
          <ControlRoomActivityFeed departmentId={deptId} />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-medium text-[var(--text-heading)]">
            Dashboard
          </h2>

          {/* Weather for drilling department - critical for outdoor operations */}
          {deptSlug === "drilling" && <WeatherWidget variant="full" />}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard>
              <p className="text-[var(--text-muted)] text-sm">
                Today&apos;s Log
              </p>
              <p className="text-2xl font-bold text-[var(--text-heading)] mt-1">
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
              <p className="text-[var(--text-muted)] text-sm">
                Active Machines
              </p>
              <p className="text-2xl font-bold text-[var(--text-heading)] mt-1">
                {machineCount ?? 0}
              </p>
            </GlassCard>
            <GlassCard>
              <p className="text-[var(--text-muted)] text-sm">Status</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                {machineCount && machineCount > 0
                  ? `${machineCount} machine${machineCount > 1 ? "s" : ""} active`
                  : "No machines online"}
              </p>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
