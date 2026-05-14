"use client";

import { motion } from "framer-motion";
import { Activity, Shield, Zap, Globe } from "lucide-react";
import { Card, CardContent } from "@repo/ui/components/ui/card";
import { SparkAreaChart } from "@tremor/react";

export function SystemHealth() {
  const stats = [
    { 
      label: "Network Latency", 
      value: "24ms", 
      icon: Activity, 
      color: "text-emerald-400",
      data: [18, 22, 19, 24, 21, 26, 24] 
    },
    { 
      label: "Security Status", 
      value: "Optimal", 
      icon: Shield, 
      color: "text-blue-400",
      data: [100, 100, 98, 100, 100, 100, 100] 
    },
    { 
      label: "System Load", 
      value: "14%", 
      icon: Zap, 
      color: "text-amber-400",
      data: [12, 15, 14, 18, 16, 13, 14] 
    },
    { 
      label: "Active Nodes", 
      value: "156", 
      icon: Globe, 
      color: "text-violet-400",
      data: [150, 152, 154, 156, 155, 156, 156] 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Card className="bg-[#171717] border-[#363636] shadow-sm">
            <CardContent className="p-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-[#242424] border border-[#363636] ${stat.color}`}>
                  <stat.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-[#898989] font-medium">
                    {stat.label}
                  </p>
                  <p className="text-sm font-medium text-[#fafafa]">
                    {stat.value}
                  </p>
                </div>
              </div>
              <div className="w-16 h-8">
                <SparkAreaChart
                  data={stat.data.map((val, i) => ({ month: i, performance: val }))}
                  categories={["performance"]}
                  index="month"
                  colors={[stat.color.replace("text-", "").replace("-400", "")]}
                  className="h-full w-full"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
