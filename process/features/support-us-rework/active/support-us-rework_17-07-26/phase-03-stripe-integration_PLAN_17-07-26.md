---
name: plan:support-us-rework-phase-03-stripe-integration
description: "Support Us Rework — Phase 03: Stripe Integration"
date: 17-07-26
metadata:
  node_type: memory
  type: plan
  feature: support-us-rework
  phase: phase-03
---

# Phase 03 — Stripe Integration

**Program:** support-us-rework
**Umbrella plan:** process/features/support-us-rework/active/support-us-rework_17-07-26/support-us-rework-umbrella_PLAN_17-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/support-us-rework/active/support-us-rework_17-07-26/phase-03-stripe-integration_REPORT_17-07-26.md (flat in the program task folder)

---

## Purpose

Replace the existing "Get Pro" interface with a new "Support Us!" page/modal. This involves creating a UI with a price slider ($5 to $100) and custom input field, along with a backend endpoint that builds a custom recurring Stripe checkout session based on the chosen amount.

---

## Entry Gate

- Phase 02 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/components/ui/header.client.tsx`
- New UI files for the Support Us modal/page.
- New API route for Stripe custom pricing.

---

## Implementation Checklist

### Step A — Replace "Get Pro" Text

- [ ] A1. Search for "Get Pro" in header and relevant areas. Replace with "Support Us!".
- [ ] A2. Ensure the hrefs point to the new `/support` route (or trigger the Support modal).

### Step B — Build the "Support Us" UI

- [ ] B1. Create a `SupportUs` component (either a page or dialog).
- [ ] B2. Build a slider component bound to a state variable (range $5 - $100).
- [ ] B3. Add a numeric input for custom amounts (with validation $\ge$ $5).
- [ ] B4. Add clear copy indicating this is a monthly recurring support payment.

### Step C — Stripe API Integration

- [ ] C1. Create `apps/web/app/api/stripe/create-support-checkout/route.ts`.
- [ ] C2. Configure Stripe to create a recurring checkout session using `price_data`.
- [ ] C3. Ensure the checkout session binds to the authenticated user's Stripe customer ID (if exists) or handles new customers.
- [ ] C4. Connect the frontend UI submit button to the API route and handle redirect to Checkout.

---

## Exit Gate

```bash
# Typecheck
npx tsc --noEmit
# Expected: Exits 0
```

- All checklist items checked.
- Validators exit 0.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- If the application relies on Lemon Squeezy instead of Stripe, necessitating a pivot.
- Missing Stripe test API keys.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/components/ui/header.client.tsx`
- `apps/web/app/support/page.tsx`
- `apps/web/app/api/stripe/create-support-checkout/route.ts`

---

## Public Contracts

- `/api/stripe/create-support-checkout`

---

## Verification Evidence

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: Exits 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-03-stripe-integration_PLAN_17-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
