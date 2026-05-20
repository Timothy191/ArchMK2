import { useAutoAnimate } from "@formkit/auto-animate/react";
import { cn } from "../lib/utils";
import { GlassCard } from "./GlassCard";

type KPIColor =
  | "default"
  | "green"
  | "amber"
  | "red"
  | "blue"
  | "cyan"
  | "indigo"
  | "alert";

const colorMap: Record<KPIColor, string> = {
  default: "text-[var(--text-heading)]",
  green: "text-emerald-400",
  amber: "text-amber-400",
  red: "text-red-400",
  blue: "text-blue-400",
  cyan: "text-[var(--accent-blue)]",
  indigo: "text-[var(--accent-blue)]",
  alert: "text-[var(--accent-red)]",
};

interface KPICardProps {
  label: string;
  value: string | number;
  color?: KPIColor;
  sub?: string;
  subColor?: KPIColor;
}

export function KPICard({
  label,
  value,
  color = "default",
  sub,
  subColor = "default",
}: KPICardProps) {
  return (
    <GlassCard>
      <p className="text-[var(--text-muted)] text-xs uppercase tracking-wide">
        {label}
      </p>
      <p className={cn("text-2xl font-medium mt-1", colorMap[color])}>
        {value}
      </p>
      {sub && <p className={cn("text-xs mt-1", colorMap[subColor])}>{sub}</p>}
    </GlassCard>
  );
}

interface KPIGridProps {
  children: React.ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}

export function KPIGrid({ children, cols = 4, className }: KPIGridProps) {
  const [parent] = useAutoAnimate({ duration: 300, easing: "ease-out" });
  const colClasses: Record<number, string> = {
    2: "grid grid-cols-2 gap-4",
    3: "grid grid-cols-1 md:grid-cols-3 gap-4",
    4: "grid grid-cols-2 md:grid-cols-4 gap-4",
  };

  return (
    <div ref={parent} className={cn(colClasses[cols], className)}>
      {children}
    </div>
  );
}
