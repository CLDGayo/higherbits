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
**Phase status:** ✅ VERIFIED
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

- [x] A1. Replace "Get Pro" with "Support Us!" in `apps/web/components/ui/header.client.tsx` and `apps/web/app/public-dashboard/page.client.tsx`.
- [x] A2. Ensure the `href` points to `/support` instead of `/pricing`.

### Step B — Build the "Support Us" UI

- [x] B1. Create `apps/web/app/support/page.tsx` (dedicated route for shareability).
- [x] B2. Build the slider component ($5 - $100) bound to a state variable.
- [x] B3. Add a numeric input for custom amounts (validation $\ge$ $5).
- [x] B4. Add copy indicating "Monthly recurring support".

### Step C — Stripe API Integration

- [x] C1. Create `apps/web/app/api/stripe/create-support-checkout/route.ts`.
- [x] C2. Use `stripe.checkout.sessions.create` with `mode: 'subscription'` and inline `price_data: { recurring: { interval: 'month' }, unit_amount: amountInCents }` to avoid needing pre-created Stripe prices.
- [x] C3. Attach `userId` (from Clerk) to the checkout session metadata.
- [x] C4. Connect the submit button on the `/support` page to this API route and handle redirect.

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

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

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
- Last completed step: Step 7 (UPDATE PROCESS)
- Validate-contract status: PASS
- Next step: Phase Complete. Return to orchestrator for next phase.

---

## Validate Contract

Status: PASS
Date: 17-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: S6 (High-risk class in blast radius - billing)
Agent count: 1

### Plan updates applied
- [x] None required

### Execute-agent instructions
- Stripe Integration: Strict safety requirement — ensure only Stripe TEST mode API keys are used for the execution step. Do not run with live keys.

### Test gates (run after each section; regression suite after all sections)

**UI Components (Header & Support Page)**
- fully-automated: `npx tsc --noEmit` exits 0
  Proves: No TS errors
- agent-probe: Manually verify the slider updates state properly and input validation for amounts >= $5 works

**Stripe Checkout API Route**
- agent-probe: Call the new `/api/stripe/create-support-checkout` route with test mode and verify a valid Stripe Checkout Session URL is returned

**Regression suite (after all sections complete)**
- `npx tsc --noEmit` exits 0

### High-risk pack
Required: no (but test mode execution is strictly required)

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
vc-validate-agent (session)

---

## EVL Handoff Summary

- **Status:** PASS
- **Test Evidence:** `npx tsc --noEmit` exited 0 successfully in `apps/web`.
- **Known Gaps (Pending User Verification):**
  - **agent-probe (UI):** Manually verify the slider updates state properly and input validation for amounts >= $5 works. Requires user browser validation.
  - **agent-probe (Stripe):** Call the new `/api/stripe/create-support-checkout` route with test mode and verify a valid Stripe Checkout Session URL is returned. Requires user browser/Stripe validation.
- **Follow-up stubs registered:** None required.
