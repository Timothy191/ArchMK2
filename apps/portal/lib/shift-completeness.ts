import type { createServerSupabaseClient } from "@repo/supabase/server";
import { withCache } from "@/lib/cache-utils";
import { CacheCategory } from "@repo/redis";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export type RequiredForm =
  | "machine-operations"
  | "excavator-activity"
  | "roll-over"
  | "hourly-loads";

export interface MachineCoverageStatus {
  machineId: string;
  machineName: string;
  machineType: string;
  requiredForm: RequiredForm;
  formLabel: string;
  formPath: string;
  hasEntry: boolean;
  exempt: boolean;
  hoursWorked?: number | null;
}

export interface ShiftCompleteness {
  complete: boolean;
  totalRequired: number;
  totalCovered: number;
  statuses: MachineCoverageStatus[];
}

const DUMPER_KEYWORDS = ["dump truck", "dumper", "haul truck"];
const DOZER_KEYWORDS = ["dozer", "bulldozer"];
const EXCAVATOR_KEYWORDS = ["excavator", "excavation"];

function machineTypeLC(t: string) {
  return t.toLowerCase();
}

function requiredFormFor(machineType: string): RequiredForm {
  const t = machineTypeLC(machineType);
  if (EXCAVATOR_KEYWORDS.some((k) => t.includes(k)))
    return "excavator-activity";
  if (DOZER_KEYWORDS.some((k) => t.includes(k))) return "roll-over";
  if (DUMPER_KEYWORDS.some((k) => t.includes(k))) return "hourly-loads";
  return "machine-operations";
}

const FORM_META: Record<RequiredForm, { label: string; path: string }> = {
  "machine-operations": {
    label: "Machine Operations",
    path: "machine-operations",
  },
  "excavator-activity": {
    label: "Excavator Activity",
    path: "excavator-activity",
  },
  "roll-over": { label: "Roll-Over (Dozers)", path: "roll-over" },
  "hourly-loads": { label: "Hourly Loads", path: "hourly-loads" },
};

export async function getShiftCompleteness(
  supabase: SupabaseClient,
  deptId: string,
  departmentSlug: string | null,
  date: string,
  shift: "day" | "night",
): Promise<ShiftCompleteness> {
  return withCache(
    async () => {
      const [
        { data: machines },
        { data: machineOps },
        { data: excavatorActs },
        { data: dozerRolls },
        { data: hourlyLoads },
      ] = await Promise.all([
        supabase
          .from("machines")
          .select("id, name, machine_type, report_exempt")
          .eq("department_id", deptId)
          .eq("active", true)
          .order("name"),
        supabase
          .from("machine_operations")
          .select("machine_id, hours_worked")
          .eq("department_id", deptId)
          .eq("shift_date", date)
          .eq("shift_type", shift),
        supabase
          .from("excavator_activity")
          .select("machine_id")
          .eq("department_id", deptId)
          .eq("activity_date", date)
          .eq("shift_type", shift),
        supabase
          .from("dozer_rolls")
          .select("machine_id, hours_operated")
          .eq("department_id", deptId)
          .eq("roll_date", date)
          .eq("shift_type", shift),
        supabase
          .from("hourly_loads")
          .select("machine_id, total_loads")
          .eq("department_id", deptId)
          .eq("load_date", date)
          .eq("shift_type", shift),
      ]);

      const machineOpIds = new Set(
        (machineOps ?? []).map((r: { machine_id: string }) => r.machine_id),
      );
      const excavatorIds = new Set(
        (excavatorActs ?? []).map((r: { machine_id: string }) => r.machine_id),
      );
      const dozerIds = new Set(
        (dozerRolls ?? []).map((r: { machine_id: string }) => r.machine_id),
      );
      const loadIds = new Set(
        (hourlyLoads ?? [])
          .filter(
            (r: { machine_id: string; total_loads: number | null }) =>
              (r.total_loads ?? 0) > 0,
          )
          .map(
            (r: { machine_id: string; total_loads: number | null }) =>
              r.machine_id,
          ),
      );

      const machineOpHoursMap = new Map<string, number>();
      for (const op of machineOps ?? []) {
        if (op.machine_id && op.hours_worked !== null) {
          const current = machineOpHoursMap.get(op.machine_id) || 0;
          machineOpHoursMap.set(
            op.machine_id,
            current + Number(op.hours_worked),
          );
        }
      }

      const dozerHoursMap = new Map<string, number>();
      for (const roll of dozerRolls ?? []) {
        if (roll.machine_id && roll.hours_operated !== null) {
          const current = dozerHoursMap.get(roll.machine_id) || 0;
          dozerHoursMap.set(
            roll.machine_id,
            current + Number(roll.hours_operated),
          );
        }
      }

      const statuses: MachineCoverageStatus[] = (machines ?? []).map(
        (m: {
          id: string;
          name: string;
          machine_type: string;
          report_exempt: boolean | null;
        }) => {
          const requiredForm = requiredFormFor(m.machine_type);
          const meta = FORM_META[requiredForm];

          let hasEntry: boolean;
          switch (requiredForm) {
            case "excavator-activity":
              hasEntry = excavatorIds.has(m.id);
              break;
            case "roll-over":
              hasEntry = dozerIds.has(m.id);
              break;
            case "hourly-loads":
              hasEntry = loadIds.has(m.id);
              break;
            default:
              hasEntry = machineOpIds.has(m.id);
          }

          let hoursWorked: number | null = null;
          if (requiredForm === "machine-operations") {
            hoursWorked = machineOpHoursMap.get(m.id) ?? null;
          } else if (requiredForm === "roll-over") {
            hoursWorked = dozerHoursMap.get(m.id) ?? null;
          }

          return {
            machineId: m.id,
            machineName: m.name,
            machineType: m.machine_type,
            requiredForm,
            formLabel: meta.label,
            formPath: departmentSlug
              ? `/${departmentSlug}/${meta.path}`
              : `/${meta.path}`,
            hasEntry,
            exempt: m.report_exempt ?? false,
            hoursWorked,
          };
        },
      );

      const required = statuses.filter((s) => !s.exempt);
      const covered = required.filter((s) => s.hasEntry);

      return {
        complete: required.length === 0 || covered.length === required.length,
        totalRequired: required.length,
        totalCovered: covered.length,
        statuses,
      };
    },
    {
      category: CacheCategory.SHIFT,
      keyParts: [deptId, date, shift],
      tags: [
        `dept:${deptId}`,
        "table:machines",
        "table:machine_operations",
        "table:excavator_activity",
        "table:dozer_rolls",
        "table:hourly_loads",
      ],
    },
  );
}
