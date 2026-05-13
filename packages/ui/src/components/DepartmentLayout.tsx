"use client";

import { cn } from "../lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";

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
      <aside className="w-60 shrink-0 border-r border-[#363636] bg-[#171717] flex flex-col">
        <div className="p-4 border-b border-[#363636]">
          <Link
            href="/"
            className="text-[#898989] text-xs hover:text-[#b4b4b4] transition-colors"
          >
            &larr; Back to Hub
          </Link>
          <h2 className="text-lg font-medium text-[#fafafa] mt-2">
            {department.displayName}
          </h2>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {tabs.map((tab) => {
            const href =
              tab.name === "dashboard" ? basePath : `${basePath}/${tab.name}`;
            const isActive =
              pathname === href ||
              (tab.name === "dashboard" && pathname === basePath);
            return (
              <Link
                key={tab.name}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  isActive
                    ? "bg-[#2e2e2e] text-[#fafafa] border-l-2 border-[#3ecf8e]"
                    : "text-[#898989] hover:text-[#fafafa] hover:bg-[#242424]",
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
