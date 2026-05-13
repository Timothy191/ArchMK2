"use client";

import { useState, useCallback } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";

interface Machine {
  id: string;
  name: string;
  machine_type: string;
}

interface HourlyLoad {
  id: string;
  machine_id: string;
  shift_type: "day" | "night";
  hour_01: number;
  hour_02: number;
  hour_03: number;
  hour_04: number;
  hour_05: number;
  hour_06: number;
  hour_07: number;
  hour_08: number;
  hour_09: number;
  hour_10: number;
  hour_11: number;
  hour_12: number;
  total_loads: number;
}

interface HourlyLoadsGridProps {
  departmentId: string;
  machines: Machine[];
  hourlyLoads: HourlyLoad[];
}

// 12 hours per shift
// Day shift: 06:00-17:59
// Night shift: 18:00-05:59
const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);

const DAY_HOUR_LABELS = ["06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17"];
const NIGHT_HOUR_LABELS = ["18", "19", "20", "21", "22", "23", "00", "01", "02", "03", "04", "05"];

export function HourlyLoadsGrid({
  departmentId,
  machines,
  hourlyLoads,
}: HourlyLoadsGridProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  // Create a map for quick lookup
  const loadsByMachine = new Map<string, HourlyLoad>();
  hourlyLoads.forEach((load) => {
    loadsByMachine.set(load.machine_id, load);
  });

  const [selectedShift, setSelectedShift] = useState<"day" | "night">(
    new Date().getHours() >= 6 && new Date().getHours() < 18 ? "day" : "night"
  );
  const [editingCell, setEditingCell] = useState<{
    machineId: string;
    hour: number;
  } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  // Get hour labels based on shift
  const hourLabels = selectedShift === "day" ? DAY_HOUR_LABELS : NIGHT_HOUR_LABELS;

  const getHourValue = useCallback(
    (machineId: string, hourIndex: number): number => {
      const load = loadsByMachine.get(machineId);
      if (!load || load.shift_type !== selectedShift) return 0;
      const hourField = `hour_${hourIndex.toString().padStart(2, "0")}` as keyof HourlyLoad;
      return (load[hourField] as number) || 0;
    },
    [loadsByMachine]
  );

  const getMachineTotal = useCallback(
    (machineId: string): number => {
      const load = loadsByMachine.get(machineId);
      if (!load || load.shift_type !== selectedShift) return 0;
      return load?.total_loads || 0;
    },
    [loadsByMachine, selectedShift]
  );

  const handleCellClick = (machineId: string, hour: number) => {
    setEditingCell({ machineId, hour });
    setEditValue(getHourValue(machineId, hour).toString());
  };

  const handleSave = async () => {
    if (!editingCell) return;

    const value = parseInt(editValue, 10) || 0;
    if (value < 0 || value > 100) {
      alert("Please enter a value between 0 and 100");
      return;
    }

    setSaving(true);

    try {
      const { machineId, hour } = editingCell;
      // Find existing load for this machine, date, and shift
      const existingLoad = hourlyLoads.find(
        l => l.machine_id === machineId && l.shift_type === selectedShift
      );
      const hourField = `hour_${hour.toString().padStart(2, "0")}`;

      if (existingLoad) {
        // Update existing record
        const { error } = await supabase
          .from("hourly_loads")
          .update({ [hourField]: value })
          .eq("id", existingLoad.id);

        if (error) throw error;
      } else {
        // Insert new record with shift_type
        const { error } = await supabase.from("hourly_loads").insert({
          department_id: departmentId,
          machine_id: machineId,
          load_date: today,
          shift_type: selectedShift,
          [hourField]: value,
        });

        if (error) throw error;
      }

      setEditingCell(null);
      setEditValue("");
      router.refresh();
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setEditingCell(null);
      setEditValue("");
    }
  };

  if (machines.length === 0) {
    return (
      <GlassCard>
        <p className="text-[#898989] text-sm text-center py-8">
          No machines available. Add machines in the Machine DB tab first.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shift Selector */}
      <div className="flex items-center gap-4">
        <span className="text-[#898989] text-sm">Shift:</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSelectedShift("day")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedShift === "day"
                ? "bg-amber-500 text-[#171717]"
                : "bg-[#171717] border border-[#363636] text-[#898989] hover:text-[#fafafa]"
            }`}
          >
            Day (06:00 - 17:59)
          </button>
          <button
            type="button"
            onClick={() => setSelectedShift("night")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedShift === "night"
                ? "bg-blue-500 text-white"
                : "bg-[#171717] border border-[#363636] text-[#898989] hover:text-[#fafafa]"
            }`}
          >
            Night (18:00 - 05:59)
          </button>
        </div>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[#898989] text-xs font-medium p-3 border-b border-r border-[#363636] sticky left-0 bg-[#1f1f1f] z-10">
                Machine
              </th>
              {HOURS_12.map((hour, index) => (
                <th
                  key={hour}
                  className="text-center text-[#898989] text-xs font-medium p-2 border-b border-[#363636] w-14"
                >
                  {hourLabels[index]}:00
                </th>
              ))}
              <th className="text-center text-[#3ecf8e] text-xs font-medium p-3 border-b border-l border-[#363636]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id} className="hover:bg-[#242424]/50">
                <td className="p-3 border-b border-r border-[#363636] sticky left-0 bg-[#1f1f1f] z-10">
                  <div>
                    <p className="text-[#fafafa] text-sm font-medium">
                      {machine.name}
                    </p>
                    <p className="text-[#898989] text-xs">{machine.machine_type}</p>
                  </div>
                </td>
                {HOURS_12.map((hour) => {
                  const value = getHourValue(machine.id, hour);
                  const isEditing =
                    editingCell?.machineId === machine.id &&
                    editingCell?.hour === hour;
                  const hasValue = value > 0;

                  return (
                    <td
                      key={hour}
                      className="p-1 border-b border-[#363636] text-center"
                    >
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSave}
                          disabled={saving}
                          autoFocus
                          className="w-12 h-8 bg-[#171717] border border-[#3ecf8e] rounded text-center text-[#fafafa] text-sm focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(machine.id, hour)}
                          className={`w-12 h-8 rounded text-sm font-medium transition-colors ${
                            hasValue
                              ? "bg-[#3ecf8e]/20 text-[#3ecf8e] border border-[#3ecf8e]/50 hover:bg-[#3ecf8e]/30"
                              : "bg-[#171717] text-[#898989] border border-[#363636] hover:bg-[#242424]"
                          }`}
                        >
                          {hasValue ? value : "-"}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="p-3 border-b border-l border-[#363636] text-center">
                  <span className="text-[#3ecf8e] font-semibold">
                    {getMachineTotal(machine.id)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </GlassCard>
    </div>
  );
}
