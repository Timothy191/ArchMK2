import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { HubGrid } from "@/features/hub/components/HubGrid";
import { ToolCard } from "@/features/hub/components/ToolCard";
import { UrgencyBar } from "@/features/hub/components/UrgencyBar";
import { ProductionTrend } from "@/features/hub/components/ProductionTrend";
import { PRODUCTIVITY_TOOLS } from "~/lib/departments";

export const dynamic = "force-dynamic";

export default async function HubPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const today = new Date().toISOString().split("T")[0];

  const [
    { count: incidentCount },
    { count: breakdownCount },
    { count: offlineMachineCount },
    { data: employee },
  ] = await Promise.all([
    supabase
      .from("safety_incidents")
      .select("id", { count: "exact", head: true })
      .eq("incident_date", today)
      .eq("status", "open"),
    supabase
      .from("breakdowns")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("machines")
      .select("id", { count: "exact", head: true })
      .eq("active", false),
    supabase
      .from("employees")
      .select("accessible_departments")
      .eq("auth_id", user.id)
      .single(),
  ]);

  const accessibleDeptIds = employee?.accessible_departments ?? [];

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-medium text-[var(--text-heading)]">
            Operations Hub
          </h1>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Real-time multi-departmental monitoring and control.
          </p>
        </div>

        <UrgencyBar
          incidents={incidentCount ?? 0}
          breakdowns={breakdownCount ?? 0}
          offlineMachines={offlineMachineCount ?? 0}
        />
        <HubGrid accessibleDeptIds={accessibleDeptIds} />
        <ProductionTrend />
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-medium text-[var(--text-heading)] flex items-center gap-2">
            Productivity Tools
            <span className="px-2 py-0.5 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-muted)] text-[10px] border border-[var(--border-default)] uppercase tracking-wider">
              Efficiency
            </span>
          </h2>
          <p className="text-[var(--text-muted)] text-sm mt-1">
            Essential tools for your daily workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {PRODUCTIVITY_TOOLS.map((tool, i) => (
            <ToolCard key={tool.name} tool={tool} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
