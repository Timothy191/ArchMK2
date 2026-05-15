import { createServerSupabaseClient } from "@repo/supabase/server";
import { GlassCard } from "@repo/ui/GlassCard";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { ScadaPanel } from "@/features/departments/components/control-room/ScadaPanel";
import { AlertPanel } from "@/features/departments/components/control-room/AlertPanel";
import { ControlRoomActivityFeed } from "@/features/departments/components/control-room/ControlRoomActivityFeed";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { SatelliteMonitoringDashboard } from "@/features/departments/components/satellite/SatelliteMonitoringDashboard";
import { SafetyDashboard } from "@/features/departments/components/safety/SafetyDashboard";

export default async function DepartmentDashboard({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department: deptSlug } = await params;
  const dept = DEPARTMENTS.find((d) => d.name === deptSlug);
  if (!dept) notFound();

  const supabase = await createServerSupabaseClient();

  const { data: department } = await supabase
    .from("departments")
    .select("id")
    .eq("name", deptSlug)
    .single();

  if (!department) notFound();

  const deptId = department.id;
  const today = new Date().toISOString().split("T")[0];

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

  // Fetch Control Room specific data
  const { data: todayOperations } = await supabase
    .from("machine_operations")
    .select("hours_worked, end_time")
    .eq("department_id", deptId)
    .eq("shift_date", today);

  const totalHours =
    todayOperations?.reduce((sum, op) => sum + (op.hours_worked || 0), 0) || 0;
  const activeOperations =
    todayOperations?.filter((op) => op.end_time === null).length || 0;

  const { data: todayDelays } = await supabase
    .from("operational_delays")
    .select("delay_minutes, status")
    .eq("department_id", deptId)
    .eq("delay_date", today);

  const delayCount = todayDelays?.length || 0;
  const delayMinutes =
    todayDelays?.reduce((sum, d) => sum + (d.delay_minutes || 0), 0) || 0;

  const { data: todayLoads } = await supabase
    .from("hourly_loads")
    .select("total_loads")
    .eq("department_id", deptId)
    .eq("load_date", today);

  const totalLoads =
    todayLoads?.reduce((sum, l) => sum + (l.total_loads || 0), 0) || 0;

  const isControlRoom = deptSlug === "control-room";
  const isSatelliteMonitoring = deptSlug === "satellite-monitoring";
  const isSafety = deptSlug === "safety";

  if (isSatelliteMonitoring) {
    return <SatelliteMonitoringDashboard />;
  }

  if (isSafety) {
    return <SafetyDashboard deptId={deptId} />;
  }

  return (
    <div className="space-y-6">
      {isControlRoom ? (
        <>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-medium text-white">
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
              className="px-4 py-2 bg-[var(--card)] border border-[var(--border-default)] text-[var(--text-heading)] font-medium rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
            >
              + Add Note
            </a>
            <a
              href={`/${deptSlug}/hourly-loads`}
              className="px-4 py-2 bg-[var(--card)] border border-[var(--border-default)] text-[var(--text-heading)] font-medium rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors text-sm"
            >
              Update Loads
            </a>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ScadaPanel departmentId={deptId} />
            <AlertPanel departmentId={deptId} />
          </div>
          <ControlRoomActivityFeed departmentId={deptId} />
        </>
      ) : (
        <>
          <h2 className="text-2xl font-medium text-white">Dashboard</h2>

          {/* Weather for drilling department - critical for outdoor operations */}
          {deptSlug === "drilling" && <WeatherWidget variant="full" />}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <GlassCard>
              <p className="text-white/50 text-sm">Today&apos;s Log</p>
              <p className="text-2xl font-bold text-white mt-1">
                {shiftCount > 0
                  ? `${shiftCount} shift${shiftCount > 1 ? "s" : ""} logged`
                  : "Not logged"}
              </p>
              {latestShift && (
                <p className="text-white/40 text-xs mt-1">
                  Latest: {latestShift}
                </p>
              )}
            </GlassCard>
            <GlassCard>
              <p className="text-white/50 text-sm">Active Machines</p>
              <p className="text-2xl font-bold text-white mt-1">
                {machineCount ?? 0}
              </p>
            </GlassCard>
            <GlassCard>
              <p className="text-white/50 text-sm">Status</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">
                Operational
              </p>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
