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
- `supabase/migrations/0001_embedding_functions.sql` **[added inner-loop plan-supplement, 26-07-26]**
  — single-file migration per Step B0 (2 unique indexes → `vec_dim` → `get_missing_usage_embedding_items`
  → `insert_embedding` → `insert_code_embedding` → REVOKE/GRANT pairs)
- root `package.json` **[added inner-loop plan-supplement, 26-07-26]** — new devDependencies
  `@electric-sql/pglite` + `@electric-sql/pglite-pgvector` (ops-time-only local-verification
  tooling, never bundled into `apps/web`'s production build; same precedent as the root `sharp`
  devDependency)
- `pnpm-lock.yaml` **[added inner-loop plan-supplement, 26-07-26]** — consequence of the devDependency
  install above
- `ops/pglite-verify-embedding-functions.mjs` **[added inner-loop plan-supplement, 26-07-26]** —
  new local-verification harness script (runs the real `0001_embedding_functions.sql` through pglite)

## Phase 3 — Scheduler + seed

**[updated inner-loop plan-supplement, 26-07-26]** — claimed paths changed materially from the
original entry below; see retraction and revised claim list.

- ~~`apps/web/scripts/run-embedding-backfill-cron.ts` (new)~~ **RETRACTED, 26-07-26.** Step A0 was
  locked to "reuse the existing route, no new script" — this file is never created by this plan.
  Left struck through here (not deleted) to preserve the append-only audit trail of what was
  originally claimed vs. what actually ships.
- `apps/web/app/api/cron/gen-usage-embeddings/route.ts` — existing file, additive-only changes
  (`?dryRun=true` query param + `EMBEDDING_CRON_BATCH_CAP` env-driven cap). Read/write, not a new
  file.
- `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts` (new)
- `ops/README-embedding-cron.md` (new)
- `supabase/seed-embedding-verification.sql` (new — path now named explicitly, was "TBD by
  execute-agent" in the original entry)

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
- `apps/web/app/api/stripe/webhook/v1/route.ts` (added by outer-PVL 25-07-26 — second live
  Stripe-writing webhook path, confirmed on disk)
- `apps/web/lib/lemonsqueezy.ts`
- `apps/web/lib/stripe.ts` (mutual-exclusion guard call sites + lazy-getter conversion)
- new `apps/web/lib/billing-provider-guard.ts` (added by 29-07-26 inner-loop supplement — shared
  provider-ownership guard helper)
- new `apps/web/app/api/lemonsqueezy/cancel/route.ts`,
  `apps/web/app/api/lemonsqueezy/invoices/route.ts` (confirmed net-new, no route existed on disk
  as of 25-07-26 or 29-07-26)
- root `.env.example` (documentation of provider secret NAMES only, no values)
- `apps/web/app/api/subscription/stripe-cron/route.ts` (added by 29-07-26 inner-PVL — 4th
  `users_to_plans` writer)
- **[added at EXECUTE, 29-07-26 — see phase plan `## Deviations`]**
  `apps/web/app/settings/billing/page.tsx` (additive: select + expose
  `lemon_squeezy_subscription_id` so the client can derive the provider) and
  `apps/web/hooks/use-subscription.ts` (additive `stripe_subscription_id?` type field). Both
  checked against the Phase 4 claim list — no overlap.
- Not claimed / deferred: `apps/web/app/api/lemonsqueezy/invoices/route.ts` was NOT created
  (backlog: `lemonsqueezy-invoices-branch_NOTE_29-07-26.md`). `apps/web/lib/lemonsqueezy.ts` was
  read but NOT modified.

**status: DONE** (EXECUTE complete 29-07-26; both Exit Gate gates green on their delta criteria)

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
other and from 4/5. **[26-07-26 note]** Phase 3's revised claim list still touches only
`apps/web/app/api/cron/gen-usage-embeddings/*` and `ops/`/`supabase/` new files — no overlap with
Phase 4, 5, or 6's claimed surfaces.
