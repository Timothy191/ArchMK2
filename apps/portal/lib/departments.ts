export interface Department {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  color: string;
}

export const DEPARTMENTS: Department[] = [
  {
    name: "drilling",
    displayName: "Drilling",
    icon: "Drill",
    description: "Drill rig operations & bit depth telemetry",
    color: "amber",
  },
  {
    name: "production",
    displayName: "Production",
    icon: "Factory",
    description: "Coal yield, tonnage & extraction tracking",
    color: "emerald",
  },
  {
    name: "access-control",
    displayName: "Access Control",
    icon: "ShieldCheck",
    description: "Site access, badging & security",
    color: "blue",
  },
  {
    name: "engineering",
    displayName: "Engineering",
    icon: "Wrench",
    description: "Equipment specs, maintenance & CAD",
    color: "violet",
  },
  {
    name: "control-room",
    displayName: "Control Room",
    icon: "Monitor",
    description: "SCADA systems & real-time monitoring",
    color: "red",
  },
  {
    name: "safety",
    displayName: "Safety",
    icon: "HardHat",
    description: "Incident logs, compliance & inspections",
    color: "orange",
  },
  {
    name: "training",
    displayName: "Training",
    icon: "GraduationCap",
    description: "LMS, certifications & competency tracking",
    color: "cyan",
  },
  {
    name: "satellite-monitoring",
    displayName: "Satellite Monitoring",
    icon: "Satellite",
    description: "SAR/InSAR, hyperspectral & high-resolution imagery",
    color: "indigo",
  },
];

export const DEPARTMENT_TABS = [
  { name: "dashboard", label: "Dashboard", icon: "ChartBar" },
  { name: "daily-log", label: "Daily Log", icon: "ClipboardText" },
  { name: "machines", label: "Machines", icon: "Engine" },
  { name: "history", label: "History", icon: "ClockCounterClockwise" },
  { name: "reports", label: "Reports", icon: "FileText" },
  { name: "tools", label: "Tools", icon: "Wrench" },
] as const;

/**
 * Control Room specific tabs - optimized for mining operations monitoring
 * with automation-focused design for operators
 */
export const CONTROL_ROOM_TABS = [
  { name: "dashboard", label: "Dashboard", icon: "ChartBar" },
  { name: "hourly-loads", label: "Hourly Loads", icon: "Clock" },
  { name: "machine-operations", label: "Machine Ops", icon: "Engine" },
  { name: "operational-delays", label: "Delays", icon: "AlertTriangle" },
  { name: "engineering-notes", label: "Engineering", icon: "Wrench" },
  { name: "excavator-activity", label: "Excavator", icon: "Pickaxe" },
  { name: "roll-over", label: "Roll Over", icon: "GitCommitHorizontal" },
  { name: "machines", label: "Machine DB", icon: "Database" },
  { name: "reports", label: "Reports", icon: "FileText" },
  { name: "satellite", label: "Satellite", icon: "Satellite" },
] as const;

export const SATELLITE_MONITORING_TABS = [
  { name: "dashboard", label: "Overview", icon: "ChartBar" },
  { name: "sar", label: "SAR / InSAR", icon: "ChartBar" },
  { name: "hyperspectral", label: "Hyperspectral", icon: "ChartBar" },
  { name: "highres", label: "High-Res", icon: "ChartBar" },
] as const;

export type DepartmentTab = typeof DEPARTMENT_TABS[number];
export type ControlRoomTab = typeof CONTROL_ROOM_TABS[number];

/**
 * Get tabs for a specific department
 * Control Room gets specialized tabs, others get standard tabs
 */
export function getDepartmentTabs(departmentName: string) {
  if (departmentName === "control-room") {
    return CONTROL_ROOM_TABS;
  }
  if (departmentName === "satellite-monitoring") {
    return SATELLITE_MONITORING_TABS;
  }
  return DEPARTMENT_TABS;
}
