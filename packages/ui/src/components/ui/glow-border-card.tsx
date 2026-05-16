"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

export interface GlowBorderCardProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  aspectRatio?: string;
  borderRadius?: string;
  animationDuration?: number;
  gradientColors?: string[];
  colorPreset?: "nature" | "ocean" | "sunset" | "aurora" | "custom";
  paused?: boolean;
}

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

export const GlowBorderCard = React.forwardRef<
  HTMLDivElement,
  GlowBorderCardProps
>(
  (
    {
      children,
      className,
      aspectRatio = "auto",
      borderRadius = "1rem",
      animationDuration = 4,
      gradientColors,
      colorPreset = "custom",
      paused = false,
      style,
      ...props
    },
    ref,
  ) => {
    const colors: string[] =
      gradientColors ??
      (colorPresets[colorPreset] as string[]) ??
      colorPresets.custom;

    const colorVars: Record<string, string> = {};
    for (let i = 0; i < 10; i++) {
      colorVars[`--glow-color-${i + 1}`] = colors[i % colors.length]!;
    }

    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-hidden isolate",
          "bg-[var(--bg-secondary)]/60 backdrop-blur-md",
          className,
        )}
        style={
          {
            aspectRatio: aspectRatio === "auto" ? undefined : aspectRatio,
            borderRadius: borderRadius,
            "--glow-animation-duration": `${animationDuration}s`,
            ...colorVars,
            ...style,
          } as React.CSSProperties
        }
        {...props}
      >
        {/* Rotating conic gradient border */}
        <div
          className={cn(
            "absolute inset-[-2px] -z-10 rounded-[inherit]",
            "animate-[glow-spin_var(--glow-animation-duration)_linear_infinite]",
            paused && "[animation-play-state:paused]",
          )}
          style={{
            background: `conic-gradient(from 0deg, ${colors.join(", ")})`,
            filter: "blur(8px)",
            opacity: 0.7,
          }}
        />

        {/* Inner mask to create border effect */}
        <div className="absolute inset-[1px] -z-[5] rounded-[inherit] bg-[var(--bg-secondary)]" />

        {/* Content */}
        <div className="relative z-10 w-full h-full">{children}</div>
      </div>
    );
  },
);

GlowBorderCard.displayName = "GlowBorderCard";
