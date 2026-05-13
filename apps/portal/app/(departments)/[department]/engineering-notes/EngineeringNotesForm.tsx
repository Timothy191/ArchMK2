"use client";

import { useState } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";

interface Machine {
  id: string;
  name: string;
  machine_type: string;
}

interface EngineeringNotesFormProps {
  departmentId: string;
  machines: Machine[];
}

const ISSUE_TYPES = [
  { value: "mechanical", label: "Mechanical", color: "#f59e0b" },
  { value: "electrical", label: "Electrical", color: "#3b82f6" },
  { value: "structural", label: "Structural", color: "#8b5cf6" },
  { value: "hydraulic", label: "Hydraulic", color: "#06b6d4" },
  { value: "other", label: "Other", color: "#6b7280" },
];

const SEVERITY_LEVELS = [
  { value: "low", label: "Low", color: "#10b981" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "high", label: "High", color: "#ef4444" },
  { value: "critical", label: "Critical", color: "#dc2626" },
];

export function EngineeringNotesForm({ departmentId, machines }: EngineeringNotesFormProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();

  const getCurrentShift = (): "day" | "night" => {
    const hour = new Date().getHours();
    return hour >= 6 && hour < 18 ? "day" : "night";
  };

  const [formData, setFormData] = useState({
    issueType: "",
    severity: "",
    machineId: "",
    shiftType: getCurrentShift(),
    description: "",
    actionTaken: "",
    requiresFollowUp: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.issueType) {
      newErrors.issueType = "Select issue type";
    }
    if (!formData.severity) {
      newErrors.severity = "Select severity";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Enter description";
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

      const { error } = await supabase.from("engineering_notes").insert({
        department_id: departmentId,
        note_date: today,
        shift_type: formData.shiftType,
        issue_type: formData.issueType,
        severity: formData.severity,
        machine_id: formData.machineId || null,
        description: formData.description,
        action_taken: formData.actionTaken || null,
        requires_follow_up: formData.requiresFollowUp,
        status: "open",
      });

      if (error) throw error;

      // Clear form
      setFormData({
        issueType: "",
        severity: "",
        machineId: "",
        shiftType: getCurrentShift(),
        description: "",
        actionTaken: "",
        requiresFollowUp: false,
      });

      router.refresh();
    } catch (err) {
      setErrors({ submit: "Failed to save. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <GlassCard>
      <form onSubmit={handleSubmit} className="space-y-6">
        <h3 className="text-lg font-medium text-[#fafafa]">
          Log Engineering Issue
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Issue Type */}
          <div className="space-y-2">
            <label className="text-[#b4b4b4] text-sm block">
              Issue Type <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.issueType}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, issueType: e.target.value }))
              }
              className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
            >
              <option value="">Select type...</option>
              {ISSUE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.issueType && (
              <p className="text-red-400 text-xs">{errors.issueType}</p>
            )}
          </div>

          {/* Severity */}
          <div className="space-y-2">
            <label className="text-[#b4b4b4] text-sm block">
              Severity <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.severity}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, severity: e.target.value }))
              }
              className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
            >
              <option value="">Select severity...</option>
              {SEVERITY_LEVELS.map((sev) => (
                <option key={sev.value} value={sev.value}>
                  {sev.label}
                </option>
              ))}
            </select>
            {errors.severity && (
              <p className="text-red-400 text-xs">{errors.severity}</p>
            )}
          </div>

          {/* Machine (Optional) */}
          <div className="space-y-2">
            <label className="text-[#b4b4b4] text-sm block">
              Affected Machine <span className="text-[#898989]">(Optional)</span>
            </label>
            <select
              value={formData.machineId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, machineId: e.target.value }))
              }
              className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors"
            >
              <option value="">No specific machine</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Shift Type */}
        <div className="space-y-2">
          <label className="text-[#b4b4b4] text-sm block">Shift</label>
          <div className="flex gap-2 max-w-xs">
            {["day", "night"].map((shift) => (
              <button
                key={shift}
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    shiftType: shift as "day" | "night",
                  }))
                }
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  formData.shiftType === shift
                    ? "bg-[#3ecf8e] text-[#171717]"
                    : "bg-[#171717] border border-[#363636] text-[#898989] hover:text-[#fafafa]"
                }`}
              >
                {shift.charAt(0).toUpperCase() + shift.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label className="text-[#b4b4b4] text-sm block">
            Description <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, description: e.target.value }))
            }
            placeholder="Describe the engineering issue..."
            rows={3}
            maxLength={500}
            className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors resize-none"
          />
          <div className="flex justify-between">
            {errors.description && (
              <p className="text-red-400 text-xs">{errors.description}</p>
            )}
            <p className="text-[#898989] text-xs ml-auto">
              {formData.description.length}/500
            </p>
          </div>
        </div>

        {/* Action Taken */}
        <div className="space-y-2">
          <label className="text-[#b4b4b4] text-sm block">
            Action Taken <span className="text-[#898989]">(Optional)</span>
          </label>
          <textarea
            value={formData.actionTaken}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, actionTaken: e.target.value }))
            }
            placeholder="What was done to address this issue?"
            rows={2}
            maxLength={300}
            className="w-full bg-[#171717] border border-[#363636] rounded-lg px-3 py-2.5 text-[#fafafa] text-sm focus:outline-none focus:border-[#3ecf8e] transition-colors resize-none"
          />
        </div>

        {/* Follow-up Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.requiresFollowUp}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                requiresFollowUp: e.target.checked,
              }))
            }
            className="w-4 h-4 rounded border-[#363636] bg-[#171717] text-[#3ecf8e] focus:ring-[#3ecf8e]"
          />
          <span className="text-[#b4b4b4] text-sm">Requires follow-up</span>
        </label>

        {/* Submit */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#3ecf8e] hover:bg-[#35b37d] disabled:bg-[#2e2e2e] disabled:text-[#898989] text-[#171717] font-medium py-2.5 px-6 rounded-lg transition-colors"
          >
            {isSubmitting ? "Saving..." : "Log Issue"}
          </button>
          {errors.submit && (
            <p className="text-red-400 text-sm">{errors.submit}</p>
          )}
        </div>
      </form>
    </GlassCard>
  );
}
