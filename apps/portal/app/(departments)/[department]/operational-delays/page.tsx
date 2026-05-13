import { createServerSupabaseClient } from "@repo/supabase/server";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";
import { OperationalDelaysForm } from "./OperationalDelaysForm";
import { OperationalDelaysList } from "./OperationalDelaysList";

export default async function OperationalDelaysPage({
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

  // Fetch machines for dropdown
  const { data: machines } = await supabase
    .from("machines")
    .select("id, name")
    .eq("department_id", deptId)
    .eq("active", true)
    .order("name");

  // Fetch delay categories for dropdown
  const { data: categories } = await supabase
    .from("delay_categories")
    .select("*")
    .order("sort_order");

  // Fetch today's operational delays
  const { data: todayDelays } = await supabase
    .from("operational_delays")
    .select("*, category:delay_categories(name, color, icon), machine:machines(name)")
    .eq("department_id", deptId)
    .eq("delay_date", today)
    .order("created_at", { ascending: false });

  // Calculate statistics
  const totalDelayMinutes = todayDelays?.reduce((sum, d) => sum + (d.delay_minutes || 0), 0) || 0;
  const activeCount = todayDelays?.filter(d => d.status === 'active').length || 0;
  const recoveredCount = todayDelays?.filter(d => d.status === 'recovered').length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#fafafa]">
          Operational Delays
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-[#898989] text-sm">Total Delays</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">
            {todayDelays?.length ?? 0}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Active</p>
          <p className="text-2xl font-medium text-amber-400 mt-1">
            {activeCount}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Recovered</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {recoveredCount}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Total Minutes</p>
          <p className="text-2xl font-medium text-red-400 mt-1">
            {totalDelayMinutes}
          </p>
        </GlassCard>
      </div>

      {/* Add Delay Form */}
      <OperationalDelaysForm
        departmentId={deptId}
        machines={machines || []}
        categories={categories || []}
      />

      {/* Today's Delays List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#fafafa]">
          Today&apos;s Delays
        </h3>
        <OperationalDelaysList delays={todayDelays || []} />
      </div>
    </div>
  );
}
