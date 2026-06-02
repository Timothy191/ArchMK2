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
        "w-full rounded-lg border text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-0 transition-colors",
        variant === "default"
          ? "border-[var(--border-emphasis)] bg-[var(--bg-secondary)]"
          : "border-[var(--border-emphasis)] bg-[var(--bg-tertiary)]",
        className,
      )}
      {...props}
    />
  );
}
