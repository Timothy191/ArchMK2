"use client";

import { useState } from "react";
import { addMachine } from "~/lib/machines";

interface AddMachineFormProps {
  departmentId: string;
}

export function AddMachineForm({ departmentId }: AddMachineFormProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

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
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 rounded-full bg-[#0f0f0f] text-[#fafafa] text-sm font-medium border border-[#363636] hover:bg-[#1a1a1a] transition-colors"
      >
        + Add Machine
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-[#363636] bg-[#242424] p-6">
      <input type="hidden" name="department_id" value={departmentId} />

      <div className="space-y-2">
        <label className="block text-sm text-[#b4b4b4]">Name</label>
        <input
          name="name"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
          placeholder="e.g. Haul Truck 3"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-[#b4b4b4]">Type</label>
        <input
          name="machine_type"
          required
          className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
          placeholder="e.g. dump_truck"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm text-[#b4b4b4]">Serial Number</label>
        <input
          name="serial_number"
          className="w-full px-4 py-2.5 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] placeholder-[#898989] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
          placeholder="e.g. HT-2024-003"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={status === "submitting"}
          className="px-4 py-2 rounded-full bg-[#0f0f0f] text-[#fafafa] text-sm font-medium border border-[#363636] hover:bg-[#1a1a1a] transition-colors disabled:opacity-50"
        >
          {status === "submitting" ? "Adding..." : "Add Machine"}
        </button>
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
