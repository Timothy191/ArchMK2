"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import { revalidatePath } from "next/cache";
import type { CreateBreakdownInput, BookOutInput, DirectCheckoutInput } from "./types";

export async function createBreakdown(departmentId: string, input: CreateBreakdownInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("breakdowns").insert({
    department_id: departmentId,
    fleet_id: input.fleet_id.toUpperCase(),
    machine_type: input.machine_type,
    date_in: input.date_in,
    time_in: input.time_in,
    reason: input.reason,
    status: "active",
    missing_book_in: false,
    created_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/engineering/breakdowns");
  return { success: true };
}

export async function bookOutBreakdown(breakdownId: string, input: BookOutInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("breakdowns")
    .update({
      date_out: input.date_out,
      time_out: input.time_out,
      repair_notes: input.repair_notes || null,
      status: "completed",
      completed_by: user.id,
    })
    .eq("id", breakdownId);

  if (error) throw new Error(error.message);

  revalidatePath("/engineering/breakdowns");
  return { success: true };
}

export async function directCheckout(departmentId: string, input: DirectCheckoutInput) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase.from("breakdowns").insert({
    department_id: departmentId,
    fleet_id: input.fleet_id.toUpperCase(),
    machine_type: input.machine_type,
    date_in: input.date_out,
    time_in: input.time_out,
    date_out: input.date_out,
    time_out: input.time_out,
    reason: input.reason,
    repair_notes: input.repair_notes || null,
    status: "completed",
    missing_book_in: true,
    created_by: user.id,
    completed_by: user.id,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/engineering/breakdowns");
  return { success: true };
}

export async function softDeleteBreakdown(breakdownId: string) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const { error } = await supabase
    .from("breakdowns")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", breakdownId);

  if (error) throw new Error(error.message);

  revalidatePath("/engineering/breakdowns");
  return { success: true };
}
