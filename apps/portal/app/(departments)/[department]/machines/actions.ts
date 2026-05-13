"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";

export async function addMachine(formData: FormData) {
  const supabase = await createServerSupabaseClient();

  const department_id = formData.get("department_id") as string;
  const name = formData.get("name") as string;
  const machine_type = formData.get("machine_type") as string;
  const serial_number = formData.get("serial_number") as string || null;

  if (!department_id || !name || !machine_type) {
    return { error: "Name and type are required." };
  }

  const { data, error } = await supabase
    .from("machines")
    .insert({ department_id, name, machine_type, serial_number })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/(departments)/[department]/machines");
  return { id: data.id };
}
