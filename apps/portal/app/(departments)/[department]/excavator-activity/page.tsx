import { getDepartmentContext, requireDepartment } from "~/lib/dept-context";
import { KPIGrid, KPICard } from "@repo/ui/KPI";
import { PageHeader } from "@repo/ui/PageHeader";
import { GlassCard } from "@repo/ui/GlassCard";

export default async function ExcavatorActivityPage({
  params,
}: {
  params: { department: string };
}) {
  requireDepartment(params.department, "control-room");

  const { deptId, supabase, today } = await getDepartmentContext(params);

  // Fetch excavators only
  const { data: excavators } = await supabase
    .from("machines")
    .select("id, name, serial_number")
    .eq("department_id", deptId)
    .eq("active", true)
    .ilike("machine_type", "%excavator%")
    .order("name");

  // Fetch operators
  const { data: operators } = await supabase
    .from("operators")
    .select("id, full_name")
    .eq("active", true)
    .order("full_name");

  // Fetch today's activity
  const { data: todayActivity } = await supabase
    .from("excavator_activity")
    .select("*, machine:machines(name), operator:operators(full_name)")
    .eq("department_id", deptId)
    .eq("activity_date", today);

  const totalPasses =
    todayActivity?.reduce((sum, a) => sum + (a.passes || 0), 0) || 0;
  const totalLoads =
    todayActivity?.reduce((sum, a) => sum + (a.loads || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Excavator Activity" />

      <KPIGrid cols={3}>
        <KPICard
          label="Total Passes"
          value={totalPasses.toLocaleString()}
          color="green"
        />
        <KPICard
          label="Total Loads"
          value={totalLoads.toLocaleString()}
          color="green"
        />
        <KPICard
          label="Active Excavators"
          value={todayActivity?.length || 0}
          color="green"
        />
      </KPIGrid>

      <GlassCard>
        <div className="text-center py-8">
          <p className="text-[#fafafa] font-medium mb-2">
            Excavator Activity Tracking
          </p>
          <p className="text-[#898989] text-sm max-w-md mx-auto">
            Track passes, loads, and cycle times for excavators. This module
            will include forms for logging activity and automatic calculation of
            estimated tonnes moved.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-[#898989]">
            <span className="w-2 h-2 rounded-full bg-[#3ecf8e]"></span>
            Found {excavators?.length || 0} excavators in database
          </div>
        </div>
      </GlassCard>

      {todayActivity && todayActivity.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[#fafafa]">
            Today&apos;s Activity
          </h3>
          {todayActivity.map((activity) => (
            <GlassCard key={activity.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#fafafa] font-medium">
                    {activity.machine?.name}
                  </p>
                  <p className="text-[#898989] text-xs">
                    {activity.operator?.full_name} • {activity.shift_type} shift
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[#3ecf8e] font-medium">
                    {activity.passes} passes / {activity.loads} loads
                  </p>
                  {activity.avg_cycle_time_seconds && (
                    <p className="text-[#898989] text-xs">
                      Avg cycle:{" "}
                      {Math.round(activity.avg_cycle_time_seconds / 60)}min
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
