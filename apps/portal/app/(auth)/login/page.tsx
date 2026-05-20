import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";
import { LoginMarquees } from "./LoginMarquees";
import { Marquee } from "@repo/ui/Marquee";
import {
  fetchWeather,
  getWeatherAlert,
  getWindDirection,
  type WeatherData,
} from "@/lib/weather-api";
import {
  IconThermometer,
  IconWind,
  IconDroplets,
  IconAlertHexagon,
  IconCheck,
  IconClock,
  IconServer,
  IconWifi,
  IconDatabase,
  IconSun,
  IconMoon,
  IconLock,
} from "@tabler/icons-react";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();

  let user = null;
  let systemUnavailable = false;

  try {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      // Expected error (e.g., no session) — silently show login form
    } else {
      user = data.user;
    }
  } catch {
    // Catastrophic failure (network, misconfiguration) — show unavailable state
    systemUnavailable = true;
  }

  // If we have a user, redirect to home
  if (user) {
    redirect("/");
  }

  if (systemUnavailable) {
    return (
      <div className="w-full max-w-md space-y-3">
        <div className="rounded-xl overflow-hidden border border-[var(--border-default)] bg-white/70 backdrop-blur-2xl shadow-window">
          <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-white/50">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-[var(--border-subtle)]" />
              <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-[var(--border-subtle)]" />
              <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-[var(--border-subtle)]" />
            </div>
            <span className="flex-1 text-center text-[13px] font-medium text-[var(--text-secondary)] select-none pr-14">
              Plantcor — Sign In
            </span>
          </div>
          <div className="p-6 space-y-4 text-center">
            <IconAlertHexagon
              className="w-8 h-8 text-[var(--accent-red)] mx-auto"
              stroke={1.5}
            />
            <h1 className="text-lg font-semibold text-[var(--text-heading)]">
              System Unavailable
            </h1>
            <p className="text-sm text-[var(--text-muted)]">
              Unable to reach authentication services. Please try again shortly
              or contact IT Support.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Fetch live weather data
  let weather: WeatherData | null = null;
  try {
    weather = await fetchWeather();
  } catch {
    // Weather is non-critical for login; silently fall back to null
  }

  const weatherAlert = weather ? getWeatherAlert(weather) : null;

  // Query active operational issues (returns empty for unauthenticated users per RLS)
  const { data: activeBreakdowns } = await supabase
    .from("breakdowns")
    .select("fleet_id, reason, status, created_at")
    .eq("status", "active")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(3);

  const { data: activeDelays } = await supabase
    .from("operational_delays")
    .select("delay_type, description, status, created_at")
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(3);

  const operationalIssues = [
    ...(activeBreakdowns ?? []).map((b) => ({
      type: "breakdown" as const,
      title: `Breakdown: ${b.fleet_id}`,
      detail: b.reason,
      createdAt: b.created_at,
    })),
    ...(activeDelays ?? []).map((d) => ({
      type: "delay" as const,
      title: `Delay: ${d.delay_type}`,
      detail: d.description,
      createdAt: d.created_at,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  // Determine if an alert banner should render and with what severity
  const hasWeatherAlert = weatherAlert && weatherAlert.level !== "none";
  const hasOperationalAlert = operationalIssues.length > 0;
  const showAlertBanner = hasWeatherAlert || hasOperationalAlert;

  // Severity colour mapping for the banner
  function alertColor(
    wAlert: typeof weatherAlert,
    ops: typeof operationalIssues,
  ): { label: string; border: string; bg: string; text: string; icon: string } {
    if (wAlert?.level === "critical") {
      return {
        label: "CRITICAL",
        border: "border-[var(--accent-red)]/20",
        bg: "bg-[var(--accent-red)]/10",
        text: "text-[var(--accent-red)]",
        icon: "text-[var(--accent-red)]",
      };
    }
    if (
      wAlert?.level === "warning" ||
      ops.some((o) => o.type === "breakdown")
    ) {
      return {
        label: "WARNING",
        border: "border-[var(--accent-orange)]/20",
        bg: "bg-[var(--accent-orange)]/10",
        text: "text-[var(--accent-orange)]",
        icon: "text-[var(--accent-orange)]",
      };
    }
    return {
      label: "ADVISORY",
      border: "border-[var(--accent-blue)]/20",
      bg: "bg-[var(--accent-blue)]/10",
      text: "text-[var(--accent-blue)]",
      icon: "text-[var(--accent-blue)]",
    };
  }

  const alertStyle = alertColor(weatherAlert, operationalIssues);

  // Get current hour for shift calculation
  const currentHour = new Date().getHours();
  const isDayShift = currentHour >= 6 && currentHour < 18;
  const shiftText = isDayShift ? "Day Shift" : "Night Shift";
  const ShiftIcon = isDayShift ? IconSun : IconMoon;

  return (
    <div className="w-full max-w-md space-y-3 overflow-x-hidden">
      {/* macOS Window Title Bar strip */}
      <div
        className="rounded-xl overflow-hidden border border-[var(--border-default)] bg-white/70 backdrop-blur-2xl shadow-window animate-window-open"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        {/* Title bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] bg-white/50">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-3 h-3 rounded-full bg-[var(--mac-red)] border border-[var(--border-subtle)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-yellow)] border border-[var(--border-subtle)]" />
            <span className="w-3 h-3 rounded-full bg-[var(--mac-green)] border border-[var(--border-subtle)]" />
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
              <ShiftIcon
                className={`w-3.5 h-3.5 ${isDayShift ? "text-[var(--accent-orange)]" : "text-[var(--accent-blue)]"}`}
                stroke={1.5}
              />
              <span
                className={`text-xs ${isDayShift ? "text-[var(--accent-orange)]" : "text-[var(--accent-blue)]"}`}
              >
                {shiftText}
              </span>
              <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
              <span className="text-[10px] text-[var(--text-muted)]">
                {new Date().toLocaleTimeString("en-GB", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
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
      <div
        className="rounded-xl bg-white/70 border border-[var(--border-default)] backdrop-blur-xl overflow-hidden shadow-diffusion-sm"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex items-center justify-center w-3 h-3">
            <span
              className="absolute inline-flex h-full w-full rounded-full bg-[var(--accent-green)] opacity-50 animate-ping"
              // Tailwind doesn't support custom animation duration via class
              style={{ animationDuration: "2s" }}
            />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent-green)]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-1.5">
              <IconCheck
                className="w-4 h-4 text-[var(--accent-green)]"
                stroke={2}
              />
              <span className="text-sm text-[var(--accent-green)]">
                All Systems Operational
              </span>
            </div>
            <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
              API • Database • Network • Services
            </p>
          </div>
          <div className="flex flex-col gap-1 text-[10px] text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <IconServer
                className="w-3 h-3 text-[var(--accent-green)]"
                stroke={1.5}
              />
              <span className="text-[var(--accent-green)]">API</span>
            </span>
            <span className="flex items-center gap-1">
              <IconDatabase
                className="w-3 h-3 text-[var(--accent-green)]"
                stroke={1.5}
              />
              <span className="text-[var(--accent-green)]">DB</span>
            </span>
            <span className="flex items-center gap-1">
              <IconWifi
                className="w-3 h-3 text-[var(--accent-green)]"
                stroke={1.5}
              />
              <span className="text-[var(--accent-green)]">NET</span>
            </span>
          </div>
        </div>
        <div className="h-0.5 bg-[var(--accent-green)]/15">
          <div className="h-full w-1/3 bg-[var(--accent-green)] animate-pulse" />
        </div>
      </div>

      {/* Support Card */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 border border-[var(--border-default)] backdrop-blur-xl shadow-diffusion-sm"
        // Glass pattern: top highlight required per AGENTS.md macOS theme
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)]">
          <span className="text-sm font-semibold">?</span>
        </div>
        <div className="flex-1">
          <p className="text-xs font-medium text-[var(--text-heading)]">
            Need Help?
          </p>
          <p className="text-[10px] text-[var(--text-muted)]">
            Contact IT Support • Channel 4 • Ext. 404
          </p>
        </div>
      </div>

      {/* Weather Card — Live data from Open-Meteo */}
      <div
        className="rounded-xl bg-white/60 border border-[var(--border-default)] backdrop-blur-xl overflow-hidden shadow-diffusion-sm"
        style={{ borderTop: "1px solid rgba(255,255,255,0.9)" }}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--border-subtle)]">
          <span className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] font-medium">
            Site Conditions
          </span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--accent-green)]">
            <span className="w-1 h-1 rounded-full bg-[var(--accent-green)] animate-pulse" />
            Live
          </span>
        </div>
        <div className="flex items-center gap-4 px-4 py-3">
          <div className="flex items-center gap-2">
            <IconThermometer
              className="w-5 h-5 text-[var(--accent-orange)]"
              stroke={1.5}
            />
            <div>
              <span className="text-base font-semibold text-[var(--text-heading)]">
                {weather ? `${weather.temperature}°C` : "—"}
              </span>
              <p className="text-[10px] text-[var(--text-muted)]">
                {weather ? weather.description : "Temperature"}
              </p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border-default)]" />
          <div className="flex items-center gap-2">
            <IconWind
              className="w-5 h-5 text-[var(--accent-blue)]"
              stroke={1.5}
            />
            <div>
              <span className="text-sm font-semibold text-[var(--text-heading)]">
                {weather
                  ? `${getWindDirection(weather.windDirection)} ${weather.windSpeed}km/h`
                  : "—"}
              </span>
              <p className="text-[10px] text-[var(--text-muted)]">Wind</p>
            </div>
          </div>
          <div className="w-px h-8 bg-[var(--border-default)]" />
          <div className="flex items-center gap-2">
            <IconDroplets
              className="w-5 h-5 text-[var(--accent-blue)]"
              stroke={1.5}
            />
            <div>
              <span className="text-sm font-semibold text-[var(--text-heading)]">
                {weather ? `${weather.humidity}%` : "—"}
              </span>
              <p className="text-[10px] text-[var(--text-muted)]">Humidity</p>
            </div>
          </div>
        </div>
      </div>

      {/* Alert Banner — Live weather + operational alerts */}
      {showAlertBanner && (
        <div
          className={`flex items-center gap-3 p-3 rounded-xl ${alertStyle.bg} border ${alertStyle.border}`}
        >
          <div
            className={`flex items-center justify-center w-8 h-8 rounded-full ${alertStyle.bg} shrink-0`}
          >
            <IconAlertHexagon
              className={`w-4 h-4 ${alertStyle.icon}`}
              stroke={1.5}
            />
          </div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <p className={`text-sm font-medium ${alertStyle.text} mb-1`}>
              {weatherAlert?.message || operationalIssues[0]?.title || "Alert"}
            </p>
            <div className="overflow-hidden">
              <Marquee className="[--duration:15s] [--gap:2rem]" pauseOnHover>
                {weatherAlert?.message && (
                  <span
                    className={`text-xs ${alertStyle.text}/60 whitespace-nowrap`}
                  >
                    • {weatherAlert.message}
                  </span>
                )}
                {operationalIssues.map((issue) => (
                  <span
                    key={issue.title + issue.detail}
                    className="text-xs text-[var(--text-muted)] whitespace-nowrap"
                  >
                    • {issue.title}: {issue.detail}
                  </span>
                ))}
              </Marquee>
            </div>
          </div>
          <span className="text-[10px] text-[var(--text-muted)] shrink-0">
            {operationalIssues[0]
              ? new Date(operationalIssues[0].createdAt).toLocaleTimeString(
                  "en-GB",
                  { hour: "2-digit", minute: "2-digit" },
                )
              : "Now"}
          </span>
        </div>
      )}

      <LoginMarquees />

      {/* Enterprise Footer */}
      <div className="pt-2 flex items-center justify-between text-[10px] text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <span>Arch Systems v2.4.1</span>
          <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]" />
          <span className="flex items-center gap-1">
            <IconClock className="w-3 h-3" stroke={1.5} />
            Updated:{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        <span className="uppercase tracking-wider font-medium">
          Plantcor OS
        </span>
      </div>
    </div>
  );
}
