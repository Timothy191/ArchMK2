"use client";

import { GlassCard } from "@repo/ui/GlassCard";

const SHIFT_HOURS = 12;

interface ExcavatorActivity {
  id: string;
  machine_id: string;
  operator_id: string | null;
  activity_date: string;
  shift_type: "day" | "night";
  passes: number;
  loads: number;
  notes: string | null;
  site_id: string | null;
  block_mined_id: string | null;
  machine?: { name: string } | null;
  operator?: { full_name: string } | null;
  site?: { name: string } | null;
  block_mined?: { name: string; code: string } | null;
}

interface DumperAssignment {
  id: string;
  excavator_activity_id: string;
  dumper_machine_id: string;
  material_type: string;
  total_loads: number;
  total_bcm: number | null;
  notes: string | null;
  dumper?: {
    name: string;
    bin_factor: number | null;
    machine_type: string;
  } | null;
}

interface ExcavatorActivityListProps {
  todayActivity: ExcavatorActivity[];
  todayAssignments: DumperAssignment[];
}

export function ExcavatorActivityList({
  todayActivity,
  todayAssignments,
}: ExcavatorActivityListProps) {
  // Group by shift
  const dayOps = todayActivity.filter((a) => a.shift_type === "day");
  const nightOps = todayActivity.filter((a) => a.shift_type === "night");

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-[var(--text-heading)]">
        Today&apos;s Activity
      </h3>

      {dayOps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Day Shift
          </h4>
          <div className="space-y-2">
            {dayOps.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                assignments={todayAssignments.filter(
                  (a) => a.excavator_activity_id === activity.id,
                )}
              />
            ))}
          </div>
        </div>
      )}

      {nightOps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            Night Shift
          </h4>
          <div className="space-y-2">
            {nightOps.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                assignments={todayAssignments.filter(
                  (a) => a.excavator_activity_id === activity.id,
                )}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ActivityCard({
  activity,
  assignments,
}: {
  activity: ExcavatorActivity;
  assignments: DumperAssignment[];
}) {
  const totalBcm = assignments.reduce((sum, a) => sum + (a.total_bcm || 0), 0);
  const totalLoads = assignments.reduce(
    (sum, a) => sum + (a.total_loads || 0),
    0,
  );
  const bcmPerHour = totalBcm > 0 ? totalBcm / SHIFT_HOURS : 0;
  const loadsPerHour = totalLoads > 0 ? totalLoads / SHIFT_HOURS : 0;
  const estimatedScoopMinutes =
    totalLoads > 0 ? (SHIFT_HOURS * 60) / totalLoads : 0;

  return (
    <GlassCard className="py-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[var(--text-heading)] font-medium">
              {activity.machine?.name || "Unknown Excavator"}
            </p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
              <span>{activity.operator?.full_name || "No Operator"}</span>
              <span className="text-[var(--border-emphasis)]">|</span>
              <span>{activity.site?.name || "No Site"}</span>
              {activity.block_mined && (
                <>
                  <span className="text-[var(--border-emphasis)]">|</span>
                  <span className="text-amber-400">
                    Block {activity.block_mined.code}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                activity.shift_type === "day"
                  ? "bg-amber-500/20 text-amber-400"
                  : "bg-blue-500/20 text-blue-400"
              }`}
            >
              {activity.shift_type === "day" ? "Day" : "Night"} Shift
            </span>
          </div>
        </div>

        {/* Dumper Assignments Table */}
        {assignments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border-default)]">
                  <th
                    scope="col"
                    className="text-left text-[var(--text-muted)] py-1.5 px-2 font-medium text-xs"
                  >
                    Dumper
                  </th>
                  <th
                    scope="col"
                    className="text-left text-[var(--text-muted)] py-1.5 px-2 font-medium text-xs"
                  >
                    Material
                  </th>
                  <th
                    scope="col"
                    className="text-right text-[var(--text-muted)] py-1.5 px-2 font-medium text-xs"
                  >
                    Loads
                  </th>
                  <th
                    scope="col"
                    className="text-right text-[var(--text-muted)] py-1.5 px-2 font-medium text-xs"
                  >
                    BCM
                  </th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => (
                  <tr
                    key={assignment.id}
                    className="border-b border-[var(--border-default)]/30"
                  >
                    <td className="py-1.5 px-2 text-[var(--text-heading)]">
                      {assignment.dumper?.name || "Unknown"}
                      <span className="text-[var(--text-muted)] text-xs ml-1">
                        ({assignment.dumper?.machine_type || ""})
                      </span>
                    </td>
                    <td className="py-1.5 px-2 text-[var(--text-muted)]">
                      {assignment.material_type}
                    </td>
                    <td className="py-1.5 px-2 text-right text-[var(--text-heading)]">
                      {assignment.total_loads}
                    </td>
                    <td className="py-1.5 px-2 text-right text-[var(--accent-cyan)] font-medium">
                      {(assignment.total_bcm || 0).toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-[var(--border-default)]">
                  <td
                    colSpan={2}
                    className="py-1.5 px-2 text-[var(--text-heading)] font-medium text-xs"
                  >
                    Total
                  </td>
                  <td className="py-1.5 px-2 text-right text-[var(--text-heading)] font-medium text-xs">
                    {totalLoads}
                  </td>
                  <td className="py-1.5 px-2 text-right text-[var(--accent-cyan)] font-medium text-xs">
                    {totalBcm.toFixed(1)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <p className="text-[var(--text-muted)] text-sm text-center py-2">
            No dumper assignments
          </p>
        )}

        {/* Metrics Row */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">BCM/h:</span>
            <span className="text-amber-400 font-medium">
              {bcmPerHour.toFixed(1)}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[var(--text-muted)]">Loads/h:</span>
            <span className="text-emerald-400 font-medium">
              {loadsPerHour.toFixed(1)}
            </span>
          </div>
          {estimatedScoopMinutes > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[var(--text-muted)]">Scoop time:</span>
              <span className="text-[var(--text-heading)] font-medium">
                {estimatedScoopMinutes.toFixed(1)} min/load
              </span>
            </div>
          )}
        </div>

        {/* Notes */}
        {activity.notes && (
          <p className="text-[var(--text-muted)] text-xs italic border-t border-[var(--border-default)]/50 pt-2">
            {activity.notes}
          </p>
        )}
      </div>
    </GlassCard>
  );
}
