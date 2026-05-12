export interface Department {
  name: string;
  displayName: string;
  icon: string;
  description: string;
  color: string;
}

export const DEPARTMENTS: Department[] = [
  { name: 'drilling',       displayName: 'Drilling',       icon: 'Drill',           description: 'Drill rig operations & bit depth telemetry',  color: 'amber' },
  { name: 'production',     displayName: 'Production',     icon: 'Factory',         description: 'Coal yield, tonnage & extraction tracking',   color: 'emerald' },
  { name: 'access-control', displayName: 'Access Control', icon: 'ShieldCheck',     description: 'Site access, badging & security',              color: 'blue' },
  { name: 'engineering',    displayName: 'Engineering',    icon: 'Wrench',          description: 'Equipment specs, maintenance & CAD',           color: 'violet' },
  { name: 'control-room',   displayName: 'Control Room',  icon: 'Monitor',         description: 'SCADA systems & real-time monitoring',         color: 'red' },
  { name: 'safety',         displayName: 'Safety',         icon: 'HardHat',         description: 'Incident logs, compliance & inspections',       color: 'orange' },
  { name: 'training',       displayName: 'Training',      icon: 'GraduationCap',   description: 'LMS, certifications & competency tracking',    color: 'cyan' },
];

export const DEPARTMENT_TABS = [
  { name: 'dashboard',  label: 'Dashboard',  icon: 'ChartBar' },
  { name: 'daily-log',  label: 'Daily Log',  icon: 'ClipboardText' },
  { name: 'machines',   label: 'Machines',   icon: 'Engine' },
  { name: 'history',    label: 'History',    icon: 'ClockCounterClockwise' },
  { name: 'reports',    label: 'Reports',    icon: 'FileText' },
  { name: 'tools',      label: 'Tools',      icon: 'Wrench' },
] as const;
