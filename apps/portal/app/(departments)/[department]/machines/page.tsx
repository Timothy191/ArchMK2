import { createServerSupabaseClient } from "@repo/supabase/server";
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from "next/navigation";
import { GlassCard } from "@repo/ui/GlassCard";

export default async function MachinesPage({
  params,
}: {
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find((d) => d.name === params.department);
  if (!dept) notFound();

  const supabase = await createServerSupabaseClient();

  const { data: department } = await supabase
    .from("departments")
    .select("id")
    .eq("name", params.department)
    .single();

  if (!department) notFound();

  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, machine_type, serial_number, active, created_at")
    .eq("department_id", department.id)
    .order("name");

  const activeCount = machines?.filter((m) => m.active).length || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium text-[#fafafa]">Machines</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <p className="text-[#898989] text-sm">Total Machines</p>
          <p className="text-2xl font-medium text-[#fafafa] mt-1">
            {machines?.length ?? 0}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Active</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {activeCount}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[#898989] text-sm">Inactive</p>
          <p className="text-2xl font-medium text-[#898989] mt-1">
            {(machines?.length ?? 0) - activeCount}
          </p>
        </GlassCard>
      </div>

      <div className="space-y-3">
        {machines?.map((machine) => (
          <GlassCard key={machine.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#fafafa] font-medium">{machine.name}</p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[#898989] text-xs">
                    {machine.machine_type}
                  </span>
                  {machine.serial_number && (
                    <span className="text-[#898989] text-xs">
                      SN: {machine.serial_number}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  machine.active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-[#171717] text-[#898989] border border-[#363636]"
                }`}
              >
                {machine.active ? "Active" : "Inactive"}
              </span>
            </div>
          </GlassCard>
        ))}
        {(!machines || machines.length === 0) && (
          <GlassCard>
            <p className="text-[#898989] text-sm text-center py-8">
              No machines registered for this department.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
