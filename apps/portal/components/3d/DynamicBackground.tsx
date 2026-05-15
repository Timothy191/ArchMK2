'use client';

import { Suspense, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Preload } from '@react-three/drei';
import * as THREE from 'three';
import { FlowRibbons } from './FlowRibbons';
import { ParticleSystem } from './ParticleSystem';
import { useNavigationState } from '../../hooks/useNavigationState';

function CameraController() {
  const { camera } = useThree();
  const activeSection = useNavigationState((state) => state.activeSection);
  const scrollY = useNavigationState((state) => state.scrollY);
  const hoveredElement = useNavigationState((state) => state.hoveredElement);

  useFrame(() => {
    // Base camera positions
    const targetZ = activeSection === 'content' ? 8 : 10;
    const targetY = activeSection === 'content' ? -2 : 0;
    
    // Add scroll parallax
    const scrollOffset = scrollY * 0.005;

    // Add gentle hover offset
    const hoverOffsetX = hoveredElement ? 0.5 : 0;
    const hoverOffsetY = hoveredElement ? -0.2 : 0;

    // Smoothly interpolate camera position
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, hoverOffsetX, 0.02);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY - scrollOffset + hoverOffsetY, 0.02);
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, 0.02);
    
    // Smoothly interpolate lookAt
    camera.lookAt(0, -scrollOffset * 0.5, 0);
  });

  return null;
}

export function DynamicBackground() {
  // Listen to window scroll to update navigation state
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      useNavigationState.getState().setScrollY(scrollY);
      
      // Rough heuristic for section change
      if (scrollY > 300) {
        useNavigationState.getState().setActiveSection('content');
      } else {
        useNavigationState.getState().setActiveSection('function');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="fixed inset-0 z-0 pointer-events-none bg-[#020617]">
      {/* Fallback gradient for very deep background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#020617] opacity-80" />
      
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 2]} // Optimize for performance and quality
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <color attach="background" args={['#020617']} />
          <fog attach="fog" args={['#020617', 5, 20]} />
          
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 10, 5]} intensity={1} color="#38bdf8" />
          <directionalLight position={[-10, -10, -5]} intensity={0.5} color="#818cf8" />
          
          <FlowRibbons />
          <ParticleSystem />
          
          <CameraController />
          <Environment preset="night" />
          <Preload all />
        </Suspense>
      </Canvas>

      {/* Overlay vignette to blend edges */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#020617_100%)] opacity-60" />
    </div>
  );
}
