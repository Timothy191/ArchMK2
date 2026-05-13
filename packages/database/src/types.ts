export type Department = {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  description: string;
  color: string;
  created_at: string;
};

export type Employee = {
  id: string;
  auth_id: string;
  department_id: string;
  full_name: string;
  role: string;
  accessible_departments: string[];
  created_at: string;
};

export type Machine = {
  id: string;
  department_id: string;
  name: string;
  machine_type: string;
  serial_number: string | null;
  active: boolean;
  created_at: string;
};

export type DailyLog = {
  id: string;
  department_id: string;
  log_date: string;
  shift: "day" | "night";
  notes: string | null;
  created_at: string;
};

export type MachineHour = {
  id: string;
  daily_log_id: string;
  machine_id: string;
  hours_worked: number;
  created_at: string;
};

export type FuelLog = {
  id: string;
  daily_log_id: string;
  machine_id: string;
  diesel_litres: number;
  created_at: string;
};

export type ProductionLog = {
  id: string;
  daily_log_id: string;
  coal_tonnes: number;
  waste_tonnes: number;
  created_at: string;
};
