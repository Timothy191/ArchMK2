"use client";

import React from "react";
import { Users, Car, Wrench, ChevronRight } from "lucide-react";

interface EntityRow {
  id: string;
  type: string;
  icon: React.ElementType;
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

const entityRows: EntityRow[] = [
  {
    id: "ent-employees",
    type: "Employees",
    icon: Users,
    total: 412,
    active: 387,
    expiring: 19,
    expired: 6,
  },
  {
    id: "ent-vehicles",
    type: "Vehicles",
    icon: Car,
    total: 88,
    active: 82,
    expiring: 4,
    expired: 2,
  },
  {
    id: "ent-equipment",
    type: "Equipment",
    icon: Wrench,
    total: 204,
    active: 195,
    expiring: 7,
    expired: 2,
  },
];

export default function DashboardEntityStatus() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card h-full">
      <div className="px-5 py-4 border-b border-border">
        <h2 className="text-sm font-bold text-foreground">Entity QR Status</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Coverage across all entity types
        </p>
      </div>
      <div className="divide-y divide-border">
        {entityRows.map((row) => {
          const Icon = row.icon;
          const coveragePct = Math.round((row.active / row.total) * 100);
          return (
            <div
              key={row.id}
              className="px-5 py-4 hover:bg-secondary/40 transition-colors duration-100 cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon size={16} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {row.type}
                    </p>
                    <p className="text-[10px] text-muted-foreground tabular-nums">
                      {row.total} total
                    </p>
                  </div>
                </div>
                <ChevronRight
                  size={14}
                  className="text-muted-foreground group-hover:text-foreground transition-colors"
                />
              </div>
              <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mb-2">
                <div
                  className="h-full bg-success rounded-full transition-all duration-500"
                  style={{ width: `${coveragePct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                <span className="tabular-nums font-semibold text-success">
                  {row.active} active
                </span>
                <span className="tabular-nums text-warning">
                  {row.expiring} expiring
                </span>
                <span className="tabular-nums text-danger">
                  {row.expired} expired
                </span>
                <span className="tabular-nums font-bold text-foreground">
                  {coveragePct}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-5 py-4 border-t border-border">
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              id: "sum-active",
              label: "Total Active",
              value: "664",
              color: "text-success",
            },
            {
              id: "sum-expiring",
              label: "Expiring",
              value: "30",
              color: "text-warning",
            },
            {
              id: "sum-expired",
              label: "Expired",
              value: "10",
              color: "text-danger",
            },
          ].map((s) => (
            <div key={s.id} className="text-center">
              <p className={`text-lg font-bold tabular-nums ${s.color}`}>
                {s.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
