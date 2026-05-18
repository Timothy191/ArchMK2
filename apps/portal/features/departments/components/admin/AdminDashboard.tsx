import { createServerSupabaseClient } from "@repo/supabase/server";
import { GlassCard } from "@repo/ui/GlassCard";
import { PageHeader } from "@repo/ui/PageHeader";
import { AdminCharts } from "./AdminCharts";
import { PersonnelTable } from "./PersonnelTable";
import { ShiftOversight } from "./ShiftOversight";
import { pluginOrchestrator } from "../../../../lib/plugins/orchestrator";

export async function AdminDashboard() {
  const supabase = await createServerSupabaseClient();

  // 1. Employee Stats
  const { count: totalEmployees } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true });

  const { count: activeAdmins } = await supabase
    .from("employees")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");

  // 2. Shift Status (Today)
  const today = new Date().toISOString().split("T")[0];
  const { data: currentShifts } = await supabase
    .from("shift_status")
    .select("id, status, department_id")
    .eq("shift_date", today);

  const openShiftsCount = currentShifts?.filter(s => s.status === "open").length ?? 0;
  const closedShiftsCount = currentShifts?.filter(s => s.status === "closed").length ?? 0;

  // 3. Department Data for Charts
  const { data: deptEmployees } = await supabase
    .from("employees")
    .select("department_id");

  // 🚀 Fetch dynamic widgets from sandboxed active plugins
  const widgets = await pluginOrchestrator.getActiveWidgets();

  return (
    <div className="space-y-6">
      <PageHeader title="Administrative Operations" />

      {/* 🚀 Dynamic Sandboxed Plugins UI Layer */}
      {widgets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {widgets.map((widget) => {
            const WidgetComponent = widget.component;
            return <WidgetComponent key={widget.id} departmentId="admin" />;
          })}
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-[#898989] text-xs uppercase tracking-wide">Total Personnel</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">{totalEmployees ?? 0}</p>
          <p className="text-[#898989] text-xs mt-1">{activeAdmins ?? 0} active admins</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-xs uppercase tracking-wide">Open Shifts</p>
          <p className="text-2xl font-medium text-amber-400 mt-1">{openShiftsCount}</p>
          <p className="text-[#898989] text-xs mt-1">out of all departments</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-xs uppercase tracking-wide">Shift Completion</p>
          <p className="text-2xl font-medium text-[#3ecf8e] mt-1">
            {closedShiftsCount > 0 ? Math.round((closedShiftsCount / (openShiftsCount + closedShiftsCount)) * 100) : 0}%
          </p>
          <p className="text-[#898989] text-xs mt-1">closed today</p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-xs uppercase tracking-wide">Compliance</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">98.2%</p>
          <p className="text-[#3ecf8e] text-xs mt-1">+0.4% from last week</p>
        </GlassCard>
      </div>

      {/* Visualizations */}
      <AdminCharts 
        distributionData={[
          { name: "Drilling", value: 42 },
          { name: "Production", value: 85 },
          { name: "Engineering", value: 38 },
          { name: "Control Room", value: 12 },
          { name: "Safety", value: 15 }
        ]}
        completionData={[
          { date: "Mon", rate: 100 },
          { date: "Tue", rate: 95 },
          { date: "Wed", rate: 100 },
          { date: "Thu", rate: 88 },
          { date: "Fri", rate: 92 },
          { date: "Sat", rate: 100 },
          { date: "Sun", rate: 100 }
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ShiftOversight />
        <PersonnelTable />
      </div>
    </div>
  );
}
