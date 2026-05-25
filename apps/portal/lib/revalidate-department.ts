import { revalidatePath } from "next/cache";
import type { createServerSupabaseClient } from "@repo/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClient>>;

export async function resolveDepartmentSlug(
  supabase: SupabaseClient,
  departmentId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("departments")
    .select("name")
    .eq("id", departmentId)
    .maybeSingle();

  return data?.name ?? null;
}

/** Revalidate public URL paths (not filesystem route groups). */
export function revalidateDepartmentPage(
  departmentSlug: string,
  segment?: string,
) {
  revalidatePath(
    segment ? `/${departmentSlug}/${segment}` : `/${departmentSlug}`,
  );
}
