"use client";

import { cn } from "../lib/utils";

interface MacMenuBarProps {
  appName?: string;
  menuItems?: string[];
  rightSlot?: React.ReactNode;
  className?: string;
}

export function MacMenuBar({
  appName = "Arch Systems",
  menuItems = ["Operations", "Tools", "View", "Help"],
  rightSlot,
  className,
}: MacMenuBarProps) {
  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] h-7 flex items-center justify-between px-3",
        "bg-white/80 backdrop-blur-2xl border-b border-black/[0.06]",
        className
      )}
    >
      {/* Left: Apple logo placeholder + app name + menu items */}
      <div className="flex items-center gap-0.5">
        <button aria-label="Menu" className="px-2 py-0.5 rounded hover:bg-black/[0.06] transition-colors">
          <span className="text-[13px] font-bold text-[var(--text-heading)] select-none"></span>
        </button>
        <button className="px-2 py-0.5 rounded hover:bg-black/[0.06] transition-colors">
          <span className="text-[13px] font-semibold text-[var(--text-heading)] select-none">
            {appName}
          </span>
        </button>
        <div className="w-px h-3.5 bg-black/[0.08] mx-1" />
        {menuItems.map((item) => (
          <button
            key={item}
            className="px-2 py-0.5 rounded text-[13px] font-normal text-[var(--text-body)] hover:bg-black/[0.06] transition-colors select-none"
          >
            {item}
          </button>
        ))}
      </div>

      {/* Right: system tray slot */}
      <div className="flex items-center gap-1.5 text-[12px] text-[var(--text-secondary)]">
        {rightSlot}
      </div>
    </div>
  );
}
