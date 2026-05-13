import { GlassCard } from "@repo/ui/GlassCard";
import { DEPARTMENTS } from "~/lib/departments";
import Link from "next/link";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import {
  Construction,
  Factory,
  ShieldCheck,
  Wrench,
  Monitor,
  HardHat,
  GraduationCap,
} from "lucide-react";

const colorStyles = {
  amber: { bg: "bg-amber-500/20", text: "text-amber-400" },
  emerald: { bg: "bg-emerald-500/20", text: "text-emerald-400" },
  blue: { bg: "bg-blue-500/20", text: "text-blue-400" },
  violet: { bg: "bg-violet-500/20", text: "text-violet-400" },
  red: { bg: "bg-red-500/20", text: "text-red-400" },
  orange: { bg: "bg-orange-500/20", text: "text-orange-400" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-400" },
} as const;

type ColorKey = keyof typeof colorStyles;

function getColorStyles(color: string) {
  return colorStyles[color as ColorKey] ?? colorStyles.blue;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Drill: Construction,
  Factory: Factory,
  ShieldCheck: ShieldCheck,
  Wrench: Wrench,
  Monitor: Monitor,
  HardHat: HardHat,
  GraduationCap: GraduationCap,
};

export default async function HubPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-8">
      <header className="max-w-7xl mx-auto mb-12">
        <h1 className="text-4xl font-medium text-[#fafafa]">Plantcor OS</h1>
        <p className="text-[#898989] mt-2">Select a department to begin</p>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DEPARTMENTS.map((dept) => {
          const colors = getColorStyles(dept.color);
          const Icon = iconMap[dept.icon];
          return (
            <Link
              key={dept.name}
              href={`/${dept.name}`}
              className="block group"
            >
              <GlassCard hover className="h-full">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-medium text-[#fafafa] group-hover:text-[#3ecf8e] transition-colors">
                      {dept.displayName}
                    </h3>
                    <p className="text-[#898989] text-sm mt-2 leading-relaxed">
                      {dept.description}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-lg ${colors.bg} flex items-center justify-center ${colors.text}`}
                  >
                    {Icon ? <Icon className="w-5 h-5" /> : null}
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
