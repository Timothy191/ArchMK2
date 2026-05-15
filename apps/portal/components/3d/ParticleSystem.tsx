'use client';

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useNavigationState } from '../../hooks/useNavigationState';

export function ParticleSystem() {
  const sparklesRef = useRef<any>(null);
  const activeSection = useNavigationState((state) => state.activeSection);

  useFrame((state) => {
    if (sparklesRef.current) {
      // Rotate particles slowly
      sparklesRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      
      // Shift particles slightly based on section
      const targetY = activeSection === 'content' ? 2 : 0;
      sparklesRef.current.position.y = THREE.MathUtils.lerp(
        sparklesRef.current.position.y,
        targetY,
        0.05
      );
    }
  });

  return (
    <group ref={sparklesRef}>
      <Sparkles
        count={200}
        scale={20}
        size={3}
        speed={0.4}
        opacity={0.3}
        color="#a5b4fc" // Soft indigo/blue
        noise={1}
      />
      <Sparkles
        count={100}
        scale={25}
        size={5}
        speed={0.2}
        opacity={0.15}
        color="#67e8f9" // Cyan tint
        noise={2}
      />
    </group>
  );
}
