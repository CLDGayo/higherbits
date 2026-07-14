---
phase: security-hardening
date: 2026-07-01
status: COMPLETE_WITH_GAPS
feature: monetization-catalog
plan: process/features/monetization-catalog/active/security-hardening_01-07-26/security-hardening_PLAN_01-07-26.md
---

# Security Hardening — EXECUTE Report

## What Was Done

All 11 checklist items implemented exactly per plan (F1/F4/F5/F6):

1. `apps/web/lib/rate-limit.ts` — added `checkSubmitRateLimit` (5 req / 3600s, prefix `ratelimit:submit`). `checkRateLimit` signature unchanged.
2. `apps/web/app/actions/submit-component.ts` — rate-limit enforced right after the `userId` auth guard, before any Octokit/clerkClient call; key `submit:${userId}`. No `next/headers` import (E3 confirmed).
3. `apps/web/app/api/webhooks/stripe/route.ts` — payment_status allow-list: payment→`paid` only; subscription→`paid`|`no_payment_required`; `undefined`/`unpaid` never grants (by construction, not special-cased).
4. `apps/web/app/api/checkout/route.ts` — key → `checkout:${userId}` (ip segment + `x-forwarded-for` read removed).
5. `apps/web/app/api/connect/route.ts` — key → `connect:${userId}`; static `clerkClient` import (E1); reuses `publicMetadata.stripeConnectAccountId` when present (skips `accounts.create`), else create-new path preserved.
6. `apps/web/app/api/connect/dashboard/route.ts` — key → `connect-dashboard:${userId}`.
7. `apps/web/app/api/connect/return/route.ts` — key → `connect-return:${userId}`.
8. `apps/web/__tests__/webhook.test.ts` — 2 existing fixtures + `payment_status:"paid"`; 3 new cases (payment+unpaid→no grant, subscription+no_payment_required→grant, subscription+unpaid→no grant).
9. `apps/web/__tests__/checkout.test.ts` — added key-arg assertion `checkRateLimit` called with `checkout:user_test`.
10. NEW `apps/web/__tests__/submit-component.test.ts` — 3 tests (rate-limit-exceeded blocks Octokit; under-limit PR flow + key assert; unauthorized). Octokit mocked via factory (E2).
11. NEW `apps/web/__tests__/connect.test.ts` — 3 tests (reuse existing / create-new / rate-limit 429).

Backlog note written: `process/features/monetization-catalog/backlog/connect-account-revalidation_NOTE_01-07-26.md` (F6 Stripe-side re-check residual, item 5).

## What Was Skipped or Deferred

- F6 Stripe-side account-validity re-check (`accounts.retrieve`) — explicit plan backlog, out of scope. Note written.

## Test Gate Outcomes

- **Node:** v22.22.2
- **Typecheck** `corepack pnpm --filter web exec tsc --noEmit`: all plan-touched files clean. 1 residual error remains: `__tests__/views.test.ts(4,10)` `rateLimitMap` — PRE-EXISTING (confirmed in stash baseline), file NOT in plan touchpoints. AC8 ("no NEW type errors") satisfied.
- **Vitest** `corepack pnpm --filter web test`: **54 passed / 6 failed (60 total, 15 files)**. All 6 failures are PRE-EXISTING (confirmed identical in the pre-change stash baseline) and in files NOT in the plan's touchpoints:
  - `registry.test.ts` ×4 — Next.js `unstable_cache`/`incrementalCache` invariant
  - `search.test.ts` ×1 — view-score re-rank assertion
  - `views.test.ts` ×1 — `rateLimitMap.clear()` undefined
- **Plan-scoped subset** (webhook, checkout, connect, both submit-component files): **28/28 passed.**
- **AC4 grep audit** `grep -n "x-forwarded-for"` across the 4 routes: **0 matches (PASS).**

## Plan Deviations

All within-blast-radius (apps/web test infra), surfaced BY planned changes, no hard-stop class:

1. `apps/web/vitest.config.ts` — added `@/` → `apps/web/` resolve alias. Required: item 2's `@/lib/rate-limit` import broke resolution in a pre-existing unmocked test. Matches tsconfig `@/*→./*`.
2. `apps/web/app/actions/__tests__/submit-component.test.ts` — added `vi.mock("@/lib/rate-limit")`. Required: item 2's rate-limit call made this pre-existing test hit real Upstash Redis (threw). Mock mirrors the plan's own convention.
3. `apps/web/__tests__/checkout.test.ts` — fixed 2 pre-existing mock-type errors (orgRole return type, mockReadRegistryEntry arg signature) to keep the plan-touched file typecheck-clean.

## Test Infra Gaps Found

- PRE-EXISTING vitest failures (registry ×4, search ×1, views ×1) unrelated to this plan — recommend a separate cleanup task. `views.test.ts` references a non-existent `rateLimitMap` export (dead test).
- `corepack pnpm --filter web exec tsc --noEmit` exits non-zero solely due to the pre-existing `views.test.ts` `rateLimitMap` error.
- NOTE: `apps/web/app/api/search/route.ts` has a pre-existing uncommitted working-tree edit (not mine, not in plan) — left untouched.

## Closeout Packet

- **Selected plan:** `process/features/monetization-catalog/active/security-hardening_01-07-26/security-hardening_PLAN_01-07-26.md`
- **Finished:** all 11 checklist items + backlog note; all 8 ACs' plan-scoped gates green.
- **Verified:** 28/28 plan-scoped tests, AC4 grep audit, plan-touched-file typecheck clean.
- **Unverified / residual:** 6 pre-existing test failures + 1 pre-existing typecheck error outside plan scope (not regressions).
- **Cleanup remaining:** context-doc refresh (all-tests.md test counts stale) during UPDATE PROCESS; separate task for the 6 pre-existing failures.
- **Best next state:** Keep in active/testing until orchestrator EVL re-run confirms; then Ready for UPDATE PROCESS archival.

## Forward Preview

### Test Infra Found
- vitest has no `@/` alias by default (now added). 15 test files exist (plan assumed ~2).
- 6 pre-existing failing tests + 1 pre-existing typecheck error are baseline noise, not gates for this plan.

### Blast Radius Changes
- Modified: rate-limit.ts, submit-component.ts, webhooks/stripe/route.ts, checkout/route.ts, connect/route.ts, connect/dashboard/route.ts, connect/return/route.ts, vitest.config.ts, webhook.test.ts, checkout.test.ts, app/actions/__tests__/submit-component.test.ts.
- Added: __tests__/submit-component.test.ts, __tests__/connect.test.ts, backlog note.

### Commands to Stay Green
- `export PATH="$HOME/.nvm/versions/node/v22.22.2/bin:$PATH"`
- `corepack pnpm --filter web test` (plan-scoped subset all green; 6 pre-existing failures)
- `corepack pnpm --filter web exec tsc --noEmit` (plan-touched files clean)

### Dependency Changes
- None. Reused `@upstash/ratelimit`, `@clerk/nextjs/server`, `stripe`, all pre-installed.
