"use client";

import * as React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@repo/ui/lib/utils";

const animatedButtonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-cyan)]/50",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--accent-cyan)] text-black hover:bg-[var(--accent-cyan)]/90",
        accent:
          "bg-[var(--accent-indigo)] text-white hover:bg-[var(--accent-indigo)]/90",
        destructive:
          "bg-[var(--accent-alert)] text-white hover:bg-[var(--accent-alert)]/90",
        outline:
          "border border-[var(--border-default)] bg-transparent hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-heading)]",
        secondary:
          "bg-[var(--bg-tertiary)] text-[var(--text-body)] hover:bg-[var(--bg-tertiary)]/80",
        ghost: "hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-heading)]",
        link: "text-[var(--accent-cyan)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs",
        lg: "h-11 rounded-md px-6",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

interface AnimatedButtonProps
  extends Omit<HTMLMotionProps<"button">, "size">,
    VariantProps<typeof animatedButtonVariants> {
  hoverScale?: number;
  tapScale?: number;
}

export const AnimatedButton = React.forwardRef<
  HTMLButtonElement,
  AnimatedButtonProps
>(
  (
    { className, variant, size, hoverScale = 1.03, tapScale = 0.97, ...props },
    ref,
  ) => {
    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: hoverScale }}
        whileTap={{ scale: tapScale }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className={cn(animatedButtonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);

AnimatedButton.displayName = "AnimatedButton";
