"use client";

import { Download } from "lucide-react";

interface ExportButtonProps {
  filename: string;
  rows: Record<string, unknown>[];
}

function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const lines = [
    headers.map((h) => `"${h}"`).join(","),
    ...rows.map((row) =>
      headers
        .map((h) => `"${String(row[h] ?? "").replace(/"/g, '""')}"`)
        .join(","),
    ),
  ];
  return lines.join("\n");
}

export function ExportButton({ filename, rows }: ExportButtonProps) {
  const handleExport = () => {
    const csv = rowsToCsv(rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleExport}
      disabled={rows.length === 0}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/70 border border-black/[0.08] text-[var(--text-body)] text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
    >
      <Download className="w-4 h-4" />
      Export CSV
    </button>
  );
}
