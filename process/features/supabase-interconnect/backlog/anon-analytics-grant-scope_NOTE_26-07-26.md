---
name: report:anon-analytics-grant-scope
description: "Backlog — decide the anon-role grant/RLS shape for component_analytics before wiring it live"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-01
---

# Backlog — `anon`-role `component_analytics` grant scope

**Raised by:** supabase-interconnect Phase 1 (Step B9, Decision 4). Explicitly OUT OF SCOPE for Phase 1.

## What

`apps/web/hooks/use-analytics.ts` (`useSupabaseAnalytics`) builds a **raw anon-key**
`createClient()` (line 1/23) — not `useClerkSupabaseClient` — and uses it to
`SELECT` (dedup check, `:90`) and `INSERT` (`:122`) `public.component_analytics`
rows under the Postgres `anon` role. Every other browser surface Phase 1 audited
runs as `authenticated`.

`anon` currently holds no grant on `component_analytics`, so both calls 42501 live today.

## Why it was excluded from Phase 1

1. `anon` requests carry no verifiable JWT claim. Any RLS policy scoping by
   `anon_id`/`user_id` is unenforceable — a client-supplied identifier is not a
   security boundary. A permissive `anon` write grant is a distinct security-design
   decision deserving its own scoped review, not a fold-in to an already-large
   grant-repair phase.
2. The hook `try/catch`-swallows all Supabase errors (`:107-109`, `:130-134`) and
   no-ops entirely in development (`:66-68`). Today's failure is silent with zero
   user-visible breakage — **known-degraded, not known-broken**.

## What is needed

A dedicated SPEC/plan deciding:
- whether anonymous view-tracking should write to Postgres at all, vs. a server route
  or an edge function that can rate-limit and attribute;
- if a direct `anon` grant is chosen: the exact grant (INSERT only? SELECT?), the RLS
  policy shape, and anti-abuse hardening (rate limiting, dedup that cannot be forged);
- whether `mv_component_analytics` (granted to `authenticated` by Phase 1 for the
  read path) needs any corresponding `anon` exposure.

## Related

- Phase 1 plan: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md` Step B9
- `supabase/restore-authenticated-grants.sql` — "PHASE 1 AUDIT — relations deliberately NOT granted"
