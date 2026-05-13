import { z } from "zod";

export const dailyLogSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  shift: z.enum(["day", "night"]),
  notes: z.string().optional(),
});

export const machineHourSchema = z.object({
  machine_id: z.string().uuid(),
  hours_worked: z.number().min(0).max(24),
});

export const fuelLogSchema = z.object({
  machine_id: z.string().uuid(),
  diesel_litres: z.number().min(0),
});

export const productionLogSchema = z.object({
  coal_tonnes: z.number().min(0),
  waste_tonnes: z.number().min(0),
});

export const dailyLogFormSchema = z.object({
  log_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  shift: z.enum(["day", "night"]),
  notes: z.string().optional(),
  machine_hours: z
    .array(machineHourSchema)
    .min(1, "At least one machine hour entry required"),
  fuel_logs: z.array(fuelLogSchema).optional(),
  production: productionLogSchema.optional(),
});

export type DailyLogFormData = z.infer<typeof dailyLogFormSchema>;
export type MachineHourEntry = z.infer<typeof machineHourSchema>;
export type FuelLogEntry = z.infer<typeof fuelLogSchema>;
export type ProductionEntry = z.infer<typeof productionLogSchema>;
