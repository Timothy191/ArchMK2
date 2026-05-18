"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckSquare,
  FileText,
  Calendar,
  Calculator,
  StickyNote,
  ArrowUpRight,
  Factory
} from "lucide-react";
import { cn } from "@repo/ui/lib/utils";
import { SpotlightCard } from "@repo/ui/components/ui/spotlight-card";
import { useNavigationState } from "@/hooks/useNavigationState";

const ICON_MAP: Record<string, any> = {
  tasks: CheckSquare,
  documents: FileText,
  schedule: Calendar,
  calculations: Calculator,
  notes: StickyNote,
};

const COLOR_MAP: Record<string, { bg: string; glow: string; border: string }> = {
  amber: { 
    bg: "border-amber-500/20 text-amber-400 bg-amber-500/5", 
    glow: "rgba(245, 158, 11, 0.15)",
    border: "from-amber-500/50"
  },
  emerald: { 
    bg: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5", 
    glow: "rgba(16, 185, 129, 0.15)",
    border: "from-emerald-500/50"
  },
  blue: { 
    bg: "border-blue-500/20 text-blue-400 bg-blue-500/5", 
    glow: "rgba(59, 130, 246, 0.15)",
    border: "from-blue-500/50"
  },
  violet: { 
    bg: "border-violet-500/20 text-violet-400 bg-violet-500/5", 
    glow: "rgba(139, 92, 246, 0.15)",
    border: "from-violet-500/50"
  },
  red: { 
    bg: "border-red-500/20 text-red-400 bg-red-500/5", 
    glow: "rgba(239, 68, 68, 0.15)",
    border: "from-red-500/50"
  },
  orange: { 
    bg: "border-orange-500/20 text-orange-400 bg-orange-500/5", 
    glow: "rgba(249, 115, 22, 0.15)",
    border: "from-orange-500/50"
  },
  cyan: { 
    bg: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5", 
    glow: "rgba(6, 182, 212, 0.15)",
    border: "from-cyan-500/50"
  },
  indigo: { 
    bg: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5", 
    glow: "rgba(79, 70, 229, 0.15)",
    border: "from-indigo-500/50"
  },
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
  const config = COLOR_MAP[tool.color] || { 
    bg: "border-[var(--border-default)] text-[var(--text-heading)] bg-[var(--bg-tertiary)]", 
    glow: "rgba(0,0,0,0.04)",
    border: "from-white/20"
  };
  const setHoveredElement = useNavigationState((state) => state.setHoveredElement);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.04 }}
      onMouseEnter={() => setHoveredElement(tool.name)}
      onMouseLeave={() => setHoveredElement(null)}
      className="relative group"
    >
      {/* Arcane Border Effect */}
      <div className={cn(
        "absolute -inset-[1px] bg-gradient-to-r to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-[1px]",
        config.border
      )} />
      
      <Link href={`/tools/${tool.name}`} className="relative block outline-none">
        <SpotlightCard
          spotlightColor={config.glow}
          className="group flex items-center gap-3 bg-arch-surface-tertiary/40 border-arch-border-primary p-3 hover:border-arch-accent-blue/30 active:scale-[0.98] transition-all duration-200 ease-out rounded-xl overflow-hidden"
        >
          <div className={cn("p-2 rounded-lg border shrink-0 relative z-10", config.bg)}>
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 relative z-10">
            <h3 className="text-arch-text-primary text-sm font-medium truncate group-hover:text-arch-accent-blue transition-colors duration-200 ease-out">
              {tool.displayName}
            </h3>
            <p className="text-arch-text-tertiary text-[11px] truncate leading-tight mt-0.5">
              {tool.description}
            </p>
          </div>
          <ArrowUpRight className="w-3.5 h-3.5 text-arch-text-tertiary relative z-10 group-hover:text-arch-text-secondary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-200 ease-out" />
          
          {/* Subtle inner arcane shimmer */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </SpotlightCard>
      </Link>
    </motion.div>
  );
}
