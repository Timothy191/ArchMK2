import type { createServerSupabaseClient } from "@repo/supabase/server";
import {
  resolveDepartmentSlug,
  revalidateDepartmentPage,
} from "./revalidate-department";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export async function revalidateAfterDepartmentMutation(
  supabase: SupabaseClient,
  departmentId: string,
  segment?: string,
) {
  const slug = await resolveDepartmentSlug(supabase, departmentId);
  if (!slug) return;
  revalidateDepartmentPage(slug);
  if (segment) {
    revalidateDepartmentPage(slug, segment);
  }
}
