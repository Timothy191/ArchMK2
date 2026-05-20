"use client";

import React from "react";
import {
  RadialBarChart,
  RadialBar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const distributionData = [
  { name: "Active", value: 1284, fill: "var(--success)" },
  { name: "Expiring Soon", value: 47, fill: "var(--warning)" },
  { name: "Expired", value: 63, fill: "var(--danger)" },
  { name: "Revoked", value: 27, fill: "var(--muted-foreground)" },
];

const total = distributionData.reduce((s, d) => s + d.value, 0);

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { name: string; value: number; fill: string } }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length || !payload[0]?.payload) return null;
  const d = payload[0].payload;
  const pct = ((d.value / total) * 100).toFixed(1);
  return (
    <div className="bg-card border border-border rounded-lg shadow-card px-3 py-2 text-xs">
      <div className="flex items-center gap-2 mb-0.5">
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: d.fill }}
        />
        <span className="font-semibold text-foreground">{d.name}</span>
      </div>
      <p className="text-muted-foreground">
        <span className="tabular-nums font-semibold text-foreground">
          {d.value.toLocaleString()}
        </span>{" "}
        codes ({pct}%)
      </p>
    </div>
  );
}

export default function QRStatusDistributionChart() {
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="40%"
          outerRadius="90%"
          data={distributionData}
          startAngle={90}
          endAngle={-270}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={4}
            background={{ fill: "hsl(var(--secondary))" }}
          />
          <Tooltip content={<CustomTooltip />} />
        </RadialBarChart>
      </ResponsiveContainer>
      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 w-full mt-1">
        {distributionData.map((d) => (
          <div key={`legend-${d.name}`} className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: d.fill }}
            />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground truncate">
                {d.name}
              </p>
              <p className="text-xs font-bold text-foreground tabular-nums">
                {d.value.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
