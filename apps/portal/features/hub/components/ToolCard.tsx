"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  CheckSquare,
  FileText,
  Calendar,
  Calculator,
  StickyNote,
  Factory,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  CheckSquare,
  FileText,
  Calendar,
  Calculator,
  StickyNote,
};

const COLOR_MAP: Record<string, string> = {
  amber: "border-amber-500/20 text-amber-400 bg-amber-500/5",
  emerald: "border-emerald-500/20 text-emerald-400 bg-emerald-500/5",
  blue: "border-blue-500/20 text-blue-400 bg-blue-500/5",
  violet: "border-violet-500/20 text-violet-400 bg-violet-500/5",
  red: "border-red-500/20 text-red-400 bg-red-500/5",
  orange: "border-orange-500/20 text-orange-400 bg-orange-500/5",
  cyan: "border-cyan-500/20 text-cyan-400 bg-cyan-500/5",
  indigo: "border-indigo-500/20 text-indigo-400 bg-indigo-500/5",
};

interface ToolCardProps {
  tool: {
    name: string;
    displayName: string;
    icon: string;
    description: string;
    color: string;
  };
  index: number;
}

export function ToolCard({ tool, index }: ToolCardProps) {
  const Icon = ICON_MAP[tool.icon] || Factory;
  const colorClass = COLOR_MAP[tool.color] || "border-[#363636] text-[#fafafa] bg-[#242424]";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 + index * 0.04 }}
    >
      <Link
        href={`/tools/${tool.name}`}
        className="group flex items-center gap-3 rounded-xl border border-[#363636] bg-[#171717] p-3 hover:bg-[#242424] transition-all duration-300"
      >
        <div className={`p-2 rounded-lg border ${colorClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <h3 className="text-[#fafafa] text-sm font-medium truncate">
            {tool.displayName}
          </h3>
          <p className="text-[#898989] text-xs truncate">
            {tool.description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
