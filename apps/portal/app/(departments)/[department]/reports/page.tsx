import { createServerSupabaseClient } from "@repo/supabase/server";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";

export default async function ReportsPage({
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

  const to = searchParams.to || new Date().toISOString().split("T")[0];
  const from =
    searchParams.from ||
    new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];

  const { data: logs } = await supabase
    .from("daily_logs")
    .select("id, log_date, shift, notes")
    .eq("department_id", deptId)
    .gte("log_date", from)
    .lte("log_date", to)
    .order("log_date", { ascending: false });

  const logIds = logs?.map((l) => l.id) || [];

  const [{ data: machineHours }, { data: fuelLogs }, { data: productionLogs }] =
    await Promise.all([
      logIds.length > 0
        ? supabase
            .from("machine_hours")
            .select("daily_log_id, hours_worked")
            .in("daily_log_id", logIds)
        : Promise.resolve({ data: [] }),
      logIds.length > 0
        ? supabase
            .from("fuel_logs")
            .select("daily_log_id, diesel_litres")
            .in("daily_log_id", logIds)
        : Promise.resolve({ data: [] }),
      logIds.length > 0
        ? supabase
            .from("production_logs")
            .select("daily_log_id, coal_tonnes, waste_tonnes")
            .in("daily_log_id", logIds)
        : Promise.resolve({ data: [] }),
    ]);

  const totalHours =
    machineHours?.reduce((sum, m) => sum + (m.hours_worked || 0), 0) || 0;
  const totalFuel =
    fuelLogs?.reduce((sum, f) => sum + (f.diesel_litres || 0), 0) || 0;
  const totalCoal =
    productionLogs?.reduce((sum, p) => sum + (p.coal_tonnes || 0), 0) || 0;
  const totalWaste =
    productionLogs?.reduce((sum, p) => sum + (p.waste_tonnes || 0), 0) || 0;

  // Pre-aggregate child records for O(1) lookup during render
  const machineHoursByLog = new Map<string, number>();
  machineHours?.forEach((m) => {
    machineHoursByLog.set(
      m.daily_log_id,
      (machineHoursByLog.get(m.daily_log_id) || 0) + (m.hours_worked || 0),
    );
  });

  const fuelLogsByLog = new Map<string, number>();
  fuelLogs?.forEach((f) => {
    fuelLogsByLog.set(
      f.daily_log_id,
      (fuelLogsByLog.get(f.daily_log_id) || 0) + (f.diesel_litres || 0),
    );
  });

  const productionByLog = new Map<
    string,
    { coal_tonnes: number; waste_tonnes: number }
  >();
  productionLogs?.forEach((p) => {
    productionByLog.set(p.daily_log_id, p);
  });

  const csvRows = [
    [
      "Date",
      "Shift",
      "Notes",
      "Total Hours",
      "Total Fuel (L)",
      "Coal (t)",
      "Waste (t)",
    ],
    ...(logs || []).map((log) => {
      const mh = machineHoursByLog.get(log.id) || 0;
      const fl = fuelLogsByLog.get(log.id) || 0;
      const pl = productionByLog.get(log.id);
      return [
        log.log_date,
        log.shift,
        log.notes || "",
        mh.toFixed(2),
        fl.toFixed(2),
        (pl?.coal_tonnes || 0).toFixed(2),
        (pl?.waste_tonnes || 0).toFixed(2),
      ];
    }),
  ];

  const csvContent = csvRows
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-[#fafafa]">Reports</h2>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`}
          download={`${params.department}-report-${from}-to-${to}.csv`}
          className="px-4 py-2 rounded-lg bg-[#0f0f0f] hover:bg-[#1a1a1a] text-[#fafafa] text-sm font-medium transition-colors"
        >
          Download CSV
        </a>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-[#898989] text-sm">Total Machine Hours</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">
            {totalHours.toFixed(1)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Diesel Consumed (L)</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">
            {totalFuel.toFixed(1)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Coal Removed (t)</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {totalCoal.toFixed(1)}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Waste Removed (t)</p>
          <p className="text-2xl font-medium text-amber-400 mt-1">
            {totalWaste.toFixed(1)}
          </p>
        </GlassCard>
      </div>

      {/* Date Filter */}
      <GlassCard>
        <form method="GET" className="flex items-end gap-4">
          <div>
            <label className="block text-sm text-[#898989] mb-1">From</label>
            <input
              type="date"
              name="from"
              defaultValue={from}
              className="px-4 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
            />
          </div>
          <div>
            <label className="block text-sm text-[#898989] mb-1">To</label>
            <input
              type="date"
              name="to"
              defaultValue={to}
              className="px-4 py-2 rounded-lg bg-[#171717] border border-[#363636] text-[#fafafa] focus:outline-none focus:ring-2 focus:ring-[#3ecf8e]/30"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#242424] text-[#fafafa] text-sm font-medium hover:bg-[#2e2e2e] transition-colors"
          >
            Update
          </button>
        </form>
      </GlassCard>

      {/* Report Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider">
                  Shift
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider text-right">
                  Hours
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider text-right">
                  Fuel (L)
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider text-right">
                  Coal (t)
                </th>
                <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider text-right">
                  Waste (t)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#363636]">
              {logs?.map((log) => {
                const mh = machineHoursByLog.get(log.id) || 0;
                const fl = fuelLogsByLog.get(log.id) || 0;
                const pl = productionByLog.get(log.id);
                return (
                  <tr
                    key={log.id}
                    className="hover:bg-[#242424] transition-colors"
                  >
                    <td className="px-6 py-4 text-[#fafafa] text-sm">
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
                    <td className="px-6 py-4 text-[#898989] text-sm text-right">
                      {mh.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-[#898989] text-sm text-right">
                      {fl.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-emerald-400 text-sm text-right">
                      {(pl?.coal_tonnes || 0).toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-amber-400 text-sm text-right">
                      {(pl?.waste_tonnes || 0).toFixed(1)}
                    </td>
                  </tr>
                );
              })}
              {(!logs || logs.length === 0) && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-12 text-center text-[#898989] text-sm"
                  >
                    No data found for the selected date range.
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
