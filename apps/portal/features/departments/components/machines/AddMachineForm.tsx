"use client";

import { useState } from "react";
import { addMachine } from "~/lib/machines";
import { SecondaryButton } from "@repo/ui/SecondaryButton";
import { Input } from "@repo/ui/Input";

interface AddMachineFormProps {
  departmentId: string;
}

const DUMPER_TYPES = ["articulated dumper", "rigid dumper", "dump truck", "hauler"];

export function AddMachineForm({ departmentId }: AddMachineFormProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");
  const [machineType, setMachineType] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await addMachine(formData);

    if (result.error) {
      setError(result.error);
      setStatus("error");
    } else {
      setStatus("success");
      setOpen(false);
      window.location.reload();
    }
  }

  if (!open) {
    return (
      <SecondaryButton size="sm" onClick={() => setOpen(true)}>
        + Add Machine
      </SecondaryButton>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#363636] bg-[#242424] p-6">
      <input type="hidden" name="department_id" value={departmentId} />
      <input type="hidden" name="department_id" value={departmentId} />

      <div className="space-y-2">
        <label className="block text-sm text-[#b4b4b4]">Name</label>
        <Input
          name="name"
          required
          className="px-4 py-2.5"
          placeholder="e.g. Haul Truck 3"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-[#b4b4b4]">Type</label>
        <Input
          name="machine_type"
          required
          className="px-4 py-2.5"
          placeholder="e.g. dump_truck"
          value={machineType}
          onChange={(e) => setMachineType(e.target.value)}
        />
      </div>

      {/* Bin Factor - only for dumper types */}
      {DUMPER_TYPES.some(type => machineType.toLowerCase().includes(type)) && (
        <div className="space-y-2">
          <label className="block text-sm text-[#b4b4b4]">
            Bin Factor (BCM per load) <span className="text-red-400">*</span>
          </label>
          <Input
            name="bin_factor"
            type="number"
            step="0.1"
            min="0.1"
            required
            className="px-4 py-2.5"
            placeholder="e.g. 25.5"
          />
          <p className="text-[#898989] text-xs">
            Bank Cubic Meters per truckload. Used for BCM/hour calculations.
          </p>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm text-[#b4b4b4]">Serial Number</label>
        <Input
          name="serial_number"
          className="px-4 py-2.5"
          placeholder="e.g. HT-2024-003"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <SecondaryButton
          type="submit"
          size="sm"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Adding..." : "Add Machine"}
        </SecondaryButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-2 rounded-full text-[#898989] text-sm hover:text-[#fafafa] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
