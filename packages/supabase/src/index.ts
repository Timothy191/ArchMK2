export { createBrowserSupabaseClient } from "./client";
export { createMiddlewareClient } from "./middleware";
export { withSpan } from "./tracing";
// Server client must be imported from @repo/supabase/server directly
// to avoid pulling next/headers into client bundles
