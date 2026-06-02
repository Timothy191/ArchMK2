"use client";

import React from "react";
import { useSystemMetrics } from "@/hooks/useSystemMetrics";
import { useSplitWindow } from "@/hooks/useSplitWindow";
import { cn } from "@repo/ui/lib/utils";
import { Clock, Wifi, WifiOff, Activity } from "lucide-react";

interface ViewportBoundariesProps {
  className?: string;
}

/**
 * ViewportBoundaries
 *
 * Layout component that positions system status displays at the viewport edges
 * using pointer-events-none wrapper to prevent overlapping or blocking main workspace layouts.
 * Automatically shifts bottom right widgets to avoid overlapping persistent split-pane windows.
 */
export function ViewportBoundaries({ className }: ViewportBoundariesProps) {
  const { websocketLatency, serverTimeSAST, currentShift, online } =
    useSystemMetrics();
  const splitWindowOpen = useSplitWindow((s) => s.isOpen);

  return (
    <div
      className={cn(
        "fixed inset-0 pointer-events-none z-40 flex flex-col justify-between p-3 select-none",
        className,
      )}
    >
      {/* Top boundary space (Menu bar is at top-0 z-50, we leave this transparent) */}
      <div className="w-full flex justify-between pointer-events-none" />

      {/* Middle boundary space (Left and Right edges reserved for future tools/panels) */}
      <div className="flex-1 w-full flex justify-between items-center pointer-events-none">
        <div className="flex flex-col gap-2 items-start pointer-events-auto" />
        <div className="flex flex-col gap-2 items-end pointer-events-auto" />
      </div>

      {/* Bottom boundary container */}
      <div className="w-full flex flex-col sm:flex-row justify-between items-stretch sm:items-end gap-2 pointer-events-none">
        {/* Bottom Left Panel: Current Operational Shift & Time */}
        <div
          data-testid="shift-hud"
          className={cn(
            "pointer-events-auto",
            "liquid-glass-light border border-white/40 shadow-window rounded-xl px-3 py-2",
            "hidden md:flex items-center gap-3 text-xs transition-all duration-300 ease-glass",
          )}
        >
          <div className="flex items-center gap-1.5 text-[var(--text-heading)] font-semibold">
            <Clock className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span className="tabular-nums">{serverTimeSAST}</span>
            <span className="text-[10px] text-[var(--text-secondary)] opacity-60 font-medium">
              SAST
            </span>
          </div>

          <div className="h-3 w-px bg-black/[0.08] hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[var(--text-secondary)] font-medium">
              {currentShift.label}
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] opacity-60 font-medium">
              ({currentShift.start}-{currentShift.end})
            </span>
          </div>
        </div>

        {/* Bottom Right Panel: Latency HUD */}
        {/* Automatically shifts to the left when the Split Window layout is open to avoid overlap */}
        <div
          data-testid="latency-hud"
          className={cn(
            "pointer-events-auto",
            "liquid-glass-light border border-white/40 shadow-window rounded-xl px-3 py-2",
            "hidden md:flex items-center gap-3 text-xs",
            "transition-all duration-300 ease-glass transform",
            splitWindowOpen
              ? "translate-y-0 sm:-translate-x-[400px] md:-translate-x-[450px]"
              : "translate-y-0 translate-x-0",
          )}
        >
          <div className="flex items-center gap-1.5">
            {online ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="font-semibold text-[var(--text-heading)]">
              {online ? "Connected" : "Offline"}
            </span>
          </div>

          <div className="h-3 w-px bg-black/[0.08] hidden sm:block" />

          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            <span className="text-[var(--text-secondary)] font-medium tabular-nums">
              {websocketLatency} ms
            </span>
            <span className="text-[10px] text-[var(--text-secondary)] opacity-60 font-medium">
              RTT
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewportBoundaries;
