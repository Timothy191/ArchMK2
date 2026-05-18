"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@repo/ui/lib/utils";

interface AnimatedDialogProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
  className?: string;
}

export function AnimatedDialog({
  open,
  onClose,
  children,
  title,
  description,
  className,
}: AnimatedDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Dialog panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.95, 
              y: 16,
              transition: { duration: 0.15, ease: [0.23, 1, 0.32, 1] }
            }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className={cn(
              "relative z-10 w-full max-w-lg rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)]/90 backdrop-blur-xl p-6",
              className,
            )}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="absolute right-4 top-4 rounded-md p-1 text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            {(title || description) && (
              <div className="mb-4 pr-8">
                {title && (
                  <h2 className="text-lg font-medium text-[var(--text-heading)]">
                    {title}
                  </h2>
                )}
                {description && (
                  <p className="text-sm text-[var(--text-muted)] mt-1">
                    {description}
                  </p>
                )}
              </div>
            )}

            {/* Content */}
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
