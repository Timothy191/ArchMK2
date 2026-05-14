export interface Department {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  description: string;
  color: string;
}

export interface Employee {
  id: string;
  auth_id: string;
  department_id: string | null;
  full_name: string;
  role: "admin" | "supervisor" | "operator";
  accessible_departments: string[];
}

export interface Machine {
  id: string;
  department_id: string;
  name: string;
  machine_type: string;
  serial_number: string | null;
  active: boolean;
  bin_factor?: number | null;
}

export type Shift = "day" | "night";

export interface DailyLog {
  id: string;
  department_id: string;
  log_date: string;
  shift: Shift;
  notes: string | null;
}
