"use client";

import { useRef, useState, useEffect } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { cn } from "@repo/ui/lib/utils";
import {
  CheckSquare,
  FileText,
  Calendar,
  Calculator,
  StickyNote,
  Factory,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  tasks: CheckSquare,
  documents: FileText,
  schedule: Calendar,
  calculations: Calculator,
  notes: StickyNote,
};

const COLOR_MAP: Record<string, string> = {
  emerald: "text-emerald-400",
  blue: "text-blue-400",
  amber: "text-amber-400",
  violet: "text-violet-400",
  cyan: "text-cyan-400",
  red: "text-red-400",
  orange: "text-orange-400",
};

interface Tool {
  id: string;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  color: string;
}

interface ToolBannerProps {
  tools: Tool[];
}

export function ToolBanner({ tools }: ToolBannerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Pause on tab/window blur for performance
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  // Duplicate tools for seamless infinite scroll
  const duplicatedTools = [...tools, ...tools];

  return (
    <div
      className="relative overflow-hidden py-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 will-change-transform",
          !isPaused && "animate-marquee"
        )}
        style={{ animationPlayState: isPaused ? "paused" : "running" }}
      >
        {duplicatedTools.map((tool, index) => {
          const Icon = ICON_MAP[tool.icon] || Factory;
          const colorClass = COLOR_MAP[tool.color] || "text-arch-accent-blue";

          return (
            <GlassCard
              key={`${tool.id}-${index}`}
              className="min-w-[280px] flex-shrink-0"
            >
              <div className="p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn("p-2 rounded-lg bg-arch-surface-tertiary", colorClass)}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-arch-text-primary text-lg font-semibold">
                    {tool.displayName}
                  </h3>
                </div>
                <p className="text-arch-text-tertiary text-sm">
                  {tool.description}
                </p>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
