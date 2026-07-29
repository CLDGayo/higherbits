---
name: note:types-regen-blocked-on-cli-auth
description: "types.ts regeneration and the migrations baseline are blocked — the Supabase CLI is unauthenticated; a human must log in"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-06
---

# `types.ts` regeneration blocked on Supabase CLI authentication

**TL;DR:** Phase 06 fixed the *generator* (all four stale-project-ref sites repointed) but could not
run it. `apps/web/types/supabase.ts` is still the known-inaccurate file. A human needs to
authenticate the Supabase CLI once, then a follow-up agent can finish the job in minutes.

## What is blocked

- `apps/web/types/supabase.ts` regeneration (plan Steps B1-B5)
- `supabase/migrations/0000_baseline.sql` creation (plan Steps A1-A4b)
- The Agent-Probe live-catalog-diff gates `AC12-baseline` and `AC12-types`
- B2b's `// PENDING MIGRATION` merge-back (moot until a regeneration happens)

## Why

`corepack pnpm --filter web exec supabase gen types --project-id 'ewktoowpuemgbaaxxbdq' --schema public`
fails with:

```
Access token not provided. Supply an access token by running supabase login
or setting the SUPABASE_ACCESS_TOKEN environment variable.
```

The CLI binary itself is fine (workspace devDependency, `2.22.6`, `--version` exits 0). `pg_dump`,
`psql`, and `docker` are all genuinely absent from this environment, so there is no fallback path to
live introspection either. Credentials cannot be fabricated by an agent.

## What a human needs to do

One of:

1. `corepack pnpm --filter web supabase:login` (interactive browser flow), or
2. export `SUPABASE_ACCESS_TOKEN=<personal access token from https://supabase.com/dashboard/account/tokens>`

## What can then be done unattended

Once authenticated, the generator is already correctly pointed — no further repoint needed:

1. `corepack pnpm --filter web types` → regenerates `types.ts` against the live project.
2. Re-insert the four Phase-2 embedding-function declarations (`vec_dim`,
   `get_missing_usage_embedding_items`, `insert_embedding`, `insert_code_embedding`) tagged
   `// PENDING MIGRATION — not yet live, see supabase/migrations/0001_embedding_functions.sql`,
   because `0001_embedding_functions.sql` is authored but NOT applied live and a wholesale regen
   will delete them. Remove this patch once that migration is actually applied.
3. Assert the regenerated file against live counts (expected: 33 functions, 4 views, 41 tables
   including `rate_limits` and `_prisma_migrations`).
4. Author `supabase/migrations/0000_baseline.sql` from live introspection ONLY — Phase 1's grants,
   Phase 2's functions, and Phase 3's seed are authored-but-unapplied and must stay in separately
   numbered, commented migrations, never folded into the baseline.
5. Absorb any tsc fallout from removed phantom types.

## Related

- Phase report: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_REPORT_29-07-26.md`
- Plan: `.../phase-06-schema-truth_PLAN_25-07-26.md`
