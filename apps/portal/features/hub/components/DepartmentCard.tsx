"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Drill,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
} from "lucide-react";
import type { Department } from "~/lib/departments";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Drill,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
};

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-500/20 text-amber-400",
  emerald: "border-emerald-500/20 text-emerald-400",
  blue: "border-blue-500/20 text-blue-400",
  violet: "border-violet-500/20 text-violet-400",
  red: "border-red-500/20 text-red-400",
  orange: "border-orange-500/20 text-orange-400",
  cyan: "border-cyan-500/20 text-cyan-400",
};

interface DepartmentCardProps {
  department: Department;
  index: number;
}

export function DepartmentCard({ department, index }: DepartmentCardProps) {
  const Icon = ICON_MAP[department.icon] || Factory;
  const colorClass = COLOR_MAP[department.color] || "border-[#363636] text-[#fafafa]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Link
        href={`/${department.name}`}
        className={`group block rounded-2xl border bg-[#242424] p-6 hover:bg-[#2e2e2e] transition-all duration-300 ${colorClass}`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl border ${colorClass} bg-opacity-10`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[#fafafa] font-medium">
                {department.displayName}
              </h3>
              <p className="text-[#898989] text-sm mt-0.5">
                {department.description}
              </p>
            </div>
          </div>
          <span className="text-[#898989] text-sm group-hover:text-[#fafafa] transition-colors">
            &rarr;
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
