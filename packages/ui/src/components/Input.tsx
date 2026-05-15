"use client";

import { cn } from "../lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "login";
}

export function Input({
  variant = "default",
  className,
  ...props
}: InputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border text-[var(--text-heading)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/30",
        variant === "default"
          ? "border-[var(--border-default)] bg-[var(--card)]"
          : "border-[var(--border-default)] bg-[var(--bg-tertiary)]",
        className,
      )}
      {...props}
    />
  );
}