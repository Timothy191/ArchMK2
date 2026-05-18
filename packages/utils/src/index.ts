import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date string (YYYY-MM-DD) to a human readable format
 */
export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Returns the current shift (day/night) based on the hour
 */
export * from "./excel";
export * from "./n8n";
export function getCurrentShift(): "day" | "night" {
  const hour = new Date().getHours();
  // Day shift usually 06:00 to 18:00
  return hour >= 6 && hour < 18 ? "day" : "night";
}
