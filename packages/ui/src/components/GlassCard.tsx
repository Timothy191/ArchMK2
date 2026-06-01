"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { cn } from "../lib/utils";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  HTMLMotionProps,
} from "framer-motion";

export interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?:
    | "green"
    | "blue"
    | "red"
    | "cyan"
    | "indigo"
    | "violet"
    | "alert"
    | "none";
  variant?: "default" | "window" | "spotlight" | "glowborder";
  title?: string;
  padding?: boolean;

  // Spotlight variant props
  spotlightColor?: string;

  // GlowBorder variant props
  animationDuration?: number;
  gradientColors?: string[];
  colorPreset?: "nature" | "ocean" | "sunset" | "aurora" | "custom";
  paused?: boolean;
}

const ACCENT_COLORS = {
  green: "hover:border-[var(--accent-green)]/40 hover:shadow-card-hover",
  blue: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",
  red: "hover:border-[var(--accent-red)]/40 hover:shadow-card-hover",
  cyan: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",
  indigo: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",
  violet: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",
  alert: "hover:border-[var(--accent-red)]/40 hover:shadow-card-hover",
  none: "hover:border-black/[0.12] hover:shadow-card-hover",
};

const colorPresets: Record<string, string[]> = {
  nature: [
    "#669900",
    "#88bb22",
    "#99cc33",
    "#aaddaa",
    "#ccee66",
    "#006699",
    "#228888",
    "#3399cc",
    "#55aacc",
    "#669900",
  ],
  ocean: [
    "#006699",
    "#1177aa",
    "#2288bb",
    "#3399cc",
    "#44aadd",
    "#55bbee",
    "#66ccff",
    "#44bbee",
    "#2299cc",
    "#006699",
  ],
  sunset: [
    "#ff6600",
    "#ff7711",
    "#ff8822",
    "#ff9900",
    "#ffaa22",
    "#ffbb44",
    "#ffcc00",
    "#ff9933",
    "#ff7722",
    "#ff6600",
  ],
  aurora: [
    "#00ff87",
    "#22ffaa",
    "#44ffcc",
    "#60efff",
    "#88ddff",
    "#bb99ff",
    "#dd77ee",
    "#ff68f0",
    "#ff55cc",
    "#00ff87",
  ],
  custom: [
    "var(--accent-cyan)",
    "var(--accent-indigo)",
    "var(--accent-violet)",
    "var(--accent-cyan)",
    "var(--accent-blue)",
    "var(--accent-indigo)",
    "var(--accent-violet)",
    "var(--accent-cyan)",
    "var(--accent-blue)",
    "var(--accent-indigo)",
  ],
};

function MacTrafficLights() {
  return (
    <div className="flex items-center gap-1.5 shrink-0">
      <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-black/[0.06] group-hover/window:opacity-100 opacity-70 transition-opacity" />
      <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-black/[0.06] group-hover/window:opacity-100 opacity-70 transition-opacity" />
      <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-black/[0.06] group-hover/window:opacity-100 opacity-70 transition-opacity" />
    </div>
  );
}

export function GlassCard({
  children,
  className,
  hover,
  onClick,
  accent = "none",
  variant = "default",
  title,
  padding = true,

  // Spotlight
  spotlightColor = "rgba(62, 207, 142, 0.1)",

  // GlowBorder
  animationDuration = 4,
  gradientColors,
  colorPreset = "custom",
  paused = false,

  ...props
}: GlassCardProps) {
  const isWindow = variant === "window";
  const isSpotlight = variant === "spotlight";
  const isGlowBorder = variant === "glowborder";

  const prefersReduced = useReducedMotion();
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch(
      typeof window !== "undefined" &&
        ("ontouchstart" in window || navigator.maxTouchPoints > 0),
    );
  }, []);

  // Spotlight mouse tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const spotlightBg = useMotionTemplate`
    radial-gradient(
      400px circle at ${mouseX}px ${mouseY}px,
      ${spotlightColor},
      transparent 80%
    )
  `;

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (prefersReduced || isTouch || !isSpotlight) return;
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    },
    [prefersReduced, isTouch, isSpotlight, mouseX, mouseY],
  );

  // GlowBorder colors setup
  const glowColors =
    gradientColors ??
    (colorPresets[colorPreset] as string[]) ??
    colorPresets.custom;

  // Let's determine if glow animation should be paused
  const isGlowPaused = paused || prefersReduced;

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.004 } : undefined}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      onMouseMove={isSpotlight ? handleMouseMove : undefined}
      className={cn(
        // Base classes
        "relative overflow-hidden transition-all duration-300 ease-out",

        // Window & Default share standard glass style
        (variant === "default" || variant === "window") && [
          "group/window rounded-xl border border-black/[0.08] bg-white/85 backdrop-blur-3xl saturate-[180%]",
          "shadow-card animate-window-open glass-top-border",
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]",
          hover && ACCENT_COLORS[accent],
        ],

        // Spotlight custom layout style
        variant === "spotlight" && [
          "group rounded-2xl border border-[var(--glass-border)] border-t-white/95 bg-[var(--bg-tertiary)]/55 backdrop-blur-xl saturate-[160%]",
          "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.6)]",
        ],

        // GlowBorder custom layout style
        variant === "glowborder" && [
          "isolate",
          "bg-[var(--bg-secondary)]/80 backdrop-blur-2xl saturate-[180%] border border-[var(--glass-border)] border-t-white/95",
        ],

        hover && "cursor-pointer",
        variant === "default" && padding && "p-6",
        className,
      )}
      style={
        variant === "glowborder"
          ? ({
              "--glow-animation-duration": `${animationDuration}s`,
              ...props.style,
            } as React.CSSProperties)
          : props.style
      }
      {...props}
    >
      {/* GlowBorder outer background spinner */}
      {isGlowBorder && (
        <div
          className={cn(
            "absolute inset-[-2px] -z-10 rounded-[inherit]",
            !isGlowPaused &&
              "animate-[glow-spin_var(--glow-animation-duration)_linear_infinite]",
          )}
          style={{
            background: `conic-gradient(from 0deg, ${glowColors.join(", ")})`,
            filter: "blur(8px)",
            opacity: 0.7,
          }}
        />
      )}

      {/* GlowBorder inner mask to simulate border */}
      {isGlowBorder && (
        <div className="absolute inset-[1px] -z-[5] rounded-[inherit] bg-[var(--bg-secondary)]" />
      )}

      {/* macOS window title bar */}
      {isWindow && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] bg-white/60 backdrop-blur-md">
          <MacTrafficLights />
          {title && (
            <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
              {title}
            </span>
          )}
        </div>
      )}

      {/* Spotlight dynamic mouse overlay */}
      {isSpotlight && !prefersReduced && !isTouch && (
        <motion.div
          className="pointer-events-none absolute -inset-px rounded-[inherit] opacity-0 transition duration-300 group-hover:opacity-100"
          style={{ background: spotlightBg }}
        />
      )}

      {/* Ambient glass shimmer */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none rounded-[inherit] z-[1] motion-reduce:hidden"
        aria-hidden="true"
      >
        <div
          className="absolute inset-0 will-change-transform"
          style={{
            background: `linear-gradient(
              105deg,
              transparent 30%,
              rgba(255, 255, 255, 0.12) 45%,
              rgba(210, 210, 215, 0.08) 50%,
              rgba(255, 255, 255, 0.12) 55%,
              transparent 70%
            )`,
            transform: "translateX(-100%) skewX(-12deg)",
            animation:
              "glass-shimmer-ambient 12s ease-in-out infinite var(--shimmer-delay, 0s)",
          }}
        />
      </div>

      {/* Hover-only light sweep */}
      {hover && (variant === "default" || variant === "window") && (
        <div className="absolute inset-0 translate-x-[-100%] group-hover/window:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      )}

      {/* Dynamic border highlight facing light source on hover */}
      {hover && (variant === "default" || variant === "window") && (
        <div className="absolute inset-0 rounded-[inherit] pointer-events-none opacity-0 group-hover/window:opacity-100 transition-opacity duration-500">
          <div
            className="absolute inset-0 rounded-[inherit]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.5) 0%, transparent 40%, transparent 60%, rgba(210,210,215,0.2) 100%)",
            }}
          />
        </div>
      )}

      {/* Content wrapper */}
      <div
        className={cn(
          "relative z-10 w-full h-full",
          isWindow && padding && "p-6",
        )}
      >
        {children}
      </div>
    </motion.div>
  );
}
