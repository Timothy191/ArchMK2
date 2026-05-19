import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { DrillOperationsForm } from "./DrillOperationsForm";

export default async function NewDrillOperationPage() {
  const supabase = await createServerSupabaseClient();

  // Ensure user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Get Drilling Department ID
  const { data: dept } = await supabase
    .from("departments")
    .select("id")
    .eq("name", "drilling")
    .single();

  if (!dept) {
    redirect("/drilling");
  }

  // Get active drill rigs
  const { data: machines } = await supabase
    .from("machines")
    .select("id, name")
    .eq("department_id", dept.id)
    .eq("machine_type", "Drill Rig")
    .eq("active", true)
    .order("name");

  // Get active operators
  const { data: operators } = await supabase
    .from("employees")
    .select("id, full_name")
    .eq("department_id", dept.id)
    .eq("role", "operator")
    .eq("active", true)
    .order("full_name");

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-[var(--text-heading)]">Log Drill Operation</h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Record daily shift metrics, hours, and precise granular delays.
        </p>
      </div>

      <DrillOperationsForm 
        departmentId={dept.id} 
        machines={machines || []} 
        operators={operators || []} 
      />
    </div>
  );
}
