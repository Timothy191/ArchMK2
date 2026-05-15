"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Drill,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
  Satellite,
  Activity,
  AlertCircle,
  Settings,
} from "lucide-react";
import { SpotlightCard } from "@repo/ui/SpotlightCard";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import type { Department } from "~/lib/departments";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Drill,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
  Satellite,
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

interface DepartmentCardProps {
  department: Department;
  index: number;
}

export function DepartmentCard({ department, index }: DepartmentCardProps) {
  const Icon = ICON_MAP[department.icon] || Factory;
  const config = COLOR_MAP[department.color] || { bg: "border-[#363636] text-[#fafafa]", glow: "rgba(255,255,255,0.05)" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn("h-full", department.gridSpan)}
    >
      <Link href={`/${department.name}`} className="block h-full outline-none group active:scale-[0.99] transition-transform duration-200">
        <SpotlightCard
          spotlightColor={config.glow}
          className={cn(
            "h-full bg-[var(--bg-tertiary)]/40 border-[var(--border-default)] hover:border-[var(--accent-cyan)]/30 transition-all duration-300",
            department.status === "alert" && "border-red-500/30",
            department.status === "maintenance" && "border-amber-500/30"
          )}
        >
          <div className="p-5 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <div className={cn("p-2.5 rounded-xl border backdrop-blur-md transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(62,207,142,0.1)]", config.bg)}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                {department.status && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full border-none shadow-sm backdrop-blur-md",
                      department.status === "active" && "text-emerald-400 bg-emerald-500/10",
                      department.status === "maintenance" && "text-amber-400 bg-amber-500/10",
                      department.status === "alert" && "text-red-400 bg-red-500/10"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className={cn(
                        "w-1 h-1 rounded-full animate-pulse",
                        department.status === "active" && "bg-emerald-400",
                        department.status === "maintenance" && "bg-amber-400",
                        department.status === "alert" && "bg-red-400"
                      )} />
                      {department.status}
                    </span>
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex-1">
              <h3 className="text-[#fafafa] font-semibold text-xl tracking-tight group-hover:text-[var(--accent-cyan)] transition-colors duration-300">
                {department.displayName}
              </h3>
              <p className="text-[var(--text-muted)] text-sm mt-2 line-clamp-2 leading-relaxed">
                {department.description}
              </p>
            </div>

            {department.stats && (
              <div className="mt-8 pt-4 border-t border-[var(--border-default)] flex items-center justify-between group/stat">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] transition-colors group-hover:text-[#fafafa]">
                  {department.stats.label}
                </span>
                <span className={cn("text-lg font-mono font-bold transition-all duration-300 group-hover:scale-110", config.bg.split(" ")[1])}>
                  {department.stats.value}
                </span>
              </div>
            )}
          </div>
        </SpotlightCard>
      </Link>
    </motion.div>
  );
}
