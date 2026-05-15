import { getDepartmentContext } from "~/lib/dept-context";
import { GlassCard } from "@repo/ui/GlassCard";
import { Input } from "@repo/ui/Input";
import Link from "next/link";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ department: string }>;
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { department: deptSlug } = await params;
  const { from: fromParam, to: toParam } = await searchParams;
  const { deptId } = await getDepartmentContext({ department: deptSlug });

  // Default to last 30 days
  const to = toParam || new Date().toISOString().split("T")[0];
  const from =
    fromParam ||
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("id, log_date, shift, notes, created_at")
    .eq("department_id", deptId)
    .gte("log_date", from)
    .lte("log_date", to)
    .order("log_date", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-[var(--text-heading)]">
          History
        </h2>
        <Link
          href={`/${deptSlug}/reports?from=${from}&to=${to}`}
          className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--accent-cyan)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
        >
          Export CSV
        </Link>
      </div>

      {/* Date Filter */}
      <GlassCard>
        <form method="GET" className="flex items-end gap-4">
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">
              From
            </label>
            <Input
              type="date"
              name="from"
              defaultValue={from}
              className="px-4 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-[var(--text-muted)] mb-1">
              To
            </label>
            <Input
              type="date"
              name="to"
              defaultValue={to}
              className="px-4 py-2"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[var(--bg-tertiary)] text-[var(--text-heading)] text-sm font-medium hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            Filter
          </button>
        </form>
      </GlassCard>

      {/* Logs Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--border-default)]">
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[var(--text-muted)] uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-default)]">
              {logs?.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-[var(--bg-tertiary)] transition-colors"
                >
                  <td className="px-6 py-4 text-[var(--text-heading)] text-sm">
                    {log.log_date}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.shift === "day"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-indigo-500/10 text-indigo-400"
                      }`}
                    >
                      {log.shift}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[var(--text-muted)] text-sm truncate max-w-xs">
                    {log.notes || "—"}
                  </td>
                  <td className="px-6 py-4 text-[var(--text-muted)] text-sm">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-[var(--text-muted)] text-sm"
                  >
                    No logs found for the selected date range.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
