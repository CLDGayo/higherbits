---
name: plan:pricing-and-copy-limits-phase-02-pricing-page
description: "Pricing and Copy Limits — Phase 02: Pricing Page UI"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization
  phase: phase-02
---

# Phase 02 — Pricing Page UI

**Program:** pricing-and-copy-limits
**Umbrella plan:** process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-02-pricing-page_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Build a dedicated `/pricing` page mirroring the 21st.dev layout. This page must visually persuade users to upgrade, displaying "Builder" and "Team" plans alongside annual vs. monthly billing toggles.

---

## Entry Gate

- Phase 1 complete (Metering backend changes in place)

---

## Blast Radius

- `apps/web/app/pricing/page.tsx` (new)
- `apps/web/components/pricing/pricing-card.tsx` (new, orchestrating imported components)
- `@repo/ui` pricing components usage (importing `PricingToggle`, `PricingBadge`, and `PricingLabel` directly from `@repo/ui` instead of building them as new files in `apps/web/components/pricing/*`).

---

## Implementation Checklist

### Step A — Page Scaffolding

- [x] A1. Create `apps/web/app/pricing/page.tsx` with a centered layout.
- [x] A2. Add the main headline ("Keep the web free of AI slop" with strikethrough) and subtitle.
- [x] A3. Add social proof component ("2,144 people supporting us").

### Step B — Pricing Toggle & Cards

- [x] B1. Implement the Quarterly/Yearly toggle by importing `PricingToggle` from `@repo/ui`.
- [x] B2. Build the "Builder" pricing card featuring "Unlimited code & prompt copies", importing `PricingBadge` and `PricingLabel` from `@repo/ui`.
- [x] B3. Build the "Team" pricing card featuring multiple user licenses, utilizing imported components from `@repo/ui`.
- [x] B4. Ensure responsive stacking on mobile.

---

## Exit Gate

```bash
npm run test
npm run build
```

- Pricing page renders accurately at `/pricing` without hydration errors.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing or broken base UI components in `@repo/ui`.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.**

---

## Touchpoints

- `apps/web/app/pricing/page.tsx`
- `apps/web/components/pricing/pricing-card.tsx`

---

## Public Contracts

- New `/pricing` route available publicly.

---

## Verification Evidence

```bash
npm run build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-02-pricing-page_PLAN_07-07-26.md`
- Last completed step: UPDATE PROCESS (Step 7)
- Validate-contract status: PASS
- Next step: Complete phase and return to umbrella

---

## Validate Contract

Status: PASS
Date: 2026-07-07
date: 2026-07-07
generated-by: inner-pvl: phase-02

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: None
Agent count: 1

### Plan updates applied
- [x] No structural changes required.

### Execute-agent instructions
- Section A / B: Follow the implementation checklist. `PricingToggle`, `PricingBadge`, and `PricingLabel` are exported from `@repo/ui`.

### Test gates (run after each section; regression suite after all sections)

**apps/web/app/pricing**
- fully-automated: `npm run build` exits 0
  Proves: Next.js routing and build are successful
- agent-probe: Run the development server and verify the page visually matches the described layout.
  Proves: The UI matches requirements.

**Regression suite (after all sections complete)**
- `npm run test` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None.

### What This Coverage Does NOT Prove
- Does not prove the pricing toggle interacts properly with actual payment systems (Stripe checkout is out of scope).

### Known gaps on record
- Actual Stripe checkout integration and webhook processing (assumed existing or deferred to a separate billing feature).

### Accepted by
session (autonomous, /goal execution)

## Autonomous Goal Block

SESSION GOAL: Pricing and Copy Limits — Phase 02: Pricing Page UI
Charter + umbrella plan: process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md
Autonomy: phases execute autonomously; pause only on hard stops — see feedback_autonomous_phase_execution.md
Hard stop conditions / safety constraints:
- Do not mutate production Clerk tokens or existing Stripe webhooks blindly.
Next phase: EXECUTE: process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-02-pricing-page_PLAN_07-07-26.md
Validate contract: process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-02-pricing-page_PLAN_07-07-26.md (inline)
Execute start: Read this file. Read Phase 2 plan.
