"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMachine(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const departmentId = formData.get("department_id") as string;
  const name = formData.get("name") as string;
  const machineType = formData.get("machine_type") as string;
  const serialNumber = (formData.get("serial_number") as string) || null;
  const binFactorStr = formData.get("bin_factor") as string;
  const binFactor = binFactorStr ? parseFloat(binFactorStr) : null;

  if (!departmentId || !name || !machineType) {
    return { error: "Missing required fields" };
  }

  const { error } = await supabase.from("machines").insert({
    department_id: departmentId,
    name,
    machine_type: machineType,
    serial_number: serialNumber,
    bin_factor: binFactor,
    active: true,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/[department]/machines", "page");
  return { success: true };
}
