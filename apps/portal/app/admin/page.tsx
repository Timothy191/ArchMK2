import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@repo/supabase/server";
import { GlassCard } from "@repo/ui/GlassCard";

export default async function AdminPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  if (employee?.role !== "admin") {
    redirect("/");
  }

  const { data: employees } = await supabase
    .from("employees")
    .select("id, full_name, role, department_id, created_at")
    .order("created_at", { ascending: false });

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, display_name");

  const deptMap = new Map(departments?.map((d) => [d.id, d.display_name]) ?? []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-[#fafafa]">
      <header className="sticky top-0 z-50 border-b border-[#363636] bg-[#0f0f0f]/80 backdrop-blur">
        <div className="flex items-center justify-between px-6 py-3">
          <span className="text-lg font-medium text-[#fafafa]">Admin Dashboard</span>
        </div>
      </header>

      <main className="p-6 max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-medium text-[#fafafa]">Employees</h1>

        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#363636]">
                  <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-[#898989] uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#363636]">
                {employees?.map((emp) => (
                  <tr key={emp.id} className="hover:bg-[#242424] transition-colors">
                    <td className="px-6 py-4 text-[#fafafa] text-sm">{emp.full_name}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                          emp.role === "admin"
                            ? "bg-violet-500/10 text-violet-400"
                            : emp.role === "supervisor"
                              ? "bg-amber-500/10 text-amber-400"
                              : "bg-[#171717] text-[#898989] border border-[#363636]"
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-[#898989] text-sm">
                      {deptMap.get(emp.department_id) || "Unassigned"}
                    </td>
                    <td className="px-6 py-4 text-[#898989] text-sm">
                      {new Date(emp.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
                {(!employees || employees.length === 0) && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-12 text-center text-[#898989] text-sm"
                    >
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
