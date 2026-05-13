"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";

interface DashboardHubProps {
  onDepartmentClick: (dept: string) => void;
}

const DEPARTMENTS: Array<{
  id: string;
  name: string;
  color: string;
  metrics: Record<string, string | number>;
  position: [number, number, number];
}> = [
  { id: "drilling", name: "Drilling", color: "#3ecf8e", metrics: { active: 3, status: "Operational" }, position: [-5, 2, 0] },
  { id: "production", name: "Production", color: "#00c573", metrics: { output: "2,450 BCM", status: "Active" }, position: [5, 2, 0] },
  { id: "safety", name: "Safety", color: "#10b981", metrics: { score: "9.2/10", incidents: 0 }, position: [-5, -2, 0] },
  { id: "engineering", name: "Engineering", color: "#3b82f6", metrics: { projects: 5, status: "On Track" }, position: [5, -2, 0] },
  { id: "control-room", name: "Control Room", color: "#8b5cf6", metrics: { systems: "All Online", alerts: 2 }, position: [0, 3, -3] },
  { id: "access-control", name: "Access Control", color: "#f59e0b", metrics: { active: 47, breaches: 0 }, position: [0, -3, -3] },
  { id: "training", name: "Training", color: "#ec4899", metrics: { scheduled: 12, completed: 8 }, position: [0, 0, 5] },
];

function DepartmentCard({
  dept,
  onClick,
}: {
  dept: (typeof DEPARTMENTS)[0];
  onClick: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (meshRef.current && dept.position) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(state.clock.elapsedTime + dept.position[0]) * 0.1;
    }
    if (glowRef.current) {
      // Pulsing glow
      const scale = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.05;
      glowRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={dept.position}>
      {/* Card background glow */}
      <mesh ref={glowRef}>
        <planeGeometry args={[3.2, 2.2]} />
        <meshBasicMaterial
          color={dept.color}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* HTML Content */}
      <Html
        transform
        occlude
        position={[0, 0, 0.1]}
        style={{
          width: "280px",
          height: "180px",
        }}
      >
        <div
          onClick={onClick}
          className="w-full h-full p-4 rounded-xl border backdrop-blur-md cursor-pointer
                     bg-[#0f0f0f]/90 border-[#363636] hover:border-[#3ecf8e]/50
                     hover:bg-[#1a1a1a]/90 transition-all duration-300
                     flex flex-col"
          style={{ borderLeft: `4px solid ${dept.color}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-medium text-[#fafafa]">{dept.name}</h3>
            <div
              className="w-3 h-3 rounded-full animate-pulse"
              style={{ backgroundColor: dept.color }}
            />
          </div>

          <div className="flex-1 space-y-2">
            {Object.entries(dept.metrics).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="text-[#898989] capitalize">
                  {key.replace(/_/g, " ")}:
                </span>
                <span className="text-[#fafafa] font-medium">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t border-[#363636]">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#898989]">Click to open</span>
              <svg
                className="w-4 h-4 text-[#3ecf8e]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        </div>
      </Html>

      {/* Connecting line to center */}
      <line>
        <bufferGeometry>
          {dept.position && (
            <bufferAttribute
              attach="attributes-position"
              args={[new Float32Array([0, 0, 0, -dept.position[0] * 0.3, -dept.position[1] * 0.3, -dept.position[2] * 0.3]), 3]}
            />
          )}
        </bufferGeometry>
        <lineBasicMaterial color={dept.color} transparent opacity={0.2} />
      </line>

      {/* Hover glow effect */}
      <mesh position={[0, 0, -0.1]}>
        <planeGeometry args={[3, 1.8]} />
        <meshBasicMaterial
          color={dept.color}
          transparent
          opacity={0.05}
        />
      </mesh>
    </group>
  );
}

export function DashboardHub({ onDepartmentClick }: DashboardHubProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (groupRef.current) {
      // Slow rotation of the entire hub
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.1) * 0.1;
    }
  });

  // Create connection lines between departments
  const connectionLines = useMemo(() => {
    const lines: { start: THREE.Vector3; end: THREE.Vector3; color: string }[] = [];
    
    for (let i = 0; i < DEPARTMENTS.length; i++) {
      for (let j = i + 1; j < DEPARTMENTS.length; j++) {
        const pos1 = DEPARTMENTS[i]?.position;
        const pos2 = DEPARTMENTS[j]?.position;
        if (pos1 && pos2) {
          const start = new THREE.Vector3(...pos1);
          const end = new THREE.Vector3(...pos2);
          lines.push({
            start,
            end,
            color: "#3ecf8e",
          });
        }
      }
    }
    
    return lines;
  }, []);

  return (
    <group ref={groupRef}>
      {/* Connection lines between departments */}
      {connectionLines.map((line, index) => (
        <ConnectionLine
          key={index}
          start={line.start}
          end={line.end}
          color={line.color}
        />
      ))}

      {/* Department cards */}
      {DEPARTMENTS.map((dept) => (
        <DepartmentCard
          key={dept.id}
          dept={dept}
          onClick={() => onDepartmentClick(dept.id)}
        />
      ))}

      {/* Central hub indicator */}
      <mesh>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#3ecf8e" transparent opacity={0.5} />
      </mesh>

      {/* Central glow */}
      <mesh scale={[2, 2, 2]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshBasicMaterial color="#3ecf8e" transparent opacity={0.1} />
      </mesh>
    </group>
  );
}

function ConnectionLine({
  start,
  end,
  color,
}: {
  start: THREE.Vector3;
  end: THREE.Vector3;
  color: string;
}) {
  const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const points = [start, mid, end];
  
  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flatMap((p) => [p.x, p.y, p.z])), 3]}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.1} />
    </line>
  );
}
