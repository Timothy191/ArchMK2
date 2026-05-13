"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sphere, Html } from "@react-three/drei";
import * as THREE from "three";

interface Site {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: "operational" | "maintenance" | "offline";
  type: "drilling" | "production" | "control" | "safety" | "engineering";
}

interface OperationsGlobeProps {
  onSiteSelect: (siteName: string) => void;
  selectedSite: string | null;
}

// Department sites with approximate coordinates
const SITES: Site[] = [
  { id: "1", name: "Drilling Site Alpha", lat: -26.2, lng: 28.0, status: "operational", type: "drilling" },
  { id: "2", name: "Drilling Site Beta", lat: -25.8, lng: 27.5, status: "operational", type: "drilling" },
  { id: "3", name: "Processing Plant", lat: -26.0, lng: 28.2, status: "maintenance", type: "production" },
  { id: "4", name: "Control Center", lat: -26.1, lng: 28.1, status: "operational", type: "control" },
  { id: "5", name: "Safety Office", lat: -25.9, lng: 27.8, status: "operational", type: "safety" },
  { id: "6", name: "Engineering Hub", lat: -26.3, lng: 28.3, status: "operational", type: "engineering" },
  { id: "7", name: "Access Control", lat: -26.0, lng: 27.9, status: "offline", type: "control" },
];

function latLngToVector3(lat: number, lng: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  
  return new THREE.Vector3(x, y, z);
}

function SiteMarker({ site, onClick, isSelected }: { site: Site; onClick: () => void; isSelected: boolean }) {
  const position = useMemo(() => latLngToVector3(site.lat, site.lng, 4.05), [site.lat, site.lng]);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current) {
      // Pulse animation
      const scale = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.1;
      meshRef.current.scale.setScalar(isSelected ? scale * 1.5 : scale);
    }
  });

  const color = site.status === "operational" ? "#10b981" : 
                site.status === "maintenance" ? "#f59e0b" : "#ef4444";

  return (
    <group position={position}>
      {/* Glow ring */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>
      
      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} />
      </mesh>

      {/* Label */}
      <Html distanceFactor={10}>
        <div 
          className="cursor-pointer whitespace-nowrap select-none"
          onClick={onClick}
        >
          <div className={`
            px-2 py-1 rounded-lg text-xs font-medium
            backdrop-blur-md border
            ${isSelected 
              ? "bg-[#3ecf8e]/20 border-[#3ecf8e] text-[#fafafa]" 
              : "bg-[#0f0f0f]/80 border-[#363636] text-[#b4b4b4] hover:bg-[#242424]/80"
            }
            transition-all duration-200
          `}>
            <span className={`
              inline-block w-1.5 h-1.5 rounded-full mr-1.5
              ${site.status === "operational" ? "bg-emerald-400 animate-pulse" : 
                site.status === "maintenance" ? "bg-amber-400" : "bg-red-400"}
            `} />
            {site.name}
          </div>
        </div>
      </Html>
    </group>
  );
}

export function OperationsGlobe({ onSiteSelect, selectedSite }: OperationsGlobeProps) {
  const globeRef = useRef<THREE.Mesh>(null);
  const atmosphereRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (globeRef.current) {
      // Slow rotation
      globeRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
    if (atmosphereRef.current) {
      atmosphereRef.current.rotation.y = state.clock.elapsedTime * 0.05;
    }
  });

  // Create wireframe sphere texture
  const wireframeTexture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d")!;
    
    // Dark background
    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 512, 512);
    
    // Draw grid lines
    ctx.strokeStyle = "#1a3a4a";
    ctx.lineWidth = 1;
    
    // Latitude lines
    for (let i = 0; i <= 8; i++) {
      const y = (i / 8) * 512;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }
    
    // Longitude lines
    for (let i = 0; i <= 8; i++) {
      const x = (i / 8) * 512;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 512);
      ctx.stroke();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }, []);

  return (
    <group>
      {/* Main Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[4, 64, 64]} />
        <meshStandardMaterial
          map={wireframeTexture}
          color="#1a2a3a"
          roughness={0.8}
          metalness={0.3}
          emissive="#0a1a2a"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Atmosphere glow */}
      <mesh ref={atmosphereRef} scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial
          color="#3ecf8e"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Outer glow ring */}
      <mesh scale={[1.2, 1.2, 1.2]}>
        <sphereGeometry args={[4, 32, 32]} />
        <meshBasicMaterial
          color="#3ecf8e"
          transparent
          opacity={0.02}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Site Markers */}
      {SITES.map((site) => (
        <SiteMarker
          key={site.id}
          site={site}
          onClick={() => onSiteSelect(site.name)}
          isSelected={selectedSite === site.name}
        />
      ))}

      {/* Orbital rings (decorative) */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.5, 5.52, 128]} />
        <meshBasicMaterial color="#3ecf8e" transparent opacity={0.1} side={THREE.DoubleSide} />
      </mesh>

      <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <ringGeometry args={[6.2, 6.22, 128]} />
        <meshBasicMaterial color="#00c573" transparent opacity={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Data particles flowing between sites */}
      <DataFlowParticles />
    </group>
  );
}

function DataFlowParticles() {
  const points = useMemo(() => {
    const particleCount = 50;
    const positions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Random position around globe
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const radius = 4.5 + Math.random() * 2;
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[i3 + 1] = radius * Math.cos(phi);
      positions[i3 + 2] = radius * Math.sin(phi) * Math.sin(theta);
    }
    
    return positions;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[points, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#3ecf8e"
        transparent
        opacity={0.6}
        sizeAttenuation
      />
    </points>
  );
}
