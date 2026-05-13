import { createServerSupabaseClient } from "@repo/supabase/server";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";
import Link from "next/link";

export default async function HistoryPage({
  params,
  searchParams,
}: {
  params: { department: string };
  searchParams: { from?: string; to?: string };
}) {
  const dept = DEPARTMENTS.find((d) => d.name === params.department);
  if (!dept) notFound();

  const supabase = await createServerSupabaseClient();

  const { data: department } = await supabase
    .from("departments")
    .select("id")
    .eq("name", params.department)
    .single();

  if (!department) notFound();

  const deptId = department.id;

  // Default to last 30 days
  const to = searchParams.to || new Date().toISOString().split("T")[0];
  const from =
    searchParams.from ||
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
        <h2 className="text-2xl font-semibold text-white">History</h2>
        <Link
          href={`/${params.department}/reports?from=${from}&to=${to}`}
          className="px-4 py-2 rounded-lg bg-blue-600/20 text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
        >
          Export CSV
        </Link>
      </div>

      {/* Date Filter */}
      <GlassCard>
        <form method="GET" className="flex items-end gap-4">
          <div>
            <label className="block text-sm text-white/50 mb-1">From</label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-white/50 mb-1">To</label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-colors"
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
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-xs font-semibold text-white/50 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {logs?.map((log) => (
                <tr
                  key={log.id}
                  className="hover:bg-white/[0.02] transition-colors"
                >
                  <td className="px-6 py-4 text-white text-sm">
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
                  <td className="px-6 py-4 text-white/60 text-sm truncate max-w-xs">
                    {log.notes || "—"}
                  </td>
                  <td className="px-6 py-4 text-white/40 text-sm">
                    {new Date(log.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-white/30 text-sm"
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
