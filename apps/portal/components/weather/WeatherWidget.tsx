"use client";

import { useEffect, useState } from "react";
import { fetchWeather, getWeatherAlert, type WeatherData } from "@/lib/weather-api";
import { GlassCard } from "@repo/ui/GlassCard";

interface WeatherWidgetProps {
  lat?: number;
  lon?: number;
  locationName?: string;
  variant?: "compact" | "full" | "header";
}

export function WeatherWidget({
  lat = 51.5074,
  lon = -0.1278,
  locationName = "London",
  variant = "full",
}: WeatherWidgetProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWeather() {
      try {
        setLoading(true);
        const data = await fetchWeather(lat, lon, locationName);
        setWeather(data);
        setError(null);
      } catch (err) {
        setError("Failed to load weather");
      } finally {
        setLoading(false);
      }
    }

    loadWeather();
    // Refresh every 10 minutes
    const interval = setInterval(loadWeather, 600000);
    return () => clearInterval(interval);
  }, [lat, lon, locationName]);

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-20 bg-[#242424] rounded-xl" />
      </div>
    );
  }

  if (error || !weather) {
    return (
      <GlassCard className="p-3">
        <p className="text-[#898989] text-sm">Weather unavailable</p>
      </GlassCard>
    );
  }

  const alert = getWeatherAlert(weather);

  // Header variant - minimal
  if (variant === "header") {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#171717] border border-[#363636]">
        <span className="text-lg">{weather.icon}</span>
        <span className="text-sm text-[#fafafa]">{weather.temperature}°C</span>
        <span className="text-xs text-[#898989] hidden sm:inline">{weather.description}</span>
        {alert.level !== "none" && (
          <span className={`w-2 h-2 rounded-full ${
            alert.level === "critical" ? "bg-red-500 animate-pulse" :
            alert.level === "warning" ? "bg-amber-500" : "bg-blue-400"
          }`} />
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === "compact") {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{weather.icon}</span>
            <div>
              <p className="text-2xl font-semibold text-[#fafafa]">{weather.temperature}°C</p>
              <p className="text-sm text-[#898989]">{weather.description}</p>
            </div>
          </div>
          <div className="text-right text-sm text-[#898989]">
            <p>💧 {weather.humidity}%</p>
            <p>💨 {weather.windSpeed} km/h</p>
          </div>
        </div>
        {alert.level !== "none" && (
          <div className={`mt-3 p-2 rounded-lg text-xs ${
            alert.level === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
            alert.level === "warning" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
            "bg-blue-500/10 text-blue-400 border border-blue-500/20"
          }`}>
            {alert.message}
          </div>
        )}
      </GlassCard>
    );
  }

  // Full variant with forecast
  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-[#fafafa]">Weather Conditions</h3>
          <p className="text-sm text-[#898989]">{weather.location.name}</p>
        </div>
        <span className="text-xs text-[#898989]">
          Updated {new Date(weather.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Current conditions */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-5xl">{weather.icon}</span>
        <div>
          <p className="text-3xl font-semibold text-[#fafafa]">{weather.temperature}°C</p>
          <p className="text-[#898989]">Feels like {weather.feelsLike}°C</p>
          <p className="text-sm text-[#b4b4b4]">{weather.description}</p>
        </div>
        <div className="ml-auto text-right text-sm space-y-1">
          <p className="text-[#898989]">💧 Humidity: {weather.humidity}%</p>
          <p className="text-[#898989]">💨 Wind: {weather.windSpeed} km/h</p>
          <p className="text-[#898989]">🧭 Direction: {weather.windDirection}°</p>
        </div>
      </div>

      {/* Operations alert */}
      {alert.level !== "none" && (
        <div className={`mb-6 p-3 rounded-lg ${
          alert.level === "critical" ? "bg-red-500/10 border border-red-500/30" :
          alert.level === "warning" ? "bg-amber-500/10 border border-amber-500/30" :
          "bg-blue-500/10 border border-blue-500/30"
        }`}>
          <p className={`text-sm font-medium ${
            alert.level === "critical" ? "text-red-400" :
            alert.level === "warning" ? "text-amber-400" :
            "text-blue-400"
          }`}>
            {alert.message}
          </p>
        </div>
      )}

      {/* 5-day forecast */}
      <div>
        <p className="text-sm font-medium text-[#b4b4b4] mb-3">5-Day Forecast</p>
        <div className="grid grid-cols-5 gap-2">
          {weather.daily?.map((day, i) => (
            <div key={i} className="text-center p-2 rounded-lg bg-[#171717]/50">
              <p className="text-xs text-[#898989] mb-1">
                {new Date(day.date).toLocaleDateString([], { weekday: 'short' })}
              </p>
              <p className="text-lg mb-1">{day.icon}</p>
              <p className="text-xs text-[#fafafa]">{day.maxTemp}°</p>
              <p className="text-xs text-[#898989]">{day.minTemp}°</p>
            </div>
          ))}
        </div>
      </div>
    </GlassCard>
  );
}
