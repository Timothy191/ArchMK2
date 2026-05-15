"use client";

import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?: "green" | "blue" | "amber" | "red" | "cyan" | "indigo" | "violet" | "alert" | "none";
}

const ACCENT_COLORS = {
  green: "hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(52,211,153,0.1)]",
  blue: "hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  amber: "hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
  red: "hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  cyan: "hover:border-[var(--accent-cyan)]/50 hover:shadow-[0_0_20px_rgba(0,212,170,0.1)]",
  indigo: "hover:border-[var(--accent-indigo)]/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.1)]",
  violet: "hover:border-[var(--accent-violet)]/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]",
  alert: "hover:border-[var(--accent-alert)]/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]",
  none: "hover:border-[var(--border-subtle)] hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
};

export function GlassCard({
  children,
  className,
  hover,
  onClick,
  accent = "none",
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        "relative group rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]/40 backdrop-blur-xl p-6 overflow-hidden",
        "transition-all duration-500 ease-out",
        hover && "cursor-pointer",
        hover && ACCENT_COLORS[accent],
        className
      )}
    >
      {/* Light sweep effect */}
      {hover && (
        <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />
      )}

      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}