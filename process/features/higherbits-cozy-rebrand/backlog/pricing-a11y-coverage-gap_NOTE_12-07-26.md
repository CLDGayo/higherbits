---
name: plan:higherbits-cozy-rebrand-pricing-a11y-coverage-gap
description: "Backlog — /pricing route missing from Playwright a11y regression matrix"
date: 12-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: higherbits-cozy-rebrand
---

# /pricing route missing from a11y regression matrix — NEW PLAN REQUIRED

**Date:** 12-07-26
**Source:** Phase 04 (Surface Restyle) outer PVL, VALIDATE V2/V3 Layer 1 test-coverage dimension
**Gap:** `apps/web/e2e/a11y.spec.ts` covers `/`, `/magic`, `/magic-chat`, `/studio`,
`/api-access`, `/contest`, `/our-story`, `/templates` — `/pricing` is absent. Phase 04's Step E
(Pricing page cushion restyle) explicitly calls out pricing tier cards as "the highest-visibility
card surface on the page," yet this route has zero automated WCAG/axe coverage today, and the
program-wide `.texture-cushion` restyle work (Phase 4) will land on it without any accessibility
regression net.

**Why deferred (not fixed in Phase 4's plan):** Adding a route to the Playwright a11y matrix is
a test-infra change outside Phase 4's className/CSS-only blast radius and hour budget (2.0h).
Phase 4's own Step H already documents an accepted known-gap path for visual verification
(`vc-agent-browser` unavailability) — this note is a distinct, narrower gap specific to automated
a11y coverage, not the broader visual-probe gap.

**Files outside blast-radius:** `apps/web/e2e/a11y.spec.ts` (test infra file, not part of Phase
4's Blast Radius section).

**New API surface:** N/A — test-infra addition only, no new API surface.

**Suggested resolution:** Add `/pricing` to the `routes` array in `apps/web/e2e/a11y.spec.ts`
(one-line addition) as a follow-up task — either folded into Phase 5 (Long-tail QA, which already
does a "final grep gates + logo-matrix recheck" pass and could reasonably absorb one route
addition) or a standalone `general-plans` task if Phase 5's budget doesn't accommodate it.
