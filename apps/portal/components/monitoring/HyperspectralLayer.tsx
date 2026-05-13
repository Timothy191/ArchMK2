"use client";

import { useState } from "react";
import type { STACItem } from "@/lib/monitoring-api";
import { formatSceneDate } from "@/lib/monitoring-api";

export type SpectralComposite = "truecolor" | "falsecolor" | "ndvi" | "geology";

interface HyperspectralLayerProps {
  scenes: STACItem[];
  activeComposite: SpectralComposite;
  onCompositeChange: (composite: SpectralComposite) => void;
}

const COMPOSITES: { id: SpectralComposite; label: string; description: string; bands: string; use: string }[] = [
  {
    id: "truecolor",
    label: "True Color",
    description: "Natural RGB composite",
    bands: "B04, B03, B02",
    use: "Visual site overview, equipment tracking",
  },
  {
    id: "falsecolor",
    label: "False Color",
    description: "NIR-Red-Green composite",
    bands: "B08, B04, B03",
    use: "Vegetation health, revegetation monitoring",
  },
  {
    id: "ndvi",
    label: "NDVI",
    description: "Normalized Difference Vegetation Index",
    bands: "(B08−B04)/(B08+B04)",
    use: "Dust suppression coverage, reclamation progress",
  },
  {
    id: "geology",
    label: "Geology / Minerals",
    description: "SWIR mineral detection composite",
    bands: "B12, B08, B02",
    use: "Mineral outcrop mapping, acid mine drainage detection",
  },
];

const MINERAL_SIGNATURES = [
  { mineral: "Iron Oxide", color: "#ef4444", band: "B04/B02 ratio > 2.0", concern: "Acid drainage indicator" },
  { mineral: "Clay Minerals", color: "#f59e0b", band: "B12/B11 ratio", concern: "Tailings mineralogy" },
  { mineral: "Carbonate", color: "#6366f1", band: "B11 reflectance", concern: "Neutralisation potential" },
  { mineral: "Sulfide", color: "#8b5cf6", band: "B12 absorption", concern: "AMD risk zone" },
];

export function HyperspectralLayer({
  scenes,
  activeComposite,
  onCompositeChange,
}: HyperspectralLayerProps) {
  const [expandedScene, setExpandedScene] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <div className="flex items-start gap-3">
          <span className="text-violet-400 text-lg mt-0.5">🌈</span>
          <div>
            <p className="text-sm font-medium text-violet-400">Sentinel-2 Multispectral (13 bands)</p>
            <p className="text-xs text-[#898989] mt-1 leading-relaxed">
              Sentinel-2 captures 13 spectral bands from visible to SWIR at 10–60m resolution.
              Band combinations reveal mineral composition, vegetation health, and water quality —
              critical for AMD detection in nearby rivers.
            </p>
          </div>
        </div>
      </div>

      {/* Composite Selector */}
      <div>
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-2">
          Band Composite
        </p>
        <div className="grid grid-cols-2 gap-2">
          {COMPOSITES.map((comp) => (
            <button
              key={comp.id}
              onClick={() => onCompositeChange(comp.id)}
              className={`text-left p-3 rounded-xl border transition-colors ${
                activeComposite === comp.id
                  ? "bg-violet-500/10 border-violet-500/40"
                  : "bg-[#171717] border-[#363636] hover:bg-[#242424]"
              }`}
            >
              <p className={`text-sm font-medium ${
                activeComposite === comp.id ? "text-violet-400" : "text-[#fafafa]"
              }`}>
                {comp.label}
              </p>
              <p className="text-[10px] text-[#898989] mt-0.5">{comp.bands}</p>
              <p className="text-[10px] text-[#b4b4b4] mt-1">{comp.use}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Mineral Signatures */}
      <div className="p-4 rounded-xl bg-[#171717] border border-[#363636]">
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-3">
          Mineral / AMD Spectral Signatures
        </p>
        <div className="space-y-2">
          {MINERAL_SIGNATURES.map((sig) => (
            <div key={sig.mineral} className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded shrink-0"
                style={{ background: sig.color }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#fafafa]">{sig.mineral}</p>
                <p className="text-[10px] text-[#898989]">{sig.concern}</p>
              </div>
              <span className="text-[10px] text-[#898989] font-mono">{sig.band}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scene List */}
      <div>
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-2">
          Available Sentinel-2 Scenes
        </p>
        {scenes.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#171717] border border-[#363636] text-center">
            <p className="text-[#898989] text-sm">No cloud-free scenes in range</p>
            <p className="text-[#898989] text-xs mt-1">Expand time window or increase cloud cover threshold</p>
          </div>
        ) : (
          <div className="space-y-2">
            {scenes.slice(0, 5).map((scene) => {
              const cloud = scene.properties["eo:cloud_cover"];
              return (
                <button
                  key={scene.id}
                  onClick={() => setExpandedScene(expandedScene === scene.id ? null : scene.id)}
                  className="w-full text-left p-3 rounded-xl border bg-[#171717] border-[#363636] hover:bg-[#242424] transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[#fafafa] font-medium truncate max-w-[160px]">
                      {scene.id.slice(0, 20)}…
                    </p>
                    <div className="flex items-center gap-2">
                      {cloud !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          cloud < 10 ? "bg-[#3ecf8e]/20 text-[#3ecf8e]" :
                          cloud < 25 ? "bg-amber-500/20 text-amber-400" :
                          "bg-red-500/20 text-red-400"
                        }`}>
                          ☁ {cloud.toFixed(0)}%
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400">
                        S2
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#898989] mt-1">
                    📅 {formatSceneDate(scene.properties.datetime)}
                  </p>
                  {expandedScene === scene.id && scene.properties["s2:mgrs_tile"] && (
                    <div className="mt-2 pt-2 border-t border-[#363636]">
                      <p className="text-xs text-[#898989]">
                        🗺 MGRS Tile: {scene.properties["s2:mgrs_tile"]}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
