import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { Marquee } from "@repo/ui/Marquee";
import { 
  Drill, Factory, 
  Flame, HardHat, Radar, Satellite, Shield, ShieldCheck, 
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
  let authError = null;
  
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      authError = error;
      // Silently handle auth errors - show login form
    } else {
      user = data.user;
    }
  } catch (error) {
    // Catch any unexpected errors
    authError = error;
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
  const shiftColor = isDayShift ? "text-amber-400" : "text-indigo-400";

  return (
    <div className="w-full max-w-md space-y-4 overflow-x-hidden">
      {/* Header Bar with Clock & Shift */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <ShiftIcon className={`w-4 h-4 ${shiftColor}`} stroke={1.5} />
          <span className={`text-xs font-medium ${shiftColor}`}>{shiftText}</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
          <span className="text-[10px] text-[var(--text-muted)]">
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
          <IconLock className="w-3 h-3" stroke={1.5} />
          <span>Secure Connection</span>
        </div>
      </div>

      {/* Title Section */}
      <div className="text-left space-y-1">
        <h1 className="text-3xl font-medium text-[var(--text-heading)] tracking-tight">
          Plantcor
        </h1>
        <p className="text-[var(--text-muted)] text-sm">
          Sign in to Arch-Systems
        </p>
      </div>
      
      <LoginForm />
      {/* System Status Card */}
      <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/10 overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" style={{ animationDuration: '2s' }} />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <IconCheck className="w-4 h-4 text-emerald-400" stroke={2} />
              <span className="text-sm font-medium text-emerald-400">All Systems Operational</span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              API • Database • Network • Services
            </p>
          </div>
          <div className="flex flex-col gap-1 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <IconServer className="w-3 h-3 text-emerald-400/70" stroke={1.5} />
              <span className="text-emerald-400/70">API</span>
            </span>
            <span className="flex items-center gap-1">
              <IconDatabase className="w-3 h-3 text-emerald-400/70" stroke={1.5} />
              <span className="text-emerald-400/70">DB</span>
            </span>
            <span className="flex items-center gap-1">
              <IconWifi className="w-3 h-3 text-emerald-400/70" stroke={1.5} />
              <span className="text-emerald-400/70">NET</span>
            </span>
          </div>
        </div>
        {/* Progress bar animation */}
        <div className="h-0.5 bg-emerald-500/20">
          <div className="h-full w-1/3 bg-emerald-400 animate-pulse" />
        </div>
      </div>

      {/* Support Card */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-secondary)]/20 border border-[var(--border-default)]/20">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-secondary)]">
          <span className="text-sm">?</span>
        </div>
        <div className="flex-1">
          <p className="text-xs text-[var(--text-heading)]">Need Help?</p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Contact IT Support • Channel 4 • Ext. 404
          </p>
        </div>
      </div>

      {/* Weather Card */}
      <div className="rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/30 overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-default)]/20">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)]">Site Conditions</span>
          <span className="text-[10px] text-[var(--text-muted)]">Live</span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <IconThermometer className="w-5 h-5 text-[var(--accent-amber)]" stroke={1.5} />
            <div>
              <span className="text-lg font-medium text-[var(--text-heading)]">32°C</span>
              <p className="text-[10px] text-[var(--text-muted)]">Temperature</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border-default)]/30" />
          <div className="flex items-center gap-2">
            <IconWind className="w-5 h-5 text-[var(--accent-cyan)]" stroke={1.5} />
            <div>
              <span className="text-sm text-[var(--text-heading)]">NW 15km/h</span>
              <p className="text-[10px] text-[var(--text-muted)]">Wind</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border-default)]/30" />
          <div className="flex items-center gap-2">
            <IconCloudRain className="w-5 h-5 text-[var(--accent-blue)]" stroke={1.5} />
            <div>
              <span className="text-sm text-[var(--text-heading)]">15%</span>
              <p className="text-[10px] text-[var(--text-muted)]">Rain</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner - Critical Notifications with Scrolling Text */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-red-500/20 shrink-0">
          <IconAlertHexagon className="w-4 h-4 text-red-400" stroke={1.5} />
        </div>
        <div className="flex-1 min-w-0 overflow-hidden">
          <p className="text-sm font-medium text-red-400 mb-1">High Wind Advisory</p>
          <div className="overflow-hidden">
            <Marquee className="[--duration:15s] [--gap:2rem]" pauseOnHover>
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                Drilling ops suspended until 14:00
              </span>
              <span className="text-xs text-red-400/70 whitespace-nowrap">
                • All personnel report to safe zones
              </span>
              <span className="text-xs text-[var(--text-muted)] whitespace-nowrap">
                • Wind speeds exceeding 45km/h detected
              </span>
              <span className="text-xs text-red-400/70 whitespace-nowrap">
                • Estimated resume: 14:00 hrs
              </span>
            </Marquee>
          </div>
        </div>
        <span className="text-[10px] text-red-400/70 shrink-0">2h ago</span>
      </div>

      {/* Company Stats Marquee */}
      <div className="pt-4 border-t border-[var(--border-default)]/30">
        <Marquee pauseOnHover className="[--duration:30s] [--gap:1.5rem] py-2">
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconActivityHeartbeat className="w-3.5 h-3.5 text-[var(--accent-emerald)] shrink-0" stroke={1.5} />
            <span className="whitespace-nowrap">24/7 Operations</span>
          </div>
          <div className="flex items-center gap-2 text-[var(--text-muted)] text-xs shrink-0">
            <IconShieldCheck className="w-3.5 h-3.5 text-[var(--accent-cyan)] shrink-0" stroke={1.5} />
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
            <Zap className="w-3.5 h-3.5 text-[var(--accent-amber)] shrink-0" />
            <span className="whitespace-nowrap">Live Monitoring</span>
          </div>
        </Marquee>
      </div>

      {/* Department Icons Marquee */}
      <div className="pt-4">
        <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] mb-3">Active Departments</p>
        <Marquee pauseOnHover reverse className="[--duration:40s] [--gap:1.5rem] py-2">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <Drill className="w-4 h-4 text-amber-400" />
            <span className="text-xs text-[var(--text-body)]">Drilling</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <Factory className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-[var(--text-body)]">Production</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-[var(--text-body)]">Access Control</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <Wrench className="w-4 h-4 text-violet-400" />
            <span className="text-xs text-[var(--text-body)]">Engineering</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <Radar className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-[var(--text-body)]">Control Room</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <HardHat className="w-4 h-4 text-red-400" />
            <span className="text-xs text-[var(--text-body)]">Safety</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-xs text-[var(--text-body)]">Training</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-secondary)]/30 border border-[var(--border-default)]/20 hover:bg-[var(--bg-secondary)]/50 transition-colors cursor-default">
            <Satellite className="w-4 h-4 text-indigo-400" />
            <span className="text-xs text-[var(--text-body)]">Satellite</span>
          </div>
        </Marquee>
      </div>

      {/* Enterprise Footer */}
      <div className="pt-4 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span>Arch-Systems v2.4.1</span>
          <span className="w-1 h-1 rounded-full bg-[var(--border-default)]" />
          <span className="flex items-center gap-1">
            <IconClock className="w-3 h-3" stroke={1.5} />
            Updated: {new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
          </span>
        </div>
        <span className="uppercase tracking-wider">Plantcor OS</span>
      </div>
    </div>
  );
}
