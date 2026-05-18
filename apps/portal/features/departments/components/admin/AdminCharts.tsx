"use client";

import { Card, Title, BarChart, DonutChart, Color } from "@tremor/react";

interface AdminChartsProps {
  distributionData: {
    name: string;
    value: number;
  }[];
  completionData: {
    date: string;
    rate: number;
  }[];
}

export function AdminCharts({ distributionData, completionData }: AdminChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Shift Completion Rate */}
      <Card className="lg:col-span-2 bg-[#0d0d0d] border-[#242424] shadow-none">
        <Title className="text-[#fafafa] text-sm font-medium mb-4">Weekly Shift Completion Rates (%)</Title>
        <BarChart
          className="h-72 mt-4"
          data={completionData}
          index="date"
          categories={["rate"]}
          colors={["emerald"] as Color[]}
          valueFormatter={(number: number) => `${number}%`}
          showLegend={false}
          showGridLines={false}
        />
      </Card>

      {/* Personnel Distribution */}
      <Card className="bg-[#0d0d0d] border-[#242424] shadow-none">
        <Title className="text-[#fafafa] text-sm font-medium mb-4">Personnel Distribution</Title>
        <DonutChart
          className="h-72 mt-4"
          data={distributionData}
          category="value"
          index="name"
          colors={["emerald", "amber", "rose", "cyan", "indigo"] as Color[]}
          variant="donut"
          showAnimation={true}
        />
        <div className="mt-6 space-y-2">
          {distributionData.slice(0, 3).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-[10px] uppercase tracking-wider text-[#898989]">
              <span>{item.name}</span>
              <span className="text-[#fafafa]">{item.value} pax</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
