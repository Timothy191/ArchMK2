import { getDepartmentContext } from "~/lib/dept-context";
import { GlassCard } from "@repo/ui/GlassCard";
import { AddMachineForm } from "@/features/departments/components/machines/AddMachineForm";

export default async function MachinesPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department: deptSlug } = await params;
  const { deptId, supabase } = await getDepartmentContext({
    department: deptSlug,
  });

  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, machine_type, serial_number, active, created_at")
    .eq("department_id", deptId)
    .order("name");

  const activeCount = machines?.filter((m) => m.active).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-[var(--text-heading)]">
          Machines
        </h2>
        <AddMachineForm departmentId={deptId} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <p className="text-[var(--text-muted)] text-sm">Total Machines</p>
          <p className="text-2xl font-medium text-[var(--text-heading)] mt-1">
            {machines?.length ?? 0}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-sm">Active</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {activeCount}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-sm">Inactive</p>
          <p className="text-2xl font-medium text-[var(--text-muted)] mt-1">
            {(machines?.length ?? 0) - activeCount}
          </p>
        </GlassCard>
      </div>

      <div className="space-y-3">
        {machines?.map((machine) => (
          <GlassCard key={machine.id}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[var(--text-heading)] font-medium">
                  {machine.name}
                </p>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[var(--text-muted)] text-xs">
                    {machine.machine_type}
                  </span>
                  {machine.serial_number && (
                    <span className="text-[var(--text-muted)] text-xs">
                      SN: {machine.serial_number}
                    </span>
                  )}
                </div>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  machine.active
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-[var(--card)] text-[var(--text-muted)] border border-[var(--border-default)]"
                }`}
              >
                {machine.active ? "Active" : "Inactive"}
              </span>
            </div>
          </GlassCard>
        ))}
        {(!machines || machines.length === 0) && (
          <GlassCard>
            <p className="text-[var(--text-muted)] text-sm text-center py-8">
              No machines registered for this department.
            </p>
          </GlassCard>
        )}
      </div>
    </div>
  );
}
