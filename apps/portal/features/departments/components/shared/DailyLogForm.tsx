"use client";

import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { PageHeader } from "@repo/ui/PageHeader";
import { KPIGrid, KPICard } from "@repo/ui/KPI";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";
import { ShiftToggle, getCurrentShift } from "@repo/ui/ShiftToggle";

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

export function DailyLogForm({ departmentId, departmentSlug, machines }: DailyLogFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [shift, setShift] = useState<"day" | "night">(getCurrentShift());
  const [notes, setNotes] = useState("");
  const [hours, setHours] = useState<Record<string, string>>({});
  const [fuel, setFuel] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!notes.trim()) {
      newErrors.notes = "Enter shift notes";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      // Insert daily log
      const { data: log, error: logError } = await supabase
        .from("daily_logs")
        .insert({
          department_id: departmentId,
          log_date: today,
          shift,
          notes: notes.trim(),
        })
        .select("id")
        .single();

      if (logError) throw logError;
      const dailyLogId = log.id;

      // Insert machine hours
      for (const machine of machines) {
        const hrs = parseFloat(hours[machine.id] || "0");
        if (hrs > 0) {
          await supabase.from("machine_hours").insert({
            daily_log_id: dailyLogId,
            machine_id: machine.id,
            hours_worked: hrs,
          });
        }
      }

      // Insert fuel logs
      for (const machine of machines) {
        const litres = parseFloat(fuel[machine.id] || "0");
        if (litres > 0) {
          await supabase.from("fuel_logs").insert({
            daily_log_id: dailyLogId,
            machine_id: machine.id,
            diesel_litres: litres,
          });
        }
      }

      setNotes("");
      setHours({});
      setFuel({});
      router.refresh();
    } catch (err) {
      setErrors({ submit: "Failed to save. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-5">
        <h3 className="text-lg font-medium text-[#fafafa]">Daily Log Entry</h3>

        <ShiftToggle value={shift} onChange={setShift} />

        {/* Machine Hours & Fuel */}
        {machines.length > 0 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-[#b4b4b4]">Machine Hours &amp; Fuel</h4>
            {machines.map((m) => (
              <div key={m.id} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <span className="text-[#b4b4b4] text-sm">{m.name} ({m.machine_type})</span>
                <div className="space-y-1">
                  <label className="text-[#898989] text-xs">Hours</label>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="0.5"
                    value={hours[m.id] || ""}
                    onChange={(e) =>
                      setHours((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                    placeholder="0.0"
                    className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[#898989] text-xs">Fuel (L)</label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={fuel[m.id] || ""}
                    onChange={(e) =>
                      setFuel((prev) => ({ ...prev, [m.id]: e.target.value }))
                    }
                    placeholder="0"
                    className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e]"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notes */}
        <div className="space-y-2">
          <label className="text-[#b4b4b4] text-sm block">
            Shift Notes <span className="text-red-400">*</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter shift activities, observations, and handover notes..."
            rows={4}
            maxLength={500}
            className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors resize-none"
          />
          <div className="flex justify-between">
            {errors.notes && <p className="text-red-400 text-xs">{errors.notes}</p>}
            <p className="text-[#898989] text-xs ml-auto">{notes.length}/500</p>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#3ecf8e] hover:bg-[#35b37d] disabled:bg-[#2e2e2e] disabled:text-[#898989] text-[#171717] font-medium py-2.5 px-6 rounded-lg transition-colors"
          >
            {isSubmitting ? "Saving..." : "Log Shift"}
          </button>
          {errors.submit && (
            <p className="text-red-400 text-sm">{errors.submit}</p>
          )}
        </div>
      </form>
    </GlassCard>
  );
}
