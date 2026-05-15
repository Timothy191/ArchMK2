import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-heading)]">
          Plantcor
        </h1>
        <p className="text-[var(--text-muted)] text-sm mt-2">
          Sign in to Arch-Systems
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-xs text-[var(--text-muted)]">
        Need help? Contact IT on channel 4.
      </p>
    </div>
  );
}
