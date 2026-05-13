import { createServerSupabaseClient } from "@repo/supabase/server";

export const createEmployeeClient = () => createServerSupabaseClient();

export const createMachineClient = () => createServerSupabaseClient();
