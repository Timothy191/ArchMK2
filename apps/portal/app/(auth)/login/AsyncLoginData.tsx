import { createServerSupabaseClient } from "@repo/supabase/server";
import {
  fetchWeather,
  getWeatherAlert,
  type WeatherData,
} from "@/lib/weather-api";
import { WeatherCard } from "./WeatherCard";
import { LoginMarquees } from "./LoginMarquees";
import { Marquee } from "@repo/ui/Marquee";
import { IconAlertHexagon } from "@tabler/icons-react";

type Breakdown = {
  fleet_id: string;
  reason: string | null;
  status: string;
  created_at: string;
};

type Delay = {
  delay_type: string;
  description: string | null;
  status: string;
  created_at: string;
};

function alertColor(
  wAlert: ReturnType<typeof getWeatherAlert> | null,
  ops: Array<{ type: "breakdown" | "delay" }>,
): { border: string; bg: string; text: string; icon: string } {
  if (wAlert?.level === "critical") {
    return {
      border: "border-arch-accent-red/20",
      bg: "bg-arch-accent-red/10",
      text: "text-arch-accent-red",
      icon: "text-arch-accent-red",
    };
  }
  if (wAlert?.level === "warning" || ops.some((o) => o.type === "breakdown")) {
    return {
      border: "border-arch-accent-blue/20",
      bg: "bg-arch-accent-blue/10",
      text: "text-arch-accent-blue",
      icon: "text-arch-accent-blue",
    };
  }
  return {
    border: "border-arch-accent-blue/20",
    bg: "bg-arch-accent-blue/10",
    text: "text-arch-accent-blue",
    icon: "text-arch-accent-blue",
  };
}

/**
 * Async server component — fetches weather + operational data independently
 * of the main login card. Wrapped in <Suspense> in page.tsx so the login
 * form renders instantly while this streams in.
 */
export async function AsyncLoginData() {
  const supabase = await createServerSupabaseClient();

  let weather: WeatherData | null = null;
  let activeBreakdowns: Breakdown[] = [];
  let activeDelays: Delay[] = [];

  // Fetch all non-critical data in parallel; failures are silent
  await Promise.allSettled([
    (async () => {
      try {
        weather = await fetchWeather();
      } catch {
        /* non-critical */
      }
    })(),
    (async () => {
      try {
        const [breakdownsRes, delaysRes] = await Promise.all([
          supabase
            .from("breakdowns")
            .select("fleet_id, reason, status, created_at")
            .eq("status", "active")
            .is("deleted_at", null)
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("operational_delays")
            .select("delay_type, description, status, created_at")
            .eq("status", "active")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);
        activeBreakdowns = breakdownsRes.data ?? [];
        activeDelays = delaysRes.data ?? [];
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error(
          "Failed to fetch operational issues for login page:",
          error,
        );
      }
    })(),
  ]);

  const weatherAlert = weather ? getWeatherAlert(weather) : null;

  const operationalIssues = [
    ...activeBreakdowns.map((b) => ({
      type: "breakdown" as const,
      title: `Breakdown: ${b.fleet_id}`,
      detail: b.reason,
      createdAt: b.created_at,
    })),
    ...activeDelays.map((d) => ({
      type: "delay" as const,
      title: `Delay: ${d.delay_type}`,
      detail: d.description,
      createdAt: d.created_at,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const hasWeatherAlert = weatherAlert && weatherAlert.level !== "none";
  const hasOperationalAlert = operationalIssues.length > 0;
  const showAlertBanner = hasWeatherAlert || hasOperationalAlert;
  const alertStyle = alertColor(weatherAlert, operationalIssues);

  return (
    <>
      {/* Weather Card */}
      <WeatherCard initialWeather={weather} />

      {/* Alert Banner */}
      {showAlertBanner && (
        <div
          data-testid="alert-banner"
          className={`flex items-center gap-3 p-3 border-b ${alertStyle.bg} ${alertStyle.border} animate-slide-in-right`}
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
                    className="text-xs text-arch-text-tertiary whitespace-nowrap"
                  >
                    • {issue.title}: {issue.detail}
                  </span>
                ))}
              </Marquee>
            </div>
          </div>
          <span className="text-[10px] text-arch-text-tertiary shrink-0">
            {operationalIssues[0]
              ? new Date(operationalIssues[0].createdAt).toLocaleTimeString(
                  "en-GB",
                  {
                    timeZone: "Africa/Johannesburg",
                    hour: "2-digit",
                    minute: "2-digit",
                  },
                )
              : "Now"}
          </span>
        </div>
      )}

      {/* Marquees with live counts */}
      <div
        data-testid="login-marquees"
        className="border-t border-arch-border-subtle"
      >
        <LoginMarquees
          activeBreakdowns={activeBreakdowns.length}
          activeDelays={activeDelays.length}
        />
      </div>
    </>
  );
}
