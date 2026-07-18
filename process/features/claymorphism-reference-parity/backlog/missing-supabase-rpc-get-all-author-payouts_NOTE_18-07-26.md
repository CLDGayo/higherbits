---
name: note:missing-supabase-rpc-get-all-author-payouts
description: "Missing Supabase RPC public.get_all_author_payouts (PGRST202) stalls /public-dashboard light-desktop networkidle settle, blocking the 12th visual-evidence screenshot — foreign infra gap"
date: 18-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: claymorphism-reference-parity
  phase: phase-04
---

# Missing Supabase RPC `public.get_all_author_payouts` — cross-phase known-gap

## Problem

The Phase 4 EVL confirmation run (`phase-04-typography-qa-deploy-evl-iteration-001_REPORT_18-07-26.md`)
found `apps/web/e2e/visual-evidence.spec.ts` captures 11 of the expected 12 screenshots. The sole
miss is `phase5-dashboard-light-desktop.png` — Playwright's `waitForLoadState("networkidle")` times
out (60s) on `/public-dashboard` in light mode because the page's data-fetch calls a Supabase RPC,
`public.get_all_author_payouts`, that does not exist in the schema cache. PostgREST returns
`PGRST202` (function not found), and the client-side retry/error-boundary behavior keeps the
network tab busy long enough to blow the networkidle wait. Dark-mode dashboard captured fine
(`phase5-dashboard-dark-desktop.png` present) — the failure is specific to the light-mode run
timing, not a rendering defect.

## Root cause / provenance

Not caused by any `claymorphism-reference-parity` phase. This is a missing RPC function in the live
Supabase Postgres schema — the dashboard's author-payouts summary query expects
`public.get_all_author_payouts` to exist, but it was never created (or was dropped) server-side.
Phase 4 only extended `visual-evidence.spec.ts` with new routes/scenarios; it did not touch the
dashboard's data-fetching code (owned by earlier phases/programs, e.g. `support-us-rework` or the
original creator-studio payout work).

See memory note `higherbits-supabase-project.md` for the live DB host, applied-DDL inventory, and
the rollback-validate migration pattern to use when adding the missing function.

## Resolution path

- Add the missing `public.get_all_author_payouts` RPC via a Supabase migration or SQL editor change
  (matching whatever the dashboard's Supabase client call expects — check
  `apps/web/lib/supabase.ts` / `apps/web/app/public-dashboard/page.client.tsx` for the exact RPC
  name and parameter signature before writing the migration).
- After the RPC is live, re-run `corepack pnpm --filter web exec playwright test
  e2e/visual-evidence.spec.ts` to confirm the 12th screenshot (`phase5-dashboard-light-desktop.png`)
  captures successfully.
- Out of scope for `claymorphism-reference-parity` — this program does not own Supabase schema or
  backend data-fetching surfaces. Route to a general-plan or a dedicated backend/Supabase task.

## Status

Open — foreign infra gap, non-blocking for the claymorphism-reference-parity program (11/12
screenshots is sufficient Agent-Probe evidence per the Phase 4 validate-contract). Accepted as a
known-gap at Phase 4 EVL (18-07-26).
