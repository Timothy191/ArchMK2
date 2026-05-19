"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { DeformationSummary } from "@/components/monitoring/DeformationAlertCard";
import {
  generateDeformationReadings,
  DEFAULT_MINE_CENTER,
  type DeformationReading,
} from "@/lib/monitoring-api";

const MonitoringMap = dynamic(
  () => import("@/components/monitoring/MonitoringMap").then((m) => m.MonitoringMap),
  { ssr: false, loading: () => <div className="h-[340px] bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded-xl animate-pulse" /> }
);

const readings = generateDeformationReadings(DEFAULT_MINE_CENTER.lat, DEFAULT_MINE_CENTER.lon);

export default function ControlRoomSatellitePage() {
  const [selectedReading, setSelectedReading] = useState<DeformationReading | null>(null);
  const critical = readings.filter((r) => r.level === "critical").length;
  const moderate = readings.filter((r) => r.level === "moderate").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-medium text-[var(--text-heading)]">Satellite Monitoring</h2>
          <p className="text-[var(--text-muted)] text-sm mt-0.5">
            Sentinel-1 InSAR deformation · Real-time site overview
          </p>
        </div>
        <a
          href="/satellite-monitoring"
          className="px-3 py-1.5 text-xs font-medium text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/30 rounded-lg hover:bg-[var(--accent-cyan)]/10 transition-colors"
        >
          Full Dashboard →
        </a>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">Critical Alerts</p>
          <p className={`text-2xl font-bold mt-1 ${critical > 0 ? "text-red-400" : "text-[var(--accent-cyan)]"}`}>
            {critical}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">Moderate</p>
          <p className={`text-2xl font-bold mt-1 ${moderate > 0 ? "text-orange-400" : "text-[var(--text-heading)]"}`}>
            {moderate}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">Sensor</p>
          <p className="text-sm font-bold text-[var(--text-heading)] mt-1">Sentinel-1</p>
          <p className="text-[var(--text-muted)] text-xs">InSAR</p>
        </GlassCard>
      </div>

      {/* Map */}
      <MonitoringMap
        center={DEFAULT_MINE_CENTER}
        zoom={12}
        deformationReadings={readings}
        activeLayer="optical"
        height="340px"
        onReadingClick={setSelectedReading}
      />

      {/* Selected reading detail */}
      {selectedReading && (
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-[var(--text-heading)]">
              {selectedReading.location}
            </p>
            <button
              onClick={() => setSelectedReading(null)}
              className="text-[var(--text-muted)] hover:text-[var(--text-heading)] text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Shift: <span className="text-[var(--text-heading)]">{selectedReading.shiftMm} mm</span> ·
            Trend: <span className="text-[var(--text-heading)] capitalize">{selectedReading.trend}</span> ·
            Area: <span className="text-[var(--text-heading)] capitalize">{selectedReading.area.replace("-", " ")}</span>
          </p>
        </GlassCard>
      )}

      {/* Alert list */}
      <DeformationSummary readings={readings} onReadingClick={setSelectedReading} />
    </div>
  );
}
