"use client";

interface ShiftToggleProps {
  value: "day" | "night";
  onChange: (shift: "day" | "night") => void;
}

export function ShiftToggle({ value, onChange }: ShiftToggleProps) {
  return (
    <div className="flex gap-2">
      {(["day", "night"] as const).map((shift) => (
        <button
          key={shift}
          type="button"
          onClick={() => onChange(shift)}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            value === shift
              ? "bg-[var(--accent-cyan)] text-[var(--bg-secondary)]"
              : "bg-[var(--card)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
          }`}
        >
          {shift === "day" ? "Day" : "Night"}
        </button>
      ))}
    </div>
  );
}

export function getCurrentShift(): "day" | "night" {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? "day" : "night";
}