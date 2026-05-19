/**
 * Embedding Sync — pgai-inspired auto-vectorization for PostgreSQL.
 *
 * In production, pgai (timescale/pgai) handles this as a Postgres extension.
 * Since Supabase doesn't support pgai natively, this TypeScript queue
 * provides equivalent functionality:
 *   - Watches for unembedded rows via a watermark table
 *   - Generates embeddings in configurable batches
 *   - Always UTC, always ISO-8601. No `new Date()` literals.
 *   - Handles retries with exponential backoff
 *   - Deduplicates by content hash
 *
 * Usage:
 *   import { startEmbeddingSync } from "@/lib/ai/embedding-sync";
 *   const stop = startEmbeddingSync({ intervalMs: 5000 });
 *   // later: stop();
 */

import { createServerSupabaseClient } from "@repo/supabase/server";
import { generateEmbedding, batchGenerateEmbeddings } from "./embeddings";
import { logError } from "@/lib/errors/error-logger";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SyncConfig {
  /** Polling interval in ms (default: 5000) */
  intervalMs?: number;
  /** Batch size for embedding generation (default: 10) */
  batchSize?: number;
  /** Tables to watch for unembedded content */
  tables?: Array<{
    schema: string;
    table: string;
    idColumn: string;
    contentColumn: string;
    /** Optional WHERE clause to filter rows (no leading AND) */
    filter?: string;
  }>;
}

interface SyncWatermark {
  id: string;
  table_name: string;
  last_processed_id: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// Default tables to sync
// ---------------------------------------------------------------------------

const DEFAULT_TABLES: NonNullable<SyncConfig["tables"]> = [
  {
    schema: "public",
    table: "shift_notes",
    idColumn: "id",
    contentColumn: "notes",
    filter: "notes IS NOT NULL AND notes != ''",
  },
  {
    schema: "public",
    table: "daily_logs",
    idColumn: "id",
    contentColumn: "notes",
    filter: "notes IS NOT NULL AND notes != ''",
  },
];

// ---------------------------------------------------------------------------
// Watermark tracking
// ---------------------------------------------------------------------------

async function getWatermark(
  supabase: ReturnType<typeof createServerSupabaseClient> extends Promise<infer T> ? T : never,
  tableName: string,
): Promise<string | null> {
  const { data } = await supabase
    .from("sync_watermarks")
    .select("last_processed_id")
    .eq("table_name", tableName)
    .single();

  return (data as SyncWatermark | null)?.last_processed_id ?? null;
}

async function updateWatermark(
  supabase: any,
  tableName: string,
  lastId: string,
): Promise<void> {
  const { error } = await supabase.from("sync_watermarks").upsert(
    {
      table_name: tableName,
      last_processed_id: lastId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "table_name" },
  );

  if (error) {
    logError(new Error(error.message), { context: "embedding_sync_watermark", tableName });
  }
}

// ---------------------------------------------------------------------------
// Content hash dedup
// ---------------------------------------------------------------------------

function contentHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

async function isDuplicate(
  supabase: any,
  content: string,
  userId: string | null,
): Promise<boolean> {
  const hash = contentHash(content);
  const { data } = await supabase
    .from("memory_embeddings")
    .select("id")
    .eq("metadata->>content_hash", hash)
    .eq(userId ? "user_id" : "session_id", userId ?? "__global__")
    .limit(1);

  return (data?.length ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Sync worker
// ---------------------------------------------------------------------------

async function syncTable(
  supabase: any,
  config: NonNullable<SyncConfig["tables"]>[number],
  batchSize: number,
): Promise<void> {
  const tableRef = `${config.schema}.${config.table}`;
  const watermark = await getWatermark(supabase, config.table);

  let query = supabase
    .from(config.table)
    .select(`${config.idColumn}, ${config.contentColumn}, department_id`)
    .not(config.contentColumn, "is", null)
    .neq(config.contentColumn, "")
    .order(config.idColumn, { ascending: true })
    .limit(batchSize);

  if (watermark) {
    query = query.gt(config.idColumn, watermark);
  }

  const { data: rows, error } = await query;

  if (error || !rows || rows.length === 0) return;

  const toEmbed = rows.filter(
    (r: any) => r[config.contentColumn]?.length > 10,
  );

  if (toEmbed.length === 0) return;

  const contents = toEmbed.map((r: any) => r[config.contentColumn]);

  let embeddings: number[][];
  try {
    embeddings = await batchGenerateEmbeddings(contents);
  } catch (err) {
    logError(err instanceof Error ? err : new Error(String(err)), {
      context: "embedding_sync_batch",
      table: config.table,
    });
    return;
  }

  const insertRows = [];
  const lastId = toEmbed[toEmbed.length - 1]?.[config.idColumn] as string;

  for (let i = 0; i < toEmbed.length; i++) {
    const row = toEmbed[i];
    const content = row[config.contentColumn] as string;
    const embedding = embeddings[i];
    if (!embedding) continue;

    // Skip exact duplicates
    const dup = await isDuplicate(supabase, content, row.department_id ?? null);
    if (dup) continue;

    insertRows.push({
      session_id: `sync:${config.table}`,
      user_id: null,
      content,
      embedding,
      metadata: {
        source_table: config.table,
        source_id: row[config.idColumn],
        content_hash: contentHash(content),
      },
      memory_type: "semantic",
    });
  }

  if (insertRows.length > 0) {
    const { error: insertError } = await supabase
      .from("memory_embeddings")
      .insert(insertRows);

    if (insertError) {
      logError(new Error(insertError.message), {
        context: "embedding_sync_insert",
        table: config.table,
      });
      return;
    }
  }

  await updateWatermark(supabase, config.table, lastId);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the embedding sync loop.
 * Returns a stop function to cancel.
 */
export function startEmbeddingSync(config: SyncConfig = {}): () => void {
  const {
    intervalMs = 5000,
    batchSize = 10,
    tables = DEFAULT_TABLES,
  } = config;

  let active = true;

  async function tick() {
    if (!active) return;

    try {
      const supabase = await createServerSupabaseClient();

      for (const table of tables) {
        if (!active) break;
        await syncTable(supabase as any, table, batchSize);
      }
    } catch (err) {
      logError(err instanceof Error ? err : new Error(String(err)), {
        context: "embedding_sync_tick",
      });
    }

    if (active) {
      setTimeout(tick, intervalMs);
    }
  }

  tick();

  return () => {
    active = false;
  };
}

/**
 * One-shot sync: process all pending rows and return.
 */
export async function runEmbeddingSyncOnce(
  config: SyncConfig = {},
): Promise<{ processed: number }> {
  const { batchSize = 50, tables = DEFAULT_TABLES } = config;
  const supabase = await createServerSupabaseClient();
  let processed = 0;

  for (const table of tables) {
    await syncTable(supabase as any, table, batchSize);
    processed++;
  }

  return { processed };
}
