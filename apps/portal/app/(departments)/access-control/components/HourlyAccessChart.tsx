"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const hourlyData = [
  { hour: "00:00", granted: 2, denied: 0 },
  { hour: "01:00", granted: 1, denied: 0 },
  { hour: "02:00", granted: 0, denied: 0 },
  { hour: "03:00", granted: 1, denied: 0 },
  { hour: "04:00", granted: 3, denied: 0 },
  { hour: "05:00", granted: 8, denied: 1 },
  { hour: "06:00", granted: 24, denied: 2 },
  { hour: "07:00", granted: 47, denied: 3 },
  { hour: "08:00", granted: 68, denied: 1 },
  { hour: "09:00", granted: 52, denied: 2 },
  { hour: "10:00", granted: 41, denied: 1 },
  { hour: "11:00", granted: 38, denied: 0 },
  { hour: "12:00", granted: 29, denied: 2 },
  { hour: "13:00", granted: 33, denied: 1 },
  { hour: "14:00", granted: 44, denied: 0 },
  { hour: "15:00", granted: 51, denied: 3 },
  { hour: "16:00", granted: 46, denied: 2 },
  { hour: "17:00", granted: 38, denied: 1 },
  { hour: "18:00", granted: 19, denied: 0 },
  { hour: "19:00", granted: 12, denied: 1 },
  { hour: "20:00", granted: 8, denied: 0 },
  { hour: "21:00", granted: 5, denied: 0 },
  { hour: "22:00", granted: 3, denied: 0 },
  { hour: "23:00", granted: 1, denied: 0 },
];

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg shadow-card px-3 py-2 text-xs">
      <p className="font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p) => (
        <div
          key={`tooltip-${p.name}`}
          className="flex items-center gap-2 mb-0.5"
        >
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-muted-foreground capitalize">{p.name}:</span>
          <span className="font-semibold text-foreground tabular-nums">
            {p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function HourlyAccessChart() {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart
        data={hourlyData}
        margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
      >
        <defs>
          <linearGradient id="gradGranted" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--success)" stopOpacity={0.25} />
            <stop offset="95%" stopColor="var(--success)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="gradDenied" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--danger)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--danger)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="hsl(var(--border))"
          vertical={false}
        />
        <XAxis
          dataKey="hour"
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
          interval={3}
        />
        <YAxis
          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
          tickLine={false}
          axisLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="granted"
          name="Granted"
          stroke="var(--success)"
          strokeWidth={2}
          fill="url(#gradGranted)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
        <Area
          type="monotone"
          dataKey="denied"
          name="Denied"
          stroke="var(--danger)"
          strokeWidth={2}
          fill="url(#gradDenied)"
          dot={false}
          activeDot={{ r: 4, strokeWidth: 0 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
