"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { GlassCard } from "@repo/ui/GlassCard";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { useRouter } from "next/navigation";
import { exportToExcel, parseExcel } from "@repo/utils";
import { SecondaryButton } from "@repo/ui/SecondaryButton";
import { Download, Upload } from "lucide-react";
import { logError } from "@/lib/errors/error-logger";

const DataGrid = dynamic(
  () => import("@repo/ui/DataGrid").then((m) => m.DataGrid),
  { ssr: false },
);

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

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1);

const DAY_HOUR_LABELS = [
  "06",
  "07",
  "08",
  "09",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
];
const NIGHT_HOUR_LABELS = [
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "00",
  "01",
  "02",
  "03",
  "04",
  "05",
];

export function HourlyLoadsGrid({
  departmentId,
  machines,
  hourlyLoads,
}: HourlyLoadsGridProps) {
  const router = useRouter();
  const supabase = createBrowserSupabaseClient();
  const today = new Date().toISOString().split("T")[0];

  const loadsByMachine = new Map<string, HourlyLoad>();
  hourlyLoads.forEach((load) => {
    loadsByMachine.set(load.machine_id, load);
  });

  const [selectedShift, setSelectedShift] = useState<"day" | "night">(
    new Date().getHours() >= 6 && new Date().getHours() < 18 ? "day" : "night",
  );
  const [saving, setSaving] = useState(false);

  const hourLabels =
    selectedShift === "day" ? DAY_HOUR_LABELS : NIGHT_HOUR_LABELS;

  const getHourValue = useCallback(
    (machineId: string, hourIndex: number): number => {
      const load = loadsByMachine.get(machineId);
      if (!load || load.shift_type !== selectedShift) return 0;
      const field =
        `hour_${(hourIndex + 1).toString().padStart(2, "0")}` as keyof HourlyLoad;
      return (load[field] as number) || 0;
    },
    [loadsByMachine, selectedShift],
  );

  const getMachineTotal = useCallback(
    (machineId: string): number => {
      const load = loadsByMachine.get(machineId);
      if (!load || load.shift_type !== selectedShift) return 0;
      return load?.total_loads || 0;
    },
    [loadsByMachine, selectedShift],
  );

  // Build RevoGrid source rows (stable reference)
  const source = useMemo(() => {
    return machines.map((machine) => {
      const row: Record<string, string | number> = {
        machineName: machine.name,
        machineType: machine.machine_type,
      };
      HOURS_12.forEach((_, index) => {
        row[`hour_${(index + 1).toString().padStart(2, "0")}`] = getHourValue(
          machine.id,
          index,
        );
      });
      row.total = getMachineTotal(machine.id);
      return row;
    });
  }, [machines, loadsByMachine, selectedShift, getHourValue, getMachineTotal]);

  // Build RevoGrid columns (stable reference)
  const columns = useMemo(() => {
    const cols = [
      {
        prop: "machineName",
        name: "Machine",
        size: 160,
        pin: "colPinStart" as const,
      },
      ...HOURS_12.map((_, index) => ({
        prop: `hour_${(index + 1).toString().padStart(2, "0")}`,
        name: `${hourLabels[index]}:00`,
        size: 72,
        sortable: false,
      })),
      {
        prop: "total",
        name: "Total",
        size: 80,
        readonly: true,
      },
    ];
    return cols;
  }, [hourLabels]);

  const handleAfterEdit = useCallback(
    async (e: any) => {
      const detail = e?.detail ?? e;
      const prop: string = detail?.prop;
      const rowIndex: number = detail?.rowIndex ?? detail?.row?.index;
      const val = detail?.val;

      if (
        typeof rowIndex !== "number" ||
        !prop?.startsWith("hour_") ||
        val === undefined
      )
        return;

      const value = parseInt(String(val), 10) || 0;
      if (value < 0 || value > 100) {
        alert("Please enter a value between 0 and 100");
        router.refresh();
        return;
      }

      const machine = machines[rowIndex];
      if (!machine) return;

      setSaving(true);
      try {
        const existingLoad = hourlyLoads.find(
          (l) => l.machine_id === machine.id && l.shift_type === selectedShift,
        );

        if (existingLoad) {
          const { error } = await supabase
            .from("hourly_loads")
            .update({ [prop]: value })
            .eq("id", existingLoad.id);
          if (error) throw error;
        } else {
          const { error } = await supabase.from("hourly_loads").insert({
            department_id: departmentId,
            machine_id: machine.id,
            load_date: today,
            shift_type: selectedShift,
            [prop]: value,
          });
          if (error) throw error;
        }
        router.refresh();
      } catch (err) {
        logError(err instanceof Error ? err : new Error(String(err)), {
          context: "hourly_loads_save",
        });
        alert("Failed to save. Please try again.");
      } finally {
        setSaving(false);
      }
    },
    [
      machines,
      hourlyLoads,
      selectedShift,
      departmentId,
      today,
      supabase,
      router,
    ],
  );

  const handleExport = () => {
    const exportData = machines.map((machine) => {
      const data: any = { Machine: machine.name, Type: machine.machine_type };
      HOURS_12.forEach((_, index) => {
        const label = `${hourLabels[index]}:00`;
        data[label] = getHourValue(machine.id, index);
      });
      data.Total = getMachineTotal(machine.id);
      return data;
    });

    exportToExcel(
      exportData,
      `hourly-loads-${selectedShift}-${today}`,
      "Hourly Loads",
    );
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const data = await parseExcel(file);

      for (const row of data) {
        const machineName = row.Machine;
        const machine = machines.find((m) => m.name === machineName);
        if (!machine) continue;

        const updateData: any = {
          department_id: departmentId,
          machine_id: machine.id,
          load_date: today,
          shift_type: selectedShift,
        };

        let hasData = false;
        HOURS_12.forEach((_, index) => {
          const label = `${hourLabels[index]}:00`;
          if (row[label] !== undefined) {
            updateData[`hour_${(index + 1).toString().padStart(2, "0")}`] =
              parseInt(row[label], 10) || 0;
            hasData = true;
          }
        });

        if (hasData) {
          const { error } = await supabase
            .from("hourly_loads")
            .upsert(updateData, {
              onConflict: "department_id,machine_id,load_date,shift_type",
            });

          if (error)
            logError(new Error(error.message), {
              context: "hourly_loads_import",
              machineName,
            });
        }
      }

      router.refresh();
      alert("Import completed successfully!");
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: "hourly_loads_import_failed",
      });
      alert(
        "Failed to parse Excel file. Please ensure it follows the exported template.",
      );
    } finally {
      setSaving(false);
      if (e.target) e.target.value = "";
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
                  ? "bg-[var(--accent-blue)] text-[var(--bg-secondary)]"
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

      <DataGrid
        columns={columns}
        source={source}
        height="500px"
        resize={false}
        filter={false}
        sorting={false}
        onAfterEdit={handleAfterEdit}
      />
    </div>
  );
}
