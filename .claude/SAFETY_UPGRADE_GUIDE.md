# Safe Architecture Upgrade Path

**Reference guide for evolving Arch-Mk2's monorepo architecture** (from MONOREPO_STATUS.md) **with safety-first principles.**

The 10 upgrades below are evaluated individually for safety, with risks and mitigations. A single architectural principle (Single Source of Truth + Code Generation) prevents the #1 danger: rule duplication drift.

---

## The 10 Upgrades (Safety Analysis)

### 1. 🔐 Policy-as-Code Layer (OPA)

**Safe?** ✅ Yes — stateless rule engine, versioned policies, deterministic.

**Risk to Watch:**
- Policy drift if same rules maintained in ESLint and OPA manually
- OPA is external binary — must be pinned and verified

**Mitigations:**
- Generate OPA policies from single source of truth (SSoT compiler)
- Run OPA as CI step, not runtime sidecar
- Use `opa test` to validate policies

**Result:** No new attack surface if OPA only reads logs/graph snapshots.

---

### 2. 📦 SBOM + Supply Chain Integrity (Syft, Cosign)

**Safe?** ✅ Absolutely — passive artifact generation/verification.

**Risk to Watch:**
- False positives from SBOM diff
- Signing key management — if keys leak, provenance loses meaning

**Mitigations:**
- Store SBOMs as build artifacts; diff in read-only CI job
- Use short-lived signing keys via OIDC (`id-token: write` with Cosign)
- Never store private keys in repo; use CI secrets with strict access

**Result:** Cryptographically verifiable builds — massive security win.

---

### 3. 📊 Observability Layer (Repo Telemetry)

**Safe?** ✅ Yes, if implemented as structured, non-secret-leaking logs.

**Risk to Watch:**
- Accidentally logging secrets (env vars, tokens)
- Over-capturing could slow CI marginally

**Mitigations:**
- Scrub logs automatically (strip env vars, passwords) via wrapper
- Use simple JSONL in `.nx/telemetry/`; no network egress
- If OpenTelemetry, send to local collector that filters before export

**Result:** Deterministic "why did this run?" answer — zero safety compromise.

---

### 4. 🧩 Runtime Dependency Firewall (AST-level)

**Safe?** ✅ Trickier but safe when scoped correctly.

**Risk to Watch:**
- Legitimate dynamic imports (Next.js lazy loading) could be blocked
- Performance impact if scanning every file on every build
- False negatives/positives from buggy firewall

**Mitigations:**
- Start as optional, non-blocking step (warnings only)
- Gradually promote to blocking on critical packages (packages/db, packages/auth)
- Use static AST analysis (Babel/TypeScript plugin) respecting tag-based rules
- Pre-calculate allowlist for known dynamic import patterns

**Result:** Closes bypass vector; implement last with gradual rollout.

---

### 5. ⚙️ Execution Sandbox Layer (CI Hardening)

**Safe?** ✅ Extremely — standard DevSecOps.

**Risk to Watch:**
- Over-restriction might break tests needing localhost network (integration tests)

**Mitigations:**
- Allow network only in install + dedicated integration-test jobs
- Use Docker containers with `--read-only` filesystem; mount writable `/tmp` for tools
- Test sandbox locally first

**Result:** Prevents malicious postinstall scripts and lateral movement.

---

### 6. 🧬 Graph Versioning System

**Safe?** ✅ Yes — snapshot in `.nx/graphs/`. No execution impact.

**Risk to Watch:**
- Graph files might contain sensitive info (absolute paths) if not sanitized

**Mitigations:**
- Make snapshot relative-path-based and scrubbed (Nx JSON output is safe)
- Commit snapshots as repo files (or store as CI artifacts)
- Diff them in PR comment to visualize structural changes

**Result:** Every PR becomes a graph mutation event — excellent for review/auditing.

---

### 7. 🧠 Intent Drift Detection

**Safe?** ✅ Yes — validation step, never mutates code.

**Risk to Watch:**
- False positives when `intent-map.json` lags behind legitimate refactors

**Mitigations:**
- Run as non-blocking check initially, then soft gate (overridable with label)
- Make it easy to update `intent-map.json` in same PR as code change

**Result:** Prevents architectural rot without introducing risk.

---

### 8. 🔄 Self-Healing Loop Formalization

**Safe?** ✅ Advisory only (already established); formalization improves it.

**Risk to Watch:**
- "Deterministic fix templates" must be human-curated, not AI-generated
- Categorisation logic must be tight; wrong classification = dangerous patch

**Mitigations:**
- Keep fix templates as static, reviewed markdown/files
- AI's only job: match failure signature to template ID, output that template with placeholders
- No code generation from thin air

**Result:** Safer than generic AI suggestions; more controlled.

---

### 9. 🚦 Deployment Gate

**Safe?** ✅ Yes — final policy evaluation before deployment.

**Risk to Watch:**
- Spurious gate failure = can't deploy; need break-glass procedure

**Mitigations:**
- Manual override (with approval) for emergency deploys
- Ensure gate conditions tested independently

**Result:** Formal "release brain" — fully deterministic.

---

### 10. 🧱 Minimal "Operating System Definition"

**Safe?** ✅ Yes — documentary organization only. No code execution.

**Result:** Cognitive clarity improvement, no safety impact.

---

## 🔥 Addressing the Structural Risk: Rule Duplication Drift

The #1 danger: **rules defined in multiple places can silently contradict**. You might think a check is in place but it's only in ESLint, and OPA misses it.

### Safe Fix: Single Source of Truth + Code Generation

Define all policies in one typed source, e.g., `tools/policy-definitions.ts` exporting structured data:

- forbidden dependencies
- required checks
- CI permissions
- intent constraints

Compile this source into:
- ESLint config (module boundary rules)
- OPA Rego policies
- CI pipeline conditional checks
- `dependency.rules.json` (for documentation / custom validator)

**Validation:** Add CI step that regenerates everything and fails if output differs from committed files (treat generated files as build artifacts).

Nothing can drift without a PR, and the PR shows exactly what changed across all enforcement layers. 100% safe because it's just deterministic transformation.

---

## ✅ Phased Safe Rollout Order (without breaking anything)

1. **Observability & Graph Versioning (upgrades 3, 6)** — passive, zero risk, immediate value
2. **SBOM & Provenance (upgrade 2)** — passive artifacts; set up signing with CI OIDC
3. **Policy-as-Code with SSoT compiler (upgrade 1 + structural risk fix)** — unifies ESLint and OPA. Start OPA advisory, then enforce
4. **Execution Sandbox (upgrade 5)** — standard CI hardening; test incrementally
5. **Intent Drift Detection (upgrade 7)** — non-blocking at first
6. **Deployment Gate (upgrade 9)** — gated by policy engine, SBOM, etc.
7. **Self-Healing Loop Formalization (upgrade 8)** — template-based, still advisory
8. **Runtime Dependency Firewall (upgrade 4)** — last because most invasive; start with warnings
9. **OS Definition (upgrade 10)** — just reorganize docs

**Core Promise:** No agent decides anything. The system only gains more security, transparency, and verifiability.

---

## Implementation Status in Arch-Mk2

| Upgrade | Status | Notes |
|---------|--------|-------|
| 1. OPA Policy-as-Code | ❌ Not started | Requires SSoT compiler setup |
| 2. SBOM + Cosign | ❌ Not started | Needs OIDC signing key |
| 3. Observability Telemetry | ⚠️ Partial | OpenTelemetry configured (Sentry); not for CI |
| 4. Runtime Dependency Firewall | ❌ Not started | Last priority |
| 5. Execution Sandbox | ⚠️ Partial | CI runs in GitHub Actions; not fully sandboxed |
| 6. Graph Versioning | ❌ Not started | No graph snapshots in `.nx/graphs/` |
| 7. Intent Drift Detection | ❌ Not started | No `intent-map.json` yet |
| 8. Self-Healing Loop | ⚠️ Partial | Hooks give suggestions; not formal templates |
| 9. Deployment Gate | ✅ Present | `pnpm quality` + branch protection |
| 10. OS Definition | ⚠️ Partial | `CLAUDE.md`, `AGENTS.md` exist; not consolidated |

**Next Implementation (Quick Wins):**
- Upgrade 6: Graph Versioning (commit `nx show project-graph` snapshots)
- Upgrade 3: Add CI telemetry JSONL to `.nx/telemetry/`
- Upgrade 7: Create `intent-map.json` + non-blocking validator
- Upgrade 2: Generate SBOM in CI build (no signing yet)

---

## Related

- **MONOREPO_STATUS.md** — current phase completion
- **MONOREPO_ARCHITECTURE_CHECKLIST.md** — 9-phase blueprint
- **SECURITY_RULES.md** — safety guardrails
- **CLAUDE.md** — tech stack and commands
