"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckSquare,
  FileText,
  Calendar,
  Calculator,
  StickyNote,
  Factory,
  ArrowUpRight,
} from "lucide-react";
import { SpotlightCard } from "@repo/ui/SpotlightCard";
import { cn } from "@repo/ui/lib/utils";
import { useNavigationState } from "../../../hooks/useNavigationState";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  FileText,
  Calendar,
  Calculator,
  StickyNote,
};

const COLOR_MAP: Record<string, { bg: string; glow: string }> = {
  amber: { bg: "border-amber-500/20 text-amber-400 bg-amber-500/5", glow: "rgba(245, 158, 11, 0.15)" },
  emerald: { bg: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5", glow: "rgba(16, 185, 129, 0.15)" },
  blue: { bg: "border-blue-500/20 text-blue-400 bg-blue-500/5", glow: "rgba(59, 130, 246, 0.15)" },
  violet: { bg: "border-violet-500/20 text-violet-400 bg-violet-500/5", glow: "rgba(139, 92, 246, 0.15)" },
  red: { bg: "border-red-500/20 text-red-400 bg-red-500/5", glow: "rgba(239, 68, 68, 0.15)" },
  orange: { bg: "border-orange-500/20 text-orange-400 bg-orange-500/5", glow: "rgba(249, 115, 22, 0.15)" },
  cyan: { bg: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5", glow: "rgba(6, 182, 212, 0.15)" },
  indigo: { bg: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5", glow: "rgba(79, 70, 229, 0.15)" },
};

interface ToolCardProps {
  tool: {
    name: string;
    displayName: string;
    icon: string;
    description: string;
    color: string;
  };
  index: number;
}

export function ToolCard({ tool, index }: ToolCardProps) {
  const Icon = ICON_MAP[tool.icon] || Factory;
  const config = COLOR_MAP[tool.color] || { bg: "border-[#363636] text-[#fafafa] bg-[#242424]", glow: "rgba(255,255,255,0.05)" };
  const setHoveredElement = useNavigationState((state) => state.setHoveredElement);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.04 }}
      onMouseEnter={() => setHoveredElement(tool.name)}
      onMouseLeave={() => setHoveredElement(null)}
    >
      <Link href={`/tools/${tool.name}`} className="block outline-none">
        <SpotlightCard 
          spotlightColor={config.glow}
          className="group flex items-center gap-3 bg-[var(--bg-tertiary)]/40 border-[var(--border-default)] p-3 hover:border-[var(--accent-cyan)]/30 active:scale-[0.98] transition-all duration-200 ease-out"
        >
          <div className={cn("p-2 rounded-lg border shrink-0", config.bg)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[#fafafa] text-sm font-medium truncate group-hover:text-[var(--accent-cyan)] transition-colors duration-200 ease-out">
              {tool.displayName}
            </h3>
            <p className="text-[#898989] text-[11px] truncate leading-tight mt-0.5">
              {tool.description}
            </p>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-[#363636] group-hover:text-[var(--text-muted)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 ease-out" />
        </SpotlightCard>
      </Link>
    </motion.div>
  );
}
