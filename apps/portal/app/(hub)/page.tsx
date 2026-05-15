import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { HubGrid } from "@/features/hub/components/HubGrid";
import { ToolCard } from "@/features/hub/components/ToolCard";
import { SystemHealth } from "@/features/hub/components/SystemHealth";
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

        <SystemHealth />
        <HubGrid />
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
