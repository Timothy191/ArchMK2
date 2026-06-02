"use client";

import { useEffect } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Suppress specific Supabase refresh token errors
  useEffect(() => {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line no-console
      const originalError = console.error;
      // eslint-disable-next-line no-console
      console.error = (...args) => {
        // Suppress Supabase AuthApiError: Invalid Refresh Token: Refresh Token Not Found
        // args[0] may be a string or an AuthApiError object depending on caller
        const firstArg = args[0];
        const isRefreshTokenError = (value: unknown): boolean => {
          if (!value) return false;
          if (typeof value === "string") {
            return (
              value.includes("Invalid Refresh Token") ||
              value.includes("Refresh Token Not Found")
            );
          }
          if (typeof value === "object" && "message" in value) {
            const msg = String((value as { message: unknown }).message);
            return (
              msg.includes("Invalid Refresh Token") ||
              msg.includes("Refresh Token Not Found")
            );
          }
          return false;
        };
        if (isRefreshTokenError(firstArg)) {
          return; // Suppress this specific error
        }
        originalError.apply(console, args);
      };

      return () => {
        // eslint-disable-next-line no-console
        console.error = originalError;
      };
    }
  }, []);

  return (
    <div className="relative min-h-[calc(100vh-28px)] w-full h-full flex overflow-hidden">
      {children}
    </div>
  );
}
