"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitDailyLog } from "../../../actions";
import { GlassCard } from "@repo/ui/GlassCard";

interface Machine {
  id: string;
  name: string;
  machine_type: string;
}

export function DailyLogForm({
  departmentId,
  departmentSlug,
  machines,
}: {
  departmentId: string;
  departmentSlug: string;
  machines: Machine[];
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const today = new Date().toISOString().split("T")[0];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await submitDailyLog(departmentId, departmentSlug, formData);

    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      router.refresh();
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {success && (
        <GlassCard className="border-emerald-500/30 bg-emerald-500/5">
          <p className="text-emerald-400 text-sm font-medium">
            Daily log submitted successfully
          </p>
        </GlassCard>
      )}

      {error && (
        <GlassCard className="border-red-500/30 bg-red-500/5">
          <p className="text-red-400 text-sm">{error}</p>
        </GlassCard>
      )}

      {/* Shift & Date */}
      <GlassCard>
        <h3 className="text-sm font-medium text-[#b4b4b4] uppercase tracking-wider mb-4">
          Shift Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#898989] mb-1">Date</label>
            <input
              type="date"
              name="log_date"
              defaultValue={today}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
            />
          </div>
          <div>
            <label className="block text-sm text-[#898989] mb-1">Shift</label>
            <select
              name="shift"
              required
              className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
            >
              <option value="day">Day</option>
              <option value="night">Night</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm text-[#898989] mb-1">Notes</label>
          <textarea
            name="notes"
            rows={3}
            placeholder="Enter any observations or issues..."
            className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30 resize-none"
          />
        </div>
      </GlassCard>

      {/* Machine Hours */}
      <GlassCard>
        <h3 className="text-sm font-medium text-[#b4b4b4] uppercase tracking-wider mb-4">
          Machine Hours
        </h3>
        <div className="space-y-3">
          {machines.map((machine, idx) => (
            <div key={machine.id} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[#fafafa] text-sm font-medium">
                  {machine.name}
                </p>
                <p className="text-[#898989] text-xs">{machine.machine_type}</p>
              </div>
              <input
                type="hidden"
                name={`machine_hours[${idx}].machine_id`}
                value={machine.id}
              />
              <div className="w-32">
                <input
                  type="number"
                  name={`machine_hours[${idx}].hours_worked`}
                  min="0"
                  max="24"
                  step="0.5"
                  defaultValue="0"
                  className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] text-right focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
                />
              </div>
              <span className="text-[#898989] text-sm w-12">hrs</span>
            </div>
          ))}
          {machines.length === 0 && (
            <p className="text-[#898989] text-sm">
              No active machines for this department.
            </p>
          )}
        </div>
      </GlassCard>

      {/* Fuel Logs */}
      <GlassCard>
        <h3 className="text-sm font-medium text-[#b4b4b4] uppercase tracking-wider mb-4">
          Diesel Consumption
        </h3>
        <div className="space-y-3">
          {machines.map((machine, idx) => (
            <div key={`fuel-${machine.id}`} className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-[#fafafa] text-sm font-medium">
                  {machine.name}
                </p>
              </div>
              <input
                type="hidden"
                name={`fuel_logs[${idx}].machine_id`}
                value={machine.id}
              />
              <div className="w-32">
                <input
                  type="number"
                  name={`fuel_logs[${idx}].diesel_litres`}
                  min="0"
                  step="0.1"
                  defaultValue="0"
                  className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] text-right focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
                />
              </div>
              <span className="text-[#898989] text-sm w-12">L</span>
            </div>
          ))}
          {machines.length === 0 && (
            <p className="text-[#898989] text-sm">
              No active machines for this department.
            </p>
          )}
        </div>
      </GlassCard>

      {/* Production */}
      <GlassCard>
        <h3 className="text-sm font-medium text-[#b4b4b4] uppercase tracking-wider mb-4">
          Production
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#898989] mb-1">
              Coal Removed (tonnes)
            </label>
            <input
              type="number"
              name="coal_tonnes"
              min="0"
              step="0.01"
              defaultValue="0"
              className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
            />
          </div>
          <div>
            <label className="block text-sm text-[#898989] mb-1">
              Waste Removed (tonnes)
            </label>
            <input
              type="number"
              name="waste_tonnes"
              min="0"
              step="0.01"
              defaultValue="0"
              className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
            />
          </div>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push(`/${departmentSlug}`)}
          className="px-6 py-2.5 rounded-lg border border-[#363636] text-[#898989] hover:text-[#fafafa] hover:bg-[#242424] transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-lg bg-[#0f0f0f] text-[#fafafa] font-medium hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
        >
          {loading ? "Submitting..." : "Submit Daily Log"}
        </button>
      </div>
    </form>
  );
}
