"use client";

import { useCallback, useRef, useState } from "react";

// Kepler.gl and its styles — imported dynamically below for SSR safety
import "kepler.gl/styles/less/kepler-gl-style.css";

interface KeplerGlMapProps {
  center?: { lat: number; lon: number };
  zoom?: number;
  height?: string;
}

interface GeoJSONFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number];
  };
  properties: Record<string, unknown>;
}

export function KeplerGlMap({
  center = { lat: -26.25, lon: 26.75 },
  zoom = 11,
  height = "600px",
}: KeplerGlMapProps) {
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generate demo mining deformation data as GeoJSON
  const generateMiningData = useCallback((): GeoJSONFeature[] => {
    const features: GeoJSONFeature[] = [];
    const areaTypes = [
      "pit-wall",
      "tailings-dam",
      "haul-road",
      "conveyor",
      "stockpile",
      "crusher",
    ];
    const levels = ["stable", "minor", "moderate", "critical"] as const;

    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.015;
      const lat = center.lat + Math.cos(angle) * radius;
      const lon = center.lon + Math.sin(angle) * radius;
      const level = levels[Math.floor(Math.random() * levels.length)]!;
      const area = areaTypes[Math.floor(Math.random() * areaTypes.length)]!;

      features.push({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [lon, lat],
        },
        properties: {
          location: `Zone ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`,
          level,
          area,
          shift_mm: (Math.random() * 60 - 10).toFixed(1),
          trend: ["stable", "accelerating", "decelerating"][
            Math.floor(Math.random() * 3)
          ],
          sensor: "Sentinel-1",
          last_observation: new Date(
            Date.now() - Math.random() * 7 * 86400000,
          ).toISOString(),
        },
      });
    }
    return features;
  }, [center]);

  const miningData = useRef(generateMiningData());

  // Lazy-load kepler.gl on mount
  useState(() => {
    import("kepler.gl").then((mod) => {
      setLoaded(true);
    });
  });

  if (!loaded) {
    return (
      <div
        className="bg-[var(--bg-primary)] border border-[var(--border-emphasis)] rounded-xl flex items-center justify-center"
        style={{ height }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin" />
          <p className="text-[var(--text-secondary)] text-sm">
            Loading Kepler.gl…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Info */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
        <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
          <strong className="text-indigo-400">Kepler.gl</strong> — High-performance
          geospatial analysis engine. Filter, aggregate, and visualize deformation
          data across the mine site with interactive point clusters, heatmaps, and
          arc layers. Built on deck.gl.
        </p>
      </div>

      {/* Here we would mount the KeplerGl component */}
      <div
        ref={containerRef}
        className="rounded-xl overflow-hidden border border-[var(--border-emphasis)]"
        style={{ height }}
      >
        <div
          className="w-full h-full flex items-center justify-center bg-[var(--bg-primary)]"
          style={{ height }}
        >
          <div className="text-center space-y-2 max-w-md px-6">
            <p className="text-sm font-medium text-[var(--text-heading)]">
              Kepler.gl Spatial Analysis
            </p>
            <p className="text-xs text-[var(--text-secondary)]">
              {miningData.current.length} deformation points loaded.
              Open the Kepler.gl UI to configure layers, filters, and
              aggregations.
            </p>
            <div className="flex flex-wrap justify-center gap-2 mt-3">
              {(["critical", "moderate", "minor", "stable"] as const).map(
                (lvl) => {
                  const count = miningData.current.filter(
                    (f) => f.properties.level === lvl,
                  ).length;
                  const colors: Record<string, string> = {
                    critical: "text-red-400",
                    moderate: "text-orange-400",
                    minor: "text-amber-400",
                    stable: "text-emerald-400",
                  };
                  return (
                    <span
                      key={lvl}
                      className={`text-[10px] ${colors[lvl]} bg-[var(--bg-primary)] px-2 py-0.5 rounded border border-[var(--border-default)]`}
                    >
                      {lvl}: {count}
                    </span>
                  );
                },
              )}
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-2">
              Import this data into the Kepler.gl UI via the data manager
              panel (Add Data → GeoJSON).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
