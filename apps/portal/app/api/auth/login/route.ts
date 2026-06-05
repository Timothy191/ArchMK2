import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { withRateLimit } from "@/lib/api/rate-limit-middleware";

/**
 * Login API Route with Server-Side Rate Limiting
 *
 * This endpoint wraps Supabase authentication with server-side rate limiting
 * to prevent brute-force attacks. It uses IP-based limiting with a sliding window.
 *
 * Rate limits:
 * - 5 requests per 15 minutes per IP address
 * - Applies stricter limits during high system load
 *
 * Returns the Supabase session data on successful authentication.
 */
export async function POST(request: NextRequest) {
  return withRateLimit(
    request,
    async () => {
      try {
        const { email, password } = await request.json();

        // Validate input
        if (!email || !password) {
          return NextResponse.json(
            { error: "Email and password are required" },
            { status: 400 },
          );
        }

        const supabase = await createServerSupabaseClient();
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          // Return generic error message to avoid account enumeration
          const isRateLimitError = error.message
            .toLowerCase()
            .includes("rate limit");
          return NextResponse.json(
            {
              error: isRateLimitError
                ? "Too many attempts. Please wait a moment and try again."
                : "Invalid credentials",
            },
            { status: 401 },
          );
        }

        return NextResponse.json(
          {
            user: data.user,
            session: data.session,
          },
          { status: 200 },
        );
      } catch {
        return NextResponse.json(
          { error: "An error occurred during sign in" },
          { status: 500 },
        );
      }
    },
    {
      customLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 5, // 5 attempts per 15 minutes
      },
    },
  );
}
