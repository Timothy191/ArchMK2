"use client";

import { useEffect, useState } from "react";

export function GlobalBackground() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Background video - auto plays, muted, looped */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/arch_arcane_loop.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Animated gradient overlay */}
      <div
        className="absolute inset-0 opacity-40 animate-gradient-shift"
        style={{
          background: "linear-gradient(135deg, rgba(0, 212, 170, 0.1) 0%, transparent 40%, rgba(99, 102, 241, 0.05) 100%)",
        }}
      />

      {/* Subtle pulse glow from the logo area */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-10 animate-pulse-glow"
        style={{
          background: "radial-gradient(circle, rgba(0, 212, 170, 0.2) 0%, transparent 70%)",
          filter: "blur(100px)",
        }}
      />

      {/* Vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%)",
        }}
      />
    </div>
  );
}
