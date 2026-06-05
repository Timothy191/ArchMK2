import { createClient } from "@supabase/supabase-js";

// Simple APIError class for package-level use
class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
  ) {
    super(message);
    this.name = "APIError";
  }
}

export function createServiceRoleClient() {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new APIError(
      "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables",
      { statusCode: 500 },
    );
  }
  return createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
