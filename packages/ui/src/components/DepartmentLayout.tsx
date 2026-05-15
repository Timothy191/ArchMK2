"use client";

import { cn } from "../lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart2,
  Clock,
  Cpu,
  AlertTriangle,
  Wrench,
  Pickaxe,
  GitCommit,
  Database,
  FileText,
  Satellite,
  ClipboardList,
  History,
  Radio,
  Layers,
  ScanSearch,
} from "lucide-react";
import type { LucideProps } from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  BarChart2,
  Clock,
  Cpu,
  AlertTriangle,
  Wrench,
  Pickaxe,
  GitCommit,
  Database,
  FileText,
  Satellite,
  ClipboardList,
  History,
  Radio,
  Layers,
  ScanSearch,
};

interface Tab {
  name: string;
  label: string;
  icon: string;
}

interface DepartmentLayoutProps {
  department: {
    name: string;
    displayName: string;
    icon: string;
    color: string;
  };
  tabs: readonly Tab[];
  children: React.ReactNode;
}

export function DepartmentLayout({
  department,
  tabs,
  children,
}: DepartmentLayoutProps) {
  const pathname = usePathname();
  const basePath = `/${department.name}`;

  return (
    <div className="flex h-screen">
      <aside className="w-64 shrink-0 border-r border-[var(--border-default)] bg-[var(--bg-primary)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-default)] bg-[var(--card)]/50 backdrop-blur-sm">
          <Link
            href="/"
            className="flex items-center gap-2 text-[var(--text-muted)] text-[10px] uppercase tracking-widest font-bold hover:text-[var(--text-heading)] transition-colors group"
          >
            <span className="group-hover:-translate-x-1 transition-transform">&larr;</span> Back to Hub
          </Link>
          <div className="mt-4 flex items-center gap-3">
            <div className={cn("p-2 rounded-lg border bg-opacity-10 ",
              department.color === "amber" && "border-amber-500/20 text-amber-400 bg-amber-500",
              department.color === "emerald" && "border-emerald-500/20 text-emerald-400 bg-emerald-500",
              department.color === "blue" && "border-blue-500/20 text-blue-400 bg-blue-500",
              department.color === "violet" && "border-violet-500/20 text-violet-400 bg-violet-500",
              department.color === "red" && "border-red-500/20 text-red-400 bg-red-500",
              department.color === "orange" && "border-orange-500/20 text-orange-400 bg-orange-500",
              department.color === "cyan" && "border-cyan-500/20 text-cyan-400 bg-cyan-500",
              department.color === "indigo" && "border-indigo-500/20 text-indigo-400 bg-indigo-500"
            )}>
              <BarChart2 className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-medium text-[var(--text-heading)] tracking-tight">
              {department.displayName}
            </h2>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {tabs.map((tab) => {
            const href =
              tab.name === "dashboard" ? basePath : `${basePath}/${tab.name}`;
            const isActive =
              pathname === href ||
              (tab.name === "dashboard" && pathname === basePath);
            const Icon = ICON_MAP[tab.icon];
            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all relative group",
                  isActive
                    ? "bg-[var(--bg-tertiary)] text-[var(--text-heading)] border border-[var(--border-default)] font-medium"
                    : "text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--card)]",
                )}
              >
                {Icon && <Icon className={cn("w-4 h-4 shrink-0 transition-colors", isActive ? "text-[var(--accent-cyan)]" : "group-hover:text-[var(--text-heading)]")} />}
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute right-2 w-1 h-4 rounded-full bg-[var(--accent-cyan)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-[var(--border-default)] bg-[var(--card)]/30">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-primary)]">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-[var(--text-muted)] font-medium uppercase tracking-wider">Connection Secure</span>
          </div>
        </div>
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