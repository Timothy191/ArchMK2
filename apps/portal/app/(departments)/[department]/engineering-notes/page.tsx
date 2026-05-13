import { createServerSupabaseClient } from "@repo/supabase/server";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";
import { EngineeringNotesForm } from "./EngineeringNotesForm";
import { EngineeringNotesList } from "./EngineeringNotesList";

export default async function EngineeringNotesPage({
  params,
}: {
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find((d) => d.name === params.department);
  if (!dept) notFound();

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
  const criticalCount = todayNotes?.filter(n => n.severity === 'critical').length || 0;
  const openCount = todayNotes?.filter(n => n.status === 'open' || n.status === 'in_progress').length || 0;
  const resolvedCount = todayNotes?.filter(n => n.status === 'resolved').length || 0;
  const followUpCount = todayNotes?.filter(n => n.requires_follow_up).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-[#fafafa]">
          Engineering Notes
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
          <p className="text-[#898989] text-sm">Critical</p>
          <p className="text-2xl font-medium text-red-400 mt-1">
            {criticalCount}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Open</p>
          <p className="text-2xl font-medium text-amber-400 mt-1">
            {openCount}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Resolved</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {resolvedCount}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Follow-up</p>
          <p className="text-2xl font-medium text-blue-400 mt-1">
            {followUpCount}
          </p>
        </GlassCard>
      </div>

      {/* Add Engineering Note Form */}
      <EngineeringNotesForm
        departmentId={deptId}
        machines={machines || []}
      />

      {/* Today's Notes List */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-[#fafafa]">
          Today&apos;s Engineering Issues
        </h3>
        <EngineeringNotesList notes={todayNotes || []} />
      </div>
    </div>
  );
}
