---
name: note:preexisting-test-failures
description: "Backlog — 6 pre-existing vitest failures + 1 pre-existing tsc error, baseline-confirmed, unrelated to security-hardening plan"
date: 01-07-26
feature: monetization-catalog
---

# Backlog: Pre-existing test failures (tech debt cleanup)

> **VITEST FAILURES RESOLVED 04-07-26** (Phase 18 gate confirmation run, HEAD `90fb7ed`): all 6
> vitest failures no longer reproduce — `corepack pnpm --filter web test` = 80/80 pass across
> 19 files. Resolved as a side effect of the Phase 18 R2 migration + security-fix commits
> (07b7647, 4e0b4f3, 5c6e4f3, 0bfe97a, 90fb7ed); Phase 18 rewrote `registry.test.ts`,
> `search.test.ts`, and `views.test.ts`. New vitest baseline: 80 pass / 0 fail. The standalone
> tsc error below was NOT re-verified this run — note stays in backlog for that item only.

Discovered during the security-hardening plan's EVL confirmation run (01-07-26). Confirmed
identical in the pre-change stash baseline — NOT regressions introduced by that plan. Left
untouched because they are outside that plan's blast radius.

## Vitest failures (6 of 60 total, apps/web)

- `registry.test.ts` ×4 — Next.js `unstable_cache`/`incrementalCache` invariant violation
- `search.test.ts` ×1 — view-score re-rank assertion failing
- `views.test.ts` ×1 — `rateLimitMap.clear()` called on an undefined export

## Typecheck error

- `corepack pnpm --filter web exec tsc --noEmit` exits non-zero solely due to
  `apps/web/__tests__/views.test.ts(4,10)` referencing a non-existent `rateLimitMap` export.
  This appears to be a dead test referencing a removed/renamed export from
  `apps/web/lib/rate-limit.ts`.

## Recommended fix

1. Trace `rateLimitMap` in `views.test.ts` — likely needs updating to the current rate-limit
   module's actual exports (`checkRateLimit` / `checkSubmitRateLimit`), or the test needs
   removal if the behavior it covered no longer exists in that form.
2. Investigate the `unstable_cache` invariant in `registry.test.ts` — likely a Next.js
   test-environment mismatch (needs a mock or an `environment: "node"` adjustment specific to
   cached functions).
3. Review the `search.test.ts` re-rank assertion against the current fusion-ranking logic from
   Phase 13 (search ranking) — the assertion may simply be stale after that phase's changes.

## Priority

Low — these are 6/60 tests, isolated to non-security surfaces, and do not block any shipped
feature. Recommend picking up as a small standalone cleanup task when convenient.
