"use client";

import { useEffect, useState, useOptimistic, startTransition } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { GlassCard } from "@repo/ui/GlassCard";
import { AuthError } from "@repo/errors";
import { logError } from "@/lib/errors/error-logger";
import { Search, UserPlus, Filter, X, Check } from "lucide-react";

export function PersonnelTable() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("operator");

  const supabase = createBrowserSupabaseClient();

  // 🚀 React 19 useOptimistic Hook for instant, lag-free UI updates
  const [optimisticEmployees, addOptimisticEmployee] = useOptimistic(
    employees,
    (state, newEmp: any) => [newEmp, ...state]
  );

  async function loadEmployees() {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name, role, department_id, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    
    if (data) setEmployees(data);
  }

  useEffect(() => {
    loadEmployees();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const tempId = crypto.randomUUID();
    const optimisticEmployee = {
      id: tempId,
      full_name: newName,
      role: newRole,
      created_at: new Date().toISOString(),
    };

    // 1. Instant 0ms Optimistic UI Transition
    startTransition(() => {
      addOptimisticEmployee(optimisticEmployee);
      setIsAdding(false);
      setNewName("");
    });

    try {
      // 2. Asynchronous background database insertion
      const { data: userData } = await supabase.auth.getUser();
      const authId = userData?.user?.id;

      if (!authId) {
        throw new AuthError("No active authenticated session", {
          context: { action: "addEmployee" },
        });
      }

      const { error } = await supabase.from("employees").insert({
        auth_id: authId,
        full_name: optimisticEmployee.full_name,
        role: optimisticEmployee.role,
      });

      if (error) throw error;

      // 3. Silently sync actual state from database
      await loadEmployees();
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), { context: "personnel_table_insert" }).catch(() => {});
      // Rollback is automatic on reload miss
      await loadEmployees();
    }
  };

  return (
    <GlassCard className="p-0 overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-[#242424] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#fafafa]">Recent Personnel</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAdding(!isAdding)}
            className={`p-1.5 rounded-lg transition-colors ${
              isAdding 
                ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                : "bg-[#3ecf8e] text-[#171717] hover:bg-[#35b37d]"
            }`}
            aria-label={isAdding ? "Close Add Form" : "Add Employee"}
          >
            {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 🚀 Sleek Slide-Down Add Form */}
      {isAdding && (
        <form onSubmit={handleSubmit} className="p-4 border-b border-[#242424] bg-[#0d0d0d] flex gap-2 items-center">
          <input
            type="text"
            placeholder="Full Name..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs bg-[#171717] border border-[#242424] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#3ecf8e] transition-colors"
            required
            autoFocus
          />
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value)}
            title="Select Employee Role"
            className="px-2 py-1.5 text-xs bg-[#171717] border border-[#242424] rounded-lg text-[#fafafa] focus:outline-none focus:border-[#3ecf8e]"
          >
            <option value="operator">Operator</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
          <button
            type="submit"
            className="p-1.5 bg-[#3ecf8e] text-[#171717] rounded-lg hover:bg-[#35b37d] transition-colors"
            aria-label="Confirm Add"
          >
            <Check className="w-4 h-4" />
          </button>
        </form>
      )}
      
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-[#171717]">
              <th className="px-4 py-3 text-[10px] font-medium text-[#898989] uppercase tracking-wider">Name</th>
              <th className="px-4 py-3 text-[10px] font-medium text-[#898989] uppercase tracking-wider">Role</th>
              <th className="px-4 py-3 text-[10px] font-medium text-[#898989] uppercase tracking-wider text-right">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171717]">
            {optimisticEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-[#0d0d0d] transition-colors group">
                <td className="px-4 py-3 text-sm text-[#fafafa] font-medium">{emp.full_name}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    emp.role === "admin" ? "bg-violet-500/10 text-violet-400 border border-violet-500/20" :
                    emp.role === "supervisor" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                    "bg-[#171717] text-[#898989] border border-[#242424]"
                  }`}>
                    {emp.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-[#898989] text-right">
                  {new Date(emp.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <a href="/admin" className="p-3 text-center text-xs font-medium text-[#898989] hover:text-[#fafafa] bg-[#0d0d0d] border-t border-[#242424] transition-colors">
        View All Personnel
      </a>
    </GlassCard>
  );
}
