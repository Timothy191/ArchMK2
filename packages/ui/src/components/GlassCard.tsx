"use client";

import { cn } from "../lib/utils";
import { motion } from "framer-motion";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className,
  hover,
  onClick,
}: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { scale: 1.02, y: -4 } : undefined}
      onClick={onClick}
      className={cn(
        "rounded-2xl border border-[#363636] bg-[#242424] p-6",
        hover &&
          "cursor-pointer hover:border-[#393939] hover:bg-[#2e2e2e] transition-all duration-300",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
