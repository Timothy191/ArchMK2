"use client";

import * as React from "react";
import {
  Unstable_NumberInput as BaseNumberInput,
  NumberInputProps,
} from "@mui/base/Unstable_NumberInput";
import { cn } from "@repo/ui/lib/utils";
import { ChevronUp, ChevronDown } from "lucide-react";

const NumberInput = React.forwardRef(function CustomNumberInput(
  props: NumberInputProps,
  ref: React.ForwardedRef<HTMLDivElement>
) {
  return (
    <BaseNumberInput
      slots={{
        root: "div",
        input: "input",
        incrementButton: "button",
        decrementButton: "button",
      }}
      slotProps={{
        root: {
          className: cn(
            "flex items-center rounded-lg border border-[var(--border-emphasis)] bg-[var(--bg-primary)] hover:border-[#424242] transition-all overflow-hidden focus-within:ring-1 focus-within:ring-[#3ecf8e] focus-within:border-[#3ecf8e]/50",
            props.className
          ),
        },
        input: {
          className: "w-full bg-transparent px-3 py-2 text-sm text-[var(--text-heading)] outline-none placeholder-[var(--text-secondary)]",
        },
        incrementButton: {
          children: <ChevronUp className="w-3 h-3" />,
          className: "flex items-center justify-center p-1 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border-l border-[var(--border-emphasis)] transition-colors",
        },
        decrementButton: {
          children: <ChevronDown className="w-3 h-3" />,
          className: "flex items-center justify-center p-1 hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-heading)] border-l border-[var(--border-emphasis)] transition-colors",
        },
      }}
      {...props}
      ref={ref}
    />
  );
});

interface PrecisionInputProps extends NumberInputProps {
  label?: string;
  suffix?: string;
}

export function PrecisionInput({ label, suffix, ...props }: PrecisionInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <NumberInput {...props} />
        {suffix && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2 pointer-events-none text-xs text-[#4a4a4a] font-medium">
            {suffix}
          </div>
        )}
      </div>
    </div>
  );
}
