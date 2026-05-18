"use client";

import { useEffect, useState, useMemo } from "react";
import { usePathname } from "next/navigation";
import { DEPARTMENTS } from "~/lib/departments";

const COLOR_MAP: Record<string, string> = {
  amber: "rgba(245, 158, 11, 0.25)",
  emerald: "rgba(16, 185, 129, 0.25)",
  blue: "rgba(59, 130, 246, 0.25)",
  violet: "rgba(139, 92, 246, 0.25)",
  red: "rgba(239, 68, 68, 0.25)",
  orange: "rgba(249, 115, 22, 0.25)",
  cyan: "rgba(6, 182, 212, 0.25)",
  indigo: "rgba(79, 70, 229, 0.25)",
  default: "rgba(0, 212, 170, 0.2)",
};

export function GlobalBackground() {
  const [isMounted, setIsMounted] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mouseMoved, setMouseMoved] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      setMouseMoved(true);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const activeColor = useMemo(() => {
    const deptName = pathname.split("/")[1];
    const dept = DEPARTMENTS.find((d) => d.name === deptName);
    const colorKey = dept?.color || "default";
    return (COLOR_MAP[colorKey] || COLOR_MAP["default"]) as string;
  }, [pathname]);

  if (!isMounted) return null;

  const isHub = pathname === "/";
  if (isHub) {
    return (
      <div 
        className="fixed inset-0 -z-10 overflow-hidden pointer-events-none"
        style={{
          background: "linear-gradient(180deg, #f5f5f7 0%, #e8e8ed 100%)",
        }}
      >
        {/* Subtle noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Light gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg-primary)] to-[var(--bg-secondary)]" />

      {/* Subtle animated glow - reduced intensity */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none blur-[100px] opacity-15 transition-all duration-500 ease-out left-0 top-0"
        style={{
          background: `radial-gradient(circle, ${activeColor.replace("0.25", "0.3")} 0%, transparent 70%)`,
          transform: `translate3d(${mousePos.x - 300}px, ${mousePos.y - 300}px, 0)`,
        }}
      />

      {/* Minimal particles for light theme */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: `${Math.random() * 3 + 1}px`,
              height: `${Math.random() * 3 + 1}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: activeColor.replace("0.25", "0.4"),
              opacity: 0.15 + Math.random() * 0.2,
            }}
          />
        ))}
      </div>
    </div>
  );
}
