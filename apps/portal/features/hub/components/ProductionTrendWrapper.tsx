"use client";

import dynamic from "next/dynamic";

export const ProductionTrend = dynamic(
  () => import("./ProductionTrend").then((m) => m.ProductionTrend),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 animate-pulse bg-[var(--bg-tertiary)] rounded-xl" />
    ),
  },
);
