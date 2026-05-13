"use client";

import { useState } from "react";
import type { STACItem } from "@/lib/monitoring-api";
import { formatSceneDate } from "@/lib/monitoring-api";

interface SARLayerPanelProps {
  scenes: STACItem[];
  onSceneSelect?: (scene: STACItem) => void;
}

const COLORMAP_STEPS = [
  { label: "-50mm", color: "#ef4444" },
  { label: "-30mm", color: "#f97316" },
  { label: "-15mm", color: "#f59e0b" },
  { label: "0mm", color: "#3ecf8e" },
  { label: "+15mm", color: "#06b6d4" },
  { label: "+30mm", color: "#6366f1" },
];

export function SARLayerPanel({ scenes, onSceneSelect }: SARLayerPanelProps) {
  const [selectedScene, setSelectedScene] = useState<string | null>(
    scenes[0]?.id ?? null
  );

  function handleSelect(scene: STACItem) {
    setSelectedScene(scene.id);
    onSceneSelect?.(scene);
  }

  return (
    <div className="space-y-4">
      {/* InSAR Info Banner */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-3">
          <span className="text-blue-400 text-lg mt-0.5">📡</span>
          <div>
            <p className="text-sm font-medium text-blue-400">Sentinel-1 SAR / InSAR</p>
            <p className="text-xs text-[#898989] mt-1 leading-relaxed">
              Synthetic Aperture Radar operates through clouds and at night. InSAR measures
              millimeter-level ground deformation — critical for pit wall stability and
              tailings dam integrity.
            </p>
          </div>
        </div>
      </div>

      {/* Deformation Colormap Legend */}
      <div className="p-4 rounded-xl bg-[#171717] border border-[#363636]">
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-3">
          Deformation Scale (mm)
        </p>
        <div className="flex items-center gap-1 h-6 rounded overflow-hidden">
          {COLORMAP_STEPS.map((step) => (
            <div
              key={step.label}
              className="flex-1 h-full"
              style={{ background: step.color }}
              title={step.label}
            />
          ))}
        </div>
        <div className="flex justify-between mt-1.5">
          {COLORMAP_STEPS.map((step) => (
            <span key={step.label} className="text-[10px] text-[#898989]">
              {step.label}
            </span>
          ))}
        </div>
        <p className="text-[10px] text-[#898989] mt-2">
          Red = subsidence ↓ · Green = stable · Blue = uplift ↑
        </p>
      </div>

      {/* Scene List */}
      <div>
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-2">
          Recent Sentinel-1 Acquisitions
        </p>
        {scenes.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#171717] border border-[#363636] text-center">
            <p className="text-[#898989] text-sm">No scenes fetched — check network or bbox</p>
            <p className="text-[#898989] text-xs mt-1">Showing deformation data from last processed pass</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                onClick={() => handleSelect(scene)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  selectedScene === scene.id
                    ? "bg-[#3ecf8e]/10 border-[#3ecf8e]/40"
                    : "bg-[#171717] border-[#363636] hover:bg-[#242424]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-[#fafafa] font-medium">{scene.id.slice(0, 24)}…</p>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                    SAR
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-[#898989]">
                  <span>📅 {formatSceneDate(scene.properties.datetime)}</span>
                  {scene.properties["s1:polarisation"] && (
                    <span>🔄 {scene.properties["s1:polarisation"]}</span>
                  )}
                  <span>🛰 {scene.properties.platform ?? "Sentinel-1"}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Technical note */}
      <p className="text-[11px] text-[#898989] leading-relaxed">
        Note: Full InSAR differential interferometry requires server-side processing (SNAP/StaMPS).
        This view shows Sentinel-1 GRD backscatter overlays with pre-computed deformation estimates.
        Contact your geotechnical team for certified InSAR reports.
      </p>
    </div>
  );
}
