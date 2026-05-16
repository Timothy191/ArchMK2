import { getDepartmentContext, requireDepartment } from "~/lib/dept-context";
import { KPIGrid, KPICard } from "@repo/ui/KPI";
import { PageHeader } from "@repo/ui/PageHeader";
import { ExcavatorActivityForm } from "./ExcavatorActivityForm";
import { ExcavatorActivityList } from "./ExcavatorActivityList";

export const revalidate = 0;

export default async function ExcavatorActivityPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department: deptSlug } = await params;
  requireDepartment(deptSlug, "control-room");

  const { deptId, supabase, today } = await getDepartmentContext({
    department: deptSlug,
  });

  // Fetch excavators for the department
  const { data: excavators } = await supabase
    .from("machines")
    .select("id, name, machine_type, serial_number, active")
    .eq("department_id", deptId)
    .eq("active", true)
    .ilike("machine_type", "%excavator%")
    .order("name");

  // Fetch dumper-type machines with bin_factor and site assignment
  const { data: dumpers } = await supabase
    .from("machines")
    .select(
      "id, name, machine_type, serial_number, active, bin_factor, site_id",
    )
    .eq("department_id", deptId)
    .eq("active", true)
    .or(
      "machine_type.ilike.%dumper%,machine_type.ilike.%dump truck%,machine_type.ilike.%hauler%",
    )
    .order("name");

  // Fetch operators
  const { data: operators } = await supabase
    .from("operators")
    .select("id, full_name, employee_code")
    .eq("active", true)
    .order("full_name");

  // Fetch sites
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, site_code, active")
    .eq("active", true)
    .order("name");

  // Fetch mine blocks with site relation
  const { data: mineBlocks } = await supabase
    .from("mine_blocks")
    .select("id, name, code, site_id, active")
    .eq("active", true)
    .order("name");

  // Fetch today's excavator activity with joins
  const { data: todayActivity } = await supabase
    .from("excavator_activity")
    .select(
      "*, machine:machines(name), operator:operators(full_name), site:sites(name), block_mined:mine_blocks(name, code)",
    )
    .eq("department_id", deptId)
    .eq("activity_date", today)
    .order("created_at", { ascending: false });

  // Fetch today's dumper assignments via excavator_activity IDs
  const activityIds = todayActivity?.map((a) => a.id) || [];
  let todayAssignments: Array<{
    id: string;
    excavator_activity_id: string;
    dumper_machine_id: string;
    material_type: string;
    total_loads: number;
    total_bcm: number | null;
    notes: string | null;
    dumper: {
      name: string;
      bin_factor: number | null;
      machine_type: string;
    } | null;
  }> = [];

  if (activityIds.length > 0) {
    const { data: assignments } = await supabase
      .from("excavator_dumper_assignments")
      .select(
        "*, dumper:machines!dumper_machine_id(name, bin_factor, machine_type)",
      )
      .in("excavator_activity_id", activityIds);
    todayAssignments = assignments || [];
  }

  // Fetch today's hourly loads for BCM auto-calculation
  const { data: todayLoads } = await supabase
    .from("hourly_loads")
    .select("machine_id, shift_type, total_loads")
    .eq("department_id", deptId)
    .eq("load_date", today);

  // Compute KPIs
  const totalLoads =
    todayAssignments?.reduce((sum, a) => sum + (a.total_loads || 0), 0) || 0;
  const totalBcm =
    todayAssignments?.reduce((sum, a) => sum + (a.total_bcm || 0), 0) || 0;
  const activeExcavators = new Set(todayActivity?.map((a) => a.machine_id))
    .size;

  return (
    <div className="space-y-6">
      <PageHeader title="Excavator Activity" />

      <KPIGrid cols={3}>
        <KPICard label="Total BCM" value={totalBcm.toFixed(1)} color="green" />
        <KPICard
          label="Total Loads"
          value={totalLoads.toLocaleString()}
          color="green"
        />
        <KPICard
          label="Active Excavators"
          value={activeExcavators}
          color="cyan"
        />
      </KPIGrid>

      <ExcavatorActivityForm
        departmentId={deptId}
        excavators={excavators || []}
        dumpers={dumpers || []}
        operators={operators || []}
        sites={sites || []}
        mineBlocks={mineBlocks || []}
        todayDumperLoads={todayLoads || []}
      />

      {todayActivity && todayActivity.length > 0 && (
        <ExcavatorActivityList
          todayActivity={todayActivity}
          todayAssignments={todayAssignments || []}
        />
      )}
    </div>
  );
}
