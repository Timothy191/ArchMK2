"use client";

import { Title, AreaChart, Text } from "@tremor/react";

const chartdata = [
  { date: "08:00", Drilling: 2890, Production: 2338, Engineering: 1200 },
  { date: "09:00", Drilling: 2756, Production: 2103, Engineering: 1400 },
  { date: "10:00", Drilling: 3322, Production: 2194, Engineering: 1100 },
  { date: "11:00", Drilling: 3470, Production: 2108, Engineering: 1600 },
  { date: "12:00", Drilling: 3475, Production: 1812, Engineering: 1300 },
  { date: "13:00", Drilling: 3129, Production: 1726, Engineering: 1500 },
];

export function ProductionTrend() {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Title className="text-arch-text-primary">Site Production Trend</Title>
          <Text className="text-arch-text-tertiary">Real-time output across core departments</Text>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-xs text-arch-text-tertiary">Drilling</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-arch-text-tertiary">Production</span>
          </div>
        </div>
      </div>
      <AreaChart
        className="h-72 mt-4"
        data={chartdata}
        index="date"
        categories={["Drilling", "Production"]}
        colors={["amber", "emerald"]}
        showLegend={false}
        showYAxis={false}
        showGridLines={false}
        curveType="monotone"
      />
    </div>
  );
}
