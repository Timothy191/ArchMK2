"use client";

import { useState, useCallback } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";
import { exportToExcel, parseExcel } from "@repo/utils";
import { SecondaryButton } from "@repo/ui/SecondaryButton";
import { Download, Upload } from "lucide-react";
import { logError } from "@/lib/errors/error-logger";

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
      logError(err instanceof Error ? err : new Error(String(err)), { context: "hourly_loads_save" }).catch(() => {});
      alert("Failed to save. Please try again.");
    }
  };

  const handleExport = () => {
    const exportData = machines.map((machine) => {
      const data: any = { Machine: machine.name, Type: machine.machine_type };
      HOURS_12.forEach((hour, index) => {
        const label = `${hourLabels[index]}:00`;
        data[label] = getHourValue(machine.id, hour);
      });
      data.Total = getMachineTotal(machine.id);
      return data;
    });

    exportToExcel(
      exportData,
      `hourly-loads-${selectedShift}-${today}`,
      "Hourly Loads"
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const data = await parseExcel(file);
      
      // Process each row
      for (const row of data) {
        const machineName = row.Machine;
        const machine = machines.find(m => m.name === machineName);
        if (!machine) continue;

        const updateData: any = {
          department_id: departmentId,
          machine_id: machine.id,
          load_date: today,
          shift_type: selectedShift,
        };

        let hasData = false;
        HOURS_12.forEach((hour, index) => {
          const label = `${hourLabels[index]}:00`;
          if (row[label] !== undefined) {
            updateData[`hour_${hour.toString().padStart(2, "0")}`] = parseInt(row[label], 10) || 0;
            hasData = true;
          }
        });

        if (hasData) {
          const { error } = await supabase
            .from("hourly_loads")
            .upsert(updateData, { onConflict: "department_id,machine_id,load_date,shift_type" });
          
          if (error) logError(new Error(error.message), { context: "hourly_loads_import", machineName }).catch(() => {});
        }
      }

      router.refresh();
      alert("Import completed successfully!");
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), { context: "hourly_loads_import_failed" }).catch(() => {});
      alert("Failed to parse Excel file. Please ensure it follows the exported template.");
    } finally {
      setSaving(false);
      if (e.target) e.target.value = "";
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
        <p className="text-[var(--text-muted)] text-sm text-center py-8">
          No machines available. Add machines in the Machine DB tab first.
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      {/* Shift Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="text-[var(--text-muted)] text-sm">Shift:</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelectedShift("day")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedShift === "day"
                  ? "bg-amber-500 text-[var(--bg-secondary)]"
                  : "bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
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
                  : "bg-[var(--bg-secondary)] border border-[var(--border-default)] text-[var(--text-muted)] hover:text-[var(--text-heading)]"
              }`}
            >
              Night (18:00 - 05:59)
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="file"
            id="excel-import"
            accept=".xlsx, .xls"
            className="hidden"
            onChange={handleImport}
            aria-label="Import Excel file with hourly load data"
          />
          <SecondaryButton
            size="sm"
            variant="rounded-lg"
            onClick={() => document.getElementById("excel-import")?.click()}
            disabled={saving}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import
          </SecondaryButton>
          <SecondaryButton
            size="sm"
            variant="rounded-lg"
            onClick={handleExport}
            disabled={saving}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </SecondaryButton>
        </div>
      </div>

      <GlassCard className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="text-left text-[var(--text-muted)] text-xs font-medium p-3 border-b border-r border-[var(--border-default)] sticky left-0 bg-[var(--bg-secondary)] z-10">
                Machine
              </th>
              {HOURS_12.map((hour, index) => (
                <th
                  key={hour}
                  className="text-center text-[var(--text-muted)] text-xs font-medium p-2 border-b border-[var(--border-default)] w-14"
                >
                  {hourLabels[index]}:00
                </th>
              ))}
              <th className="text-center text-[var(--accent-cyan)] text-xs font-medium p-3 border-b border-l border-[var(--border-default)]">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id} className="hover:bg-[var(--bg-tertiary)]/50">
                <td className="p-3 border-b border-r border-[var(--border-default)] sticky left-0 bg-[var(--bg-secondary)] z-10">
                  <div>
                    <p className="text-[var(--text-heading)] text-sm font-medium">
                      {machine.name}
                    </p>
                    <p className="text-[var(--text-muted)] text-xs">{machine.machine_type}</p>
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
                      className="p-1 border-b border-[var(--border-default)] text-center"
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
                          aria-label={`Hourly load percentage for hour ${hour}`}
                          className="w-12 h-8 bg-[var(--bg-secondary)] border border-[var(--accent-cyan)] rounded text-center text-[var(--text-heading)] text-sm focus:outline-none"
                        />
                      ) : (
                        <button
                          onClick={() => handleCellClick(machine.id, hour)}
                          className={`w-12 h-8 rounded text-sm font-medium transition-colors ${
                            hasValue
                              ? "bg-[var(--accent-cyan)]/20 text-[var(--accent-cyan)] border border-[var(--accent-cyan)]/50 hover:bg-[var(--accent-cyan)]/30"
                              : "bg-[var(--bg-secondary)] text-[var(--text-muted)] border border-[var(--border-default)] hover:bg-[var(--bg-tertiary)]"
                          }`}
                        >
                          {hasValue ? value : "-"}
                        </button>
                      )}
                    </td>
                  );
                })}
                <td className="p-3 border-b border-l border-[var(--border-default)] text-center">
                  <span className="text-[var(--accent-cyan)] font-medium">
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
