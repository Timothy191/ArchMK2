"use client";

import Link from "next/link";
import { AlertTriangle, Wrench, Activity } from "lucide-react";
import { AnimatedNumber } from "@repo/ui/AnimatedNumber";

interface UrgencyBarProps {
  incidents: number;
  breakdowns: number;
  offlineMachines: number;
}

export function UrgencyBar({
  incidents,
  breakdowns,
  offlineMachines,
}: UrgencyBarProps) {
  const hasIssues = incidents > 0 || breakdowns > 0 || offlineMachines > 0;

  if (!hasIssues) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-sm text-emerald-400 font-medium">
          All systems operational
        </p>
      </div>
    );
  }

  const items = [
    incidents > 0 && (
      <Link
        key="incidents"
        href="/safety/daily-log"
        className="flex items-center gap-2 text-sm text-[var(--accent-orange)] hover:text-[var(--accent-orange)]/80 hover:underline underline-offset-2 transition-colors font-medium"
      >
        <AlertTriangle className="w-4 h-4 shrink-0" />
        <span>
          <AnimatedNumber value={incidents} duration={0.4} /> open safety
          incident{incidents > 1 ? "s" : ""}
        </span>
      </Link>
    ),
    breakdowns > 0 && (
      <Link
        key="breakdowns"
        href="/engineering/breakdowns"
        className="flex items-center gap-2 text-sm text-[var(--accent-red)] hover:text-[var(--accent-red)]/80 hover:underline underline-offset-2 transition-colors font-medium"
      >
        <Wrench className="w-4 h-4 shrink-0" />
        <span>
          <AnimatedNumber value={breakdowns} duration={0.4} /> active breakdown
          {breakdowns > 1 ? "s" : ""}
        </span>
      </Link>
    ),
    offlineMachines > 0 && (
      <span
        key="offline"
        className="flex items-center gap-2 text-sm text-[var(--text-muted)]"
      >
        <Activity className="w-4 h-4 shrink-0" />
        <span>
          <AnimatedNumber value={offlineMachines} duration={0.4} /> machine
          {offlineMachines > 1 ? "s" : ""} offline
        </span>
      </span>
    ),
  ].filter(Boolean);

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)]/40 border border-[var(--border-default)]">
      {items.map((item, i) => (
        <span key={i} className="contents">
          {item}
          {i < items.length - 1 && (
            <span className="w-px h-4 bg-[var(--border-emphasis)] hidden sm:block" />
          )}
        </span>
      ))}
    </div>
  );
}
