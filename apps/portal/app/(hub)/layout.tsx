import Link from "next/link";
import { DEPARTMENTS } from "~/lib/departments";
import { WeatherWidget } from "@/components/weather/WeatherWidget";
import { AIAssistant } from "@/components/ai/AIAssistant";
import { UserNav } from "@/components/nav/UserNav";
import { 
  LayoutDashboard, 
  Satellite as SatelliteIcon,
} from "lucide-react";
import dynamic from "next/dynamic";

const Toggle3D = dynamic(() => import("@/components/3d/Toggle3D").then(mod => ({ default: mod.Toggle3D })), {
  ssr: false,
  loading: () => <div className="w-8 h-6" />
});

export default function HubLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#fafafa]">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-[#363636] bg-[#0f0f0f]/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-medium text-[#fafafa]">
              Arch-Systems
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#242424] text-[#898989] text-xs border border-[#363636]">
              Hub
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Toggle3D />
            <WeatherWidget variant="header" />
            <div className="h-4 w-[1px] bg-[#363636] mx-1" />
            <UserNav />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 shrink-0 border-r border-[#363636] bg-[#0f0f0f] min-h-[calc(100vh-53px)]">
          <nav className="p-4 space-y-6">
            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-[#4a4a4a] uppercase tracking-[0.2em]">
                Main Navigation
              </div>
              <Link
                href="/"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#fafafa] bg-[#242424] border border-[#363636] shadow-sm transition-all"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                Operations Hub
              </Link>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-[#4a4a4a] uppercase tracking-[0.2em]">
                Departments
              </div>
              <div className="space-y-1">
                {DEPARTMENTS.filter((d) => d.name !== "satellite-monitoring").map((dept) => (
                  <Link
                    key={dept.name}
                    href={`/${dept.name}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#898989] hover:text-[#fafafa] hover:bg-[#171717] transition-all group"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#363636] group-hover:bg-[#fafafa] transition-colors" />
                    {dept.displayName}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="px-3 mb-2 text-[10px] font-bold text-[#4a4a4a] uppercase tracking-[0.2em]">
                Advanced Systems
              </div>
              <Link
                href="/satellite-monitoring"
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#898989] hover:text-[#fafafa] hover:bg-[#171717] transition-all"
              >
                <SatelliteIcon className="w-4 h-4 text-indigo-400" />
                Satellite Monitoring
              </Link>
            </div>
          </nav>
        </aside>

        <main className="flex-1 p-6">{children}</main>
      </div>

      {/* AI Assistant */}
      <AIAssistant context="Hub Dashboard" />
    </div>
  );
}
