"use client";

import type { DeformationReading } from "@/lib/monitoring-api";

interface DeformationAlertCardProps {
  reading: DeformationReading;
  onClick?: (reading: DeformationReading) => void;
}

const LEVEL_CONFIG = {
  stable: {
    bg: "bg-[#3ecf8e]/10",
    border: "border-[#3ecf8e]/30",
    text: "text-[#3ecf8e]",
    badge: "bg-[#3ecf8e]/20 text-[#3ecf8e]",
    dot: "bg-[#3ecf8e]",
    label: "Stable",
  },
  minor: {
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-400",
    dot: "bg-amber-400",
    label: "Minor Shift",
  },
  moderate: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/30",
    text: "text-orange-400",
    badge: "bg-orange-500/20 text-orange-400",
    dot: "bg-orange-400",
    label: "Moderate",
  },
  critical: {
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-400",
    badge: "bg-red-500/20 text-red-400",
    dot: "bg-red-500 animate-pulse",
    label: "CRITICAL",
  },
};

const AREA_ICONS: Record<string, string> = {
  "pit-wall": "🪨",
  "tailings-dam": "🏗️",
  "haul-road": "🛣️",
  "processing-plant": "🏭",
};

const TREND_ICONS: Record<string, string> = {
  subsiding: "↓",
  stable: "→",
  uplifting: "↑",
};

export function DeformationAlertCard({ reading, onClick }: DeformationAlertCardProps) {
  const cfg = LEVEL_CONFIG[reading.level];

  return (
    <button
      onClick={() => onClick?.(reading)}
      className={`w-full text-left p-4 rounded-xl border ${cfg.bg} ${cfg.border} transition-all hover:brightness-110 focus:outline-none focus:ring-1 focus:ring-[#363636]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${cfg.dot}`} />
          <span className="text-sm font-medium text-[#fafafa] truncate">
            {AREA_ICONS[reading.area]} {reading.location}
          </span>
        </div>
        <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <div>
          <p className={`text-xl font-bold tabular-nums ${cfg.text}`}>
            {reading.shiftMm > 0 ? "+" : ""}
            {reading.shiftMm.toFixed(1)} mm
            <span className="ml-1 text-base">{TREND_ICONS[reading.trend]}</span>
          </p>
          <p className="text-xs text-[#898989] mt-0.5">{reading.sensor}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-[#898989] capitalize">{reading.trend}</p>
          <p className="text-xs text-[#898989] mt-0.5">
            {new Date(reading.lastUpdated).toLocaleDateString("en-ZA", {
              day: "2-digit",
              month: "short",
            })}
          </p>
        </div>
      </div>
    </button>
  );
}

interface DeformationSummaryProps {
  readings: DeformationReading[];
  onReadingClick?: (reading: DeformationReading) => void;
}

export function DeformationSummary({ readings, onReadingClick }: DeformationSummaryProps) {
  const criticalCount = readings.filter((r) => r.level === "critical").length;
  const moderateCount = readings.filter((r) => r.level === "moderate").length;
  const sortedReadings = [...readings].sort((a, b) => {
    const order = { critical: 0, moderate: 1, minor: 2, stable: 3 };
    return order[a.level] - order[b.level];
  });

  return (
    <div className="space-y-3">
      {(criticalCount > 0 || moderateCount > 0) && (
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
          criticalCount > 0
            ? "bg-red-500/10 border border-red-500/30 text-red-400"
            : "bg-orange-500/10 border border-orange-500/30 text-orange-400"
        }`}>
          <span>⚠</span>
          <span>
            {criticalCount > 0
              ? `${criticalCount} critical deformation alert${criticalCount > 1 ? "s" : ""} — immediate review required`
              : `${moderateCount} moderate shift${moderateCount > 1 ? "s" : ""} detected — monitor closely`}
          </span>
        </div>
      )}
      <div className="space-y-2">
        {sortedReadings.map((reading) => (
          <DeformationAlertCard
            key={reading.id}
            reading={reading}
            onClick={onReadingClick}
          />
        ))}
      </div>
    </div>
  );
}
