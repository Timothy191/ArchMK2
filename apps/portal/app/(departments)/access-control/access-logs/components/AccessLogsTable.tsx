"use client";

import React from "react";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Eye,
  Trash2,
  AlertCircle,
} from "lucide-react";
import StatusBadge from "@/features/access-control/components/StatusBadge";
import { AccessLogEntry } from "./accessLogsData";
import { SortConfig } from "./AccessLogsContent";
import { Skeleton } from "@repo/ui/components/ui/skeleton";
import { toast } from "sonner";

interface AccessLogsTableProps {
  data: AccessLogEntry[];
  loading: boolean;
  sortConfig: SortConfig;
  onSort: (_key: keyof AccessLogEntry) => void;
  selectedRows: Set<string>;
  onSelectRow: (_id: string) => void;
  onSelectAll: () => void;
  allSelected: boolean;
  onViewDetail: (_entry: AccessLogEntry) => void;
  page: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (_p: number) => void;
  onPageSizeChange: (_s: number) => void;
}

type Column = {
  key: keyof AccessLogEntry;
  label: string;
  sortable?: boolean;
  width?: string;
  mono?: boolean;
};

const COLUMNS: Column[] = [
  {
    key: "timestamp",
    label: "Timestamp",
    sortable: true,
    width: "w-36",
    mono: true,
  },
  { key: "entityName", label: "Entity Name", sortable: true, width: "w-44" },
  { key: "entityType", label: "Type", sortable: true, width: "w-28" },
  {
    key: "qrCodeId",
    label: "QR Code ID",
    sortable: false,
    width: "w-32",
    mono: true,
  },
  { key: "zone", label: "Zone", sortable: true, width: "w-36" },
  { key: "accessMethod", label: "Method", sortable: true, width: "w-28" },
  { key: "status", label: "Status", sortable: true, width: "w-36" },
  {
    key: "duration",
    label: "Duration (s)",
    sortable: true,
    width: "w-24",
    mono: true,
  },
  {
    key: "operator",
    label: "Operator",
    sortable: true,
    width: "w-32",
    mono: true,
  },
];

const entityTypePill: Record<string, string> = {
  Employee: "bg-primary/10 text-primary",
  Vehicle: "bg-accent/10 text-accent",
  Equipment: "bg-secondary text-secondary-foreground",
};

const methodPill: Record<string, string> = {
  "QR Scan": "bg-primary/10 text-primary",
  "Mobile QR": "bg-accent/10 text-accent",
  "Kiosk Scan": "bg-secondary text-secondary-foreground",
  "Reader Tap": "bg-success/10 text-success",
};

function SortIcon({
  col,
  sortConfig,
}: {
  col: Column;
  sortConfig: SortConfig;
}) {
  if (!col.sortable) return null;
  if (sortConfig?.key !== col.key)
    return (
      <ChevronsUpDown
        size={12}
        className="text-muted-foreground opacity-40 ml-1 shrink-0"
      />
    );
  return sortConfig.direction === "asc" ? (
    <ChevronUp size={12} className="text-primary ml-1 shrink-0" />
  ) : (
    <ChevronDown size={12} className="text-primary ml-1 shrink-0" />
  );
}

function formatTimestamp(ts: string) {
  const d = new Date(ts);
  const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  return { date, time };
}

const PAGE_SIZES = [10, 25, 50, 100];

function TableRowSkeleton({ cols = 9 }: { cols?: number }) {
  return (
    <tr className="border-b border-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={`skel-col-${i}`} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function AccessLogsTable({
  data,
  loading,
  sortConfig,
  onSort,
  selectedRows,
  onSelectRow,
  onSelectAll,
  allSelected,
  onViewDetail,
  page,
  totalPages,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
}: AccessLogsTableProps) {
  const startItem = (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, totalCount);

  const pageNumbers = Array.from(
    { length: Math.min(totalPages, 7) },
    (_, i) => {
      if (totalPages <= 7) return i + 1;
      if (page <= 4) return i + 1;
      if (page >= totalPages - 3) return totalPages - 6 + i;
      return page - 3 + i;
    },
  );

  return (
    <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <p className="text-xs text-muted-foreground">
          Showing{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {startItem}–{endItem}
          </span>{" "}
          of{" "}
          <span className="font-semibold text-foreground tabular-nums">
            {totalCount.toLocaleString()}
          </span>{" "}
          events
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs bg-secondary border border-border rounded-md px-2 py-1 text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {PAGE_SIZES.map((s) => (
              <option key={`pgsz-${s}`} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] text-sm">
          <thead>
            <tr className="bg-secondary/50 border-b border-border">
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={onSelectAll}
                  className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
                  aria-label="Select all rows"
                />
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={`th-${col.key}`}
                  className={`text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground ${col.width ?? ""} ${col.sortable ? "cursor-pointer hover:text-foreground select-none" : ""} ${sortConfig?.key === col.key ? "text-primary" : ""}`}
                  onClick={() => col.sortable && onSort(col.key)}
                >
                  <span className="flex items-center">
                    {col.label}
                    <SortIcon col={col} sortConfig={sortConfig} />
                  </span>
                </th>
              ))}
              <th className="w-20 px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRowSkeleton
                  key={`skel-row-${i}`}
                  cols={COLUMNS.length + 2}
                />
              ))
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={COLUMNS.length + 2}
                  className="text-center py-12 text-muted-foreground"
                >
                  No access log entries found.
                </td>
              </tr>
            ) : (
              data.map((entry, rowIdx) => {
                const { date, time } = formatTimestamp(entry.timestamp);
                const isSelected = selectedRows.has(entry.id);
                const isAlert =
                  entry.status === "Denied" ||
                  entry.status === "Expired Credential" ||
                  entry.status === "Tailgate Alert";
                return (
                  <tr
                    key={entry.id}
                    className={`border-b border-border transition-colors duration-100 group
                      ${rowIdx % 2 === 0 ? "bg-card" : "bg-secondary/20"}
                      ${isSelected ? "bg-primary/5" : "hover:bg-secondary/50"}
                      ${isAlert && !isSelected ? "hover:bg-danger/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onSelectRow(entry.id)}
                        className="w-3.5 h-3.5 rounded border-border accent-primary cursor-pointer"
                        aria-label={`Select row ${entry.id}`}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-foreground">
                        {time}
                      </div>
                      <div className="font-mono text-[10px] text-muted-foreground">
                        {date}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
                          {entry.entityName}
                        </span>
                        {isAlert && (
                          <AlertCircle
                            size={12}
                            className="text-danger shrink-0"
                          />
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${entityTypePill[entry.entityType]}`}
                      >
                        {entry.entityType}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {entry.qrCodeId}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="text-sm text-foreground">
                        {entry.zone}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${methodPill[entry.accessMethod] ?? "bg-secondary text-secondary-foreground"}`}
                      >
                        {entry.accessMethod}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <StatusBadge status={entry.status} size="sm" />
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-foreground tabular-nums">
                        {entry.duration === 0 ? "—" : `${entry.duration}s`}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        {entry.operator}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <button
                          onClick={() => onViewDetail(entry)}
                          title="View full log details"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-primary/10 hover:text-primary transition-all duration-150 active:scale-95"
                          aria-label="View log details"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() =>
                            toast.error(`Log entry ${entry.id} deleted`)
                          }
                          title="Delete this log entry — this cannot be undone"
                          className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-danger/10 hover:text-danger transition-all duration-150 active:scale-95"
                          aria-label="Delete log entry"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-5 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground tabular-nums">
            Page <span className="font-semibold text-foreground">{page}</span>{" "}
            of{" "}
            <span className="font-semibold text-foreground">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page === 1}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-border text-secondary-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
            >
              Prev
            </button>
            {pageNumbers.map((n) => (
              <button
                key={`page-${n}`}
                onClick={() => onPageChange(n)}
                className={`w-8 h-7 rounded-md text-xs font-medium transition-all duration-150 active:scale-95
                  ${
                    n === page
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-secondary-foreground hover:bg-secondary"
                  }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page === totalPages}
              className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-border text-secondary-foreground hover:bg-secondary disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 active:scale-95"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
