"use client";

import { useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";

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

export function DailyLogForm({
  departmentId,
  machines,
}: DailyLogFormProps) {
  const [shift, setShift] = useState<"day" | "night">("day");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

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
        <label className="block text-sm text-[#898989]">Shift</label>
        <div className="flex gap-3">
          {(["day", "night"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setShift(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                shift === s
                  ? "bg-[#2e2e2e] text-[#fafafa] border border-[#3ecf8e]"
                  : "bg-[#171717] text-[#898989] border border-[#363636] hover:text-[#fafafa]"
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
          <label className="block text-sm text-[#898989]">Machines</label>
          <div className="flex flex-wrap gap-2">
            {machines.map((m) => (
              <span
                key={m.id}
                className="px-3 py-1 rounded-full text-xs bg-[#171717] text-[#b4b4b4] border border-[#363636]"
              >
                {m.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-2">
        <label className="block text-sm text-[#898989]">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="w-full px-4 py-3 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30 resize-none"
          placeholder="Enter any observations or issues..."
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="px-6 py-2.5 rounded-full bg-[#0f0f0f] text-[#fafafa] text-sm font-medium hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
        >
          {status === "submitting" ? "Saving..." : "Save Daily Log"}
        </button>

        {status === "success" && (
          <span className="text-sm text-emerald-400">Log saved successfully.</span>
        )}
        {status === "error" && (
          <span className="text-sm text-red-400">Failed to save log. Please try again.</span>
        )}
      </div>
    </form>
  );
}
