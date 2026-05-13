"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";

interface HolographicAIProps {
  position: [number, number, number];
  expanded: boolean;
  onClick: () => void;
}

export function HolographicAI({ position, expanded, onClick }: HolographicAIProps) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const ring1Ref = useRef<THREE.Mesh>(null);
  const ring2Ref = useRef<THREE.Mesh>(null);
  const ring3Ref = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const time = state.clock.elapsedTime;

    // Core pulsing
    if (coreRef.current) {
      const scale = 1 + Math.sin(time * 2) * 0.1;
      coreRef.current.scale.setScalar(scale);
    }

    // Rings rotation
    if (ring1Ref.current) {
      ring1Ref.current.rotation.x = time * 0.5;
      ring1Ref.current.rotation.y = time * 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.x = time * 0.3;
      ring2Ref.current.rotation.z = time * 0.5;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = time * 0.4;
      ring3Ref.current.rotation.z = time * 0.2;
    }

    // Floating animation
    if (groupRef.current) {
      groupRef.current.position.y = position[1] + Math.sin(time) * 0.2;
    }
  });

  const hologramMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#3ecf8e",
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
      }),
    []
  );

  const glowMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: "#00c573",
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      }),
    []
  );

  return (
    <Float
      speed={2}
      rotationIntensity={0.2}
      floatIntensity={0.5}
    >
      <group
        ref={groupRef}
        position={position}
        onClick={onClick}
      >
        {/* Central Core */}
        <mesh ref={coreRef}>
          <icosahedronGeometry args={[0.5, 1]} />
          <meshBasicMaterial
            color="#3ecf8e"
            transparent
            opacity={0.9}
            wireframe
          />
        </mesh>

        {/* Inner Glow */}
        <mesh scale={[0.7, 0.7, 0.7]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <primitive object={hologramMaterial} />
        </mesh>

        {/* Outer Glow */}
        <mesh scale={[1.2, 1.2, 1.2]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <primitive object={glowMaterial} />
        </mesh>

        {/* Rotating Rings */}
        <mesh ref={ring1Ref}>
          <torusGeometry args={[1.2, 0.02, 8, 64]} />
          <meshBasicMaterial color="#3ecf8e" transparent opacity={0.6} />
        </mesh>

        <mesh ref={ring2Ref}>
          <torusGeometry args={[1.5, 0.015, 8, 64]} />
          <meshBasicMaterial color="#00c573" transparent opacity={0.4} />
        </mesh>

        <mesh ref={ring3Ref}>
          <torusGeometry args={[1.8, 0.01, 8, 64]} />
          <meshBasicMaterial color="#3ecf8e" transparent opacity={0.3} />
        </mesh>

        {/* Data particles orbiting */}
        <OrbitingParticles />

        {/* Label */}
        <Html
          position={[0, -2.5, 0]}
          center
          distanceFactor={8}
          style={{
            pointerEvents: "none",
            userSelect: "none",
          }}
        >
          <div
            onClick={onClick}
            className={`
              px-3 py-2 rounded-xl backdrop-blur-md cursor-pointer
              border border-[#3ecf8e]/50 bg-[#0f0f0f]/80
              hover:bg-[#3ecf8e]/20 transition-all duration-300
              ${expanded ? "scale-110" : "scale-100"}
            `}
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#3ecf8e] animate-pulse" />
              <span className="text-sm font-medium text-[#fafafa]">
                {expanded ? "AI Assistant Active" : "Click to Talk"}
              </span>
            </div>
            {!expanded && (
              <p className="text-xs text-[#898989] mt-1">
                Ask about operations, safety, equipment
              </p>
            )}
          </div>
        </Html>

        {/* Expanded visual indicator */}
        {expanded && (
          <mesh>
            <sphereGeometry args={[2.5, 32, 32]} />
            <meshBasicMaterial
              color="#3ecf8e"
              transparent
              opacity={0.05}
              side={THREE.BackSide}
            />
          </mesh>
        )}

        {/* Sound wave visualization when active */}
        {expanded && <SoundWaves />}
      </group>
    </Float>
  );
}

function OrbitingParticles() {
  const count = 20;
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 2 + Math.random() * 0.5;
      pos[i * 3] = Math.cos(angle) * radius;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
      pos[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return pos;
  }, []);

  const pointsRef = useRef<THREE.Points>(null);

  useFrame((state) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#3ecf8e"
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  );
}

function SoundWaves() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const mesh = child as THREE.Mesh;
        const scale = 1 + Math.sin(state.clock.elapsedTime * 3 + i * 0.5) * 0.2;
        mesh.scale.setScalar(scale);
        const material = mesh.material as THREE.MeshBasicMaterial;
        material.opacity = 0.3 - i * 0.1;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2 + i * 0.3, 2 + i * 0.3 + 0.05, 64]} />
          <meshBasicMaterial
            color="#3ecf8e"
            transparent
            opacity={0.3 - i * 0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      ))}
    </group>
  );
}
