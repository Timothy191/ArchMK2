import { createSupabaseClient } from '@repo/supabase';

export const createEmployeeClient = () =>
  createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );

export const createMachineClient = () =>
  createSupabaseClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!
  );
