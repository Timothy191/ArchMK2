# Optimization Completion Plan

> Status: ACTIVE — implements the 7 gaps identified in the optimization audit.
> Branch: master (work happens in feature branch + PR at the end).
> Last updated: 2026-06-02.

## Status Overview

- [x] **INV-1** Investigate Next.js cache directives
- [x] **INV-2** Investigate Server Component data fetching
- [x] **INV-3** Investigate streaming SSR / Suspense
- [x] **INV-4** Investigate rate-limiter per-tool scoping
- [x] **INV-5** Investigate embedding pipeline batching
- [x] **INV-6** Investigate PWA workbox runtime caching
- [x] **INV-7** Investigate CDN/cache-control headers
- [x] **PLAN** Write this plan
- [ ] **GAP-1** Per-tool rate-limit buckets
- [ ] **GAP-2** `unstable_cache` wrapper for expensive Server Component reads
- [ ] **GAP-3** Streaming SSR for hub + heavy dept pages
- [ ] **GAP-4** Connection coalescing + AbortController reuse for Ollama
- [ ] **GAP-5** Cache-Control headers for static + CDN-friendly assets
- [ ] **GAP-6** Embedding batched background job (queue)
- [ ] **GAP-7** Supabase query memoization helper
- [ ] **VERIFY** Lint + type-check + test + E2E smoke

---

## Gaps Investigated

### GAP-1: Single-bucket rate limiter

**Current**: `lib/ai/rate-limiter.ts` uses a single token bucket keyed on `ratelimit:${ip}`. Every AI request (chat, embedding, tool) shares the same 30 req/min budget regardless of which tool ran. Heavy tool users (e.g. embed-on-document-upload) starve chat users on the same IP.

**Why it matters**: No isolation between high-cost and low-cost endpoints. A single user running a long embedding job can DoS their own chat session.

### GAP-2: No `unstable_cache` for Server Component reads

**Current**: Server Components like `apps/portal/app/(departments)/[department]/hourly-loads/page.tsx` fetch Supabase directly per render. The `withCache` wrapper is used in Server Actions and `(hub)/page.tsx`, but raw RSC fetches bypass it.

**Why it matters**: Multiple users on the same department hitting the same dashboard pay the full DB round-trip on every render. The materialized views in migration 022 are designed to be cached, but the cache only activates when code opts in via `withCache`.

### GAP-3: No streaming SSR for heavy pages

**Current**: Only 1 `<Suspense>` boundary exists (hub page line 472). Dashboard pages like `(departments)/[department]/page.tsx` use `dynamic()` to lazy-load the ScadaPanel, AlertPanel, etc. — good for client bundle, but the **server** still renders all KPIs and table rows synchronously before sending the first byte.

**Why it matters**: TTFB suffers on dashboard pages with multiple Supabase queries. Streaming the HTML shell + Suspense boundaries around the slowest queries would cut LCP.

### GAP-4: Ollama fetch leaks connections under cancel

**Current**: `ollamaChatStream` creates an `AbortController` but `withTimeout` does NOT pass the signal through — it uses a separate `Promise.race` with a `setTimeout` reject. The actual `fetch()` request is NOT aborted on timeout, only the await is abandoned. The HTTP connection is left dangling until the server closes it.

**Why it matters**: Serverless cold-start cost + connection pool exhaustion under load. CLAUDE.md says "Every external request must have a strict timeout" — currently we time out the wait, not the connection.

### GAP-5: No Cache-Control headers on responses

**Current**: `next.config.mjs` has security headers (HSTS, CSP, X-Frame-Options) but no `Cache-Control`. Static assets get Next.js defaults, but RSC payloads and dashboard pages have no explicit cache lifetime. The PWA workbox config (when enabled) handles client-side caching, but the upstream CDN cannot cache.

**Why it matters**: Vercel/Cloudflare can't cache anything. Every request hits the origin. Also, the `images.minimumCacheTTL: 86400` only governs the image optimizer output, not the surrounding HTML.

### GAP-6: Embedding pipeline is synchronous

**Current**: `memory.ts` calls `generateEmbedding` inline before insert. `storeMemories` does batch correctly, but `loadMemoryNode` runs `storeMemory` _and_ `retrieveRelevantMemories` in sequence (both block on an Ollama round-trip per turn).

**Why it matters**: The Ollama local server is the bottleneck for chat latency. Even with the per-process cache, a cold-cache first turn of a session costs ~500ms-1s for embeddings alone.

### GAP-7: No query result memoization at the Supabase layer

**Current**: Multiple `lib/` files construct `createServerSupabaseClient()` per call. There's no shared request-scoped memoization for repeat queries in the same RSC render.

**Why it matters**: A page that fetches `departments(name=X)` + `employees(department_id=X)` + `machines(department_id=X)` does 3 round-trips. A scoped cache could collapse them.

---

## Implementation Plan

### GAP-1: Per-tool rate-limit buckets

**File**: `apps/portal/lib/ai/rate-limiter.ts` (extend existing), `apps/portal/lib/ai/tools.ts` (call new helper), `apps/portal/lib/ai/agent-graph.ts` (pass tool name into `executeTools` rate check)

**Approach**:

- Add `checkRateLimitForTool(ip, toolName, options?)` that prefixes the key: `ratelimit:${toolName}:${ip}`.
- Default limits per tool category:
  - `chat` (default): 30 req/min, 1000 tokens/min — current behaviour.
  - `embedding`: 60 req/min (cheap, but vector-DB-bound).
  - `tools` (per-tool override): config-driven, default 60 req/min.
- Keep the existing `checkRateLimit(ip)` as a convenience wrapper for `chat` to preserve callers.
- Add a `RateLimitConfig` registry mirroring the cache TTL pattern: `RATE_LIMIT_REGISTRY: Record<ToolCategory, { limit, windowMs }>`.

**Verification**: New unit test in `rate-limiter.test.ts` asserting different IPs/tools get different buckets.

### GAP-2: `unstable_cache` wrapper for RSC reads

**File**: `apps/portal/lib/server-cache.ts` (new), plus opt-in calls in hub page and dept pages.

**Approach**:

- New `cachedRSC<T>(key, fn, options)` wrapper that calls `unstable_cache(fn, keyParts, { revalidate, tags })`.
- Convert the 4 `withCache` calls in `(hub)/page.tsx` to `cachedRSC` so they participate in Next.js's data cache AND the Redis L2 cache.
- Add `revalidateTag('dept:{name}')` calls in the corresponding Server Actions so mutations invalidate.
- Per CLAUDE.md quality gate, the change is opt-in per page (don't blanket-apply).

**Verification**: Build succeeds, dev server boots, hub page renders, repeated loads show `<1ms` from cache (Next.js dev indicator).

### GAP-3: Streaming SSR for heavy pages

**File**: `apps/portal/app/(departments)/[department]/page.tsx` (ScadaPanel, AlertPanel already dynamic — wrap them in `<Suspense>`), `apps/portal/app/(hub)/page.tsx` (add Suspense around remaining KPIs).

**Approach**:

- Extract each top-level section of the dept page into its own async component, then wrap the JSX in `<Suspense fallback={...}>`.
- For the hub page, do the same for the 4 KPI grids.
- Loading skeletons already exist via `loading.tsx`; reuse the same shape as the Suspense fallback.
- Do NOT change any of the underlying data fetching — just hoist the boundary.

**Verification**: `pnpm build` succeeds; dev server still renders; `view-source` shows HTML stream opens before the slow sections resolve.

### GAP-4: Connection abort on Ollama timeout

**File**: `apps/portal/lib/ai/ollama.ts` (refactor `withTimeout` to thread `AbortSignal`), `apps/portal/lib/ai/providers.ts` (use the new signature).

**Approach**:

- Change `withTimeout<T>(promise, timeoutMs)` → `withTimeout<T>(factory: (signal) => Promise<T>, timeoutMs)`.
- `factory` returns a fresh promise; the wrapper attaches a signal to a child `AbortController`, starts a timer, and calls `controller.abort()` on timeout.
- `ollamaChatStream` and `ollamaChat` pass the signal to `fetch()`.
- `ollamaEmbed` (single-shot) gets the same treatment.

**Verification**: Existing `ollama.test.ts` (if present) or new unit test that uses a slow mock fetch and asserts the connection is aborted (not just the await dropped). Manual: `OLLAMA_TIMEOUT_MS=1` and observe `fetch` `AbortError` in logs, not a hung request.

### GAP-5: Cache-Control headers for static + RSC

**File**: `apps/portal/next.config.mjs` (extend `headers()`).

**Approach**:

- Add `Cache-Control: public, max-age=300, stale-while-revalidate=86400` to:
  - `/_next/static/**` (hashed assets — already cacheable but be explicit)
  - `/api/health` (let CDN absorb health-check spam)
- Add `Cache-Control: private, no-store` to:
  - `/api/auth/**` (never cache)
  - `/api/ai/**` (per-user responses)
- Keep existing `Cache-Control: public, max-age=31536000, immutable` default for static images via `images.minimumCacheTTL` (already set).
- Skip caching for any route that returns `Set-Cookie` — already the default for App Router, but add a `/(auth)/*` deny rule for explicitness.

**Verification**: `curl -I` against the dev server shows the new headers; build succeeds.

### GAP-6: Background embedding queue (deferred — flag only)

**File**: NONE — recorded as a future enhancement.

**Why deferred**: Requires Inngest setup (already in deps as `inngest@4.4.0`) and an event schema. Out of scope for a 4-hour session. Documented in `LEARNED.md` as a deferred optimization.

**What I'll do**: Update the `add-ai-tool` skill to call out the per-tool rate-limit buckets added in GAP-1 and the abort-on-timeout pattern from GAP-4.

### GAP-7: Supabase query memoization

**File**: `apps/portal/lib/supabase/scoped-cache.ts` (new, opt-in helper).

**Approach**:

- New `withScopedCache<T>(key, fn)` that uses `React.cache()` (from `react`) to memoize a per-render Supabase query.
- Do NOT change existing call sites. Provide it as a helper, document in the skill.

**Why deferred** (mostly): Most RSC pages already have at most 2-3 Supabase queries; the win is marginal compared to GAP-2. Add the helper, but defer adoption to a follow-up plan.

---

## Verification Strategy

Per `.claude/rules/verification.md` and `development-practices.md`:

| Gap   | Build | Lint | Type-check | Unit test      | E2E / dev-server probe                                  |
| ----- | ----- | ---- | ---------- | -------------- | ------------------------------------------------------- |
| GAP-1 | ✅    | ✅   | ✅         | new + existing | rate-limit test                                         |
| GAP-2 | ✅    | ✅   | ✅         | existing       | dev server: hub page renders, cache hits via `?trace=1` |
| GAP-3 | ✅    | ✅   | ✅         | n/a            | `view-source` shows streamed HTML before slow sections  |
| GAP-4 | ✅    | ✅   | ✅         | new abort test | manual: short timeout → connection abort in logs        |
| GAP-5 | ✅    | ✅   | ✅         | n/a            | `curl -I` shows headers                                 |

Final gate: `pnpm quality` before declaring done.

---

## Risks

- **GAP-2**: `unstable_cache` interaction with auth (must NOT cache per-user data without tags). Mitigation: opt-in only, document the per-user caveat in the helper docblock.
- **GAP-4**: Aborting a `fetch` mid-stream may produce a noisy error in Ollama's logs. Acceptable trade-off vs. connection leak.
- **GAP-3**: Streaming SSR can surface unstyled-content flashes if the Suspense fallback doesn't match the final shape. Mitigation: reuse `loading.tsx` skeletons.

## Out of Scope

- New database indexes (covered in migrations 010/021/030/041 — already complete).
- Switching to `pgvectorscale` StreamingDiskANN (extension availability dependent on host).
- Replacing Redis with Vercel KV (works fine as-is; no migration trigger).
- Bundler-level changes (esbuild, swc tuning beyond Next defaults).
- Edge runtime migration.

## Next Actions

1. Create feature branch `optimization/gap-implementation`.
2. Implement GAP-1 (rate-limit) → run unit tests.
3. Implement GAP-4 (ollama abort) → run unit tests.
4. Implement GAP-2 (RSC cache) → dev server smoke.
5. Implement GAP-3 (streaming SSR) → dev server smoke.
6. Implement GAP-5 (cache headers) → curl smoke.
7. Skip GAP-6/7 (deferred, documented).
8. Run `pnpm quality` → fix any issues.
9. Commit per task, open PR.
