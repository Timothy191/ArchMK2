export type { SupabaseClient } from '@supabase/supabase-js';

export interface Department {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  description: string | null;
  created_at: string;
}

export interface Employee {
  id: string;
  email: string;
  full_name: string | null;
  role: 'admin' | 'supervisor' | 'operator' | 'viewer';
  department_id: string | null;
  accessible_departments: string[];
  badge_number: string | null;
  active: boolean;
  created_at: string;
}

export interface Machine {
  id: string;
  department_id: string;
  name: string;
  machine_type: string;
  serial_number: string | null;
  active: boolean;
  created_at: string;
}

export interface DailyLog {
  id: string;
  department_id: string;
  log_date: string;
  shift: 'day' | 'night';
  supervisor_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MachineHour {
  id: string;
  daily_log_id: string;
  machine_id: string;
  hours_worked: number;
  created_at: string;
}

export interface FuelLog {
  id: string;
  daily_log_id: string;
  machine_id: string;
  diesel_litres: number;
  created_at: string;
}

export interface ProductionLog {
  id: string;
  daily_log_id: string;
  coal_tonnes: number;
  waste_tonnes: number;
  created_at: string;
}

export interface Backup {
  id: string;
  department_id: string | null;
  backup_date: string;
  file_url: string;
  file_type: 'csv' | 'json' | 'sql';
  created_by: string | null;
  created_at: string;
}
