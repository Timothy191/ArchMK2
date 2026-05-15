"use client";

import { motion } from "framer-motion";
import { Activity, Shield, Zap, Globe } from "lucide-react";
import { SpotlightCard } from "@repo/ui/SpotlightCard";
import { SparkAreaChart } from "@tremor/react";

export function SystemHealth() {
  const stats = [
    {
      label: "Network Latency",
      value: "24ms",
      icon: Activity,
      color: "emerald",
      data: [18, 22, 19, 24, 21, 26, 24],
    },
    {
      label: "Security Status",
      value: "Optimal",
      icon: Shield,
      color: "blue",
      data: [100, 100, 98, 100, 100, 100, 100],
    },
    {
      label: "System Load",
      value: "14%",
      icon: Zap,
      color: "amber",
      data: [12, 15, 14, 18, 16, 13, 14],
    },
    {
      label: "Active Nodes",
      value: "156",
      icon: Globe,
      color: "violet",
      data: [150, 152, 154, 156, 155, 156, 156],
    },
  ];

  const COLOR_CONFIG: Record<string, { text: string; glow: string }> = {
    emerald: { text: "text-emerald-400", glow: "rgba(16, 185, 129, 0.1)" },
    blue: { text: "text-blue-400", glow: "rgba(59, 130, 246, 0.1)" },
    amber: { text: "text-amber-400", glow: "rgba(245, 158, 11, 0.1)" },
    violet: { text: "text-violet-400", glow: "rgba(139, 92, 246, 0.1)" },
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <SpotlightCard
            spotlightColor={COLOR_CONFIG[stat.color]?.glow}
            className="bg-[var(--bg-tertiary)]/40 border-[var(--border-default)] group"
          >
            <div className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg bg-[var(--bg-tertiary)] border border-[var(--border-default)] ${COLOR_CONFIG[stat.color]?.text} transition-transform duration-300 group-hover:scale-110`}
                >
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-[0.15em] text-[var(--text-muted)]">
                    {stat.label}
                  </p>
                  <p className="text-sm font-bold text-[#fafafa] tracking-tight">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="w-16 h-8 opacity-60 group-hover:opacity-100 transition-opacity duration-300">
                <SparkAreaChart
                  data={stat.data.map((val, i) => ({
                    month: i,
                    performance: val,
                  }))}
                  categories={["performance"]}
                  index="month"
                  colors={[stat.color]}
                  className="h-full w-full"
                />
              </div>
            </div>
          </SpotlightCard>
        </motion.div>
      ))}
    </div>
  );
}
