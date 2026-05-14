import { getDepartmentContext } from "~/lib/dept-context";
import { DailyLogForm } from "./DailyLogForm";
import { GlassCard } from "@repo/ui/GlassCard";

export default async function DailyLogPage({
  params,
}: {
  params: { department: string };
}) {
  const { deptId, supabase, today } = await getDepartmentContext(params);

  const { data: machines } = await supabase
    .from("machines")
    .select("id, name, machine_type")
    .eq("department_id", deptId)
    .eq("active", true)
    .order("name");

  const { data: todayLogs } = await supabase
    .from("daily_logs")
    .select("id, shift, notes")
    .eq("department_id", deptId)
    .eq("log_date", today);

  const existingShifts = (todayLogs || []).map(
    (l) => l.shift as "day" | "night",
  );
  const allShiftsLogged = existingShifts.length >= 2;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium text-[#fafafa]">Daily Log</h2>

      {allShiftsLogged ? (
        <GlassCard className="border-emerald-500/20">
          <p className="text-emerald-400 text-sm font-medium">
            &#10003; All shifts logged for today
          </p>
          <p className="text-[#b4b4b4] text-sm mt-1">
            <a
              href={`/${params.department}/history`}
              className="text-[#00c573] hover:underline"
            >
              View History
            </a>
          </p>
        </GlassCard>
      ) : (
        <>
          {existingShifts.length > 0 && (
            <GlassCard className="border-amber-500/20">
              <p className="text-amber-400 text-sm font-medium">
                {existingShifts.length} shift
                {existingShifts.length > 1 ? "s" : ""} already logged:{" "}
                {existingShifts.join(", ")}
              </p>
            </GlassCard>
          )}
          <DailyLogForm
            departmentId={deptId}
            departmentSlug={params.department}
            machines={machines || []}
          />
        </>
      )}
    </div>
  );
}
