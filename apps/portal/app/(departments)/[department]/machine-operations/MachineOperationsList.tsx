"use client";

import { GlassCard } from "@repo/ui/GlassCard";

interface MachineOperation {
  id: string;
  machine_id: string;
  operator_id: string | null;
  site_id: string | null;
  shift_type: "day" | "night";
  start_time: string;
  end_time: string | null;
  hours_worked: number | null;
  machine?: { name: string; bin_factor?: number } | null;
  operator?: { full_name: string } | null;
  site?: { name: string } | null;
}

interface HourlyLoadSummary {
  machine_id: string;
  shift_type: string;
  total_loads: number;
}

interface MachineOperationsListProps {
  operations: MachineOperation[];
  todayLoads: HourlyLoadSummary[];
}

function formatTime(timeStr: string) {
  return timeStr.slice(0, 5); // HH:MM format
}

export function MachineOperationsList({ operations, todayLoads }: MachineOperationsListProps) {
  if (operations.length === 0) {
    return (
      <GlassCard>
        <p className="text-[var(--text-muted)] text-sm text-center py-8">
          No operations logged today. Use the form above to add operations.
        </p>
      </GlassCard>
    );
  }

  // Group by shift
  const dayOps = operations.filter(op => op.shift_type === "day");
  const nightOps = operations.filter(op => op.shift_type === "night");

  return (
    <div className="space-y-4">
      {dayOps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Day Shift
          </h4>
          <div className="space-y-2">
            {dayOps.map((op) => (
              <OperationCard 
                key={op.id} 
                operation={op} 
                todayLoads={todayLoads}
              />
            ))}
          </div>
        </div>
      )}

      {nightOps.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Night Shift
          </h4>
          <div className="space-y-2">
            {nightOps.map((op) => (
              <OperationCard 
                key={op.id} 
                operation={op} 
                todayLoads={todayLoads}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OperationCard({ 
  operation, 
  todayLoads 
}: { 
  operation: MachineOperation;
  todayLoads: HourlyLoadSummary[];
}) {
  const isComplete = operation.end_time !== null && operation.hours_worked !== null;
  const isInProgress = operation.end_time === null;

  // Calculate BCM metrics
  const binFactor = operation.machine?.bin_factor || 0;
  const machineLoads = todayLoads
    ?.filter(l => l.machine_id === operation.machine_id)
    ?.reduce((sum, l) => sum + (l.total_loads || 0), 0) || 0;
  const materialBCM = machineLoads * binFactor;
  const bcmPerHour = (operation.hours_worked || 0) > 0 
    ? materialBCM / (operation.hours_worked || 1) 
    : 0;

  return (
    <GlassCard className="py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Status Indicator */}
          <div
            className={`w-2 h-2 rounded-full ${
              isComplete
                ? "bg-emerald-400"
                : isInProgress
                ? "bg-amber-400 animate-pulse"
                : "bg-[var(--text-secondary)]"
            }`}
          />

          {/* Machine & Details */}
          <div>
            <p className="text-[var(--text-heading)] font-medium">
              {operation.machine?.name || "Unknown Machine"}
            </p>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-[var(--text-muted)]">
              <span>{operation.operator?.full_name || "No Operator"}</span>
              <span className="text-[var(--border-emphasis)]">|</span>
              <span>{operation.site?.name || "No Site"}</span>
            </div>
          </div>
        </div>

        {/* Time, Hours & BCM */}
        <div className="text-right">
          <p className="text-[var(--text-heading)] text-sm">
            {formatTime(operation.start_time)} -{" "}
            {operation.end_time ? formatTime(operation.end_time) : "In Progress"}
          </p>
          <div className="flex items-center gap-3 mt-0.5 justify-end">
            {operation.hours_worked !== null && (
              <span className="text-emerald-400 text-xs">
                {operation.hours_worked.toFixed(2)}h
              </span>
            )}
            {binFactor > 0 && (
              <>
                <span className="text-[var(--border-emphasis)]">|</span>
                <span className="text-[var(--accent-cyan)] text-xs">
                  {materialBCM.toFixed(1)} BCM
                </span>
                <span className="text-[var(--border-emphasis)]">|</span>
                <span className="text-amber-400 text-xs">
                  {bcmPerHour.toFixed(1)} BCM/h
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
