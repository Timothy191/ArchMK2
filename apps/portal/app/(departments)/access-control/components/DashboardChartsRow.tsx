"use client";

import React from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/components/ui/skeleton";

const HourlyAccessChart = dynamic(() => import("./HourlyAccessChart"), {
  ssr: false,
  loading: () => <Skeleton className="h-[240px] w-full" />,
});

const QRStatusDistributionChart = dynamic(
  () => import("./QRStatusDistributionChart"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-[240px] w-full" />,
  },
);

export default function DashboardChartsRow() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 bg-card rounded-xl border border-border shadow-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-foreground">
              Access Events — Today
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Hourly scan volume across all entry points
            </p>
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground bg-secondary px-2 py-1 rounded-md">
            Live
          </span>
        </div>
        <HourlyAccessChart />
      </div>
      <div className="lg:col-span-1 bg-card rounded-xl border border-border shadow-card p-5">
        <div className="mb-4">
          <h2 className="text-sm font-bold text-foreground">
            QR Code Status Distribution
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            All 1,421 registered QR codes
          </p>
        </div>
        <QRStatusDistributionChart />
      </div>
    </div>
  );
}
