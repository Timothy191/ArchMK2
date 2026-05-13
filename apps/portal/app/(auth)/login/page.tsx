import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth/components/LoginForm";

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/");
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-medium text-[#fafafa]">Arch-Systems</h1>
        <p className="text-[#898989] text-sm mt-1">
          Sign in to your account
        </p>
      </div>
      <LoginForm />
    </>
  );
}
