"use client";

import { useFocusMode } from "@/hooks/useFocusMode";
import { cn } from "@repo/ui/lib/utils";

interface LoginCardShellProps {
  children: React.ReactNode;
}

/**
 * Login card container that adjusts glass opacity based on Focus Mode.
 * - Focused mode: more opaque (80%) for concentration.
 * - Normal mode: more transparent (30%) to show the background video.
 */
export function LoginCardShell({ children }: LoginCardShellProps) {
  const enabled = useFocusMode((s) => s.enabled);

  return (
    <div
      data-testid="login-card"
      className={cn(
        "rounded-xl overflow-hidden border border-arch-border-primary backdrop-blur-3xl shadow-window animate-window-open transition-colors duration-300",
        enabled
          ? "bg-arch-surface-secondary/50"
          : "bg-arch-surface-secondary/10",
      )}
    >
      {children}
    </div>
  );
}
