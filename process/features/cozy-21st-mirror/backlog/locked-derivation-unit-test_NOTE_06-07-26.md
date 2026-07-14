---
name: report:locked-derivation-unit-test-note
description: "Backlog — page.tsx line-92 locked boolean has no direct unit test"
date: 06-07-26
metadata:
  node_type: memory
  type: report
  feature: cozy-21st-mirror
  phase: phase-04
---

# Backlog Note — `locked` Derivation Has No Direct Unit Test

**Found during:** Phase 4 (Component UI) PLAN-SUPPLEMENT, 06-07-26.

**Gap:** `apps/web/app/(catalog)/[category]/[slug]/page.tsx` line 92 computes:

```ts
const locked = (entry?.isPro === true && !isProUser) || isOverLimit;
```

This boolean is the single point that decides whether a viewer sees the real component source or
the locked placeholder. It is covered only indirectly — via `stripDemoPaywall` unit tests
(`paywall-demo.test.ts`) and the theme install-snippet parity tests, which test the *downstream*
stripping functions, not this exact boolean expression or its three inputs (`entry?.isPro`,
`isProUser`, `isOverLimit`) in combination. There is no test file targeting `page.tsx` directly
(it is a server component with `auth()`, `headers()`, and DB reads, making direct unit testing
harder without a fuller server-component test harness).

**Status:** Pre-existing gap. This Phase 4 pass does NOT touch the `locked` derivation logic (it is
listed as a SACRED / do-not-touch line in the phase plan's Blast Radius section) — this note
records a residual, it is not a regression introduced by Phase 4.

**Suggested resolution (future hardening pass):** Extract the three-input boolean expression into a
small pure helper function (e.g. `isComponentLocked(isPro, isProUser, isOverLimit)`) that can be
unit-tested in isolation the same way `stripDemoPaywall` is tested today, then have `page.tsx` call
it. This would close the gap without needing a full server-component render harness.
