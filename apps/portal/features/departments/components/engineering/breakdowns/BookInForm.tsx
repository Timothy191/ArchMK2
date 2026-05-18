"use client";

import { useState, useTransition } from "react";
import { ClipboardPlus, ClipboardList } from "lucide-react";
import { createBreakdown } from "./actions";
import { MACHINE_TYPES, type Breakdown } from "./types";

interface BookInFormProps {
  departmentId: string;
  activeBreakdowns: Breakdown[];
}

export function BookInForm({ departmentId, activeBreakdowns }: BookInFormProps) {
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    fleet_id: "",
    date_in: new Date().toISOString().split("T")[0] ?? "",
    time_in: new Date().toTimeString().slice(0, 5),
    machine_type: "",
    reason: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!formData.fleet_id.trim()) {
      setMessage({ type: "error", text: "Fleet ID is required" });
      return;
    }
    if (!formData.machine_type) {
      setMessage({ type: "error", text: "Machine type is required" });
      return;
    }
    if (!formData.reason.trim() || formData.reason.length < 5) {
      setMessage({ type: "error", text: "Reason must be at least 5 characters" });
      return;
    }

    startTransition(async () => {
      try {
        await createBreakdown(departmentId, formData);
        setMessage({ type: "success", text: "Machine registered successfully!" });
        
        // Trigger n8n workflow for breakdown alert
        import("@repo/utils").then(({ triggerWorkflow }) => {
          triggerWorkflow("machine-breakdown", {
            department_id: departmentId,
            fleet_id: formData.fleet_id,
            machine_type: formData.machine_type,
            reason: formData.reason,
            status: "active",
          });
        });

        setFormData({
          fleet_id: "",
          date_in: new Date().toISOString().split("T")[0] ?? "",
          time_in: new Date().toTimeString().slice(0, 5),
          machine_type: "",
          reason: "",
        });
      } catch (err) {
        setMessage({ type: "error", text: "Failed to register breakdown." });
      }
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form */}
      <div className="rounded-xl border border-[#363636] bg-[#242424] p-6">
        <div className="flex items-center gap-3 mb-5">
          <ClipboardPlus className="w-5 h-5 text-violet-400" />
          <h3 className="text-lg font-medium text-white">Book In Machine</h3>
        </div>

        {message && (
          <div
            className={`mb-4 px-4 py-3 rounded-lg border text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-red-500/10 border-red-500/20 text-red-400"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-[#898989] mb-1.5">Fleet ID</label>
            <input
              required
              value={formData.fleet_id}
              onChange={(e) => setFormData({ ...formData, fleet_id: e.target.value })}
              placeholder="e.g. FL-123"
              className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] text-sm placeholder:text-[#555] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-[#898989] mb-1.5">Date In</label>
              <input
                type="date"
                required
                aria-label="Date In"
                value={formData.date_in}
                onChange={(e) => setFormData({ ...formData, date_in: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm text-[#898989] mb-1.5">Time In</label>
              <input
                type="time"
                required
                aria-label="Time In"
                value={formData.time_in}
                onChange={(e) => setFormData({ ...formData, time_in: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-[#898989] mb-1.5">Machine Type</label>
            <select
              required
              aria-label="Machine Type"
              value={formData.machine_type}
              onChange={(e) => setFormData({ ...formData, machine_type: e.target.value })}
              className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors"
            >
              <option value="">Select Type</option>
              {MACHINE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-[#898989] mb-1.5">Breakdown Reason</label>
            <textarea
              required
              rows={3}
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Describe the issue..."
              className="w-full px-3 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] text-sm placeholder:text-[#555] focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-colors resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? "Registering..." : "Register Breakdown"}
          </button>
        </form>
      </div>

      {/* Active List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-violet-400" />
            <h3 className="text-lg font-medium text-white">Active Breakdowns</h3>
          </div>
          <span className="text-[#898989] text-sm">
            {activeBreakdowns.length} machines
          </span>
        </div>

        <div className="rounded-xl border border-[#363636] bg-[#242424] overflow-hidden">
          {activeBreakdowns.length === 0 ? (
            <div className="p-8 text-center text-[#898989] text-sm">
              No active breakdowns. All machines operational.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#363636]">
                    <th className="text-left px-4 py-3 text-[#898989] text-xs uppercase tracking-wide font-medium">
                      Fleet ID
                    </th>
                    <th className="text-left px-4 py-3 text-[#898989] text-xs uppercase tracking-wide font-medium">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-[#898989] text-xs uppercase tracking-wide font-medium">
                      Date In
                    </th>
                    <th className="text-left px-4 py-3 text-[#898989] text-xs uppercase tracking-wide font-medium">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeBreakdowns.map((b) => (
                    <tr
                      key={b.id}
                      className="border-b border-[#363636] last:border-0 hover:bg-[#2e2e2e] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#fafafa] font-medium">
                        {b.fleet_id}
                      </td>
                      <td className="px-4 py-3 text-[#ccc]">{b.machine_type}</td>
                      <td className="px-4 py-3 text-[#ccc] whitespace-nowrap">
                        {b.date_in}
                      </td>
                      <td className="px-4 py-3 text-[#ccc] max-w-[200px] truncate">
                        {b.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
