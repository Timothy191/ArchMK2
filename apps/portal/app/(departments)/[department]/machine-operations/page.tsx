import { createServerSupabaseClient } from "@repo/supabase/server";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";
import { MachineOperationsForm } from "./MachineOperationsForm";
import { MachineOperationsList } from "./MachineOperationsList";

export default async function MachineOperationsPage({
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

  // Fetch machines with bin_factor for BCM calculations
  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, machine_type, serial_number, active, bin_factor")
    .eq("department_id", deptId)
    .eq("active", true)
    .order("name");

  // Fetch operators for dropdown
  const { data: operators } = await supabase
    .from("operators")
    .select("id, full_name, employee_code")
    .eq("active", true)
    .order("full_name");

  // Fetch sites for dropdown
  const { data: sites } = await supabase
    .from("sites")
    .select("id, name, site_code")
    .eq("active", true)
    .order("name");

  // Fetch today's operations with pre-populated data
  const { data: todayOperations } = await supabase
    .from("machine_operations")
    .select("*, machine:machines(name, bin_factor), operator:operators(full_name), site:sites(name)")
    .eq("department_id", deptId)
    .eq("shift_date", today)
    .order("start_time", { ascending: false });

  // Fetch today's hourly loads for BCM calculations
  const { data: todayLoads } = await supabase
    .from("hourly_loads")
    .select("machine_id, shift_type, total_loads")
    .eq("department_id", deptId)
    .eq("load_date", today);

  // Calculate today's totals
  const totalHours = todayOperations?.reduce((sum, op) => {
    return sum + (op.hours_worked || 0);
  }, 0) || 0;

  const activeMachines = new Set(todayOperations?.map(op => op.machine_id)).size;

  // Calculate total material moved (BCM) - sum of (loads × bin_factor)
  let totalMaterialBCM = 0;
  todayOperations?.forEach(op => {
    const binFactor = op.machine?.bin_factor || 0;
    // Find loads for this machine across both shifts
    const machineLoads = todayLoads
      ?.filter(l => l.machine_id === op.machine_id)
      ?.reduce((sum, l) => sum + (l.total_loads || 0), 0) || 0;
    totalMaterialBCM += machineLoads * binFactor;
  });

  // Calculate average BCM/hour
  const avgBcmPerHour = totalHours > 0 ? totalMaterialBCM / totalHours : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#fafafa]">
          Machine Operations
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
          <p className="text-[#898989] text-sm">Today&apos;s Hours</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">
            {totalHours.toFixed(1)}h
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Active Machines</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {activeMachines}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Material Moved</p>
          <p className="text-2xl font-medium text-[#3ecf8e] mt-1">
            {totalMaterialBCM.toFixed(1)} BCM
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">BCM/Hour</p>
          <p className="text-2xl font-medium text-amber-400 mt-1">
            {avgBcmPerHour.toFixed(1)}
          </p>
        </GlassCard>
      </div>

      {/* Add Operation Form */}
      <MachineOperationsForm
        departmentId={deptId}
        machines={machines || []}
        operators={operators || []}
        sites={sites || []}
        todayOperations={todayOperations || []}
      />

      {/* Today's Operations List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#fafafa]">
          Today&apos;s Operations
        </h3>
        <MachineOperationsList 
          operations={todayOperations || []} 
          todayLoads={todayLoads || []}
        />
      </div>
    </div>
  );
}
