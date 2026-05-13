"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { MAP_TILE_URLS, LAYER_META, type DeformationReading } from "@/lib/monitoring-api";

export type MapLayerKey = "none" | "sar" | "optical" | "ndvi" | "geology" | "terrain" | "osm";

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
  stable:   "#3ecf8e",
  minor:    "#f59e0b",
  moderate: "#f97316",
  critical: "#ef4444",
};

const LAYER_OPTIONS: { key: MapLayerKey; label: string }[] = [
  { key: "optical",  label: "S2 Optical" },
  { key: "terrain",  label: "Terrain" },
  { key: "sar",      label: "SAR" },
  { key: "ndvi",     label: "NDVI" },
  { key: "geology",  label: "Geology" },
  { key: "osm",      label: "Streets" },
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
        radius: r.level === "critical" ? 14 : r.level === "moderate" ? 11 : r.level === "minor" ? 9 : 7,
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const popupRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentLayer, setCurrentLayer] = useState<MapLayerKey>(activeLayer);
  const readingsRef = useRef(deformationReadings);
  readingsRef.current = deformationReadings;

  const switchLayer = useCallback((layerKey: MapLayerKey) => {
    setCurrentLayer(layerKey);
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("raster-tiles");
    if (src) {
      src.setTiles([MAP_TILE_URLS[layerKey] ?? MAP_TILE_URLS.optical]);
    }
  }, []);

  useEffect(() => {
    if (mapLoaded) switchLayer(activeLayer);
  }, [activeLayer, mapLoaded, switchLayer]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    async function initMap() {
      try {
        const maplibre = await import("maplibre-gl");
        await import("maplibre-gl/dist/maplibre-gl.css" as any);
        const MapLibreGL = maplibre.default ?? maplibre;

        if (mapRef.current) return;

        const tileUrl = MAP_TILE_URLS[activeLayer] ?? MAP_TILE_URLS["optical"]!;
        const meta = LAYER_META[activeLayer] ?? LAYER_META["optical"];

        const map = new MapLibreGL.Map({
          container: mapContainerRef.current!,
          style: {
            version: 8,
            glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
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
          },
          center: [center.lon, center.lat],
          zoom,
        });

        map.addControl(new MapLibreGL.NavigationControl({ showCompass: true }), "top-right");
        map.addControl(new MapLibreGL.ScaleControl({ maxWidth: 120, unit: "metric" }), "bottom-left");

        popupRef.current = new MapLibreGL.Popup({
          closeButton: true,
          closeOnClick: false,
          className: "monitoring-popup",
          maxWidth: "260px",
        });

        map.on("load", () => {
          const geojson = buildDeformationGeoJSON(readingsRef.current);

          map.addSource("deformation-points", { type: "geojson", data: geojson });

          map.addLayer({
            id: "deformation-glow",
            type: "circle",
            source: "deformation-points",
            paint: {
              "circle-radius": ["get", "radius"],
              "circle-color": ["get", "color"],
              "circle-opacity": 0.25,
              "circle-stroke-width": 0,
            },
          });

          map.addLayer({
            id: "deformation-circles",
            type: "circle",
            source: "deformation-points",
            paint: {
              "circle-radius": [
                "interpolate", ["linear"], ["zoom"],
                8, ["*", ["get", "radius"], 0.5],
                14, ["*", ["get", "radius"], 1.8],
              ],
              "circle-color": ["get", "color"],
              "circle-opacity": 0.9,
              "circle-stroke-width": 2,
              "circle-stroke-color": "rgba(255,255,255,0.85)",
            },
          });

          map.on("click", "deformation-circles", (e: any) => {
            const props = e.features?.[0]?.properties;
            if (!props) return;
            const reading = readingsRef.current.find((r) => r.id === props.id);
            if (reading) onReadingClick?.(reading);

            popupRef.current
              .setLngLat(e.lngLat)
              .setHTML(`
                <div style="padding:8px 4px;">
                  <p style="font-size:13px;font-weight:600;margin:0 0 6px;color:#fafafa">${props.location}</p>
                  <p style="font-size:12px;margin:0 0 2px;color:${props.color}">
                    ${props.shiftMm > 0 ? "+" : ""}${props.shiftMm} mm LOS
                  </p>
                  <p style="font-size:11px;margin:0 0 2px;color:#b4b4b4">
                    Velocity: ${props.velocityMmPerMonth > 0 ? "+" : ""}${props.velocityMmPerMonth} mm/mo
                  </p>
                  <p style="font-size:10px;margin:0;color:#898989">${props.sensor}</p>
                </div>
              `)
              .addTo(map);
          });

          map.on("mouseenter", "deformation-circles", () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", "deformation-circles", () => {
            map.getCanvas().style.cursor = "";
          });

          setMapLoaded(true);
        });

        mapRef.current = map;
      } catch (err) {
        console.error("MapLibre init error:", err);
        setError("Map failed to load");
      }
    }

    initMap();

    return () => {
      popupRef.current?.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      setMapLoaded(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapLoaded || !mapRef.current) return;
    const src = mapRef.current.getSource("deformation-points");
    if (src) {
      src.setData(buildDeformationGeoJSON(deformationReadings));
    }
  }, [deformationReadings, mapLoaded]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center bg-[#171717] border border-[#363636] rounded-xl"
        style={{ height }}
      >
        <p className="text-[#898989] text-sm">Map unavailable — {error}</p>
      </div>
    );
  }

  const meta = LAYER_META[currentLayer] ?? LAYER_META.optical;

  return (
    <div className="relative rounded-xl overflow-hidden border border-[#363636]" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#171717]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-[#3ecf8e] border-t-transparent rounded-full animate-spin" />
            <p className="text-[#898989] text-sm">Loading satellite map…</p>
          </div>
        </div>
      )}

      {/* Layer switcher overlay */}
      {showLayerSwitcher && mapLoaded && (
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
          {LAYER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => switchLayer(opt.key)}
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
      {mapLoaded && (
        <div className="absolute bottom-8 right-2 px-2 py-1 bg-[#0f0f0f]/85 rounded-lg text-[10px] text-[#898989] max-w-[180px] text-right">
          <p className="text-[#b4b4b4] font-medium">{meta?.label}</p>
          <p>{meta?.description}</p>
        </div>
      )}

      {/* Deformation legend */}
      {mapLoaded && (
        <div className="absolute bottom-2 left-2 flex items-center gap-2 px-2 py-1 bg-[#0f0f0f]/85 rounded-lg">
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
      )}
    </div>
  );
}
