"use client";

import React, { useState } from 'react';
import Map from 'react-map-gl/maplibre';
import DeckGL from '@deck.gl/react';
import { PathLayer, ArcLayer, ScatterplotLayer } from '@deck.gl/layers';
import 'maplibre-gl/dist/maplibre-gl.css';

// Initial viewport settings
const INITIAL_VIEW_STATE = {
  longitude: 148.243,
  latitude: -22.385,
  zoom: 13,
  pitch: 45,
  bearing: 0
};

export function SatelliteMap() {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  const layers = [
    new ScatterplotLayer({
      id: 'sensor-nodes',
      data: [
        { position: [148.243, -22.385], size: 100, color: [255, 0, 0] },
        { position: [148.250, -22.390], size: 80, color: [0, 255, 0] }
      ],
      getPosition: (d: any) => d.position,
      getRadius: (d: any) => d.size,
      getFillColor: (d: any) => d.color,
      pickable: true
    }),
    new ArcLayer({
      id: 'satellite-link',
      data: [
        { source: [148.243, -22.385], target: [148.300, -22.300] }
      ],
      getSourcePosition: (d: any) => d.source,
      getTargetPosition: (d: any) => d.target,
      getSourceColor: [0, 128, 255],
      getTargetColor: [255, 0, 128],
      getWidth: 2
    })
  ];

  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-[#363636]">
      <DeckGL
        initialViewState={viewState}
        onViewStateChange={(e: any) => setViewState(e.viewState)}
        controller={true}
        layers={layers}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        />
      </DeckGL>
      
      {/* Map Controls Overlay */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        <div className="bg-[#171717]/80 backdrop-blur border border-[#363636] p-3 rounded-lg">
          <p className="text-[10px] font-bold text-[#fafafa] uppercase tracking-wider mb-2">Map Layers</p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-xs text-[#898989]">InSAR Displacement</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-xs text-[#898989]">SAR Intensity</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
