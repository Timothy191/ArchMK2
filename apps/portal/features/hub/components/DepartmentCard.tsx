"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Shovel,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
  Radio as Broadcast,
} from "lucide-react";
import { GlassCard } from "@repo/ui/GlassCard";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import type { Department } from "~/lib/departments";
import { Sparkline } from "./Sparkline";
import { ArrowUpRight, FileText } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Drill: Shovel,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
  Satellite: Broadcast,
};

const COLOR_MAP: Record<string, { bg: string; glow: string; text: string }> = {
  amber: {
    bg: "border-[var(--mac-yellow)]/20 text-[var(--mac-yellow)] bg-[var(--mac-yellow)]/5",
    glow: "rgba(255, 189, 46, 0.15)",
    text: "text-[var(--mac-yellow)]",
  },
  emerald: {
    bg: "border-[var(--accent-green)]/20 text-[var(--accent-green)] bg-[var(--accent-green)]/5",
    glow: "rgba(52, 199, 89, 0.15)",
    text: "text-[var(--accent-green)]",
  },
  blue: {
    bg: "border-[var(--accent-blue)]/20 text-[var(--accent-blue)] bg-[var(--accent-blue)]/5",
    glow: "rgba(0, 122, 255, 0.15)",
    text: "text-[var(--accent-blue)]",
  },
  violet: {
    bg: "border-[var(--accent-blue)]/20 text-[var(--accent-blue)] bg-[var(--accent-blue)]/5",
    glow: "rgba(0, 122, 255, 0.15)",
    text: "text-[var(--accent-blue)]",
  },
  red: {
    bg: "border-[var(--accent-red)]/20 text-[var(--accent-red)] bg-[var(--accent-red)]/5",
    glow: "rgba(255, 59, 48, 0.15)",
    text: "text-[var(--accent-red)]",
  },
  orange: {
    bg: "border-[var(--mac-yellow)]/20 text-[var(--mac-yellow)] bg-[var(--mac-yellow)]/5",
    glow: "rgba(255, 189, 46, 0.15)",
    text: "text-[var(--mac-yellow)]",
  },
  cyan: {
    bg: "border-[var(--accent-blue)]/20 text-[var(--accent-blue)] bg-[var(--accent-blue)]/5",
    glow: "rgba(0, 122, 255, 0.15)",
    text: "text-[var(--accent-blue)]",
  },
  indigo: {
    bg: "border-[var(--accent-blue)]/20 text-[var(--accent-blue)] bg-[var(--accent-blue)]/5",
    glow: "rgba(0, 122, 255, 0.15)",
    text: "text-[var(--accent-blue)]",
  },
};

interface DepartmentCardProps {
  department: Department;
  index: number;
}

export function DepartmentCard({ department, index }: DepartmentCardProps) {
  const router = useRouter();
  const Icon = ICON_MAP[department.icon] || Factory;
  const config = COLOR_MAP[department.color] || {
    bg: "border-[var(--border-default)] text-[var(--text-heading)]",
    glow: "rgba(0,0,0,0.04)",
    text: "text-[var(--text-heading)]",
  };
  const hasGlow =
    department.status === "alert" || department.status === "maintenance";

  const cardContent = (
    <>
      <div className="flex items-center justify-between mb-6">
        <div
          className={cn(
            "p-2.5 rounded-xl border backdrop-blur-md transition-[opacity,transform] duration-300 group-hover:scale-110 group-hover:shadow-glow-blue",
            config.bg,
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          {department.status && (
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] font-bold uppercase tracking-[0.1em] px-2.5 py-0.5 rounded-full border border-transparent backdrop-blur-md",
                department.status === "active" &&
                  "text-accent-green bg-accent-green/10 border-accent-green/20 shadow-[inset_0_0_6px_rgba(52,199,89,0.25)]",
                department.status === "maintenance" &&
                  "text-[var(--mac-yellow)] bg-[var(--mac-yellow)]/10 border-[var(--mac-yellow)]/20",
                department.status === "alert" &&
                  "text-[var(--accent-red)] bg-[var(--accent-red)]/10 border-[var(--accent-red)]/20",
              )}
            >
              <span className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "w-1.5 h-1.5 rounded-full animate-pulse",
                    department.status === "active" &&
                      "bg-accent-green shadow-[0_0_8px_rgba(52,199,89,0.8)]",
                    department.status === "maintenance" &&
                      "bg-[var(--mac-yellow)]",
                    department.status === "alert" && "bg-[var(--accent-red)]",
                  )}
                />
                {department.status}
              </span>
            </Badge>
          )}
        </div>
      </div>

      <div className="flex-1">
        <h3 className="text-arch-text-primary font-bold text-xl tracking-tighter group-hover:text-arch-accent-blue transition-colors duration-300">
          {department.displayName}
        </h3>
        <p className="text-arch-text-secondary antialiased text-sm mt-2 line-clamp-2 leading-relaxed">
          {department.description}
        </p>
      </div>

      {department.stats && (
        <div className="mt-6 pt-4 border-t border-arch-border-primary flex items-center justify-between group/stat">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold text-arch-text-tertiary uppercase tracking-widest transition-colors group-hover:text-arch-text-secondary">
              {department.stats.label}
            </span>
            {department.trend && (
              <Sparkline data={department.trend} width={72} height={20} />
            )}
          </div>
          <span
            className={cn(
              "text-lg font-mono tabular-nums font-bold transition-all duration-300 group-hover:scale-110",
              config.text,
            )}
          >
            {department.stats.value}
          </span>
        </div>
      )}

      {department.actions && department.actions.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {department.actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-arch-surface-tertiary/60 hover:bg-arch-surface-tertiary border border-arch-border-subtle hover:border-white/40 text-[11px] font-medium text-arch-text-secondary hover:text-arch-accent-blue transition-colors"
            >
              <FileText className="w-3 h-3" />
              {action.label}
              <ArrowUpRight className="w-3 h-3 opacity-50" />
            </Link>
          ))}
        </div>
      )}
    </>
  );

  return (
    <div
      style={
        {
          animation: `fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.05}s both`,
          ["--shimmer-delay" as string]: `${-(index * 1.5)}s`,
        } as React.CSSProperties
      }
      className={cn("h-full", department.gridSpan)}
    >
      <div
        onClick={() => router.push(`/${department.name}`)}
        className="block h-full outline-none group cursor-pointer active:scale-[0.99] transition-transform duration-200 will-change-backdrop-filter"
      >
        {hasGlow ? (
          <GlassCard
            variant="glowborder"
            colorPreset={department.status === "alert" ? "sunset" : "aurora"}
            animationDuration={5}
            className="h-full aurora-shadow transition duration-500 ease-out hover:-translate-y-1 hover:shadow-card-hover"
          >
            <div className="p-5 flex flex-col h-full">{cardContent}</div>
          </GlassCard>
        ) : (
          <GlassCard
            variant="spotlight"
            spotlightColor={config.glow}
            className={cn(
              "h-full bg-arch-surface-tertiary/40 border border-arch-border-primary hover:border-white/40 transition duration-500 ease-out hover:-translate-y-1 hover:shadow-card-hover aurora-shadow",
            )}
          >
            <div className="p-5 flex flex-col h-full">{cardContent}</div>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
