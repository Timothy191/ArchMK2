# Security & Safe Execution Rules

Rules to prevent injection, data exposure, and unsafe mutations.

## Code Injection Prevention

### Secrets & Credentials

- ❌ **Never commit secrets**, env keys, or API tokens into code
- ❌ Never generate fake credentials for testing; use `.env` files and mock environment
- ✅ All secrets handled via `SUPABASE_SERVICE_KEY`, `OPENAI_API_KEY`, etc. (injected at runtime)
- ✅ Use `secretlint` pre-commit hook; never `--no-verify` commits

### Unsafe String Operations

- ❌ Never use `eval()`, `Function()`, or dynamic `require()` from user input
- ❌ Never interpolate user input into shell commands directly
- ❌ Never build SQL queries by string concatenation; use parameterized queries or ORMs
- ✅ Use Kysely, Prisma, or parameterized SQL always
- ✅ Shell commands via bash tool only; escape properly with `shlex.quote()` in Python

### Database Safety

- ❌ Never run raw migrations without review; always `/plan` schema changes first
- ❌ Never edit `packages/supabase/supabase/migrations/` directly (deploy-time copy only)
- ❌ Never disable RLS on tables with sensitive data
- ✅ All new tables must have RLS enabled with explicit policies
- ✅ RLS policies reviewed by security-reviewer agent before merge
- ✅ Migrations in `packages/database/migrations/` with zero-padded names

### Role-Based Access Control (RBAC)

- ❌ Never trust client-side role/department claims; always verify via `employees` table
- ❌ Never assume user session is valid; call `getUser()` at Server Action entry
- ✅ RLS policies depend on `auth.uid()` and joined `employees.role`
- ✅ Department isolation enforced via `employees.department_id` and RLS

---

## Data Safety

### Production Data Handling

- ❌ Never run destructive operations (DROP, TRUNCATE, DELETE bulk) on production DB
- ❌ Never write real API keys or credentials into test data
- ✅ Use `supabase:reset` only on local dev DB
- ✅ Production operations require explicit human confirmation and runbook

### Data Exports / Imports

- ❌ Never export PII (personal data) without encryption and audit
- ❌ Never store exported data in version control or logs
- ✅ Export operations log to `wiki/logs/` with timestamp
- ✅ Audit trail maintained for compliance

---

## Code Quality Safeguards

### Type Safety

- ❌ Never use `any` without explicit reasoning (add comment `// unsafe:` if unavoidable)
- ✅ Strict TypeScript: `strict: true` enforced in `tsconfig.json`
- ✅ After DB migrations, always run `supabase:gen` to regenerate `database.types.ts`

### Testing Requirements

- ❌ Never merge untested code; all critical paths must have unit or E2E tests
- ✅ Run `pnpm test` before each commit
- ✅ Run `pnpm test:e2e` for portal UI changes
- ✅ Coverage thresholds: 40% lines, 30% branches, 35% functions

### Linting & Formatting

- ❌ Never bypass pre-commit hooks with `git commit --no-verify`
- ✅ ESLint (auto-fix), Prettier, secretlint enforced via lint-staged
- ✅ Run `pnpm quality` before declaring work done

---

## Permitted Actions & Boundaries

### What I Can Do

✅ Create/edit code in `apps/`, `packages/`, `e2e/`  
✅ Create migrations in `packages/database/migrations/`  
✅ Update `.env.example` (never `.env` itself)  
✅ Modify configs in `.claude/` (hooks, rules, settings)  
✅ Create/update documentation files  
✅ Run tests, linters, builds locally

### What Requires Approval

🛑 Database schema changes or migrations  
🛑 Auth / RLS policy changes  
🛑 Modifying git history (rebase, force-push)  
🛑 Commits that affect production deploy  
🛑 Dependencies with security vulnerabilities  
🛑 Creating new public API routes

### What I Cannot Do

❌ Delete critical files without recovery plan  
❌ Modify production environment variables  
❌ Access secrets that aren't injected at runtime  
❌ Write code that fails the quality gate  
❌ Merge unreviewed security-sensitive code

---

## Pre-Commit Safety Checklist

Before every commit:

- [ ] `pnpm quality` passes (all checks green)
- [ ] No secrets in staged files (secretlint passes)
- [ ] New DB tables have RLS enabled
- [ ] New API routes have auth validation at entry
- [ ] Types generated from schema (if migrations touched)
- [ ] Test coverage maintained (40%+ lines)
- [ ] Conventional commit message follows spec
- [ ] No `any` types without comment
- [ ] No hardcoded credentials, API keys, or env vars

---

## Incident Response

If a security issue is detected:

1. **Stop**: Halt all ongoing work
2. **Isolate**: Do not merge code containing the issue
3. **Diagnose**: Determine scope and severity
4. **Patch**: Apply minimal fix; re-test
5. **Audit**: Check for similar patterns elsewhere
6. **Document**: Log incident in `.claude/LEARNED.md`

---

## Related

- `.claude/rules/auth.md` — Auth flow and RLS patterns
- `SECURITY.md` — Project security policy
- `CLAUDE.md` — Tech stack and command reference
