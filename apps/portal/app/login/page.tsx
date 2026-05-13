import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/");

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f]">
      <div className="w-full max-w-md border border-[#363636] bg-[#242424] rounded-2xl p-8">
        <h1 className="text-2xl font-medium text-[#fafafa] text-center mb-2">
          Plantcor OS
        </h1>
        <p className="text-[#898989] text-center mb-8">
          Sign in to your department
        </p>
        <LoginForm />
      </div>
    </div>
  );
}
