"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import StatusBadge, {
  AccessStatus,
} from "@/features/access-control/components/StatusBadge";

interface ActivityEntry {
  id: string;
  entityName: string;
  entityType: "Employee" | "Vehicle" | "Equipment";
  zone: string;
  status: AccessStatus;
  time: string;
  qrId: string;
}

const recentActivity: ActivityEntry[] = [
  {
    id: "act-001",
    entityName: "Priya Krishnamurthy",
    entityType: "Employee",
    zone: "Server Room B",
    status: "Granted",
    time: "23:38",
    qrId: "QR-EMP-4821",
  },
  {
    id: "act-002",
    entityName: "Truck TK-7741",
    entityType: "Vehicle",
    zone: "Loading Bay 2",
    status: "Granted",
    time: "23:35",
    qrId: "QR-VEH-0293",
  },
  {
    id: "act-003",
    entityName: "Carlos Mendes",
    entityType: "Employee",
    zone: "R&D Lab",
    status: "Denied",
    time: "23:31",
    qrId: "QR-EMP-1193",
  },
  {
    id: "act-004",
    entityName: "Forklift FL-04",
    entityType: "Equipment",
    zone: "Warehouse A",
    status: "Granted",
    time: "23:28",
    qrId: "QR-EQP-0872",
  },
  {
    id: "act-005",
    entityName: "Amara Osei",
    entityType: "Employee",
    zone: "Executive Floor",
    status: "Expired Credential",
    time: "23:22",
    qrId: "QR-EMP-3310",
  },
  {
    id: "act-006",
    entityName: "Van VN-2284",
    entityType: "Vehicle",
    zone: "Gate A",
    status: "Tailgate Alert",
    time: "23:17",
    qrId: "QR-VEH-1104",
  },
  {
    id: "act-007",
    entityName: "Lena Hoffmann",
    entityType: "Employee",
    zone: "Data Center",
    status: "Granted",
    time: "23:09",
    qrId: "QR-EMP-2255",
  },
  {
    id: "act-008",
    entityName: "Crane CR-01",
    entityType: "Equipment",
    zone: "Yard East",
    status: "Granted",
    time: "22:58",
    qrId: "QR-EQP-0031",
  },
];

const statusIcons: Record<string, React.ElementType> = {
  Granted: CheckCircle2,
  Denied: XCircle,
  "Expired Credential": Clock,
  "Tailgate Alert": AlertTriangle,
};

const entityTypePill: Record<string, string> = {
  Employee: "bg-primary/10 text-primary",
  Vehicle: "bg-accent/10 text-accent",
  Equipment: "bg-secondary text-secondary-foreground",
};

export default function DashboardActivityFeed() {
  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div>
          <h2 className="text-sm font-bold text-foreground">
            Recent Access Events
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Last 8 scan events across all zones
          </p>
        </div>
        <Link
          href="/access-control/access-logs"
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          View all <ArrowRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {recentActivity.map((entry) => {
          const StatusIcon = statusIcons[entry.status] ?? CheckCircle2;
          return (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-5 py-3 hover:bg-secondary/40 transition-colors duration-100 group"
            >
              <div className="shrink-0">
                <StatusIcon
                  size={16}
                  className={
                    entry.status === "Granted"
                      ? "text-success"
                      : entry.status === "Denied" ||
                          entry.status === "Expired Credential"
                        ? "text-danger"
                        : "text-warning"
                  }
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-foreground truncate">
                    {entry.entityName}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${entityTypePill[entry.entityType]}`}
                  >
                    {entry.entityType}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">
                    {entry.zone}
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {entry.qrId}
                  </span>
                </div>
              </div>
              <div className="shrink-0 flex flex-col items-end gap-1">
                <StatusBadge status={entry.status} size="sm" />
                <span className="text-[10px] font-mono text-muted-foreground">
                  {entry.time}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
