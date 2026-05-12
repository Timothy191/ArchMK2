import { GlassCard } from '@repo/ui/GlassCard';
import { DEPARTMENTS } from "~/lib/departments";
import Link from 'next/link';
import { createServerSupabaseClient } from '@repo/supabase/server';
import { redirect } from 'next/navigation';

const colorStyles = {
  amber:   { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  emerald: { bg: 'bg-emerald-500/20', text: 'text-emerald-400' },
  blue:    { bg: 'bg-blue-500/20', text: 'text-blue-400' },
  violet:  { bg: 'bg-violet-500/20', text: 'text-violet-400' },
  red:     { bg: 'bg-red-500/20', text: 'text-red-400' },
  orange:  { bg: 'bg-orange-500/20', text: 'text-orange-400' },
  cyan:    { bg: 'bg-cyan-500/20', text: 'text-cyan-400' },
} as const;

type ColorKey = keyof typeof colorStyles;

function getColorStyles(color: string) {
  return (colorStyles[color as ColorKey] ?? colorStyles.blue);
}

export default async function HubPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8">
      <header className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white">Plantcor OS</h1>
        <p className="text-white/50 mt-2">Select a department to begin</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEPARTMENTS.map((dept) => {
          const colors = getColorStyles(dept.color);
          return (
            <Link key={dept.name} href={`/${dept.name}`} className="block group">
              <GlassCard hover className="h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {dept.displayName}
                    </h3>
                    <p className="text-white/50 text-sm mt-2 leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}>
                    <DeptIcon name={dept.icon} />
                  </div>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </main>
    </div>
  );
}

function DeptIcon({ name }: { name: string }) {
  const icons: Record<string, JSX.Element> = {
    Drill: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/></svg>,
    Factory: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M17 18h1"/><path d="M12 18h1"/><path d="M7 18h1"/></svg>,
    ShieldCheck: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>,
    Wrench: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>,
    Monitor: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>,
    HardHat: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 18a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1H3a1 1 0 0 0-1 1v2z"/><path d="M10 10a5 5 0 0 1 5 0"/><path d="M14 10V5a1 1 0 0 0-1-1h-2a1 1 0 0 0-1 1v5"/></svg>,
    GraduationCap: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  };
  return icons[name] || null;
}
