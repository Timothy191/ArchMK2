import { getDepartmentContext, requireDepartment } from "~/lib/dept-context";
import { GlassCard } from "@repo/ui/GlassCard";
import { DozerRollForm } from "~/features/departments/components/control-room/DozerRollForm";

export default async function RollOverPage({
  params,
}: {
  params: Promise<{ department: string }>;
}) {
  const { department: deptSlug } = await params;
  requireDepartment(deptSlug, "control-room");
  const { deptId, supabase, today } = await getDepartmentContext({
    department: deptSlug,
  });

  // Fetch dozers with site info
  const { data: dozers } = await supabase
    .from("machines")
    .select("id, name, serial_number, site_id, sites(name)")
    .eq("department_id", deptId)
    .eq("active", true)
    .ilike("machine_type", "%dozer%")
    .order("name");

  // Fetch today's roll data
  const { data: todayRolls } = await supabase
    .from("dozer_rolls")
    .select("*, machine:machines(name), operator:operators(full_name)")
    .eq("department_id", deptId)
    .eq("roll_date", today);

  const totalPasses =
    todayRolls?.reduce((sum, r) => sum + (r.blade_passes || 0), 0) || 0;
  const totalPushes =
    todayRolls?.reduce((sum, r) => sum + (r.push_count || 0), 0) || 0;
  const totalHours =
    todayRolls?.reduce((sum, r) => sum + (r.hours_operated || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medium text-[var(--text-heading)]">
          Roll Over (Dozers)
        </h2>
        <p className="text-[var(--text-muted)] text-sm">
          {new Date().toLocaleDateString("en-ZA", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <GlassCard>
          <p className="text-[var(--text-muted)] text-sm">Blade Passes</p>
          <p className="text-2xl font-medium text-[var(--accent-cyan)] mt-1">
            {totalPasses.toLocaleString()}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-sm">Push Count</p>
          <p className="text-2xl font-medium text-[var(--accent-cyan)] mt-1">
            {totalPushes.toLocaleString()}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-sm">Hours Operated</p>
          <p className="text-2xl font-medium text-emerald-400 mt-1">
            {totalHours.toFixed(1)}h
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-[var(--text-muted)] text-sm">Active Dozers</p>
          <p className="text-2xl font-medium text-[var(--text-heading)] mt-1">
            {todayRolls?.length || 0}
          </p>
        </GlassCard>
      </div>

      {/* Add Roll Form */}
      <DozerRollForm departmentId={deptId} dozers={dozers || []} />

      {/* Roll List */}
      {todayRolls && todayRolls.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[var(--text-heading)]">
            Today&apos;s Rolls
          </h3>
          {todayRolls.map((roll) => (
            <GlassCard key={roll.id} className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[var(--text-heading)] font-medium">
                    {roll.machine?.name}
                  </p>
                  <p className="text-[var(--text-muted)] text-xs">
                    {roll.operator?.full_name} • {roll.shift_type} shift
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[var(--accent-cyan)] font-medium">
                    {roll.blade_passes} passes
                  </p>
                  {roll.area_covered_sqm && roll.area_covered_sqm > 0 && (
                    <p className="text-[var(--text-muted)] text-xs">
                      {Number(roll.area_covered_sqm).toFixed(2)} m²
                    </p>
                  )}
                  {roll.material_moved_tonnes && (
                    <p className="text-[var(--text-muted)] text-xs">
                      {roll.material_moved_tonnes.toFixed(1)} tonnes
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
