'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigationState } from '../../hooks/useNavigationState';

const COLOR_SCHEMES: Record<string, { primary: string; secondary: string; accent: string }> = {
  default: { primary: "#06b6d4", secondary: "#4f46e5", accent: "#8b5cf6" },
  drilling: { primary: "#f59e0b", secondary: "#d97706", accent: "#fde68a" },
  production: { primary: "#10b981", secondary: "#059669", accent: "#a7f3d0" },
  "access-control": { primary: "#3b82f6", secondary: "#2563eb", accent: "#bfdbfe" },
  engineering: { primary: "#8b5cf6", secondary: "#7c3aed", accent: "#ddd6fe" },
  "control-room": { primary: "#ef4444", secondary: "#dc2626", accent: "#fecaca" },
  safety: { primary: "#f97316", secondary: "#ea580c", accent: "#fed7aa" },
  training: { primary: "#06b6d4", secondary: "#0891b2", accent: "#cffafe" },
  "satellite-monitoring": { primary: "#6366f1", secondary: "#4f46e5", accent: "#c7d2fe" },
};

export function FlowRibbons() {
  const ribbon1 = useRef<THREE.Mesh>(null);
  const ribbon2 = useRef<THREE.Mesh>(null);
  const ribbon3 = useRef<THREE.Mesh>(null);

  const activeSection = useNavigationState((state) => state.activeSection);
  const activeDepartment = useNavigationState((state) => state.activeDepartment);
  const scrollY = useNavigationState((state) => state.scrollY);

  const targetColors = COLOR_SCHEMES[activeDepartment || "default"];

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    
    // Smoothly interpolate colors
    if (ribbon1.current) {
      const mat = ribbon1.current.material as THREE.MeshStandardMaterial;
      mat.color.lerp(new THREE.Color(targetColors.primary), 0.05);
      mat.emissive.lerp(new THREE.Color(targetColors.primary), 0.05);
      
      ribbon1.current.rotation.x = Math.sin(time * 0.2) * 0.2;
      ribbon1.current.rotation.y = time * 0.1 + Math.min(scrollY * 0.0005, 1);
    }
    if (ribbon2.current) {
      const mat = ribbon2.current.material as THREE.MeshStandardMaterial;
      mat.color.lerp(new THREE.Color(targetColors.secondary), 0.05);
      mat.emissive.lerp(new THREE.Color(targetColors.secondary), 0.05);
      
      ribbon2.current.rotation.x = Math.cos(time * 0.15) * 0.2;
      ribbon2.current.rotation.y = -time * 0.08 - Math.min(scrollY * 0.0005, 1);
    }
    if (ribbon3.current) {
      const mat = ribbon3.current.material as THREE.MeshStandardMaterial;
      mat.color.lerp(new THREE.Color(targetColors.accent), 0.05);
      mat.emissive.lerp(new THREE.Color(targetColors.accent), 0.05);
      
      ribbon3.current.rotation.x = Math.sin(time * 0.25) * 0.1;
      ribbon3.current.rotation.z = time * 0.05 + Math.min(scrollY * 0.0002, 0.5);
    }
  });

  return (
    <group>
      {/* Ribbon 1 */}
      <mesh ref={ribbon1} position={[0, -2, -5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[20, 20, 64, 64]} />
        <MeshDistortMaterial
          distort={0.4}
          speed={2}
          transparent
          opacity={0.15}
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ribbon 2 */}
      <mesh ref={ribbon2} position={[2, 0, -8]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[25, 25, 64, 64]} />
        <MeshDistortMaterial
          distort={0.6}
          speed={1.5}
          transparent
          opacity={0.15}
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Ribbon 3 */}
      <mesh ref={ribbon3} position={[-2, 3, -10]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30, 64, 64]} />
        <MeshDistortMaterial
          distort={0.5}
          speed={2.5}
          transparent
          opacity={0.1}
          emissiveIntensity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
