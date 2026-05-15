"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { SecondaryButton } from "@repo/ui/SecondaryButton";

interface Machine {
  id: string;
  name: string;
  machine_type: string;
}

interface DailyLogFormProps {
  departmentId: string;
  departmentSlug: string;
  machines: Machine[];
}

export function DailyLogForm({ departmentId, machines }: DailyLogFormProps) {
  const [shift, setShift] = useState<"day" | "night">("day");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");

    const supabase = createBrowserSupabaseClient();
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("daily_logs").insert({
      department_id: departmentId,
      log_date: today,
      shift,
      notes: notes || null,
    });

    if (error) {
      console.error(error);
      setStatus("error");
    } else {
      setStatus("success");
      setNotes("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Shift selector */}
      <div className="space-y-2">
        <label
          htmlFor="shift-day"
          className="block text-sm text-[var(--text-muted)]"
        >
          Shift
        </label>
        <div className="flex gap-3" role="group" aria-label="Shift selection">
          {(["day", "night"] as const).map((s) => (
            <button
              key={s}
              id={`shift-${s}`}
              type="button"
              onClick={() => setShift(s)}
              aria-pressed={shift === s}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                shift === s
                  ? "bg-[var(--bg-tertiary)] text-[var(--text-heading)] border border-[var(--accent-cyan)]"
                  : "bg-[var(--card)] text-[var(--text-muted)] border border-[var(--border-default)] hover:text-[var(--text-heading)]"
              }`}
            >
              {s === "day" ? "Day Shift" : "Night Shift"}
            </button>
          ))}
        </div>
      </div>

      {/* Machines list (read-only reference) */}
      {machines.length > 0 && (
        <div className="space-y-2">
          <label className="block text-sm text-[var(--text-muted)]">
            Machines
          </label>
          <div className="flex flex-wrap gap-2">
            {machines.map((m) => (
              <span
                key={m.id}
                className="px-3 py-1 rounded-full text-xs bg-[var(--card)] text-[var(--text-secondary)] border border-[var(--border-default)]"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label
          htmlFor="daily-log-notes"
          className="block text-sm text-[var(--text-muted)]"
        >
          Notes
        </label>
        <textarea
          id="daily-log-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-[var(--card)] border border-[var(--border-default)] text-[var(--text-heading)] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[var(--accent-cyan)]/30 resize-none"
          placeholder="Enter any observations or issues..."
          aria-label="Daily log notes"
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <SecondaryButton type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Saving..." : "Save Daily Log"}
        </SecondaryButton>

        {status === "success" && (
          <span
            className="text-sm text-emerald-400"
            role="status"
            aria-live="polite"
          >
            Log saved successfully.
          </span>
        )}
        {status === "error" && (
          <span
            className="text-sm text-red-400"
            role="alert"
            aria-live="assertive"
          >
            Failed to save log. Please try again.
          </span>
        )}
      </div>
    </form>
  );
}
