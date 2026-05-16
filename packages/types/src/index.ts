export type Shift = "day" | "night";

export type EmployeeRole = "admin" | "supervisor" | "operator" | "maintenance" | "viewer";

export type DelayCategory = {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  sort_order: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export interface Department {
  id: string;
  name: string;
  display_name: string;
  icon: string;
  description: string;
  color: string;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Employee {
  id: string;
  auth_id: string;
  department_id: string | null;
  full_name: string;
  role: EmployeeRole;
  accessible_departments: string[];
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Machine {
  id: string;
  department_id: string;
  name: string;
  machine_type: string;
  serial_number: string | null;
  bin_factor: number | null;
  site_id: string | null;
  active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface Site {
  id: string;
  name: string;
  site_code: string;
  active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MineBlock {
  id: string;
  name: string;
  code: string;
  site_id: string | null;
  active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface DailyLog {
  id: string;
  department_id: string;
  log_date: string;
  shift: Shift;
  notes: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MachineHour {
  id: string;
  daily_log_id: string;
  machine_id: string;
  hours_worked: number;
  created_at: string;
  updated_at: string | null;
}

export interface FuelLog {
  id: string;
  daily_log_id: string;
  machine_id: string;
  diesel_litres: number;
  created_at: string;
  updated_at: string | null;
}

export interface ProductionLog {
  id: string;
  daily_log_id: string;
  coal_tonnes: number;
  waste_tonnes: number;
  created_at: string;
  updated_at: string | null;
}

export interface Operator {
  id: string;
  full_name: string;
  employee_code: string;
  role: string;
  active: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface MachineOperation {
  id: string;
  department_id: string;
  machine_id: string;
  operator_id: string | null;
  site_id: string | null;
  shift_date: string;
  shift_type: Shift;
  start_time: string;
  end_time: string | null;
  hours_worked: number | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  machine?: { name: string } | null;
  operator?: { full_name: string } | null;
  site?: { name: string } | null;
}

export interface HourlyLoad {
  id: string;
  department_id: string;
  machine_id: string;
  load_date: string;
  shift_type: Shift;
  hour_01: number;
  hour_02: number;
  hour_03: number;
  hour_04: number;
  hour_05: number;
  hour_06: number;
  hour_07: number;
  hour_08: number;
  hour_09: number;
  hour_10: number;
  hour_11: number;
  hour_12: number;
  total_loads: number;
  created_at: string;
  updated_at: string;
}

export interface EngineeringNote {
  id: string;
  department_id: string;
  note_date: string;
  shift_type: Shift;
  issue_type: "mechanical" | "electrical" | "structural" | "hydraulic" | "other";
  severity: "low" | "medium" | "high" | "critical";
  machine_id: string | null;
  description: string;
  action_taken: string;
  requires_follow_up: boolean;
  status: "open" | "in_progress" | "resolved" | "closed";
  resolved_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OperationalDelay {
  id: string;
  department_id: string;
  delay_date: string;
  shift_type: Shift;
  delay_category_id: string | null;
  delay_type: "equipment" | "weather" | "safety" | "material" | "shift_change" | "operator" | "other";
  affected_machine_id: string | null;
  delay_minutes: number;
  description: string;
  impact_description: string;
  recovery_action: string | null;
  status: "active" | "recovered" | "extended";
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExcavatorActivity {
  id: string;
  department_id: string;
  machine_id: string;
  operator_id: string | null;
  activity_date: string;
  shift_type: Shift;
  passes: number;
  loads: number;
  avg_cycle_time_seconds: number | null;
  material_type: string | null;
  estimated_tonnes: number | null;
  notes: string | null;
  site_id: string | null;
  block_mined_id: string | null;
  created_at: string;
  updated_at: string;
  machine?: { name: string } | null;
  operator?: { full_name: string } | null;
  site?: { name: string } | null;
  block_mined?: { name: string; code: string } | null;
}

export interface ExcavatorDumperAssignment {
  id: string;
  excavator_activity_id: string;
  dumper_machine_id: string;
  material_type: string;
  total_loads: number;
  total_bcm: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  dumper?: {
    name: string;
    bin_factor: number | null;
    machine_type: string;
  } | null;
}

export interface DozerRoll {
  id: string;
  department_id: string;
  machine_id: string;
  operator_id: string | null;
  roll_date: string;
  shift_type: Shift;
  blade_passes: number;
  push_count: number;
  area_covered_sqm: number | null;
  material_moved_tonnes: number | null;
  hours_operated: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Breakdown {
  id: string;
  department_id: string;
  fleet_id: string;
  machine_type: string;
  date_in: string;
  time_in: string;
  date_out: string | null;
  time_out: string | null;
  reason: string;
  repair_notes: string | null;
  status: "active" | "completed";
  missing_book_in: boolean;
  created_by: string | null;
  completed_by: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type SafetySeverityLevel = "low" | "medium" | "high" | "critical";

export interface SafetySeverity {
  id: string;
  level: SafetySeverityLevel;
  weight: number;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface SafetyIncidentCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
}

export interface SafetyIncident {
  id: string;
  department_id: string;
  incident_date: string;
  shift_type: Shift;
  category_id: string | null;
  severity_id: string | null;
  incident_type: "near-miss" | "incident" | "lost-time" | "equipment-damage";
  description: string;
  location: string;
  injured_parties: number;
  reported_by: string | null;
  reviewed_by: string | null;
  root_cause: string;
  corrective_action: string;
  status: "open" | "under-investigation" | "resolved" | "closed";
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string | null;
  report_type: string;
  auto_generate: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string | null;
}

export interface GeneratedReport {
  id: string;
  template_id: string | null;
  department_id: string;
  report_date: string;
  shift_type: string | null;
  report_data: Record<string, unknown>;
  pdf_url: string | null;
  generated_by: string;
  generated_at: string;
  updated_at: string | null;
}

export interface AuditLog {
  id: string;
  action: "insert" | "update" | "delete";
  table_name: string;
  record_id: string | null;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  performed_by: string | null;
  department_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type MemoryType = "episodic" | "semantic" | "procedural";

export interface MemoryEmbedding {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  embedding: number[];
  metadata: Record<string, unknown>;
  memory_type: MemoryType;
  created_at: string;
  updated_at: string;
}

export interface HybridSearchResult {
  id: string;
  session_id: string;
  content: string;
  metadata: Record<string, unknown>;
  memory_type: MemoryType;
  created_at: string;
  semantic_score: number;
  keyword_score: number;
  temporal_score: number;
  combined_score: number;
}
