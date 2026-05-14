import { getDepartmentContext, requireDepartment } from "~/lib/dept-context";
import { KPIGrid, KPICard } from "@repo/ui/KPI";
import { PageHeader } from "@repo/ui/PageHeader";
import { EngineeringNotesForm } from "./EngineeringNotesForm";
import { EngineeringNotesList } from "./EngineeringNotesList";

export default async function EngineeringNotesPage({
  params,
}: {
  params: { department: string };
}) {
  requireDepartment(params.department, "control-room");

  const { deptId, supabase, today } = await getDepartmentContext(params);

  // Fetch machines for dropdown
  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, machine_type")
    .eq("department_id", deptId)
    .eq("active", true)
    .order("name");

  // Fetch today's engineering notes
  const { data: todayNotes } = await supabase
    .from("engineering_notes")
    .select("*, machine:machines(name)")
    .eq("department_id", deptId)
    .eq("note_date", today)
    .order("created_at", { ascending: false });

  // Calculate statistics
  const criticalCount =
    todayNotes?.filter((n) => n.severity === "critical").length || 0;
  const openCount =
    todayNotes?.filter((n) => n.status === "open" || n.status === "in_progress")
      .length || 0;
  const resolvedCount =
    todayNotes?.filter((n) => n.status === "resolved").length || 0;
  const followUpCount =
    todayNotes?.filter((n) => n.requires_follow_up).length || 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Engineering Notes" />

      <KPIGrid cols={4}>
        <KPICard label="Critical" value={criticalCount} color="red" />
        <KPICard label="Open" value={openCount} color="amber" />
        <KPICard label="Resolved" value={resolvedCount} color="green" />
        <KPICard label="Follow-up" value={followUpCount} color="blue" />
      </KPIGrid>

      <EngineeringNotesForm departmentId={deptId} machines={machines || []} />

      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#fafafa]">
          Today&apos;s Engineering Issues
        </h3>
        <EngineeringNotesList notes={todayNotes || []} />
      </div>
    </div>
  );
}
