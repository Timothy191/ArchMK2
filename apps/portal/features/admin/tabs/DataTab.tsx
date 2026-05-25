"use client";

import { useEffect, useState, useCallback } from "react";
import { GlassCard } from "@repo/ui/GlassCard";
import { Search, Save, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@repo/ui/components/ui/button";
import { Input } from "@repo/ui/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/ui/dialog";
import { logError } from "@/lib/errors/error-logger";

const TABLES = [
  { value: "machines", label: "Machines" },
  { value: "daily_logs", label: "Daily Logs" },
  { value: "machine_hours", label: "Machine Hours" },
  { value: "fuel_logs", label: "Fuel Logs" },
  { value: "production_logs", label: "Production Logs" },
  { value: "machine_operations", label: "Machine Operations" },
  { value: "hourly_loads", label: "Hourly Loads" },
  { value: "operational_delays", label: "Operational Delays" },
  { value: "engineering_notes", label: "Engineering Notes" },
  { value: "shift_status", label: "Shift Status" },
  { value: "excavator_activity", label: "Excavator Activity" },
  { value: "excavator_dumper_assignments", label: "Dumper Assignments" },
  { value: "dozer_rolls", label: "Dozer Rolls" },
  { value: "breakdowns", label: "Breakdowns" },
  { value: "safety_incidents", label: "Safety Incidents" },
  { value: "drill_operations", label: "Drill Operations" },
  { value: "documents", label: "Documents" },
  { value: "machine_configurations", label: "Machine Configs" },
  { value: "operators", label: "Operators" },
  { value: "sites", label: "Sites" },
  { value: "mine_blocks", label: "Mine Blocks" },
  { value: "delay_categories", label: "Delay Categories" },
  { value: "report_templates", label: "Report Templates" },
  { value: "safety_severities", label: "Safety Severities" },
  { value: "safety_incident_categories", label: "Incident Categories" },
  { value: "generated_reports", label: "Generated Reports" },
  { value: "personnel", label: "Personnel" },
  { value: "visitors", label: "Visitors" },
  { value: "badges", label: "Badges" },
  { value: "fleet", label: "Fleet" },
  { value: "equipment", label: "Equipment" },
  { value: "access_logs", label: "Access Logs" },
];

export function DataTab() {
  const [selectedTable, setSelectedTable] = useState(TABLES[0]!.value);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [offset, setOffset] = useState(0);
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const limit = 50;

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        offset: String(offset),
        order_by: "created_at",
        order_dir: "desc",
      });
      const res = await fetch(`/api/admin/data/${selectedTable}?${params}`);
      if (!res.ok) throw new Error("Failed to load records");
      const json = await res.json();
      setRecords(json.data ?? []);
      setTotalCount(json.count ?? 0);
    } catch (e) {
      logError(e instanceof Error ? e : new Error(String(e)), {
        context: "data_tab_load",
      });
      setRecords([]);
    }
    setLoading(false);
  }, [selectedTable, offset]);

  useEffect(() => {
    setOffset(0);
  }, [selectedTable]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleEdit = (record: Record<string, unknown>) => {
    setEditingRecord({ ...record });
    setShowEditDialog(true);
  };

  const handleSave = async () => {
    if (!editingRecord) return;
    const { id, created_at: _ca, updated_at: _ua, deleted_at: _da, ...data } = editingRecord;
    try {
      const res = await fetch(`/api/admin/data/${selectedTable}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...data }),
      });
      if (!res.ok) throw new Error("Failed to update record");
      setShowEditDialog(false);
      setEditingRecord(null);
      loadRecords();
    } catch (e) {
      logError(e instanceof Error ? e : new Error(String(e)), {
        context: "data_tab_update",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record? This cannot be undone.")) return;
    try {
      const res = await fetch(
        `/api/admin/data/${selectedTable}?id=${encodeURIComponent(id)}`,
        { method: "DELETE" },
      );
      if (!res.ok) throw new Error("Failed to delete record");
      loadRecords();
    } catch (e) {
      logError(e instanceof Error ? e : new Error(String(e)), {
        context: "data_tab_delete",
      });
    }
  };

  const filteredRecords = searchTerm
    ? records.filter((r) =>
        Object.values(r).some(
          (v) =>
            v != null &&
            String(v).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      )
    : records;

  const columns =
    filteredRecords.length > 0 && filteredRecords[0]
      ? Object.keys(filteredRecords[0]).filter(
          (k) => k !== "embedding" && !k.endsWith("_vector"),
        )
      : [];

  const totalPages = Math.ceil(totalCount / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <select
            value={selectedTable}
            onChange={(e) => setSelectedTable(e.target.value)}
            className="px-3 py-2 bg-[var(--bg-secondary)] border-[var(--border-default)] rounded text-[var(--text-heading)]"
            aria-label="Select table"
          >
            {TABLES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <span className="text-sm text-[var(--text-muted)]">
            {totalCount} records
          </span>
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <Input
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-[var(--bg-secondary)] border-[var(--border-default)]"
          />
        </div>
      </div>

      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto max-h-[65vh] overflow-y-auto">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-[var(--bg-primary)] z-10">
              <tr className="border-b border-[var(--border-default)]">
                {columns.map((col) => (
                  <th
                    key={col}
                    scope="col"
                    className="px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider whitespace-nowrap"
                  >
                    {col.replace(/_/g, " ")}
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-4 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider text-right sticky right-0 bg-[var(--bg-primary)]"
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-6 py-12 text-center text-[var(--text-muted)]"
                  >
                    Loading...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="px-6 py-12 text-center text-[var(--text-muted)]"
                  >
                    No records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record, i) => (
                  <tr
                    key={String((record as any).id ?? i)}
                    className="hover:bg-[var(--bg-tertiary)] transition-colors"
                  >
                    {columns.map((col) => {
                      const val = (record as any)[col];
                      const display =
                        val == null
                          ? "—"
                          : typeof val === "object"
                            ? JSON.stringify(val).slice(0, 60)
                            : String(val).slice(0, 80);
                      return (
                        <td
                          key={col}
                          className="px-4 py-2 text-[var(--text-muted)] text-sm max-w-[200px] truncate"
                          title={String(display)}
                        >
                          {display}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2 text-right sticky right-0 bg-[var(--bg-primary)]">
                      <div className="flex gap-1 justify-end">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(record)}
                        >
                          <Save className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-400 hover:text-red-300"
                          onClick={() =>
                            handleDelete(String((record as any).id))
                          }
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Previous
          </Button>
          <span className="text-sm text-[var(--text-muted)]">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={offset + limit >= totalCount}
            onClick={() => setOffset(offset + limit)}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="bg-[var(--bg-primary)] border-[var(--border-default)] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Record</DialogTitle>
          </DialogHeader>
          {editingRecord && (
            <EditRecordForm
              record={editingRecord}
              onSave={handleSave}
              onChange={setEditingRecord}
              onCancel={() => {
                setShowEditDialog(false);
                setEditingRecord(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditRecordForm({
  record,
  onSave,
  onChange,
  onCancel,
}: {
  record: Record<string, unknown>;
  onSave: () => void;
  onChange: (_r: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const skipFields = new Set([
    "id",
    "created_at",
    "updated_at",
    "deleted_at",
    "embedding",
  ]);

  const entries = Object.entries(record).filter(
    ([k]) => !skipFields.has(k) && !k.endsWith("_vector"),
  );

  const handleFieldChange = (key: string, value: string) => {
    const parsed: unknown =
      value === "" ? null : /^\d+$/.test(value) ? parseInt(value, 10) : /^\d+\.\d+$/.test(value) ? parseFloat(value) : value;
    onChange({ ...record, [key]: parsed });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        {entries.map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 uppercase tracking-wider">
              {key.replace(/_/g, " ")}
            </label>
            {value != null && typeof value === "object" ? (
              <textarea
                rows={3}
                value={JSON.stringify(value, null, 2)}
                readOnly
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border-[var(--border-default)] rounded text-[var(--text-muted)] text-sm font-mono"
              />
            ) : (
              <input
                type={typeof value === "number" ? "number" : "text"}
                value={String(value ?? "")}
                onChange={(e) => handleFieldChange(key, e.target.value)}
                className="w-full px-3 py-2 bg-[var(--bg-secondary)] border-[var(--border-default)] rounded text-[var(--text-heading)] text-sm"
              />
            )}
          </div>
        ))}
      </div>
      <div className="flex gap-2 justify-end pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-[var(--accent-emerald)] hover:bg-[var(--accent-green)] text-[var(--bg-void)]"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
