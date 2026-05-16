"use client";

import { useState, useMemo } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { ShiftToggle, getCurrentShift } from "@repo/ui/ShiftToggle";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";
import { Plus, X, Equal, Calculator } from "lucide-react";

interface DozerWithSite {
  id: string;
  name: string;
  serial_number: string | null;
  site_id: string | null;
  sites: { name: string }[] | null;
}

interface DozerRollFormProps {
  departmentId: string;
  dozers: DozerWithSite[];
}

export function DozerRollForm({ departmentId, dozers }: DozerRollFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const [isOpen, setIsOpen] = useState(false);
  const [machineId, setMachineId] = useState("");
  const [lengthM, setLengthM] = useState("");
  const [widthM, setWidthM] = useState("");
  const [shiftType, setShiftType] = useState<"day" | "night">(
    getCurrentShift(),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedDozer = useMemo(
    () => dozers.find((d) => d.id === machineId),
    [machineId, dozers],
  );

  const siteName = selectedDozer?.sites?.[0]?.name ?? "—";

  const area = useMemo(() => {
    const l = parseFloat(lengthM);
    const w = parseFloat(widthM);
    if (isNaN(l) || isNaN(w)) return 0;
    return l * w;
  }, [lengthM, widthM]);

  const reset = () => {
    setMachineId("");
    setLengthM("");
    setWidthM("");
    setShiftType(getCurrentShift());
    setError(null);
    setIsOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!machineId) {
      setError("Select a dozer");
      return;
    }
    if (!lengthM || !widthM) {
      setError("Enter both length and width");
      return;
    }

    setIsSubmitting(true);

    try {
      const today = new Date().toISOString().split("T")[0];

      const { error: insertError } = await supabase.from("dozer_rolls").insert({
        department_id: departmentId,
        machine_id: machineId,
        roll_date: today,
        shift_type: shiftType,
        blade_passes: 0,
        push_count: 0,
        area_covered_sqm: area,
        notes: `Length: ${lengthM}m, Width: ${widthM}m`,
      });

      if (insertError) throw insertError;

      reset();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save roll. Try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {!isOpen && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/90 text-[var(--bg-secondary)] font-medium py-2.5 px-5 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Roll
          </button>
        </div>
      )}

      {isOpen && (
        <GlassCard>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-[var(--accent-cyan)]" />
                <h3 className="text-lg font-medium text-[var(--text-heading)]">
                  Record Dozer Roll
                </h3>
              </div>
              <button
                type="button"
                onClick={reset}
                className="text-[var(--text-muted)] hover:text-[var(--text-heading)] text-sm transition-colors"
              >
                Cancel
              </button>
            </div>

            {/* Dozer & Site */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm text-[var(--text-secondary)]">
                  Dozer <span className="text-red-400">*</span>
                </label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="w-full bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-[var(--text-heading)] text-sm focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                >
                  <option value="">Select dozer...</option>
                  {dozers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                      {d.serial_number ? ` (${d.serial_number})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-sm text-[var(--text-secondary)]">
                  Site
                </label>
                <div className="w-full bg-[var(--card)]/60 border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-[var(--text-heading)] text-sm">
                  {siteName}
                </div>
              </div>
            </div>

            {/* Shift */}
            <div className="space-y-2">
              <label className="block text-sm text-[var(--text-secondary)]">
                Shift
              </label>
              <ShiftToggle value={shiftType} onChange={setShiftType} />
            </div>

            {/* Calculation: Length x Width = Area */}
            <div className="space-y-2">
              <label className="block text-sm text-[var(--text-secondary)]">
                Area Calculation
              </label>
              <div className="flex items-center gap-3">
                <div className="flex-1 space-y-1">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={lengthM}
                    onChange={(e) => setLengthM(e.target.value)}
                    placeholder="Length (m)"
                    className="w-full bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-[var(--text-heading)] text-sm focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  />
                </div>
                <X className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                <div className="flex-1 space-y-1">
                  <input
                    type="number"
                    min={0}
                    step="0.1"
                    value={widthM}
                    onChange={(e) => setWidthM(e.target.value)}
                    placeholder="Width (m)"
                    className="w-full bg-[var(--card)] border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-[var(--text-heading)] text-sm focus:outline-none focus:border-[var(--accent-cyan)] transition-colors"
                  />
                </div>
                <Equal className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                <div className="flex-1">
                  <div className="w-full bg-[var(--card)]/60 border border-[var(--border-default)] rounded-lg px-3 py-2.5 text-[var(--accent-cyan)] text-sm font-medium text-center">
                    {area > 0 ? `${area.toFixed(2)} m²` : "—"}
                  </div>
                </div>
              </div>
            </div>

            {/* Error */}
            {error && <p className="text-red-400 text-sm">{error}</p>}

            {/* Actions */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[var(--accent-cyan)] hover:bg-[var(--accent-cyan)]/90 disabled:bg-[var(--bg-tertiary)] disabled:text-[var(--text-muted)] text-[var(--bg-secondary)] font-medium py-2.5 px-6 rounded-lg transition-colors"
              >
                {isSubmitting ? "Saving..." : "Save Roll"}
              </button>
            </div>
          </form>
        </GlassCard>
      )}
    </div>
  );
}
