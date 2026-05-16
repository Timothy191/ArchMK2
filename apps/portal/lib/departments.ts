export interface Department {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  color: string;
  status?: "active" | "maintenance" | "alert";
  gridSpan?: string;
  stats?: {
    label: string;
    value: string;
  };
}

export const DEPARTMENTS: Department[] = [
  {
    name: "drilling",
    displayName: "Drilling",
    icon: "Drill",
    description: "Drill rig operations & bit depth telemetry",
    color: "amber",
    status: "active",
    gridSpan: "md:col-span-2 xl:col-span-1",
    stats: { label: "Depth", value: "1,240m" },
  },
  {
    name: "production",
    displayName: "Production",
    icon: "Factory",
    description: "Coal yield, tonnage & extraction tracking",
    color: "emerald",
    status: "active",
    gridSpan: "md:col-span-1 xl:col-span-2",
    stats: { label: "Yield", value: "85%" },
  },
  {
    name: "access-control",
    displayName: "Access Control",
    icon: "ShieldCheck",
    description: "Site access, badging & security",
    color: "blue",
    status: "active",
    gridSpan: "md:col-span-1 xl:col-span-1",
    stats: { label: "On-site", value: "142" },
  },
  {
    name: "engineering",
    displayName: "Engineering",
    icon: "Wrench",
    description: "Equipment specs, maintenance & CAD",
    color: "violet",
    status: "maintenance",
    gridSpan: "md:col-span-1 xl:col-span-1",
    stats: { label: "Pending", value: "12" },
  },
  {
    name: "control-room",
    displayName: "Control Room",
    icon: "Monitor",
    description: "SCADA systems & real-time monitoring",
    color: "red",
    status: "active",
    gridSpan: "md:col-span-2 xl:col-span-1",
    stats: { label: "Alerts", value: "0" },
  },
  {
    name: "safety",
    displayName: "Safety",
    icon: "HardHat",
    description: "Incident logs, compliance & inspections",
    color: "orange",
    status: "active",
    gridSpan: "md:col-span-1 xl:col-span-1",
    stats: { label: "LTI-free", value: "450d" },
  },
  {
    name: "training",
    displayName: "Training",
    icon: "GraduationCap",
    description: "LMS, certifications & competency tracking",
    color: "cyan",
    status: "active",
    gridSpan: "md:col-span-1 xl:col-span-1",
    stats: { label: "Courses", value: "8" },
  },
  {
    name: "satellite-monitoring",
    displayName: "Satellite Monitoring",
    icon: "Satellite",
    description: "SAR/InSAR, hyperspectral & high-resolution imagery",
    color: "indigo",
    status: "active",
    gridSpan: "md:col-span-2 xl:col-span-1",
    stats: { label: "Imagery", value: "Latest" },
  },
];

export const PRODUCTIVITY_TOOLS = [
  {
    name: "tasks",
    displayName: "Tasks",
    icon: "CheckSquare",
    description: "Manage your daily to-do list",
    color: "emerald",
  },
  {
    name: "documents",
    displayName: "Documents",
    icon: "FileText",
    description: "Access shared files & templates",
    color: "blue",
  },
  {
    name: "schedule",
    displayName: "Schedule",
    icon: "Calendar",
    description: "View site-wide shift calendar",
    color: "amber",
  },
  {
    name: "calculations",
    displayName: "Calculations",
    icon: "Calculator",
    description: "Quick operational formulas",
    color: "violet",
  },
  {
    name: "notes",
    displayName: "Notes",
    icon: "StickyNote",
    description: "Personal and shared site notes",
    color: "cyan",
  },
];

export const DEPARTMENT_TABS = [
  { name: "dashboard", label: "Dashboard", icon: "BarChart2" },
  { name: "daily-log", label: "Daily Log", icon: "ClipboardList" },
  { name: "machines", label: "Machines", icon: "Cpu" },
  { name: "history", label: "History", icon: "History" },
  { name: "reports", label: "Reports", icon: "FileText" },
  { name: "tools", label: "Tools", icon: "Wrench" },
] as const;

/**
 * Control Room specific tabs - optimized for mining operations monitoring
 * with automation-focused design for operators
 */
export const CONTROL_ROOM_TABS = [
  { name: "dashboard", label: "Dashboard", icon: "BarChart2" },
  { name: "hourly-loads", label: "Hourly Loads", icon: "Clock" },
  { name: "machine-operations", label: "Machine Ops", icon: "Cpu" },
  { name: "operational-delays", label: "Delays", icon: "AlertTriangle" },
  { name: "engineering-notes", label: "Engineering", icon: "Wrench" },
  { name: "excavator-activity", label: "Excavator", icon: "Pickaxe" },
  { name: "shift-coverage", label: "Shift Coverage", icon: "CheckSquare" },
  { name: "roll-over", label: "Roll Over", icon: "GitCommit" },
  { name: "machines", label: "Machine DB", icon: "Database" },
  { name: "reports", label: "Reports", icon: "FileText" },
  { name: "satellite", label: "Satellite", icon: "Satellite" },
] as const;

export const ENGINEERING_TABS = [
  { name: "dashboard", label: "Dashboard", icon: "BarChart2" },
  { name: "breakdowns", label: "Breakdowns", icon: "AlertTriangle" },
  { name: "daily-log", label: "Daily Log", icon: "ClipboardList" },
  { name: "machines", label: "Machines", icon: "Cpu" },
  { name: "history", label: "History", icon: "History" },
  { name: "reports", label: "Reports", icon: "FileText" },
  { name: "tools", label: "Tools", icon: "Wrench" },
] as const;

export const SATELLITE_MONITORING_TABS = [
  { name: "dashboard", label: "Overview", icon: "BarChart2" },
  { name: "sar", label: "SAR / InSAR", icon: "Radio" },
  { name: "hyperspectral", label: "Hyperspectral", icon: "Layers" },
  { name: "highres", label: "High-Res", icon: "ScanSearch" },
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
  if (departmentName === "engineering") {
    return ENGINEERING_TABS;
  }
  return DEPARTMENT_TABS;
}
