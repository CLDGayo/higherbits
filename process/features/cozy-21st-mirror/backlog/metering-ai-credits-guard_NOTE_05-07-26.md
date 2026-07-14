---
name: report:metering-ai-credits-guard-note
description: "Backlog note — getAICredits/consumeAICredits share the unguarded-Redis crash risk, deferred pending dedicated review"
date: 05-07-26
metadata:
  node_type: memory
  type: report
  feature: cozy-21st-mirror
  phase: phase-01
---

# Backlog Note — metering.ts AI-Credits Guard

**Discovered during:** cozy-21st-mirror Phase 1 RESEARCH/INNOVATE (05-07-26)
**Status:** Deferred — out of Phase 1 scope

## Issue

`getAICredits` and `consumeAICredits` in `apps/web/lib/metering.ts` share the same unguarded-Redis
client dependency (`apps/web/lib/redis.ts`) as `hasHitDailyLimit`/`recordComponentView`. If Redis
env vars are absent or the client throws, these functions are also at risk of an uncaught
throw/rejection propagating up to their callers.

## Why deferred from Phase 1

Phase 1's fix pattern for `hasHitDailyLimit`/`recordComponentView` is fail-open (return `false`) /
fail-silent (no-op) — both are safe defaults because they gate soft usage-metering, not security or
billing correctness. `getAICredits`/`consumeAICredits` govern **credit/billing accounting**. A
blanket fail-open or fail-silent guard on a credit-consumption path could allow uncontrolled AI
usage bypass (fail-open) or silently drop credit debits (fail-silent) — neither is a safe default
without deliberate review. This is NOT on the current crash path (the catalog detail-page render
that caused the reported error boundary), so it is explicitly excluded from Phase 1's blast radius.

## Recommended follow-up

Dedicated review/phase to decide the correct failure semantics for `getAICredits`/
`consumeAICredits` under Redis unavailability (e.g. fail-closed with a clear user-facing error,
vs. a bounded local fallback) before applying any guard pattern to this surface.
