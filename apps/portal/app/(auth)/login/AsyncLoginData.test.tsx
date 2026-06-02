/**
 * @jest-environment node
 */
import { AsyncLoginData } from "./AsyncLoginData";
import { fetchWeather, getWeatherAlert } from "@/lib/weather-api";
import { createServerSupabaseClient } from "@repo/supabase/server";
import type { ReactElement } from "react";

jest.mock("@/lib/weather-api", () => ({
  fetchWeather: jest.fn(),
  getWeatherAlert: jest.fn(),
}));

jest.mock("@repo/supabase/server", () => ({
  createServerSupabaseClient: jest.fn(),
}));

jest.mock("./WeatherCard", () => ({
  WeatherCard: jest.fn(() => null),
}));

jest.mock("./LoginMarquees", () => ({
  LoginMarquees: jest.fn(() => null),
}));

jest.mock("@repo/ui/Marquee", () => ({
  Marquee: jest.fn(() => null),
}));

jest.mock("lucide-react", () => ({
  AlertTriangle: jest.fn(() => null),
}));

const BASE_WEATHER = {
  temperature: 22,
  feelsLike: 20,
  humidity: 55,
  windSpeed: 15,
  windDirection: 180,
  weatherCode: 0,
  description: "Clear sky",
  icon: "☀️",
  timestamp: "2026-05-17T08:00",
  location: { lat: -26.2, lon: 28.0, name: "Mining Site" },
};

/**
 * Flatten a React element tree into an array of all elements (depth-first).
 * Useful for asserting on server-component JSX without a DOM renderer.
 */
function flattenElements(node: unknown): ReactElement[] {
  const results: ReactElement[] = [];

  function walk(n: unknown) {
    if (
      n === null ||
      n === undefined ||
      typeof n === "string" ||
      typeof n === "number" ||
      typeof n === "boolean"
    ) {
      return;
    }
    if (Array.isArray(n)) {
      n.forEach(walk);
      return;
    }
    if (typeof n === "object" && "type" in (n as object)) {
      results.push(n as ReactElement);
      const props = (n as ReactElement).props as
        | Record<string, unknown>
        | undefined;
      if (props?.children) {
        walk(props.children);
      }
    }
  }

  walk(node);
  return results;
}

function findByTestId(
  elements: ReactElement[],
  testId: string,
): ReactElement | undefined {
  return elements.find(
    (el) =>
      typeof el.props === "object" &&
      el.props !== null &&
      (el.props as Record<string, unknown>)["data-testid"] === testId,
  );
}

describe("AsyncLoginData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("calls fetchWeather and never instantiates a Supabase client", async () => {
    (fetchWeather as jest.Mock).mockResolvedValue(BASE_WEATHER);
    (getWeatherAlert as jest.Mock).mockReturnValue({
      level: "none" as const,
      message: "",
    });

    await AsyncLoginData();

    expect(fetchWeather).toHaveBeenCalledTimes(1);
    expect(createServerSupabaseClient).not.toHaveBeenCalled();
  });

  it("gracefully handles weather fetch failure", async () => {
    (fetchWeather as jest.Mock).mockRejectedValue(new Error("Network timeout"));
    (getWeatherAlert as jest.Mock).mockReturnValue({
      level: "none" as const,
      message: "",
    });

    const jsx = await AsyncLoginData();
    const flat = flattenElements(jsx);

    // Should still render WeatherCard and LoginMarquees even when weather is null
    expect(
      flat.some((el) => el.type && (el.type as jest.Mock).getMockName?.()),
    ).toBe(true);
    expect(findByTestId(flat, "alert-banner")).toBeUndefined();
  });

  it("renders an alert banner when a critical weather alert is active", async () => {
    (fetchWeather as jest.Mock).mockResolvedValue({
      ...BASE_WEATHER,
      weatherCode: 95,
    });
    (getWeatherAlert as jest.Mock).mockReturnValue({
      level: "critical" as const,
      message: "⚠️ Thunderstorm - Cease outdoor operations immediately",
    });

    const jsx = await AsyncLoginData();
    const flat = flattenElements(jsx);
    const banner = findByTestId(flat, "alert-banner");

    expect(banner).toBeDefined();
    const bannerProps = (banner as { props: { className: string } }).props;
    expect(bannerProps.className).toContain("bg-arch-accent-red/10");
    expect(bannerProps.className).toContain("border-arch-accent-red/20");
  });

  it("renders an alert banner for warning-level weather", async () => {
    (fetchWeather as jest.Mock).mockResolvedValue({
      ...BASE_WEATHER,
      weatherCode: 71,
    });
    (getWeatherAlert as jest.Mock).mockReturnValue({
      level: "warning" as const,
      message: "❄️ Snow conditions",
    });

    const jsx = await AsyncLoginData();
    const flat = flattenElements(jsx);
    const banner = findByTestId(flat, "alert-banner");

    expect(banner).toBeDefined();
    const bannerProps2 = (banner as { props: { className: string } }).props;
    expect(bannerProps2.className).toContain("bg-arch-accent-blue/10");
  });

  it("does not render an alert banner when weather is clear", async () => {
    (fetchWeather as jest.Mock).mockResolvedValue(BASE_WEATHER);
    (getWeatherAlert as jest.Mock).mockReturnValue({
      level: "none" as const,
      message: "",
    });

    const jsx = await AsyncLoginData();
    const flat = flattenElements(jsx);

    expect(findByTestId(flat, "alert-banner")).toBeUndefined();
  });

  it("passes weather data to WeatherCard", async () => {
    (fetchWeather as jest.Mock).mockResolvedValue(BASE_WEATHER);
    (getWeatherAlert as jest.Mock).mockReturnValue({
      level: "none" as const,
      message: "",
    });

    const jsx = await AsyncLoginData();
    const flat = flattenElements(jsx);
    const weatherCard = flat.find(
      (el) =>
        typeof (el as { type: unknown }).type === "function" &&
        Object.prototype.hasOwnProperty.call(
          (el as { props: Record<string, unknown> }).props,
          "initialWeather",
        ),
    );

    expect(weatherCard).toBeDefined();
    const wcProps = (weatherCard as { props: { initialWeather: unknown } })
      .props;
    expect(wcProps.initialWeather).toEqual(BASE_WEATHER);
  });

  it("renders LoginMarquees with zero counts", async () => {
    (fetchWeather as jest.Mock).mockResolvedValue(BASE_WEATHER);
    (getWeatherAlert as jest.Mock).mockReturnValue({
      level: "none" as const,
      message: "",
    });

    const jsx = await AsyncLoginData();
    const flat = flattenElements(jsx);
    const marquees = flat.find(
      (el) =>
        typeof (el as { type: unknown }).type === "function" &&
        Object.prototype.hasOwnProperty.call(
          (el as { props: Record<string, unknown> }).props,
          "activeBreakdowns",
        ),
    );

    expect(marquees).toBeDefined();
    const mqProps = (
      marquees as { props: { activeBreakdowns: number; activeDelays: number } }
    ).props;
    expect(mqProps.activeBreakdowns).toBe(0);
    expect(mqProps.activeDelays).toBe(0);
  });
});
