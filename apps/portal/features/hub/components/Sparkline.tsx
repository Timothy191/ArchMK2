"use client";

import * as React from "react";
import { cn } from "@repo/ui/lib/utils";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (data.length < 2) return null;

  const id = React.useId();
  const gradId = `sparkGrad-${id}`;
  const glowId = `sparkGlow-${id}`;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const points = data.map((value, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  });

  const pathD = `M${points.join(" L")}`;
  const trend = data[data.length - 1]! - data[0]!;
  const strokeColor =
    trend > 0
      ? "var(--accent-green, #34d399)"
      : trend < 0
        ? "var(--accent-red, #f87171)"
        : "var(--text-muted, #9ca3af)";

  const endX = points[points.length - 1]?.split(",")[0] ?? "0";
  const endY = points[points.length - 1]?.split(",")[1] ?? "0";

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.2} />
          <stop offset="85%" stopColor={strokeColor} stopOpacity={0.8} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={1} />
        </linearGradient>
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy="0"
            stdDeviation="2"
            floodColor={strokeColor}
            floodOpacity={0.4}
          />
        </filter>
        <style>{`
          @keyframes spark-pulse-${id} {
            0%, 100% { r: 2; opacity: 0.9; }
            50% { r: 3.5; opacity: 0.4; }
          }
        `}</style>
      </defs>
      <path
        d={pathD}
        fill="none"
        stroke={`url(#${gradId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.9}
      />
      <g filter={`url(#${glowId})`}>
        <circle
          cx={endX}
          cy={endY}
          r={2}
          fill={strokeColor}
          opacity={0.9}
          style={{
            animation: `spark-pulse-${id} 2s ease-in-out infinite`,
            transformOrigin: `${endX}px ${endY}px`,
          }}
        />
      </g>
    </svg>
  );
}
