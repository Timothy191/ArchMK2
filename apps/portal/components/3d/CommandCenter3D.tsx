"use client";

import { Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stars, PerspectiveCamera } from "@react-three/drei";
import { EffectComposer, Bloom, Noise } from "@react-three/postprocessing";
import { OperationsGlobe } from "./OperationsGlobe";
import { HolographicAI } from "./HolographicAI";
import { DashboardHub } from "./DashboardHub";
import { GlassCard } from "@repo/ui/GlassCard";

interface CommandCenter3DProps {
  onClose: () => void;
  activeFeature?: "globe" | "ai" | "hub" | "all";
}

export function CommandCenter3D({ onClose, activeFeature = "all" }: CommandCenter3DProps) {
  const [selectedSite, setSelectedSite] = useState<string | null>(null);
  const [aiExpanded, setAiExpanded] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a]">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto">
          <GlassCard className="px-4 py-2 flex items-center gap-3">
            <span className="text-[#3ecf8e] text-lg">◉</span>
            <span className="text-[#fafafa] font-medium">3D Command Center</span>
            <span className="text-[#898989] text-sm">|</span>
            <span className="text-[#898989] text-xs">Live Operations</span>
          </GlassCard>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <GlassCard className="px-3 py-2 flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[#b4b4b4]">7 Sites Online</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[#b4b4b4]">2 Maintenance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3ecf8e]" />
              <span className="text-[#b4b4b4]">AI Active</span>
            </div>
          </GlassCard>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-[#242424] text-[#fafafa] text-sm hover:bg-[#363636] transition-colors border border-[#363636]"
          >
            Exit 3D (ESC)
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <Canvas
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
        style={{ background: "linear-gradient(to bottom, #0a0a0a, #1a1a2e)" }}
      >
        <PerspectiveCamera makeDefault position={[0, 0, 18]} fov={45} />
        
        {/* Lighting */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 5]} intensity={1} color="#ffffff" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3ecf8e" />
        <pointLight position={[10, -10, -10]} intensity={0.3} color="#00c573" />

        {/* Stars Background */}
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />

        <Suspense fallback={null}>
          {/* Operations Globe */}
          {(activeFeature === "globe" || activeFeature === "all") && (
            <OperationsGlobe 
              onSiteSelect={setSelectedSite} 
              selectedSite={selectedSite}
            />
          )}

          {/* Holographic AI */}
          {(activeFeature === "ai" || activeFeature === "all") && (
            <HolographicAI 
              position={[8, 2, 0]} 
              expanded={aiExpanded}
              onClick={() => setAiExpanded(!aiExpanded)}
            />
          )}

          {/* Dashboard Hub */}
          {(activeFeature === "hub" || activeFeature === "all") && (
            <DashboardHub 
              onDepartmentClick={(dept) => console.log("Navigate to:", dept)}
            />
          )}
        </Suspense>

        {/* Post Processing Effects */}
        <EffectComposer>
          <Bloom 
            intensity={0.5} 
            luminanceThreshold={0.2} 
            luminanceSmoothing={0.9}
            height={300}
          />
          <Noise opacity={0.02} />
        </EffectComposer>

        {/* Camera Controls */}
        <OrbitControls 
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={50}
          autoRotate={!selectedSite && !aiExpanded}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      {/* Site Info Panel */}
      {selectedSite && (
        <div className="absolute bottom-4 left-4 z-10 pointer-events-auto">
          <GlassCard className="p-4 w-80">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-medium text-[#fafafa]">{selectedSite}</h3>
                <p className="text-sm text-[#3ecf8e]">Operational</p>
              </div>
              <button 
                onClick={() => setSelectedSite(null)}
                className="text-[#898989] hover:text-[#fafafa]"
              >
                ×
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-[#898989]">Active Machines:</span>
                <span className="text-[#fafafa]">12</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">Today&apos;s Output:</span>
                <span className="text-[#fafafa]">2,450 BCM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#898989]">Safety Score:</span>
                <span className="text-emerald-400">9.2/10</span>
              </div>
            </div>
            <button className="w-full mt-4 px-4 py-2 rounded-lg bg-[#3ecf8e] text-[#0f0f0f] text-sm font-medium hover:bg-[#35b87d] transition-colors">
              Open Dashboard
            </button>
          </GlassCard>
        </div>
      )}

      {/* AI Chat Panel */}
      {aiExpanded && (
        <div className="absolute bottom-4 right-4 z-10 pointer-events-auto">
          <GlassCard className="p-4 w-96">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#3ecf8e]/20 flex items-center justify-center">
                  <span className="text-[#3ecf8e]">AI</span>
                </div>
                <span className="font-medium text-[#fafafa]">3D Assistant</span>
              </div>
              <button 
                onClick={() => setAiExpanded(false)}
                className="text-[#898989] hover:text-[#fafafa]"
              >
                ×
              </button>
            </div>
            <div className="h-48 bg-[#171717] rounded-lg p-3 overflow-y-auto mb-3">
              <p className="text-sm text-[#b4b4b4]">
                Hello! I&apos;m your 3D AI assistant. I can see all your operations on the globe. 
                Click any site marker to view details, or ask me about:
              </p>
              <ul className="mt-2 text-sm text-[#898989] space-y-1">
                <li>• Equipment status</li>
                <li>• Shift summaries</li>
                <li>• Safety alerts</li>
                <li>• Weather conditions</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                placeholder="Ask about operations..."
                className="flex-1 px-3 py-2 rounded-lg bg-[#242424] border border-[#363636] text-[#fafafa] text-sm placeholder-[#898989] focus:outline-none focus:border-[#3ecf8e]"
              />
              <button className="px-4 py-2 rounded-lg bg-[#3ecf8e] text-[#0f0f0f]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Controls Help */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <GlassCard className="px-4 py-2 text-xs text-[#898989]">
          <span className="mr-4">🖱️ Drag to rotate</span>
          <span className="mr-4">📜 Scroll to zoom</span>
          <span>👆 Click markers for details</span>
        </GlassCard>
      </div>
    </div>
  );
}
