'use server';

import { createServerSupabaseClient } from '@repo/supabase/server';
import { dailyLogFormSchema } from '../lib/schemas';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function getStringValue(value: FormDataEntryValue | undefined): string {
  return typeof value === 'string' ? value : '';
}

export async function submitDailyLog(departmentId: string, formData: FormData) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const raw = Object.fromEntries(formData.entries());

  // Parse machine hours from form entries
  const machineHours: { machine_id: string; hours_worked: number }[] = [];
  const fuelLogs: { machine_id: string; diesel_litres: number }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith('machine_hours[')) {
      const match = key.match(/machine_hours\[(\d+)\]\.(\w+)/);
      if (match && match[1] && match[2]) {
        const idx = parseInt(match[1], 10);
        const field = match[2] as 'machine_id' | 'hours_worked';
        machineHours[idx] = machineHours[idx] || { machine_id: '', hours_worked: 0 };
        if (field === 'hours_worked') {
          machineHours[idx].hours_worked = parseFloat(getStringValue(value)) || 0;
        } else {
          machineHours[idx].machine_id = getStringValue(value);
        }
      }
    }
    if (key.startsWith('fuel_logs[')) {
      const match = key.match(/fuel_logs\[(\d+)\]\.(\w+)/);
      if (match && match[1] && match[2]) {
        const idx = parseInt(match[1], 10);
        const field = match[2] as 'machine_id' | 'diesel_litres';
        fuelLogs[idx] = fuelLogs[idx] || { machine_id: '', diesel_litres: 0 };
        if (field === 'diesel_litres') {
          fuelLogs[idx].diesel_litres = parseFloat(getStringValue(value)) || 0;
        } else {
          fuelLogs[idx].machine_id = getStringValue(value);
        }
      }
    }
  }

  const parsed = dailyLogFormSchema.safeParse({
    log_date: getStringValue(raw.log_date),
    shift: getStringValue(raw.shift) as 'day' | 'night',
    notes: getStringValue(raw.notes) || undefined,
    machine_hours: machineHours.filter(m => m.machine_id && m.hours_worked > 0),
    fuel_logs: fuelLogs.filter(f => f.machine_id && f.diesel_litres > 0).length > 0 ? fuelLogs.filter(f => f.machine_id && f.diesel_litres > 0) : undefined,
    production: raw.coal_tonnes || raw.waste_tonnes ? {
      coal_tonnes: parseFloat(getStringValue(raw.coal_tonnes)) || 0,
      waste_tonnes: parseFloat(getStringValue(raw.waste_tonnes)) || 0,
    } : undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues.map(e => e.message).join(', ') };
  }

  const data = parsed.data;

  // Insert daily log
  const { data: log, error: logError } = await supabase
    .from('daily_logs')
    .insert({
      department_id: departmentId,
      log_date: data.log_date,
      shift: data.shift,
      supervisor_id: user.id,
      notes: data.notes || null,
    })
    .select()
    .single();

  if (logError) {
    return { error: logError.message };
  }

  // Insert machine hours
  if (data.machine_hours.length > 0) {
    const { error: mhError } = await supabase
      .from('machine_hours')
      .insert(data.machine_hours.map(mh => ({
        daily_log_id: log.id,
        machine_id: mh.machine_id,
        hours_worked: mh.hours_worked,
      })));
    if (mhError) return { error: mhError.message };
  }

  // Insert fuel logs
  if (data.fuel_logs && data.fuel_logs.length > 0) {
    const { error: fuelError } = await supabase
      .from('fuel_logs')
      .insert(data.fuel_logs.map(fl => ({
        daily_log_id: log.id,
        machine_id: fl.machine_id,
        diesel_litres: fl.diesel_litres,
      })));
    if (fuelError) return { error: fuelError.message };
  }

  // Insert production logs
  if (data.production) {
    const { error: prodError } = await supabase
      .from('production_logs')
      .insert({
        daily_log_id: log.id,
        coal_tonnes: data.production.coal_tonnes,
        waste_tonnes: data.production.waste_tonnes,
      });
    if (prodError) return { error: prodError.message };
  }

  revalidatePath(`/${departmentId}`);
  revalidatePath(`/${departmentId}/daily-log`);
  return { success: true };
}
