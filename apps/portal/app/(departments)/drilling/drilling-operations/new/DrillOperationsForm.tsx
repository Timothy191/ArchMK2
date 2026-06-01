"use client";

import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";

interface Machine {
  id: string;
  name: string;
}

interface Operator {
  id: string;
  full_name: string;
}

interface DrillOperationsFormProps {
  departmentId: string;
  machines: Machine[];
  operators: Operator[];
}

export function DrillOperationsForm({
  departmentId,
  machines,
  operators,
}: DrillOperationsFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    machine_id: "",
    operator_id: "",
    shift_type: "day",
    operation_date: new Date().toISOString().split("T")[0],
    open_hours: "",
    close_hours: "",
    holes: "0",
    meters_drilled: "0",
    block_drilled: "",

    // Production Delays (Minutes)
    delay_blasting: "0",
    delay_no_operator: "0",
    delay_natural: "0",
    delay_lunch_breaks: "0",
    delay_safety_talks: "0",
    delay_tramming: "0",
    delay_non_prod_other: "0",

    // Engineering Delays (Minutes)
    delay_get: "0",
    delay_maintenance: "0",
    delay_mech_breakdown: "0",
    delay_elec_breakdown: "0",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const calculateTotalDelays = () => {
    return (
      Number(formData.delay_blasting) +
      Number(formData.delay_no_operator) +
      Number(formData.delay_natural) +
      Number(formData.delay_lunch_breaks) +
      Number(formData.delay_safety_talks) +
      Number(formData.delay_tramming) +
      Number(formData.delay_non_prod_other) +
      Number(formData.delay_get) +
      Number(formData.delay_maintenance) +
      Number(formData.delay_mech_breakdown) +
      Number(formData.delay_elec_breakdown)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        department_id: departmentId,
        machine_id: formData.machine_id,
        operator_id: formData.operator_id || null,
        shift_type: formData.shift_type,
        operation_date: formData.operation_date,
        open_hours: formData.open_hours ? Number(formData.open_hours) : null,
        close_hours: formData.close_hours ? Number(formData.close_hours) : null,
        holes: Number(formData.holes),
        meters_drilled: Number(formData.meters_drilled),
        block_drilled: formData.block_drilled || null,

        delay_blasting: Number(formData.delay_blasting),
        delay_no_operator: Number(formData.delay_no_operator),
        delay_natural: Number(formData.delay_natural),
        delay_lunch_breaks: Number(formData.delay_lunch_breaks),
        delay_safety_talks: Number(formData.delay_safety_talks),
        delay_tramming: Number(formData.delay_tramming),
        delay_non_prod_other: Number(formData.delay_non_prod_other),

        delay_get: Number(formData.delay_get),
        delay_maintenance: Number(formData.delay_maintenance),
        delay_mech_breakdown: Number(formData.delay_mech_breakdown),
        delay_elec_breakdown: Number(formData.delay_elec_breakdown),
      };

      const { error: submitError } = await supabase
        .from("drill_operations")
        .insert([payload]);

      if (submitError) throw submitError;

      router.push("/drilling/drilling-operations");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to log operation");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="bg-accent-red/10 border border-accent-red text-accent-red p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* Basic Info & Metrics */}
      <GlassCard>
        <h3 className="text-lg font-medium text-[var(--text-heading)] mb-4">
          Core Metrics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Drill Rig
            </label>
            <select
              required
              name="machine_id"
              value={formData.machine_id}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            >
              <option value="">Select Rig...</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Operator
            </label>
            <select
              name="operator_id"
              value={formData.operator_id}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            >
              <option value="">Select Operator...</option>
              {operators.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.full_name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Shift Type
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, shift_type: "day" }))
                }
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  formData.shift_type === "day"
                    ? "bg-[var(--accent-blue)] text-[var(--bg-secondary)]"
                    : "bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)]"
                }`}
              >
                Day Shift
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, shift_type: "night" }))
                }
                className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                  formData.shift_type === "night"
                    ? "bg-[var(--accent-blue)] text-[var(--bg-secondary)]"
                    : "bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)]"
                }`}
              >
                Night Shift
              </button>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Operation Date
            </label>
            <input
              type="date"
              required
              name="operation_date"
              value={formData.operation_date}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Block Drilled
            </label>
            <input
              type="text"
              name="block_drilled"
              placeholder="e.g. N2-B4"
              value={formData.block_drilled}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Open Hours (Meter)
            </label>
            <input
              type="number"
              step="0.1"
              required
              name="open_hours"
              value={formData.open_hours}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Close Hours (Meter)
            </label>
            <input
              type="number"
              step="0.1"
              required
              name="close_hours"
              value={formData.close_hours}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Holes Completed
            </label>
            <input
              type="number"
              required
              name="holes"
              value={formData.holes}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Meters Drilled
            </label>
            <input
              type="number"
              step="0.1"
              required
              name="meters_drilled"
              value={formData.meters_drilled}
              onChange={handleChange}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
        </div>
      </GlassCard>

      {/* Production & Operational Delays */}
      <GlassCard className="border-accent-blue/20">
        <h3 className="text-lg font-medium text-accent-blue mb-4">
          Production & Operational Delays (Minutes)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Blasting
            </label>
            <input
              type="number"
              name="delay_blasting"
              value={formData.delay_blasting}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              No Operator
            </label>
            <input
              type="number"
              name="delay_no_operator"
              value={formData.delay_no_operator}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Natural (Weather)
            </label>
            <input
              type="number"
              name="delay_natural"
              value={formData.delay_natural}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Lunch & Breaks
            </label>
            <input
              type="number"
              name="delay_lunch_breaks"
              value={formData.delay_lunch_breaks}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Safety Talks
            </label>
            <input
              type="number"
              name="delay_safety_talks"
              value={formData.delay_safety_talks}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Tramming (Moving Tracks)
            </label>
            <input
              type="number"
              name="delay_tramming"
              value={formData.delay_tramming}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Other Non-Prod
            </label>
            <input
              type="number"
              name="delay_non_prod_other"
              value={formData.delay_non_prod_other}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
        </div>
      </GlassCard>

      {/* Engineering Delays */}
      <GlassCard className="border-accent-red/20">
        <h3 className="text-lg font-medium text-accent-red mb-4">
          Engineering & Maintenance Delays (Minutes)
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              GET (Bits/Hammers)
            </label>
            <input
              type="number"
              name="delay_get"
              value={formData.delay_get}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Scheduled Maintenance
            </label>
            <input
              type="number"
              name="delay_maintenance"
              value={formData.delay_maintenance}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Mechanical Breakdown
            </label>
            <input
              type="number"
              name="delay_mech_breakdown"
              value={formData.delay_mech_breakdown}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm text-[var(--text-secondary)] block">
              Electrical Breakdown
            </label>
            <input
              type="number"
              name="delay_elec_breakdown"
              value={formData.delay_elec_breakdown}
              onChange={handleChange}
              min="0"
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-default)] rounded px-3 py-2 text-sm text-[var(--text-heading)]"
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex items-center justify-between pt-4">
        <p className="text-[var(--text-muted)] text-sm">
          Total Recorded Delays:{" "}
          <strong className="text-[var(--text-heading)]">
            {calculateTotalDelays()} min
          </strong>
        </p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-[var(--accent-blue)] text-white px-6 py-2 rounded-lg font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Submit Log"}
        </button>
      </div>
    </form>
  );
}
