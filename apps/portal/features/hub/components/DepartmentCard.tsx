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
  Satellite,
  Activity,
  AlertCircle,
  Settings,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@repo/ui/components/ui/card";
import { Badge } from "@repo/ui/components/ui/badge";
import { cn } from "@repo/ui/lib/utils";
import type { Department } from "~/lib/departments";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Drill,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
  Satellite,
};

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-500/20 text-amber-400",
  emerald: "border-emerald-500/20 text-emerald-400",
  blue: "border-blue-500/20 text-blue-400",
  violet: "border-violet-500/20 text-violet-400",
  red: "border-red-500/20 text-red-400",
  orange: "border-orange-500/20 text-orange-400",
  cyan: "border-cyan-500/20 text-cyan-400",
  indigo: "border-indigo-500/20 text-indigo-400",
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
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Link href={`/${department.name}`} className="block h-full">
        <Card className={cn(
          "h-full transition-all duration-300 bg-[#171717] border-[#363636] hover:border-[#424242] group overflow-hidden relative",
          department.status === "alert" && "border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.1)]",
          department.status === "maintenance" && "border-amber-500/50"
        )}>
          {/* Accent Glow */}
          <div className={cn(
            "absolute -top-24 -right-24 w-48 h-48 blur-[100px] opacity-10 transition-opacity duration-500 group-hover:opacity-20",
            department.color === "amber" && "bg-amber-500",
            department.color === "emerald" && "bg-emerald-500",
            department.color === "blue" && "bg-blue-500",
            department.color === "violet" && "bg-violet-500",
            department.color === "red" && "bg-red-500",
            department.color === "orange" && "bg-orange-500",
            department.color === "cyan" && "bg-cyan-500",
            department.color === "indigo" && "bg-indigo-500"
          )} />

          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className={cn("p-2 rounded-lg border", colorClass, "bg-opacity-10")}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2">
                {department.status && (
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "text-[10px] uppercase tracking-wider h-5",
                      department.status === "active" && "border-emerald-500/20 text-emerald-500 bg-emerald-500/5",
                      department.status === "maintenance" && "border-amber-500/20 text-amber-500 bg-amber-500/5",
                      department.status === "alert" && "border-red-500/20 text-red-500 bg-red-500/5"
                    )}
                  >
                    {department.status === "active" && <Activity className="w-3 h-3 mr-1" />}
                    {department.status === "maintenance" && <Settings className="w-3 h-3 mr-1" />}
                    {department.status === "alert" && <AlertCircle className="w-3 h-3 mr-1" />}
                    {department.status}
                  </Badge>
                )}
                <span className="text-[#898989] group-hover:translate-x-1 transition-transform duration-300">
                  &rarr;
                </span>
              </div>
            </div>
            <div className="mt-4">
              <CardTitle className="text-[#fafafa] font-medium text-lg leading-none">
                {department.displayName}
              </CardTitle>
              <CardDescription className="text-[#898989] text-sm mt-2 line-clamp-2">
                {department.description}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            {department.stats && (
              <div className="pt-4 border-t border-[#363636] flex items-center justify-between">
                <span className="text-xs text-[#898989] uppercase tracking-tight">{department.stats.label}</span>
                <span className={cn("text-sm font-medium", colorClass.split(" ")[1])}>
                  {department.stats.value}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
