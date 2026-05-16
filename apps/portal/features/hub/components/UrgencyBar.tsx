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

  return (
    <div className="flex flex-wrap items-center gap-4 px-4 py-3 rounded-xl bg-[var(--bg-tertiary)]/40 border border-[var(--border-default)]">
      {incidents > 0 && (
        <Link
          href="/safety/daily-log"
          className="flex items-center gap-2 text-sm text-amber-400 hover:text-amber-300 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium">
            <AnimatedNumber value={incidents} duration={0.4} /> open safety
            incident{incidents > 1 ? "s" : ""}
          </span>
        </Link>
      )}
      {breakdowns > 0 && (
        <Link
          href="/engineering/breakdowns"
          className="flex items-center gap-2 text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          <Wrench className="w-4 h-4" />
          <span className="font-medium">
            <AnimatedNumber value={breakdowns} duration={0.4} /> active
            breakdown{breakdowns > 1 ? "s" : ""}
          </span>
        </Link>
      )}
      {offlineMachines > 0 && (
        <span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
          <Activity className="w-4 h-4" />
          <span>
            <AnimatedNumber value={offlineMachines} duration={0.4} /> machine
            {offlineMachines > 1 ? "s" : ""} offline
          </span>
        </span>
      )}
    </div>
  );
}
