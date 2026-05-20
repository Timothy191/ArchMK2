"use client";

import React, { useState, useMemo, useCallback } from "react";
import AccessLogsFilters from "./AccessLogsFilters";
import AccessLogsTable from "./AccessLogsTable";
import AccessLogDetailModal from "./AccessLogDetailModal";
import { toast } from "sonner";
import { accessLogsData, AccessLogEntry } from "./accessLogsData";
import { Download, RefreshCw, Bell } from "lucide-react";

export type SortConfig = {
  key: keyof AccessLogEntry;
  direction: "asc" | "desc";
} | null;

export default function AccessLogsContent() {
  const [search, setSearch] = useState("");
  const [entityTypeFilter, setEntityTypeFilter] = useState<string[]>([]);
  const [zoneFilter, setZoneFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "timestamp",
    direction: "desc",
  });
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [detailEntry, setDetailEntry] = useState<AccessLogEntry | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loading] = useState(false);

  const filtered = useMemo(() => {
    let data = [...accessLogsData];

    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (d) =>
          d.entityName.toLowerCase().includes(q) ||
          d.qrCodeId.toLowerCase().includes(q) ||
          d.zone.toLowerCase().includes(q) ||
          d.operator.toLowerCase().includes(q),
      );
    }
    if (entityTypeFilter.length > 0) {
      data = data.filter((d) => entityTypeFilter.includes(d.entityType));
    }
    if (zoneFilter !== "all") {
      data = data.filter((d) => d.zone === zoneFilter);
    }
    if (statusFilter !== "all") {
      data = data.filter((d) => d.status === statusFilter);
    }
    if (dateFrom) {
      data = data.filter((d) => d.timestamp >= dateFrom);
    }
    if (dateTo) {
      data = data.filter((d) => d.timestamp <= dateTo + "T23:59:59");
    }

    if (sortConfig) {
      data.sort((a, b) => {
        const av = a[sortConfig.key] as string;
        const bv = b[sortConfig.key] as string;
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortConfig.direction === "asc" ? cmp : -cmp;
      });
    }

    return data;
  }, [
    search,
    entityTypeFilter,
    zoneFilter,
    statusFilter,
    dateFrom,
    dateTo,
    sortConfig,
  ]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleSort = useCallback((key: keyof AccessLogEntry) => {
    setSortConfig((prev) =>
      prev?.key === key
        ? { key, direction: prev.direction === "asc" ? "desc" : "asc" }
        : { key, direction: "asc" },
    );
    setPage(1);
  }, []);

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedRows.size === paginated.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(paginated.map((r) => r.id)));
    }
  }, [selectedRows.size, paginated]);

  const handleExport = useCallback(() => {
    const rows =
      selectedRows.size > 0
        ? filtered.filter((r) => selectedRows.has(r.id))
        : filtered;

    const headers = [
      "Timestamp",
      "Entity Name",
      "Entity Type",
      "QR Code ID",
      "Zone",
      "Access Method",
      "Status",
      "Duration (s)",
      "Operator",
    ];
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.timestamp,
          `"${r.entityName}"`,
          r.entityType,
          r.qrCodeId,
          `"${r.zone}"`,
          r.accessMethod,
          r.status,
          r.duration,
          `"${r.operator}"`,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `access-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} access log entries`);
  }, [filtered, selectedRows]);

  const handleBulkDelete = useCallback(() => {
    toast.error(`Deleted ${selectedRows.size} selected log entries`);
    setSelectedRows(new Set());
  }, [selectedRows.size]);

  const clearFilters = useCallback(() => {
    setSearch("");
    setEntityTypeFilter([]);
    setZoneFilter("all");
    setStatusFilter("all");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-20 bg-card border-b border-border px-6 py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-foreground tracking-tight truncate">
            Access Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filtered.length.toLocaleString()} events — full audit trail
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground hidden lg:block">
            Updated 2 min ago
          </span>
          <button
            onClick={() => toast.success("Data refreshed successfully")}
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150 active:scale-95"
            title="Refresh data"
          >
            <RefreshCw size={15} />
          </button>
          <button
            className="w-8 h-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-all duration-150 active:scale-95 relative"
            title="Notifications"
            onClick={() => toast.info("4 alerts require your attention")}
          >
            <Bell size={15} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-danger" />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-secondary-foreground border border-border hover:bg-secondary transition-all duration-150 active:scale-95"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </header>

      <div className="px-6 py-5 max-w-screen-2xl mx-auto space-y-4">
        <AccessLogsFilters
          search={search}
          onSearchChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          entityTypeFilter={entityTypeFilter}
          onEntityTypeChange={(v) => {
            setEntityTypeFilter(v);
            setPage(1);
          }}
          zoneFilter={zoneFilter}
          onZoneChange={(v) => {
            setZoneFilter(v);
            setPage(1);
          }}
          statusFilter={statusFilter}
          onStatusChange={(v) => {
            setStatusFilter(v);
            setPage(1);
          }}
          dateFrom={dateFrom}
          onDateFromChange={(v) => {
            setDateFrom(v);
            setPage(1);
          }}
          dateTo={dateTo}
          onDateToChange={(v) => {
            setDateTo(v);
            setPage(1);
          }}
          onClear={clearFilters}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          activeFilterCount={
            (entityTypeFilter.length > 0 ? 1 : 0) +
            (zoneFilter !== "all" ? 1 : 0) +
            (statusFilter !== "all" ? 1 : 0) +
            (dateFrom ? 1 : 0) +
            (dateTo ? 1 : 0)
          }
        />

        {selectedRows.size > 0 && (
          <div className="flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-5 py-3">
            <span className="text-sm font-semibold text-primary">
              {selectedRows.size} row{selectedRows.size !== 1 ? "s" : ""}{" "}
              selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExport}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-150 active:scale-95"
              >
                Export Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 rounded-md text-sm font-medium bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20 transition-all duration-150 active:scale-95"
              >
                Delete Selected
              </button>
              <button
                onClick={() => setSelectedRows(new Set())}
                className="px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-secondary transition-all duration-150"
              >
                Clear
              </button>
            </div>
          </div>
        )}

        <AccessLogsTable
          data={paginated}
          loading={loading}
          sortConfig={sortConfig}
          onSort={handleSort}
          selectedRows={selectedRows}
          onSelectRow={handleSelectRow}
          onSelectAll={handleSelectAll}
          allSelected={
            paginated.length > 0 && selectedRows.size === paginated.length
          }
          onViewDetail={setDetailEntry}
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalCount={filtered.length}
          onPageChange={setPage}
          onPageSizeChange={(s) => {
            setPageSize(s);
            setPage(1);
          }}
        />
      </div>

      <AccessLogDetailModal
        entry={detailEntry}
        onClose={() => setDetailEntry(null)}
      />
    </>
  );
}
