import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { User } from "@supabase/supabase-js";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}

/**
 * Safely gets the current user from Supabase auth, handling refresh token errors gracefully.
 * Returns null if the user is not authenticated or if a refresh token error occurs.
 * This prevents "AuthApiError: Invalid Refresh Token: Refresh Token Not Found" errors
 * from crashing server components.
 */
export async function getUserSafely(supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>): Promise<User | null> {
  try {
    const result = await supabase.auth.getUser();
    return result.data.user ?? null;
  } catch (error) {
    // Handle refresh token errors - treat as no user
    // This can happen when the access token is expired and refresh token is invalid/missing
    return null;
  }
}
