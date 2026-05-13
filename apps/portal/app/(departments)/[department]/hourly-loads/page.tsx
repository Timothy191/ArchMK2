import { createServerSupabaseClient } from "@repo/supabase/server";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";
import { HourlyLoadsGrid } from "./HourlyLoadsGrid";

export default async function HourlyLoadsPage({
  params,
}: {
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find((d) => d.name === params.department);
  if (!dept) notFound();

  // Only for control-room department
  if (params.department !== "control-room") {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  const { data: department } = await supabase
    .from("departments")
    .select("id")
    .eq("name", params.department)
    .single();

  if (!department) notFound();

  const deptId = department.id;
  const today = new Date().toISOString().split("T")[0];

  // Fetch machines
  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, machine_type")
    .eq("department_id", deptId)
    .eq("active", true)
    .order("name");

  // Fetch today's hourly loads
  const { data: hourlyLoads } = await supabase
    .from("hourly_loads")
    .select("*")
    .eq("department_id", deptId)
    .eq("load_date", today);

  // Calculate totals
  const loadsByMachine = new Map();
  let grandTotal = 0;

  hourlyLoads?.forEach((load) => {
    loadsByMachine.set(load.machine_id, load.total_loads);
    grandTotal += load.total_loads || 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#fafafa]">
          Hourly Loads Sheet
        </h2>
        <p className="text-[#898989] text-sm">
          {new Date().toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <p className="text-[#898989] text-sm">Total Loads Today</p>
          <p className="text-2xl font-medium text-[#3ecf8e] mt-1">
            {grandTotal.toLocaleString()}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Machines Active</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {loadsByMachine.size}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Avg Loads per Machine</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">
            {loadsByMachine.size > 0
              ? Math.round(grandTotal / loadsByMachine.size)
              : 0}
          </p>
        </GlassCard>
      </div>

      {/* Hourly Loads Grid */}
      <HourlyLoadsGrid
        departmentId={deptId}
        machines={machines || []}
        hourlyLoads={hourlyLoads || []}
      />

      {/* Legend */}
      <div className="flex items-center gap-6 text-xs text-[#898989]">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#3ecf8e]/20 border border-[#3ecf8e]"></span>
          <span>Active hour with loads</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-[#171717] border border-[#363636]"></span>
          <span>No loads recorded</span>
        </div>
        <p className="ml-auto">
          Tip: Click any cell to edit load count. Auto-saves on change.
        </p>
      </div>
    </div>
  );
}
