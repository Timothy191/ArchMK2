"use client";

import { GlassCard } from "@repo/ui/GlassCard";

interface OperationalDelay {
  id: string;
  shift_type: "day" | "night";
  delay_type: string;
  delay_minutes: number;
  description: string;
  impact_description: string | null;
  recovery_action: string | null;
  status: "active" | "recovered" | "extended";
  created_at: string;
  category?: {
    name: string;
    color: string;
    icon: string;
  } | null;
  machine?: {
    name: string;
  } | null;
}

interface OperationalDelaysListProps {
  delays: OperationalDelay[];
}

const DELAY_TYPE_COLORS: Record<string, string> = {
  equipment: "#f59e0b",
  weather: "#3b82f6",
  safety: "#ef4444",
  material: "#8b5cf6",
  shift_change: "#10b981",
  operator: "#f97316",
  other: "#6b7280",
};

const STATUS_COLORS: Record<string, string> = {
  active: "#f59e0b",
  recovered: "#10b981",
  extended: "#ef4444",
};

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OperationalDelaysList({ delays }: OperationalDelaysListProps) {
  if (delays.length === 0) {
    return (
      <GlassCard>
        <p className="text-[#898989] text-sm text-center py-8">
          No delays recorded today.
        </p>
      </GlassCard>
    );
  }

  // Group by shift
  const dayDelays = delays.filter((d) => d.shift_type === "day");
  const nightDelays = delays.filter((d) => d.shift_type === "night");

  return (
    <div className="space-y-4">
      {dayDelays.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-amber-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Day Shift Delays
          </h4>
          <div className="space-y-2">
            {dayDelays.map((delay) => (
              <DelayCard key={delay.id} delay={delay} />
            ))}
          </div>
        </div>
      )}

      {nightDelays.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-blue-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-400"></span>
            Night Shift Delays
          </h4>
          <div className="space-y-2">
            {nightDelays.map((delay) => (
              <DelayCard key={delay.id} delay={delay} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DelayCard({ delay }: { delay: OperationalDelay }) {
  const typeColor = DELAY_TYPE_COLORS[delay.delay_type] || "#898989";
  const statusColor = STATUS_COLORS[delay.status] || "#898989";

  return (
    <GlassCard className="py-3">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Delay Type */}
          <span
            className="px-2 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: typeColor }}
          >
            {delay.delay_type.replace("_", " ").toUpperCase()}
          </span>

          {/* Category */}
          {delay.category && (
            <span
              className="text-xs"
              style={{ color: delay.category.color }}
            >
              {delay.category.name}
            </span>
          )}

          {/* Status */}
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: `${statusColor}20`,
              color: statusColor,
              border: `1px solid ${statusColor}40`,
            }}
          >
            {delay.status.toUpperCase()}
          </span>

          {/* Duration */}
          <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full">
            {delay.delay_minutes} min
          </span>

          {/* Time */}
          <span className="text-[#898989] text-xs ml-auto">
            {formatTime(delay.created_at)}
          </span>
        </div>

        {/* Machine */}
        {delay.machine && (
          <p className="text-[#898989] text-xs">
            Machine: <span className="text-[#b4b4b4]">{delay.machine.name}</span>
          </p>
        )}

        {/* Description */}
        <p className="text-[#fafafa] text-sm">{delay.description}</p>

        {/* Impact */}
        {delay.impact_description && (
          <p className="text-sm">
            <span className="text-amber-400">Impact:</span>{" "}
            <span className="text-[#b4b4b4]">{delay.impact_description}</span>
          </p>
        )}

        {/* Recovery */}
        {delay.recovery_action && (
          <p className="text-sm">
            <span className="text-[#3ecf8e]">Recovery:</span>{" "}
            <span className="text-[#b4b4b4]">{delay.recovery_action}</span>
          </p>
        )}
      </div>
    </GlassCard>
  );
}
