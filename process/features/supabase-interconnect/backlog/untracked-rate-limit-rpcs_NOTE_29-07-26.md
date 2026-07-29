---
name: note:untracked-rate-limit-rpcs
description: "check_rate_limit and increment_api_usage are called live (one on the middleware hot path) but have no definition in any tracked supabase SQL file"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-06
---

# Two live-called RPCs have no tracked SQL definition

**TL;DR:** `check_rate_limit` and `increment_api_usage` are invoked by live application code but do
not appear in any file under `supabase/`. Either they exist only in the live database (untracked
drift), or they do not exist at all and the calls are silently failing.

## Evidence

Phase 06 Step C1 cross-referenced all 21 unique `.rpc()` call-site names in `apps/web` against every
`CREATE FUNCTION` in `supabase/migrations/*.sql` and `supabase/*.sql` (35 definitions total). Exactly
two call sites had no match:

| RPC | Called from |
|---|---|
| `check_rate_limit` | `apps/web/middleware.ts:33` (hot path — runs on requests), `apps/web/app/api/magic/use/route.ts:42` |
| `increment_api_usage` | `apps/web/app/api/magic/use/route.ts` |

Both appear in `apps/web/types/supabase.ts` (lines ~3041, ~3050) — but that file is the known-
inaccurate artifact this whole program exists to fix, so its presence there is not evidence of
anything.

## Why it was not resolved

Determining whether these functions exist in the live database requires introspection. The Supabase
CLI was unauthenticated during Phase 06 and no `psql` exists in the environment. See
`types-regen-blocked-on-cli-auth_NOTE_29-07-26.md`.

## Two possible states, both worth knowing

1. **They exist live but are untracked.** Then `supabase/` is not a complete source of truth and a
   future rebuild-from-migrations would silently drop rate limiting. Fix: capture their definitions
   into a tracked migration.
2. **They do not exist.** Then `supabase.rpc("check_rate_limit", ...)` in `middleware.ts` is
   erroring on every request. Note that call site does capture `error` — worth checking whether it
   fails open (allowing all traffic) or closed.

## Next step

After the Supabase CLI is authenticated, run introspection against `pg_proc` for both names. Then
either author the missing migration (state 1) or open a real bug (state 2).
