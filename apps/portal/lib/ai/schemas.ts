import { z } from "zod";

export const riskAssessmentSchema = z.object({
  risk: z.enum(["low", "medium", "high"]),
  actions: z.array(z.string()),
  timeEstimate: z.string(),
  summary: z.string(),
});

export const complianceResultSchema = z.object({
  violations: z.array(z.string()),
  concerns: z.array(z.string()),
  score: z.number().min(1).max(10),
  summary: z.string(),
});
