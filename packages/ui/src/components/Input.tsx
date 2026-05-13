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
        "w-full rounded-lg border text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30",
        variant === "default"
          ? "border-[#363636] bg-[#171717]"
          : "border-[#363636] bg-[#242424]",
        className,
      )}
      {...props}
    />
  );
}