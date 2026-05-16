"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Map from "react-map-gl/maplibre";
import DeckGL from "@deck.gl/react";
import { ScatterplotLayer } from "@deck.gl/layers";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  MAP_TILE_URLS,
  LAYER_META,
  type DeformationReading,
} from "@/lib/monitoring-api";

export type MapLayerKey =
  | "none"
  | "sar"
  | "optical"
  | "ndvi"
  | "geology"
  | "terrain"
  | "osm";

interface MonitoringMapProps {
  center?: { lat: number; lon: number };
  zoom?: number;
  deformationReadings?: DeformationReading[];
  activeLayer?: MapLayerKey;
  height?: string;
  onReadingClick?: (reading: DeformationReading) => void;
  showLayerSwitcher?: boolean;
}

const LEVEL_COLORS: Record<string, string> = {
  stable: "#3ecf8e",
  minor: "#f59e0b",
  moderate: "#f97316",
  critical: "#ef4444",
};

const LAYER_OPTIONS: { key: MapLayerKey; label: string }[] = [
  { key: "optical", label: "S2 Optical" },
  { key: "terrain", label: "Terrain" },
  { key: "sar", label: "SAR" },
  { key: "ndvi", label: "NDVI" },
  { key: "geology", label: "Geology" },
  { key: "osm", label: "Streets" },
];

function buildDeformationGeoJSON(readings: DeformationReading[]) {
  return {
    type: "FeatureCollection" as const,
    features: readings.map((r) => ({
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [r.lon, r.lat] },
      properties: {
        id: r.id,
        location: r.location,
        level: r.level,
        shiftMm: r.shiftMm,
        velocityMmPerMonth: r.velocityMmPerMonth,
        sensor: r.sensor,
        color: LEVEL_COLORS[r.level] ?? "#3ecf8e",
        radius:
          r.level === "critical"
            ? 14
            : r.level === "moderate"
              ? 11
              : r.level === "minor"
                ? 9
                : 7,
      },
    })),
  };
}

export function MonitoringMap({
  center = { lat: -26.25, lon: 26.75 },
  zoom = 12,
  deformationReadings = [],
  activeLayer = "optical",
  height = "400px",
  onReadingClick,
  showLayerSwitcher = true,
}: MonitoringMapProps) {
  const [viewState, setViewState] = useState({
    latitude: center.lat,
    longitude: center.lon,
    zoom: zoom,
    pitch: 0,
    bearing: 0,
  });

  const [currentLayer, setCurrentLayer] = useState<MapLayerKey>(activeLayer);

  useEffect(() => {
    setCurrentLayer(activeLayer);
  }, [activeLayer]);

  const layers = [
    new ScatterplotLayer({
      id: "deformation-points",
      data: deformationReadings,
      getPosition: (d: DeformationReading) => [d.lon, d.lat],
      getFillColor: (d: DeformationReading) => {
        const hex = LEVEL_COLORS[d.level] || "#3ecf8e";
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b, 200];
      },
      getRadius: (d: DeformationReading) => {
        return d.level === "critical"
          ? 100
          : d.level === "moderate"
            ? 70
            : d.level === "minor"
              ? 50
              : 30;
      },
      pickable: true,
      onClick: (info: { object?: DeformationReading }) => {
        if (info.object) {
          onReadingClick?.(info.object);
        }
      },
      updateTriggers: {
        getFillColor: [deformationReadings],
        getRadius: [deformationReadings],
      },
    }),
  ];

  const tileUrl = MAP_TILE_URLS[currentLayer] ?? MAP_TILE_URLS.optical ?? "";
  const meta = LAYER_META[currentLayer] ?? LAYER_META.optical;

  return (
    <div
      className="relative rounded-xl overflow-hidden border border-[#363636]"
      style={{ height }}
    >
      <DeckGL
        viewState={viewState}
        onViewStateChange={
          ((e: { viewState: typeof viewState }) =>
            setViewState(e.viewState)) as any
        }
        controller={true}
        layers={layers}
        getCursor={({ isHovering }: { isHovering?: boolean }) =>
          isHovering ? "pointer" : "grab"
        }
      >
        <Map
          mapStyle={{
            version: 8,
            sources: {
              "raster-tiles": {
                type: "raster",
                tiles: [tileUrl],
                tileSize: 256,
                attribution: meta?.attribution ?? "© EOX IT Services / ESA",
              },
            },
            layers: [
              {
                id: "raster-layer",
                type: "raster",
                source: "raster-tiles",
                minzoom: 0,
                maxzoom: 22,
              },
            ],
          }}
        />
      </DeckGL>

      {/* Layer switcher overlay */}
      {showLayerSwitcher && (
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setCurrentLayer(opt.key)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-lg border transition-colors shadow-sm ${
                currentLayer === opt.key
                  ? "bg-[#3ecf8e] text-[#171717] border-[#3ecf8e]"
                  : "bg-[#0f0f0f]/85 text-[#b4b4b4] border-[#363636] hover:text-[#fafafa]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {/* Active layer info badge */}
      <div className="absolute bottom-8 right-2 px-2 py-1 bg-[#0f0f0f]/85 rounded-lg text-[10px] text-[#898989] max-w-[180px] text-right pointer-events-none">
        <p className="text-[#b4b4b4] font-medium">{meta?.label}</p>
        <p>{meta?.description}</p>
      </div>

      {/* Deformation legend */}
      <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 bg-[#0f0f0f]/85 rounded-lg pointer-events-none">
        {(["stable", "minor", "moderate", "critical"] as const).map((lvl) => (
          <div key={lvl} className="flex items-center gap-1">
            <span
              className="w-2.5 h-2.5 rounded-full inline-block"
              style={{ background: LEVEL_COLORS[lvl] }}
            />
            <span className="text-[10px] text-[#898989] capitalize">{lvl}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
