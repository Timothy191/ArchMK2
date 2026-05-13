import { createServerSupabaseClient } from "@repo/supabase/server";
import { redirect } from "next/navigation";
import { HubGrid } from "@/features/hub/components/HubGrid";

export default async function HubPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-medium text-[#fafafa]">
          Operations Hub
        </h1>
        <p className="text-[#898989] text-sm mt-1">
          Select a department to manage operations.
        </p>
      </div>

      <HubGrid />
    </div>
  );
}
