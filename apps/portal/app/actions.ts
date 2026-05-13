"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import { dailyLogFormSchema } from "../lib/schemas";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function getStringValue(value: FormDataEntryValue | undefined): string {
  return typeof value === "string" ? value : "";
}

export async function submitDailyLog(departmentId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const raw = Object.fromEntries(formData.entries());

  // Parse machine hours from form entries
  const machineHours: { machine_id: string; hours_worked: number }[] = [];
  const fuelLogs: { machine_id: string; diesel_litres: number }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("machine_hours[")) {
      const match = key.match(/machine_hours\[(\d+)\]\.(\w+)/);
      if (match && match[1] && match[2]) {
        const idx = parseInt(match[1], 10);
        const field = match[2] as "machine_id" | "hours_worked";
        machineHours[idx] = machineHours[idx] || {
          machine_id: "",
          hours_worked: 0,
        };
        if (field === "hours_worked") {
          machineHours[idx].hours_worked = parseFloat(getStringValue(value));
        } else {
          machineHours[idx].machine_id = getStringValue(value);
        }
      }
    }
    if (key.startsWith("fuel_logs[")) {
      const match = key.match(/fuel_logs\[(\d+)\]\.(\w+)/);
      if (match && match[1] && match[2]) {
        const idx = parseInt(match[1], 10);
        const field = match[2] as "machine_id" | "diesel_litres";
        fuelLogs[idx] = fuelLogs[idx] || { machine_id: "", diesel_litres: 0 };
        if (field === "diesel_litres") {
          fuelLogs[idx].diesel_litres = parseFloat(getStringValue(value));
        } else {
          fuelLogs[idx].machine_id = getStringValue(value);
        }
      }
    }
  }

  const parsed = dailyLogFormSchema.safeParse({
    log_date: getStringValue(raw.log_date),
    shift: getStringValue(raw.shift) as "day" | "night",
    notes: getStringValue(raw.notes) || undefined,
    machine_hours: machineHours.filter(
      (m) => m.machine_id && m.hours_worked > 0,
    ),
    fuel_logs:
      fuelLogs.filter((f) => f.machine_id && f.diesel_litres > 0).length > 0
        ? fuelLogs.filter((f) => f.machine_id && f.diesel_litres > 0)
        : undefined,
    production:
      raw.coal_tonnes || raw.waste_tonnes
        ? {
            coal_tonnes: parseFloat(getStringValue(raw.coal_tonnes)),
            waste_tonnes: parseFloat(getStringValue(raw.waste_tonnes)),
          }
        : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map((e) => e.message).join(", ") };
  }

  const data = parsed.data;

  // Use atomic Postgres function for transaction safety
  const { data: logId, error: rpcError } = await supabase.rpc(
    "submit_daily_log",
    {
      p_department_id: departmentId,
      p_log_date: data.log_date,
      p_shift: data.shift,
      p_supervisor_id: user.id,
      p_notes: data.notes || null,
      p_machine_hours:
        data.machine_hours.length > 0
          ? JSON.stringify(data.machine_hours)
          : null,
      p_fuel_logs:
        data.fuel_logs && data.fuel_logs.length > 0
          ? JSON.stringify(data.fuel_logs)
          : null,
      p_production: data.production ? JSON.stringify(data.production) : null,
    },
  );

  if (rpcError) {
    return { error: rpcError.message };
  }

  // Revalidate with slug (departmentId is the UUID; caller passes slug via separate param if needed)
  // We don't know the slug here from UUID without a DB lookup, so we revalidate generically
  // The daily-log page will handle its own revalidation via client refresh
  return { success: true, logId };
}
