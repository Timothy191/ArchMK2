"use client";

import { useEffect, useRef, useState } from "react";
import type { DeformationReading } from "@/lib/monitoring-api";

interface MonitoringMapProps {
  center?: { lat: number; lon: number };
  zoom?: number;
  deformationReadings?: DeformationReading[];
  activeLayer?: "none" | "sar" | "optical" | "ndvi" | "geology";
  height?: string;
  onReadingClick?: (reading: DeformationReading) => void;
}

const LAYER_TILES: Record<string, string> = {
  none: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  sar: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg",
  optical: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg",
  ndvi: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg",
  geology: "https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2024_3857/default/g/{z}/{y}/{x}.jpg",
};

const DEFORMATION_COLORS: Record<string, string> = {
  stable: "#3ecf8e",
  minor: "#f59e0b",
  moderate: "#f97316",
  critical: "#ef4444",
};

export function MonitoringMap({
  center = { lat: -26.25, lon: 26.75 },
  zoom = 12,
  deformationReadings = [],
  activeLayer = "optical",
  height = "400px",
  onReadingClick,
}: MonitoringMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    let maplibre: any;

    async function initMap() {
      try {
        maplibre = await import("maplibre-gl");
        const MapLibreGL = maplibre.default ?? maplibre;

        if (mapRef.current) return;

        const map = new MapLibreGL.Map({
          container: mapContainerRef.current!,
          style: {
            version: 8,
            sources: {
              "raster-tiles": {
                type: "raster",
                tiles: [LAYER_TILES[activeLayer] ?? LAYER_TILES.optical],
                tileSize: 256,
                attribution: "© EOX IT Services / Copernicus / ESA",
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

        map.on("load", () => {
          setMapLoaded(true);

          deformationReadings.forEach((reading) => {
            const el = document.createElement("div");
            el.className = "deformation-marker";
            el.style.cssText = `
              width: 20px;
              height: 20px;
              border-radius: 50%;
              background: ${DEFORMATION_COLORS[reading.level]};
              border: 2px solid rgba(255,255,255,0.8);
              cursor: pointer;
              box-shadow: 0 0 0 4px ${DEFORMATION_COLORS[reading.level]}33;
              transition: transform 0.15s;
            `;
            if (reading.level === "critical") {
              el.style.animation = "pulse-ring 1.5s infinite";
            }

            el.addEventListener("mouseenter", () => {
              el.style.transform = "scale(1.3)";
            });
            el.addEventListener("mouseleave", () => {
              el.style.transform = "scale(1)";
            });
            el.addEventListener("click", () => {
              onReadingClick?.(reading);
            });

            const popup = new MapLibreGL.Popup({
              offset: 15,
              closeButton: false,
              className: "monitoring-popup",
            }).setHTML(`
              <div style="background:#1a1a1a;border:1px solid #363636;padding:10px;border-radius:8px;min-width:180px;">
                <p style="color:#fafafa;font-size:13px;font-weight:600;margin:0 0 4px">${reading.location}</p>
                <p style="color:${DEFORMATION_COLORS[reading.level]};font-size:12px;margin:0 0 2px">${reading.shiftMm > 0 ? "+" : ""}${reading.shiftMm} mm shift</p>
                <p style="color:#898989;font-size:11px;margin:0">${reading.sensor}</p>
              </div>
            `);

            const marker = new MapLibreGL.Marker({ element: el })
              .setLngLat([reading.lon, reading.lat])
              .setPopup(popup)
              .addTo(map);

            markersRef.current.push(marker);
          });
        });

        mapRef.current = map;
      } catch (err) {
        console.error("MapLibre init error:", err);
        setError("Map failed to load");
      }
    }

    initMap();

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;
    const src = mapRef.current.getSource("raster-tiles");
    if (src) {
      src.tiles = [LAYER_TILES[activeLayer] ?? LAYER_TILES.optical];
      mapRef.current.triggerRepaint();
    }
  }, [activeLayer, mapLoaded]);

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
      <div className="absolute bottom-2 right-2 px-2 py-1 bg-[#0f0f0f]/80 rounded text-[10px] text-[#898989]">
        © EOX / Copernicus / ESA
      </div>
    </div>
  );
}
