import { createServerSupabaseClient } from "@repo/supabase/server";
import { notFound } from "next/navigation";
import { BreakdownsDashboard } from "@/features/departments/components/engineering/breakdowns";
import type {
  Breakdown,
  BreakdownMetrics,
} from "@/features/departments/components/engineering/breakdowns";

export default async function BreakdownsPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department: deptSlug } = await params;
  if (deptSlug !== "engineering") {
    notFound();
  }

  const supabase = await createServerSupabaseClient();

  const { data: department } = await supabase
    .from("departments")
    .select("id")
    .eq("name", "engineering")
    .single();

  if (!department) notFound();

  const deptId = department.id;
  const today = new Date().toISOString().split("T")[0];

  // Fetch all non-deleted breakdowns
  const { data: breakdowns } = await supabase
    .from("breakdowns")
    .select("*")
    .eq("department_id", deptId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);

  // Compute metrics
  const allBreakdowns = (breakdowns ?? []) as Breakdown[];
  const active = allBreakdowns.filter((b) => b.status === "active").length;
  const completedToday = allBreakdowns.filter(
    (b) => b.status === "completed" && b.date_out === today,
  ).length;

  // Avg repair time for completed breakdowns
  let totalRepairHours = 0;
  let completedCount = 0;
  for (const b of allBreakdowns) {
    if (b.status === "completed" && b.date_out && b.time_out) {
      const start = new Date(`${b.date_in}T${b.time_in}`);
      const end = new Date(`${b.date_out}T${b.time_out}`);
      const diffHours = (end.getTime() - start.getTime()) / 3600000;
      if (diffHours > 0) {
        totalRepairHours += diffHours;
        completedCount++;
      }
    }
  }

  const metrics: BreakdownMetrics = {
    total: allBreakdowns.length,
    active,
    completedToday,
    avgRepairHours: completedCount > 0 ? totalRepairHours / completedCount : 0,
  };

  return (
    <BreakdownsDashboard
      departmentId={deptId}
      breakdowns={allBreakdowns}
      metrics={metrics}
    />
  );
}
