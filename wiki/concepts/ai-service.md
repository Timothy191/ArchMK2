---
title: AI Service
created: 2026-05-15
updated: 2026-05-15
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

Two-tier failover system:

1. **Primary**: Groq (`llama-3.1-8b-instant`) — fast, low-latency
2. **Secondary**: OpenRouter (`google/gemma-2-9b-it:free`) — free tier backup

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
- `TOGETHER_API_KEY` — Tertiary provider (not currently wired)

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

Related pages: [[portal-app-architecture]], [[external-tools]]
