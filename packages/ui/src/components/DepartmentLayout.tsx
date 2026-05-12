'use client';
import { cn } from '../lib/utils';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export const DEPARTMENT_TABS = [
  { name: 'dashboard',  label: 'Dashboard',  icon: 'ChartBar' },
  { name: 'daily-log',  label: 'Daily Log',  icon: 'ClipboardText' },
  { name: 'machines',   label: 'Machines',   icon: 'Engine' },
  { name: 'history',    label: 'History',    icon: 'ClockCounterClockwise' },
  { name: 'reports',    label: 'Reports',    icon: 'FileText' },
  { name: 'tools',      label: 'Tools',      icon: 'Wrench' },
] as const;
import { motion } from 'framer-motion';

interface DepartmentLayoutProps {
  department: {
    name: string;
    displayName: string;
    icon: string;
    color: string;
  };
  children: React.ReactNode;
}

export function DepartmentLayout({ department, children }: DepartmentLayoutProps) {
  const pathname = usePathname();
  const basePath = `/${department.name}`;

  return (
    <div className="flex h-screen">
      <aside className="w-60 shrink-0 backdrop-blur-md bg-white/5 border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <Link href="/" className="text-white/40 text-xs hover:text-white/60 transition-colors">
            &larr; Back to Hub
          </Link>
          <h2 className="text-lg font-semibold text-white mt-2">{department.displayName}</h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {DEPARTMENT_TABS.map(tab => {
            const href = tab.name === 'dashboard' ? basePath : `${basePath}/${tab.name}`;
            const isActive = pathname === href || (tab.name === 'dashboard' && pathname === basePath);
            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-white/10 text-white border-l-2 border-blue-500'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto p-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </main>
    </div>
  );
}
