import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { Marquee } from "@repo/ui/Marquee";
import { 
  Drill, Factory, 
  Flame, HardHat, Radar, Satellite, ShieldCheck, 
  Users, Wrench, Zap 
} from "lucide-react";
import { 
  IconThermometer, 
  IconWind,
  IconCloudRain,
  IconAlertHexagon,
  IconActivityHeartbeat,
  IconShieldCheck,
  IconTruck,
  IconCheck,
  IconClock,
  IconServer,
  IconWifi,
  IconDatabase,
  IconSun,
  IconMoon,
  IconLock
} from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  
  let user = null;
  let _authError = null;
  
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      _authError = error;
      if (process.env.NODE_ENV === "development") {
        console.error("[LoginPage] Supabase auth.getUser() error:", error);
      }
    } else {
      user = data.user;
    }
  } catch (error) {
    _authError = error;
    if (process.env.NODE_ENV === "development") {
      console.error("[LoginPage] Unexpected auth error:", error);
    }
  }

  // If we have a user, redirect to home
  if (user) {
    redirect("/");
  }
  
  // Otherwise show login form (even if there was an auth error)

  // Get current hour for shift calculation
  const currentHour = new Date().getHours();
  const isDayShift = currentHour >= 6 && currentHour < 18;
  const shiftText = isDayShift ? "Day Shift" : "Night Shift";
  const ShiftIcon = isDayShift ? IconSun : IconMoon;

  return (
    <div className="w-full max-w-md space-y-3 overflow-x-hidden">
      {/* macOS Window Title Bar strip */}
      <div className="rounded-xl overflow-hidden border border-black/[0.08] bg-white/70 backdrop-blur-2xl shadow-window animate-window-open"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.06] bg-white/50">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-black/[0.06]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-black/[0.06]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-black/[0.06]" />
          </div>
          <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
            Plantcor — Sign In
          </span>
        </div>

        {/* Login card body */}
        <div className="p-6 space-y-4">
          {/* Header Bar with Clock & Shift */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShiftIcon className={`w-3.5 h-3.5 ${isDayShift ? "text-[var(--accent-orange)]" : "text-[var(--accent-blue)]"}`} stroke={1.5} />
              <span className={`text-xs ${isDayShift ? "text-[var(--accent-orange)]" : "text-[var(--accent-blue)]"}`}>{shiftText}</span>
              <span className="w-1 h-1 rounded-full bg-black/20" />
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--accent-green)]">
              <IconLock className="w-3 h-3" stroke={1.5} />
              <span>Secure</span>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-0.5">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-heading)]">
              Plantcor
            </h1>
            <p className="text-[var(--text-muted)] text-sm">
              Sign in to Arch Systems
            </p>
          </div>

          <LoginForm />
        </div>
      </div>

      {/* System Status Card */}
      <div className="rounded-xl bg-white/70 border border-black/[0.08] backdrop-blur-xl overflow-hidden shadow-diffusion-sm"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-50 animate-ping"
              // Tailwind doesn't support custom animation duration via class
              style={{ animationDuration: '2s' }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <IconCheck className="w-4 h-4 text-[var(--accent-green)]" stroke={2} />
              <span className="text-sm text-[var(--accent-green)]">All Systems Operational</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              API • Database • Network • Services
            </p>
          </div>
          <div className="flex flex-col gap-1 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <IconServer className="w-3 h-3 text-[var(--accent-green)]" stroke={1.5} />
              <span className="text-[var(--accent-green)]">API</span>
            </span>
            <span className="flex items-center gap-1">
              <IconDatabase className="w-3 h-3 text-[var(--accent-green)]" stroke={1.5} />
              <span className="text-[var(--accent-green)]">DB</span>
            </span>
            <span className="flex items-center gap-1">
              <IconWifi className="w-3 h-3 text-[var(--accent-green)]" stroke={1.5} />
              <span className="text-[var(--accent-green)]">NET</span>
            </span>
          </div>
        </div>
        <div className="h-0.5 bg-[var(--accent-green)]/15">
          <div className="h-full w-1/3 bg-[var(--accent-green)] animate-pulse" />
        </div>
      </div>

      {/* Support Card */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 border border-black/[0.08] backdrop-blur-xl shadow-diffusion-sm"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          <span className="text-sm font-semibold">?</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-heading)]">Need Help?</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Contact IT Support • Channel 4 • Ext. 404
          </p>
        </div>
      </div>

      {/* Weather Card — TODO: replace static mock data with real weather/site API */}
      <div className="rounded-xl bg-white/60 border border-black/[0.08] backdrop-blur-xl overflow-hidden shadow-diffusion-sm"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-black/[0.06]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">Site Conditions</span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--accent-green)]">
            <span className="w-1 h-1 rounded-full bg-[var(--accent-green)] animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <IconThermometer className="w-5 h-5 text-[var(--accent-orange)]" stroke={1.5} />
            <div>
              <span className="text-base font-semibold text-[var(--text-heading)]">32°C</span>
              <p className="text-[10px] text-[var(--text-muted)]">Temperature</p>
            </div>
          </div>
          <div className="w-px h-8 bg-black/[0.08]" />
          <div className="flex items-center gap-2">
            <IconWind className="w-5 h-5 text-[var(--accent-blue)]" stroke={1.5} />
            <div>
              <span className="text-sm font-semibold text-[var(--text-heading)]">NW 15km/h</span>
              <p className="text-[10px] text-[var(--text-muted)]">Wind</p>
            </div>
          </div>
          <div className="w-px h-8 bg-black/[0.08]" />
          <div className="flex items-center gap-2">
            <IconCloudRain className="w-5 h-5 text-[var(--accent-blue)]" stroke={1.5} />
            <div>
              <span className="text-sm font-semibold text-[var(--text-heading)]">15%</span>
              <p className="text-[10px] text-[var(--text-muted)]">Rain</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner — TODO: replace static mock alert with real operations feed */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--accent-red)]/5 border border-[var(--accent-red)]/15">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent-red)]/10 shrink-0">
          <IconAlertHexagon className="w-4 h-4 text-[var(--accent-red)]" stroke={1.5} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium text-[var(--accent-red)] mb-1">High Wind Advisory</p>
          <div className="overflow-hidden">
            <Marquee className="[--duration:15s] [--gap:2rem]" pauseOnHover>
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">Drilling ops suspended until 14:00</span>
              <span className="text-xs text-[var(--accent-red)]/60 whitespace-nowrap">• All personnel report to safe zones</span>
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">• Wind speeds exceeding 45km/h detected</span>
              <span className="text-xs text-[var(--accent-red)]/60 whitespace-nowrap">• Estimated resume: 14:00 hrs</span>
            </Marquee>
          </div>
        </div>
        <span className="text-[10px] text-[var(--text-muted)] shrink-0">2h ago</span>
      </div>

      {/* Company Stats Marquee */}
      <div className="pt-2 border-t border-black/[0.06]">
        <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem] py-2">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconActivityHeartbeat className="w-3.5 h-3.5 text-[var(--accent-green)] shrink-0" stroke={1.5} />
            <span className="whitespace-nowrap">24/7 Operations</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconShieldCheck className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" stroke={1.5} />
            <span className="whitespace-nowrap">Safety First</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconTruck className="w-3.5 h-3.5 text-[var(--accent-green)] shrink-0" stroke={1.5} />
            <span className="whitespace-nowrap">Fleet Active</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <Users className="w-3.5 h-3.5 text-[var(--text-body)] shrink-0" />
            <span className="whitespace-nowrap">8 Departments</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <Zap className="w-3.5 h-3.5 text-[var(--accent-orange)] shrink-0" />
            <span className="whitespace-nowrap">Live Monitoring</span>
          </div>
        </Marquee>
      </div>

      {/* Department Icons Marquee */}
      <div className="pt-2">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium mb-2">Active Departments</p>
        <Marquee pauseOnHover reverse className="[--duration:40s] [--gap:1rem] py-1">
          {[
            { Icon: Drill, label: "Drilling", color: "text-amber-500" },
            { Icon: Factory, label: "Production", color: "text-[var(--accent-green)]" },
            { Icon: ShieldCheck, label: "Access Control", color: "text-[var(--accent-blue)]" },
            { Icon: Wrench, label: "Engineering", color: "text-violet-500" },
            { Icon: Radar, label: "Control Room", color: "text-cyan-500" },
            { Icon: HardHat, label: "Safety", color: "text-[var(--accent-red)]" },
            { Icon: Flame, label: "Training", color: "text-[var(--accent-orange)]" },
            { Icon: Satellite, label: "Satellite", color: "text-indigo-500" },
          ].map(({ Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/60 border border-black/[0.08] hover:bg-white/80 transition-colors cursor-default shrink-0">
              <Icon className={`w-3.5 h-3.5 ${color}`} />
              <span className="text-xs text-[var(--text-body)]">{label}</span>
            </div>
          ))}
        </Marquee>
      </div>

      {/* Enterprise Footer */}
      <div className="pt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span>Arch Systems v2.4.1</span>
          <span className="w-1 h-1 rounded-full bg-black/20" />
          <span className="flex items-center gap-1">
            <IconClock className="w-3 h-3" stroke={1.5} />
            Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <span className="uppercase tracking-wider font-medium">Plantcor OS</span>
      </div>
    </div>
  );
}
