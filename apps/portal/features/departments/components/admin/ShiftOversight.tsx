"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@repo/supabase/client";
import { GlassCard } from "@repo/ui/GlassCard";
import { Clock, CheckCircle2, AlertCircle } from "lucide-react";

export function ShiftOversight() {
  const [shifts, setShifts] = useState<any[]>([]);
  const supabase = createBrowserSupabaseClient();

  useEffect(() => {
    async function loadShifts() {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("shift_status")
        .select(`
          id, 
          status, 
          shift_type,
          departments (display_name)
        `)
        .eq("shift_date", today);
      
      if (data) setShifts(data);
    }
    loadShifts();
  }, [supabase]);

  return (
    <GlassCard className="p-0 overflow-hidden flex flex-col h-full bg-[#0d0d0d]/50">
      <div className="p-4 border-b border-[#242424] flex items-center justify-between">
        <h3 className="text-sm font-medium text-[#fafafa] flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          Shift Oversight (Today)
        </h3>
        <span className="text-[10px] uppercase tracking-widest text-amber-400 font-bold bg-amber-400/10 px-2 py-0.5 rounded">
          Day Shift
        </span>
      </div>

      <div className="p-4 space-y-3">
        {shifts.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <AlertCircle className="w-8 h-8 text-[#242424] mx-auto" />
            <p className="text-xs text-[#898989]">No shift data received for today yet.</p>
          </div>
        ) : (
          shifts.map((shift) => (
            <div key={shift.id} className="flex items-center justify-between p-3 rounded-lg bg-[#171717] border border-[#242424]">
              <div className="flex items-center gap-3">
                <div className={`w-1.5 h-1.5 rounded-full ${shift.status === "closed" ? "bg-[#3ecf8e]" : "bg-amber-400 animate-pulse"}`} />
                <span className="text-sm text-[#fafafa] font-medium">{shift.departments?.display_name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase ${shift.status === "closed" ? "text-[#3ecf8e]" : "text-amber-400"}`}>
                  {shift.status}
                </span>
                {shift.status === "closed" ? (
                  <CheckCircle2 className="w-4 h-4 text-[#3ecf8e]" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-auto p-3 bg-[#171717]/30 border-t border-[#242424]">
        <div className="flex justify-between text-[10px] text-[#898989] mb-2">
          <span>Compliance Rate</span>
          <span className="text-[#fafafa]">
            {shifts.length > 0 ? Math.round((shifts.filter(s => s.status === "closed").length / shifts.length) * 100) : 0}%
          </span>
        </div>
        <div className="w-full bg-[#242424] h-1 rounded-full overflow-hidden">
          <div 
            className="bg-[#3ecf8e] h-full transition-all duration-500" 
            style={{ width: `${shifts.length > 0 ? (shifts.filter(s => s.status === "closed").length / shifts.length) * 100 : 0}%` }}
          />
        </div>
      </div>
    </GlassCard>
  );
}
