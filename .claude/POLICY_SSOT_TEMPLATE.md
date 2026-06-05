# Policy Single Source of Truth (SSoT) — Design Template

**Purpose:** Eliminate rule duplication drift between ESLint, OPA, CI, and documentation.

> This is a **design template** showing how Arch-Mk2 could implement the SSoT compiler from SAFETY_UPGRADE_GUIDE.md. Not yet implemented — this is the blueprint for Upgrade 1 (Policy-as-Code) + structural risk fix.

---

## The Problem

Rules are duplicated across:
- ESLint config (`@nx/enforce-module-boundaries` rules)
- OPA Rego policies (when added)
- CI conditional checks
- `dependency.rules.json` (when created)
- Documentation files (CLAUDE.md, .claude/rules/auth.md)

When rules diverge (drift), the system becomes unsafe: checks pass in ESLint but not in OPA, or documentation claims a check exists that doesn't.

## The Solution: SSoT + Code Generation

**Single typed source** → **multiple outputs** via deterministic compiler.

```
tools/policy-definitions.ts
    ↓ (compiler)
    ├─→ eslint.config.js (generated section)
    ├─→ tools/policy/opa/*.rego (generated)
    ├─→ .github/workflows/ci-conditional.yml (generated)
    └─→ tools/policy/dependency.rules.json (generated)
```

---

## Source File Template: `tools/policy-definitions.ts`

```typescript
// tools/policy-definitions.ts
// This is the SINGLE source of truth for all architectural policies.
// Changes here must regenerate all dependent configs.

export interface DependencyRule {
  sourceTag: string;          // e.g., 'scope:app'
  targetTag: string;          // e.g., 'scope:package' 
  allowed: boolean;           // true = allowed, false = forbidden
  onlyDependentsOf?: string[]; // only enforce for these source projects
  reason: string;             // human-readable explanation
}

export interface RequiredCheck {
  projectType: 'app' | 'package' | 'tool';
  targets: string[];          // e.g., ['build', 'test', 'lint', 'typecheck']
  blocking: boolean;          // if true, CI fails on missing
}

export interface IntentCapability {
  name: string;               // e.g., 'auth', 'db', 'ai-orchestration'
  allowedClients: string[];   // tags that can import this
  dbAccess: boolean;
  auditRequired: boolean;
}

export const DEPENDENCY_RULES: DependencyRule[] = [
  {
    sourceTag: 'scope:app',
    targetTag: 'scope:db-internal',
    allowed: false,
    reason: 'apps/* must not import packages/database directly; use packages/supabase abstractions',
  },
  {
    sourceTag: 'scope:app:portal',
    targetTag: 'scope:db-internal',
    allowed: true,
    reason: 'Portal is gateway; allowed to use supabase client (which wraps db)',
  },
  {
    sourceTag: 'scope:package:ui',
    targetTag: 'scope:package:db',
    allowed: false,
    reason: 'UI components must be pure; no data layer access',
  },
];

export const REQUIRED_CHECKS: RequiredCheck[] = [
  {
    projectType: 'app',
    targets: ['build', 'lint', 'typecheck', 'test'],
    blocking: true,
  },
  {
    projectType: 'package',
    targets: ['build', 'lint', 'typecheck'],
    blocking: true,
  },
  {
    projectType: 'tool',
    targets: ['lint', 'typecheck'],
    blocking: false,  // tools are scripts, not required to build
  },
];

export const INTENT_CAPABILITIES: IntentCapability[] = [
  {
    name: 'auth',
    allowedClients: ['scope:app', 'scope:package:api'],
    dbAccess: true,
    auditRequired: true,
  },
  {
    name: 'ai-orchestration',
    allowedClients: ['scope:app:portal'],
    dbAccess: true,
    auditRequired: true,
  },
  {
    name: 'ui-rendering',
    allowedClients: ['scope:app:portal', 'scope:app:cms'],
    dbAccess: false,
    auditRequired: false,
  },
];
```

---

## Compiler: `tools/policy-compiler.ts`

Generates outputs from SSoT:

```typescript
// tools/policy-compiler.ts
// Reads policy-definitions.ts and generates:
// - eslint.config.js
// - .github/workflows/ci-conditional.yml
// - tools/policy/dependency.rules.json
// - tools/policy/opa/policies.rego

import { DEPENDENCY_RULES, REQUIRED_CHECKS, INTENT_CAPABILITIES } from './policy-definitions';
import { writeFileSync, mkdirSync } from 'fs';

function generateESLint() {
  // Map DEPENDENCY_RULES to @nx/enforce-module-boundaries format
  const depConstraints = DEPENDENCY_RULES.map(r => ({
    sourceTag: r.sourceTag,
    onlyDependentsOf: r.onlyDependentsOf,
    bannedImport: !r.allowed,
    allowedTransitive: r.allowed,
    message: r.reason,
  }));
  
  return `// GENERATED FROM tools/policy-definitions.ts
// Do not edit manually. Run 'pnpm run policy:gen' to regenerate.

export default {
  // ... other config
  '@nx/enforce-module-boundaries': [
    'error',
    {
      enforceBuildableLibDependency: true,
      allowCircularSelfDependency: false,
      depConstraints: ${JSON.stringify(depConstraints, null, 2)},
    },
  ],
};
`;
}

function generateCI() {
  // Generate CI conditional checks for required checks per project type
  // ... (similar transformation)
}

function generateDependencyRules() {
  return JSON.stringify({ rules: DEPENDENCY_RULES, checks: REQUIRED_CHECKS }, null, 2);
}

function generateOPA() {
  // Generate Rego policies from the same SSoT
  // ... (similar transformation)
}

// Compile all
mkdirSync('tools/policy/output', { recursive: true });
writeFileSync('eslint.config.generated.js', generateESLint());
writeFileSync('.github/workflows/ci-conditional.generated.yml', generateCI());
writeFileSync('tools/policy/output/dependency.rules.json', generateDependencyRules());
writeFileSync('tools/policy/output/policies.rego', generateOPA());

console.log('✓ Policy files generated');
```

---

## CI Validation Step

```yaml
# In .github/workflows/ci.yml
- name: Validate policy SSoT consistency
  run: |
    pnpm run policy:gen
    if [[ -n "$(git diff --name-only)" ]]; then
      echo "ERROR: Policy SSoT drift detected. Run 'pnpm run policy:gen' locally and commit."
      git diff
      exit 1
    fi
```

This step ensures that if the generated files are stale (drift), CI fails. Anyone modifying the SSoT must regenerate and commit.

---

## Workflow

1. **Modify rules**: Edit only `tools/policy-definitions.ts`
2. **Regenerate**: Run `pnpm run policy:gen`
3. **Commit both**: SSoT + generated files
4. **CI validates**: If drift detected, fail PR

---

## Benefits

✅ **Single source**: One TypeScript file defines all policies  
✅ **Deterministic**: Code generation is pure transformation  
✅ **Auditable**: PR shows what rules changed across all enforcement layers  
✅ **Drift-proof**: CI catches when generated files are stale  
✅ **Type-safe**: TypeScript catches errors in policy definitions  
✅ **Machine-readable**: Easy to query policy state programmatically

---

## Implementation Steps (Future)

1. Create `tools/policy-definitions.ts` with sample rules
2. Create `tools/policy-compiler.ts` with basic transformations
3. Add `pnpm run policy:gen` script
4. Add CI validation step
5. Start with one rule type (e.g., dependency rules) and expand
6. Once stable, add OPA generation
7. Once OPA is tested, add self-healing template generation

---

## Related

- **SAFETY_UPGRADE_GUIDE.md** — full safety analysis
- **MONOREPO_STATUS.md** — current architecture completion
- **MONOREPO_ARCHITECTURE_CHECKLIST.md** — 9-phase blueprint
- **SECURITY_RULES.md** — current safety guardrails
