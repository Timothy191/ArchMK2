"use client";

import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?: "green" | "blue" | "amber" | "red" | "cyan" | "indigo" | "violet" | "alert" | "none";
  variant?: "default" | "window";
  title?: string;
  padding?: boolean;
}

const ACCENT_COLORS = {
  green: "hover:border-[var(--accent-green)]/40 hover:shadow-card-hover",
  blue: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",
  amber: "hover:border-[var(--accent-amber)]/40 hover:shadow-card-hover",
  red: "hover:border-[var(--accent-red)]/40 hover:shadow-card-hover",
  cyan: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",    // --accent-cyan deprecated → --accent-blue
  indigo: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",  // --accent-indigo deprecated → --accent-blue
  violet: "hover:border-[var(--accent-blue)]/40 hover:shadow-card-hover",  // --accent-violet deprecated → --accent-blue
  alert: "hover:border-[var(--accent-red)]/40 hover:shadow-card-hover",    // --accent-alert deprecated → --accent-red
  none: "hover:border-black/[0.12] hover:shadow-card-hover",
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
}: GlassCardProps) {
  const isWindow = variant === "window";

  return (
    <motion.div
      whileHover={hover ? { y: -2, scale: 1.004 } : undefined}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
      className={cn(
        "relative group/window rounded-xl border border-black/[0.08] bg-white/70 backdrop-blur-2xl overflow-hidden",
        "shadow-card transition-all duration-300 ease-out",
        "animate-window-open glass-top-border",
        hover && "cursor-pointer",
        hover && ACCENT_COLORS[accent],
        !isWindow && padding && "p-6",
        className
      )}
    >
      {/* macOS window title bar */}
      {isWindow && (
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] bg-white/50 backdrop-blur-sm">
          <MacTrafficLights />
          {title && (
            <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
              {title}
            </span>
          )}
        </div>
      )}

      {/* Light shimmer on hover */}
      {hover && (
        <div className="absolute inset-0 translate-x-[-100%] group-hover/window:translate-x-[100%] transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />
      )}

      <div className={cn("relative z-10", isWindow && padding && "p-6")}>{children}</div>
    </motion.div>
  );
}