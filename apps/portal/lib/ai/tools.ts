import { tool } from "ai";
import { z } from "zod";
import { createServerSupabaseClient } from "@repo/supabase/server";

export const machineStatusTool = tool({
  description: "Get current status and details of machines in a department",
  inputSchema: z.object({
    departmentName: z
      .string()
      .describe("Department name to query machines for"),
  }),
  execute: async ({ departmentName }: { departmentName: string }) => {
    const supabase = await createServerSupabaseClient();
    const { data: dept } = await supabase
      .from("departments")
      .select("id")
      .eq("name", departmentName)
      .single();

    if (!dept) return { error: "Department not found" };

    const { data: machines } = await supabase
      .from("machines")
      .select("id, name, machine_type, active")
      .eq("department_id", dept.id);

    return { machines: machines ?? [] };
  },
});

export const shiftLogsTool = tool({
  description: "Get recent shift logs for a department",
  inputSchema: z.object({
    departmentName: z.string().describe("Department name"),
    date: z.string().optional().describe("ISO date string, defaults to today"),
  }),
  execute: async ({
    departmentName,
    date,
  }: {
    departmentName: string;
    date?: string;
  }) => {
    const supabase = await createServerSupabaseClient();
    const { data: dept } = await supabase
      .from("departments")
      .select("id")
      .eq("name", departmentName)
      .single();

    if (!dept) return { error: "Department not found" };

    const targetDate = date ?? new Date().toISOString().split("T")[0];
    const { data: logs } = await supabase
      .from("daily_logs")
      .select("id, log_date, shift")
      .eq("department_id", dept.id)
      .eq("log_date", targetDate);

    return { logs: logs ?? [] };
  },
});

export const delaysTool = tool({
  description: "Get operational delays for a department on a given date",
  inputSchema: z.object({
    departmentName: z.string().describe("Department name"),
    date: z.string().optional().describe("ISO date string, defaults to today"),
  }),
  execute: async ({
    departmentName,
    date,
  }: {
    departmentName: string;
    date?: string;
  }) => {
    const supabase = await createServerSupabaseClient();
    const { data: dept } = await supabase
      .from("departments")
      .select("id")
      .eq("name", departmentName)
      .single();

    if (!dept) return { error: "Department not found" };

    const targetDate = date ?? new Date().toISOString().split("T")[0];
    const { data: delays } = await supabase
      .from("operational_delays")
      .select("delay_minutes, status, reason")
      .eq("department_id", dept.id)
      .eq("delay_date", targetDate);

    return { delays: delays ?? [] };
  },
});

export const aiTools = {
  machineStatus: machineStatusTool,
  shiftLogs: shiftLogsTool,
  delays: delaysTool,
} as const;
