---
title: AI Service
created: 2026-05-15
updated: 2026-05-17
type: concept
tags: [system, api, integration, concept]
sources: [raw/codebase/ai-service.md]
confidence: high
---

# AI Service

The portal includes a multi-provider AI chat endpoint with automatic failover, built-in prompt templates, and tool use for operational data queries.

## Architecture

The AI layer is split across four files in `apps/portal/lib/ai/`:

| File           | Responsibility                               |
| -------------- | -------------------------------------------- |
| `providers.ts` | Model providers and failover logic           |
| `prompts.ts`   | System prompt templates                      |
| `tools.ts`     | Zod-typed tools for operational data         |
| `schemas.ts`   | JSON response schemas for structured outputs |

## Providers

Three-tier cascading failover system:

1. **Primary**: Groq (`llama-3.1-8b-instant`) — fast, low-latency (LPU inference)
2. **Secondary**: OpenRouter (`google/gemma-2-9b-it:free`) — broad model access, free tier fallback
3. **Tertiary**: Together AI — cost-efficient open-source models, final fallback

```typescript
export const models = {
  primary: groq("llama-3.1-8b-instant"),
  secondary: openrouterProvider("google/gemma-2-9b-it:free"),
};
```

The `withFailover()` helper tries primary first, falls back to secondary on error:

```typescript
export async function withFailover<T>(
  fn: (model: LanguageModel) => Promise<T>,
  modelList: LanguageModel[] = [models.primary, models.secondary],
): Promise<T> {
  let lastError: Error | undefined;
  for (const model of modelList) {
    try {
      return await fn(model);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`Provider failed, trying next:`, lastError.message);
    }
  }
  throw lastError ?? new Error("All providers failed");
}
```

Environment variables:

- `GROQ_API_KEY` — Primary provider
- `OPENROUTER_API_KEY` — Secondary provider
- `TOGETHER_API_KEY` — Tertiary provider (wired in Phase 3)

## Prompt Templates

Built-in system prompts for specific operational contexts:

| Template                | Purpose                                            |
| ----------------------- | -------------------------------------------------- |
| `chat`                  | General assistant with optional department context |
| `predictiveMaintenance` | Machine risk assessment with JSON output           |
| `safetyCompliance`      | Safety violation review with JSON output           |
| `shiftHandoff`          | Shift summary for handover                         |

```typescript
export const systemPrompts = {
  chat: (context?: string) =>
    context
      ? `You are an AI assistant for Arch-Systems... Current context: ${context}.`
      : "You are an AI assistant for Arch-Systems...",
  predictiveMaintenance: "You are an industrial maintenance AI...",
  safetyCompliance: "You are a safety compliance officer AI...",
  shiftHandoff: "You are a shift supervisor AI...",
};
```

## Tools

Three operational tools using the `ai` SDK's `tool()` helper with Zod schemas:

### machineStatus

Queries the `machines` table for a given department name.

Input: `{ departmentName: string }`
Output: `{ machines: [{ id, name, machine_type, active }] }`

### shiftLogs

Queries `daily_logs` for a department and optional date.

Input: `{ departmentName: string, date?: string }`
Output: `{ logs: [{ id, log_date, shift }] }`

### delays

Queries `operational_delays` for a department and optional date.

Input: `{ departmentName: string, date?: string }`
Output: `{ delays: [{ delay_minutes, status, reason }] }`

All tools use `createServerSupabaseClient()` for database access.

## Chat Endpoint

`POST /api/ai/chat` — Accepts messages, streams responses with tool calling support.

Features:

- Multi-provider failover
- Rate limiting
- Streaming responses
- Tool use for real-time operational data
- Context injection for department-specific queries

## AI Chat UI

The chat interface is embedded in department pages and the hub. It supports:

- Markdown rendering
- Syntax highlighting via shiki
- Streaming text display
- Tool result visualization
- Department context awareness

## Phase 3 Additions

Phase 3 extended the AI service with memory, orchestration, and tool infrastructure:

### Vector Memory System (pgvector)

Long-term AI memory stored in PostgreSQL using the `pgvector` extension:

| Table            | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `memories`       | Stored facts, context, and conversation history  |
| `embeddings`     | Vector embeddings (1536-dim) for semantic search |
| `conversations`  | Chat session records per user/department         |
| `agent_sessions` | Multi-agent task tracking                        |

Hybrid search: keyword (`tsvector`) + embedding (`HNSW index`) combined via reciprocal rank fusion.

### Redis Cache Layer

AI responses cached in Redis to reduce provider calls and latency:

```
ai:response:{hash}        → 1h TTL   (identical query deduplication)
user:context:{user_id}    → 24h TTL  (user conversation context)
dept:summary:{dept_id}    → 15m TTL  (department data summaries)
```

Cache hit rate target: 78%+ (measured in Grafana).

### MCP Registry

10+ Model Context Protocol patterns registered for agent tool use:

- `database_query` — Supabase parameterized queries
- `document_search` — Full-text search across operational logs
- `code_execution` — Sandboxed formula evaluation
- `external_api` — Weather, satellite data fetchers
- `shift_context` — Current shift state injection
- `dept_summary` — Materialized department summaries

### Multi-Agent Orchestrator (Kiro)

Coordinates specialized sub-agents for complex operational queries:

| Component       | Role                                       |
| --------------- | ------------------------------------------ |
| Task Router     | Classifies query → routes to best agent    |
| Memory Manager  | Retrieves relevant context from pgvector   |
| Context Builder | Assembles prompt with dept data + history  |
| Tool Selector   | Picks MCP tools for the query type         |
| Result Merger   | Combines multi-agent outputs into response |

See [[external-tools]] for n8n workflow integration with the orchestrator.

## Related

- [[portal-app-architecture]] — where AI service fits in the app
- [[external-tools]] — n8n workflows, MCP registry
- [[monitoring-error-tracking]] — Prometheus metrics for AI response times
- [[analytics-reporting]] — predictive maintenance uses `predictiveMaintenance` prompt template
- [[database-optimization]] — pgvector HNSW index tuning for memory search
