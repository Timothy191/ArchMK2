"use client";

import { useFocusMode } from "@/hooks/useFocusMode";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface FocusModeToggleProps {
  className?: string;
  variant?: "default" | "icon";
}

export function FocusModeToggle({
  className,
  variant = "default",
}: FocusModeToggleProps) {
  const { enabled, toggle } = useFocusMode();

  if (variant === "icon") {
    return (
      <button
        onClick={toggle}
        className={cn(
          "relative w-11 h-6 rounded-full transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]",
          enabled
            ? "bg-accent-amber/20 border border-accent-amber/30"
            : "bg-black/[0.06] border border-black/[0.08] hover:bg-black/[0.10]",
          className,
        )}
        aria-pressed={enabled}
        title={enabled ? "Exit Focus Mode" : "Enter Focus Mode"}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-black shadow-sm transition-transform duration-200 ease-out",
            enabled ? "translate-x-5" : "translate-x-0",
          )}
        >
          <span className="absolute inset-0 flex items-center justify-center">
            {enabled ? (
              <EyeOff className="w-3 h-3 text-white" />
            ) : (
              <Eye className="w-3 h-3 text-white" />
            )}
          </span>
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200",
        "border backdrop-blur-md",
        enabled
          ? "bg-accent-amber/10 border-accent-amber/20 text-accent-amber hover:bg-accent-amber/20"
          : "bg-arch-surface-tertiary/50 border-arch-border-subtle text-arch-text-tertiary hover:text-arch-text-primary hover:bg-arch-surface-tertiary",
        className,
      )}
      aria-pressed={enabled}
      title={enabled ? "Exit Focus Mode" : "Enter Focus Mode"}
    >
      {enabled ? (
        <>
          <EyeOff className="w-3.5 h-3.5" />
          Focused
        </>
      ) : (
        <>
          <Eye className="w-3.5 h-3.5" />
          Focus Mode
        </>
      )}
    </button>
  );
}
