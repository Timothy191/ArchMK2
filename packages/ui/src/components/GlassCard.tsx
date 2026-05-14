"use client";

import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
  accent?: "green" | "blue" | "amber" | "red" | "none";
}

const ACCENT_COLORS = {
  green: "hover:border-[#3ecf8e]/50 hover:shadow-[0_0_20px_rgba(62,207,142,0.1)]",
  blue: "hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]",
  amber: "hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(245,158,11,0.1)]",
  red: "hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]",
  none: "hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
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
        "relative group rounded-2xl border border-white/5 bg-[#121212]/40 backdrop-blur-xl p-6 overflow-hidden",
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
