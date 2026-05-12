import { createServerSupabaseClient } from '@repo/supabase/server';
import { GlassCard } from '@repo/ui/GlassCard';
import { DEPARTMENTS } from "~/lib/departments";
import { notFound } from 'next/navigation';

export default async function DepartmentDashboard({
  params,
}: {
  params: { department: string };
}) {
  const dept = DEPARTMENTS.find(d => d.name === params.department);
  if (!dept) notFound();

  const supabase = await createServerSupabaseClient();

  // Resolve department name to UUID
  const { data: department } = await supabase
    .from('departments')
    .select('id')
    .eq('name', params.department)
    .single();

  if (!department) notFound();

  const deptId = department.id;
  const today = new Date().toISOString().split('T')[0];

  const { data: todayLog } = await supabase
    .from('daily_logs')
    .select('id, log_date, shift')
    .eq('department_id', deptId)
    .eq('log_date', today)
    .single();

  const { count: machineCount } = await supabase
    .from('machines')
    .select('*', { count: 'exact', head: true })
    .eq('department_id', deptId)
    .eq('active', true);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard>
          <p className="text-white/50 text-sm">Today&apos;s Log</p>
          <p className="text-2xl font-bold text-white mt-1">
            {todayLog ? `Shift: ${todayLog.shift}` : 'Not logged'}
          </p>
        </GlassCard>
        <GlassCard>
          <p className="text-white/50 text-sm">Active Machines</p>
          <p className="text-2xl font-bold text-white mt-1">{machineCount ?? 0}</p>
        </GlassCard>
        <GlassCard>
          <p className="text-white/50 text-sm">Status</p>
          <p className="text-2xl font-bold text-emerald-400 mt-1">Operational</p>
        </GlassCard>
      </div>
    </div>
  );
}
