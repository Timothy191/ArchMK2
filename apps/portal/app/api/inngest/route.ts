import { serve } from "inngest/next";
import { inngest } from "@repo/utils/inngest";
import { syncPlaybackFn } from "@/lib/jobs/sync-playback";
import { generateReportFn } from "@/lib/jobs/report-generation";
import { generateEmbeddingFn } from "@/lib/jobs/embedding-generation";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [syncPlaybackFn, generateReportFn, generateEmbeddingFn],
});
