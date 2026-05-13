"use client";

import { useState } from "react";
import type { STACItem } from "@/lib/monitoring-api";
import { formatSceneDate } from "@/lib/monitoring-api";

interface HighResPanelProps {
  scenes: STACItem[];
}

const USE_CASES = [
  {
    icon: "🚜",
    title: "Equipment Tracking",
    description: "Sub-meter imagery detects individual haul trucks, excavators, and dozers to verify shift compliance and utilisation.",
  },
  {
    icon: "⛏️",
    title: "Excavation Volume",
    description: "Multi-temporal DEM differencing calculates how much material has been extracted between acquisition dates.",
  },
  {
    icon: "🏗️",
    title: "Infrastructure Change",
    description: "Detect new stockpiles, road extensions, or dam embankment changes across the site perimeter.",
  },
  {
    icon: "💧",
    title: "Water Body Mapping",
    description: "Track pit dewatering, tailings pond levels, and nearby drainage courses for environmental compliance.",
  },
];

const PROVIDERS = [
  {
    name: "Sentinel-2 (ESA/Copernicus)",
    resolution: "10m",
    revisit: "5 days",
    cost: "Free",
    key: false,
    api: "Copernicus STAC",
  },
  {
    name: "Planet Labs (PlanetScope)",
    resolution: "3m",
    revisit: "Daily",
    cost: "Paid (edu free)",
    key: true,
    api: "Planet API v1",
  },
  {
    name: "Maxar WorldView",
    resolution: "0.3m",
    revisit: "< 1 day",
    cost: "Paid",
    key: true,
    api: "Maxar GBDX",
  },
  {
    name: "Airbus Pleiades",
    resolution: "0.5m",
    revisit: "< 1 day",
    cost: "Paid",
    key: true,
    api: "Airbus Intelligence",
  },
];

export function HighResPanel({ scenes }: HighResPanelProps) {
  const [selectedScene, setSelectedScene] = useState<string | null>(
    scenes[0]?.id ?? null
  );

  return (
    <div className="space-y-4">
      {/* Info Banner */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
        <div className="flex items-start gap-3">
          <span className="text-emerald-400 text-lg mt-0.5">🛰️</span>
          <div>
            <p className="text-sm font-medium text-emerald-400">High-Resolution Commercial Imagery</p>
            <p className="text-xs text-[#898989] mt-1 leading-relaxed">
              CubeSat constellations (Planet Labs, Maxar) image the entire Earth daily at sub-meter
              resolution. Mining companies use these to track equipment position, calculate excavation
              volumes, and monitor site perimeter changes.
            </p>
          </div>
        </div>
      </div>

      {/* Use Cases */}
      <div>
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-2">
          Mining Applications
        </p>
        <div className="grid grid-cols-1 gap-2">
          {USE_CASES.map((uc) => (
            <div
              key={uc.title}
              className="flex items-start gap-3 p-3 rounded-xl bg-[#171717] border border-[#363636]"
            >
              <span className="text-xl shrink-0">{uc.icon}</span>
              <div>
                <p className="text-sm font-medium text-[#fafafa]">{uc.title}</p>
                <p className="text-xs text-[#898989] mt-0.5 leading-relaxed">{uc.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provider Comparison */}
      <div>
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-2">
          Imagery Providers
        </p>
        <div className="rounded-xl border border-[#363636] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#242424]">
                <th className="text-left p-3 text-[#898989] font-medium">Provider</th>
                <th className="text-left p-3 text-[#898989] font-medium">Res.</th>
                <th className="text-left p-3 text-[#898989] font-medium">Revisit</th>
                <th className="text-left p-3 text-[#898989] font-medium">Cost</th>
              </tr>
            </thead>
            <tbody>
              {PROVIDERS.map((p, i) => (
                <tr
                  key={p.name}
                  className={`border-t border-[#363636] ${i % 2 === 0 ? "bg-[#171717]" : "bg-[#1a1a1a]"}`}
                >
                  <td className="p-3 text-[#fafafa]">
                    <span>{p.name}</span>
                    {p.key && (
                      <span className="ml-1.5 text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">
                        API KEY
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[#b4b4b4]">{p.resolution}</td>
                  <td className="p-3 text-[#b4b4b4]">{p.revisit}</td>
                  <td className="p-3">
                    <span className={p.cost === "Free" ? "text-[#3ecf8e]" : "text-[#898989]"}>
                      {p.cost}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Latest Sentinel-2 Scenes as proxy for high-res */}
      <div>
        <p className="text-xs font-medium text-[#b4b4b4] uppercase tracking-wider mb-2">
          Latest Copernicus Scenes (Active)
        </p>
        {scenes.length === 0 ? (
          <div className="p-4 rounded-xl bg-[#171717] border border-[#363636] text-center">
            <p className="text-[#898989] text-sm">No recent scenes available</p>
            <p className="text-[#898989] text-xs mt-1">
              Configure Planet/Maxar API keys in Settings for daily sub-meter imagery
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {scenes.slice(0, 4).map((scene) => {
              const cloud = scene.properties["eo:cloud_cover"];
              return (
                <button
                  key={scene.id}
                  onClick={() => setSelectedScene(scene.id === selectedScene ? null : scene.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-colors ${
                    selectedScene === scene.id
                      ? "bg-emerald-500/10 border-emerald-500/30"
                      : "bg-[#171717] border-[#363636] hover:bg-[#242424]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm text-[#fafafa] font-medium truncate">
                      {scene.id.slice(0, 22)}…
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {cloud !== undefined && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                          cloud < 10 ? "bg-[#3ecf8e]/20 text-[#3ecf8e]" : "bg-amber-500/20 text-amber-400"
                        }`}>
                          ☁ {cloud.toFixed(0)}%
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                        10m
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-[#898989] mt-1">
                    📅 {formatSceneDate(scene.properties.datetime)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
