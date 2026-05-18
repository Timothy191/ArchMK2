"use client";

import React, { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, Points, PointMaterial, MeshDistortMaterial } from "@react-three/drei";
import * as THREE from "three";

function Grid() {
  return (
    <gridHelper 
      args={[100, 50, "#1a1a1a", "#0d0d0d"]} 
      position={[0, -5, 0]} 
      rotation={[0, 0, 0]} 
    />
  );
}

function DataRibbons() {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      meshRef.current.rotation.z = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={meshRef}>
        <torusKnotGeometry args={[10, 0.05, 256, 32, 2, 3]} />
        <MeshDistortMaterial
          color="#3ecf8e"
          speed={2}
          distort={0.4}
          radius={1}
          emissive="#3ecf8e"
          emissiveIntensity={2}
        />
      </mesh>
    </Float>
  );
}

function Particles({ count = 2000 }) {
  const points = useMemo(() => {
    const p = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      p[i * 3] = (Math.random() - 0.5) * 100;
      p[i * 3 + 1] = (Math.random() - 0.5) * 100;
      p[i * 3 + 2] = (Math.random() - 0.5) * 100;
    }
    return p;
  }, [count]);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.getElapsedTime() * 0.02;
    }
  });

  return (
    <Points ref={pointsRef} positions={points} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#3ecf8e"
        size={0.1}
        sizeAttenuation={true}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </Points>
  );
}

export function DynamicBackgroundWrapper() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050508]">
      <Canvas
        camera={{ position: [0, 0, 20], fov: 75 }}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#050508"]} />
        <fog attach="fog" args={["#050508", 10, 50]} />
        
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#3ecf8e" />
        
        <Grid />
        <DataRibbons />
        <Particles />
      </Canvas>
      
      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#050508]/50 to-[#050508] pointer-events-none" />
    </div>
  );
}
