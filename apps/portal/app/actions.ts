"use server";

import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { inngest, aiGenerateEmbeddingEvent } from "@repo/utils/inngest";
import { logError } from "@/lib/errors/error-logger";

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function speculativeEmbedShiftLog(text: string) {
  // Validate that the user is authenticated (Always validate the user at the top)
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (!text || text.trim() === "") return;

  try {
    await inngest.send({
      name: aiGenerateEmbeddingEvent,
      data: {
        text,
        userId: user.id,
      },
    });
  } catch (err) {
    // Log error but do not fail the user's critical operation path
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "speculative_embed_queue_failed",
    });
  }
}

export async function revalidateRSC(tags: string[]) {
  // Always validate the user at the top
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  for (const tag of tags) {
    revalidateTag(tag, "max");
  }
  return { success: true };
}
