"use client";

import React from "react";
import { Search, Filter, X, ChevronDown } from "lucide-react";

interface AccessLogsFiltersProps {
  search: string;
  onSearchChange: (_v: string) => void;
  entityTypeFilter: string[];
  onEntityTypeChange: (_v: string[]) => void;
  zoneFilter: string;
  onZoneChange: (_v: string) => void;
  statusFilter: string;
  onStatusChange: (_v: string) => void;
  dateFrom: string;
  onDateFromChange: (_v: string) => void;
  dateTo: string;
  onDateToChange: (_v: string) => void;
  onClear: () => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
  activeFilterCount: number;
}

const entityTypes = ["Employee", "Vehicle", "Equipment"];
const zones = [
  "Server Room B",
  "Loading Bay 2",
  "R&D Lab",
  "Warehouse A",
  "Executive Floor",
  "Gate A",
  "Data Center",
  "Yard East",
  "Parking Zone C",
  "Lobby Main",
  "Roof Access",
  "Chemical Storage",
];
const statuses = ["Granted", "Denied", "Expired Credential", "Tailgate Alert"];

export default function AccessLogsFilters({
  search,
  onSearchChange,
  entityTypeFilter,
  onEntityTypeChange,
  zoneFilter,
  onZoneChange,
  statusFilter,
  onStatusChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onClear,
  filtersOpen,
  onToggleFilters,
  activeFilterCount,
}: AccessLogsFiltersProps) {
  const toggleEntityType = (type: string) => {
    onEntityTypeChange(
      entityTypeFilter.includes(type)
        ? entityTypeFilter.filter((t) => t !== type)
        : [...entityTypeFilter, type],
    );
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-card">
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="relative flex-1 max-w-sm">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Search entity name, QR code, zone, operator…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-all duration-150 active:scale-95
            ${
              filtersOpen || activeFilterCount > 0
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-secondary border-border text-secondary-foreground hover:bg-secondary/80"
            }`}
        >
          <Filter size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown
            size={12}
            className={`transition-transform duration-200 ${filtersOpen ? "rotate-180" : ""}`}
          />
        </button>

        {activeFilterCount > 0 && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-danger border border-danger/20 bg-danger/5 hover:bg-danger/10 transition-all duration-150 active:scale-95"
          >
            <X size={12} />
            Clear all
          </button>
        )}
      </div>

      {filtersOpen && (
        <div className="border-t border-border px-4 py-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Entity Type
              </label>
              <div className="flex flex-wrap gap-2">
                {entityTypes.map((type) => (
                  <button
                    key={`et-chip-${type}`}
                    onClick={() => toggleEntityType(type)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95
                      ${
                        entityTypeFilter.includes(type)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-secondary text-secondary-foreground border-border hover:border-primary/40"
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Zone
              </label>
              <select
                value={zoneFilter}
                onChange={(e) => onZoneChange(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              >
                <option value="all">All Zones</option>
                {zones.map((z) => (
                  <option key={`zone-opt-${z}`} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => {
                  const active = statusFilter === s;
                  const colorMap: Record<string, string> = {
                    Granted: active
                      ? "bg-success text-white border-success"
                      : "bg-success/10 text-success border-success/30 hover:border-success/60",
                    Denied: active
                      ? "bg-danger text-white border-danger"
                      : "bg-danger/10 text-danger border-danger/30 hover:border-danger/60",
                    "Expired Credential": active
                      ? "bg-danger text-white border-danger"
                      : "bg-danger/10 text-danger border-danger/30 hover:border-danger/60",
                    "Tailgate Alert": active
                      ? "bg-warning text-white border-warning"
                      : "bg-warning/10 text-warning border-warning/30 hover:border-warning/60",
                  };
                  return (
                    <button
                      key={`status-chip-${s}`}
                      onClick={() => onStatusChange(active ? "all" : s)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-all duration-150 active:scale-95 ${colorMap[s]}`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Date Range
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => onDateFromChange(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
                <span className="text-muted-foreground text-xs">to</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => onDateToChange(e.target.value)}
                  className="flex-1 px-2 py-2 text-xs bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
