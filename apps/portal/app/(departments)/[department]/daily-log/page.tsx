import { createServerSupabaseClient } from '@repo/supabase/server';
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from 'next/navigation';
import { DailyLogForm } from './DailyLogForm';
import { GlassCard } from '@repo/ui/GlassCard';

export default async function DailyLogPage({
  params,
}: {
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find(d => d.name === params.department);
  if (!dept) notFound();

  const supabase = await createServerSupabaseClient();

  const { data: department } = await supabase
    .from('departments')
    .select('id')
    .eq('name', params.department)
    .single();

  if (!department) notFound();

  const deptId = department.id;

  const { data: machines } = await supabase
    .from('machines')
    .select('id, name, machine_type')
    .eq('department_id', deptId)
    .eq('active', true)
    .order('name');

  const today = new Date().toISOString().split('T')[0];
  const { data: todayLog } = await supabase
    .from('daily_logs')
    .select('id, shift, notes')
    .eq('department_id', deptId)
    .eq('log_date', today)
    .maybeSingle();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Daily Log</h2>

      {todayLog ? (
        <GlassCard className="border-emerald-500/20">
          <p className="text-emerald-400 text-sm font-medium">&#10003; Today&apos;s log already submitted</p>
          <p className="text-white/70 text-sm mt-1">Shift: {todayLog.shift} &middot; <a href={`/${params.department}/history`} className="text-blue-400 hover:underline">View History</a></p>
        </GlassCard>
      ) : (
        <DailyLogForm departmentId={deptId} machines={machines || []} />
      )}
    </div>
  );
}
