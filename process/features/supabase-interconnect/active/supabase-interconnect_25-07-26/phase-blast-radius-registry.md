---
name: plan:supabase-interconnect-blast-radius-registry
description: "Supabase Interconnect — cross-phase blast-radius registry (append-only)"
date: 25-07-26
feature: supabase-interconnect
---

# Supabase Interconnect — Phase Blast-Radius Registry

Append-only. Each phase's owning agent/plan appends its claimed files/paths here so parallel
phases (especially Phase 4 and Phase 5, declared parallel-safe) can be confirmed disjoint.

## Phase 1 — Grant/RLS repair

- `supabase/restore-authenticated-grants.sql`
- Read-only: browser-client files (`useClerkSupabaseClient` call sites) — count is self-deriving
  at execute time, not the stale hardcoded 41
- `supabase/views.sql` **[added PVL supplement cycle 1, 26-07-26]** — new `public.public_profiles`
  view + redefinition of `components_with_username` and `demo_hunt_leaderboard` to join it instead
  of `public.users` directly (fixes Gap 6/Gap 7: INNER JOIN to RLS own-row-only `users` was
  silently excluding cross-user rows). Overlaps Phase 6's claimed `supabase/*.sql` surface — no
  conflict: Phase 6 runs later and sequentially, after Phase 1's SQL is already applied, so there
  is no concurrent-write risk.
- `supabase/admin-functions.sql` **[added PVL supplement cycle 2, 26-07-26]** — grant-only addition:
  `GRANT EXECUTE` for the two existing `update_submission_as_admin`/`update_demo_info_as_admin`
  SECURITY DEFINER RPCs (no function body changes). Overlaps Phase 6's claimed `supabase/*.sql`
  surface for the same sequential-no-conflict reason as `views.sql` above.

## Phase 2 — Embedding DB functions

- `supabase/migrations/` (new directory or first entries — 4 embedding-function migrations)
- Read-only: `apps/web/scripts/generate-embeddings.ts`, `supabase/functions/generate-embeddings`,
  `supabase/functions/ai-search-oai`

## Phase 3 — Scheduler + seed

- `apps/web/scripts/run-embedding-backfill-cron.ts` (new)
- `ops/README-embedding-cron.md` (new)
- new idempotent seed SQL file (path TBD by execute-agent)

## Phase 4 — Navigation

- `apps/web/hooks/use-navigation.ts`
- `apps/web/lib/atoms.ts`
- `apps/web/lib/navigation.ts`
- `apps/web/components/features/main-page/sidebar-layout.tsx`
- `apps/web/app/templates/`
- `apps/web/lib/queries.ts` (sidebar-count reads only — coordinated with in-flight WIP)

## Phase 5 — Billing unification

- `apps/web/app/settings/billing/page.client.tsx`
- `apps/web/app/api/lemonsqueezy/webhook/route.ts`
- `apps/web/app/api/stripe/webhook/v2/route.ts`
- `apps/web/lib/lemonsqueezy.ts`
- `apps/web/lib/stripe.ts`
- possibly new `apps/web/app/api/lemonsqueezy/cancel/route.ts`,
  `apps/web/app/api/lemonsqueezy/invoices/route.ts`

## Phase 6 — Schema source of truth

- `apps/web/types/supabase.ts`
- `supabase/migrations/0000_baseline.sql` (or CLI-native structure)
- `supabase/*.sql` (existing loose files, folded in)
- `process/context/all-context.md`
- scoped tsc-fallout fix sites (cataloged during execution, not predetermined)

## Conflict Check

**No package conflicts identified.** Phase 4 and Phase 5 (the only two phases declared
parallel-safe) own fully disjoint file sets — see umbrella plan `## Pre-PVL Conflict Resolution`
for the authoritative statement. Phases 1, 2, 3, and 6 are sequential and touch disjoint surfaces
(Supabase SQL/migrations, cron scripts, and `types.ts`/`all-context.md` respectively) from each
other and from 4/5.
