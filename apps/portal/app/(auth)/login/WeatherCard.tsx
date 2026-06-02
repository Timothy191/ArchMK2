"use client";

import { useState, useEffect, useCallback } from "react";
import type { WeatherData } from "@/lib/weather-api";
import { getWindDirection } from "@/lib/weather-api";
import {
  Droplets as IconDroplets,
  RefreshCw as IconRefresh,
  Thermometer as IconThermometer,
  Wind as IconWind,
} from "lucide-react";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

interface WeatherCardProps {
  initialWeather: WeatherData | null;
}

export function WeatherCard({ initialWeather }: WeatherCardProps) {
  const [weather, setWeather] = useState<WeatherData | null>(initialWeather);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(() => new Date());

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/weather");
      if (res.ok) {
        const data: WeatherData | null = await res.json();
        if (data) {
          setWeather(data);
          setLastUpdated(new Date());
        }
      }
    } catch {
      // Silently fail — weather is non-critical
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div data-testid="weather-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-arch-border-subtle">
        <span className="text-[10px] uppercase tracking-wider text-arch-text-tertiary font-medium">
          Site Conditions
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={refresh}
            disabled={refreshing}
            aria-label="Refresh weather"
            className="text-arch-text-tertiary hover:text-arch-text-secondary transition-colors disabled:opacity-40"
          >
            <IconRefresh
              className={`w-3 h-3 transition-transform ${refreshing ? "animate-spin" : "hover:rotate-180 duration-500"}`}
              stroke="1.5"
            />
          </button>
          <span className="flex items-center gap-1 text-[10px] text-arch-accent-green">
            <span className="w-1 h-1 rounded-full bg-arch-accent-green animate-pulse" />
            Live
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <IconThermometer
            className="w-5 h-5 text-arch-accent-blue"
            stroke="1.5"
          />
          <div>
            <span className="text-sm font-semibold text-arch-text-primary">
              {weather ? `${weather.temperature}°C` : "—"}
            </span>
            <p className="text-[10px] text-arch-text-tertiary">
              {weather ? weather.description : "Temperature"}
            </p>
          </div>
        </div>
        <div className="w-px h-8 bg-arch-border-primary" />
        <div className="flex items-center gap-2">
          <IconWind className="w-5 h-5 text-arch-accent-blue" stroke="1.5" />
          <div>
            <span className="text-sm font-semibold text-arch-text-primary">
              {weather
                ? `${getWindDirection(weather.windDirection)} ${weather.windSpeed}km/h`
                : "—"}
            </span>
            <p className="text-[10px] text-arch-text-tertiary">Wind</p>
          </div>
        </div>
        <div className="w-px h-8 bg-arch-border-primary" />
        <div className="flex items-center gap-2">
          <IconDroplets
            className="w-5 h-5 text-arch-accent-blue"
            stroke="1.5"
          />
          <div>
            <span className="text-sm font-semibold text-arch-text-primary">
              {weather ? `${weather.humidity}%` : "—"}
            </span>
            <p className="text-[10px] text-arch-text-tertiary">Humidity</p>
          </div>
        </div>
      </div>

      {/* Last updated timestamp */}
      <div className="px-4 pb-2 text-[9px] text-arch-text-tertiary/50 text-right tabular-nums">
        Updated{" "}
        {lastUpdated.toLocaleTimeString("en-GB", {
          timeZone: "Africa/Johannesburg",
          hour: "2-digit",
          minute: "2-digit",
        })}{" "}
        SAST
      </div>
    </div>
  );
}
