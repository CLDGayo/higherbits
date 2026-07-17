---
name: plan:support-us-rework-phase-04-supporter-access
description: "Support Us Rework — Phase 04: Supporter Access"
date: 17-07-26
metadata:
  node_type: memory
  type: plan
  feature: support-us-rework
  phase: phase-04
---

# Phase 04 — Supporter Access

**Program:** support-us-rework
**Umbrella plan:** process/features/support-us-rework/active/support-us-rework_17-07-26/support-us-rework-umbrella_PLAN_17-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/support-us-rework/active/support-us-rework_17-07-26/phase-04-supporter-access_REPORT_17-07-26.md (flat in the program task folder)

---

## Purpose

Update the previous "Pro" component access logic so that it checks for any active subscription ("Supporter" status) rather than a specific fixed-price Pro tier.

---

## Entry Gate

- Phase 03 complete (all checklist items done, validators green)

---

## Blast Radius

- Authentication/Subscription hooks.
- Component card/view UI that locks "Pro" components.

---

## Implementation Checklist

### Step A — Backend Access Modification

- [x] A1. Edit `apps/web/lib/api/server/components.ts` (`hasUserComponentAccess`).
- [x] A2. Inject a Prisma query: `const userPlan = await prisma.users_to_plans.findUnique({ where: { user_id: userId } });`.
- [x] A3. Add early return: `if (userPlan?.status === "active") return true;`.

### Step B — Frontend Hook State Adjustment

- [x] B1. Edit `apps/web/hooks/use-component-access.ts`.
- [x] B2. If `hasPurchased` (returned from action) is `false`, set state to `"REQUIRES_SUBSCRIPTION"` instead of `"REQUIRES_BUNDLE"` to transition the primary gate representation.

### Step C — Paywall UI Update

- [x] C1. Edit `apps/web/components/features/component-page/pay-wall.tsx`.
- [x] C2. Update the `SubscriptionPaywall` component to redirect users to `/support` instead of `/pricing` or LS checkouts.
- [x] C3. Change the copy to indicate "Supporters-only component" and invite them to become a Supporter.
- [x] C4. Optional: include a small fallback link to `/?tab=bundles` for one-off purchasers.

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

- If the backend RPC heavily relies on specific `stripe_price_id` values instead of simple subscription status, requiring complex DB migrations.

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
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- TBD during RESEARCH phase.

---

## Public Contracts

- None

---

## Verification Evidence

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: Exits 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/support-us-rework/active/support-us-rework_17-07-26/phase-04-supporter-access_PLAN_17-07-26.md`
- Last completed step: Step 6 (EVL)
- Validate-contract status: complete
- Next step: Proceed to Step 7 (UPDATE PROCESS)

---

## Validate Contract

Status: PASS
Date: 17-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: S5 (User requested depth explicitly)
Agent count: 1 (1 executor, all sections in order)

### Plan updates applied
- [x] No structural plan updates required.

### Execute-agent instructions
- Section A: Confirm `apps/web/lib/api/server/components.ts` imports the correct `prisma` instance.
- Section B: Confirm `"REQUIRES_SUBSCRIPTION"` state exists in the hook definition.
- Section C: Verify `/support` routing logic inside `SubscriptionPaywall`.

### Test gates (run after each section; regression suite after all sections)

**Backend Access Modification**
- Fully-automated: `npx tsc --noEmit` exits 0
  Proves: Prisma query and component types are valid

**Frontend Hook State Adjustment**
- Fully-automated: `npx tsc --noEmit` exits 0
  Proves: Hook state types are valid

**Paywall UI Update**
- Fully-automated: `npx tsc --noEmit` exits 0
  Proves: UI component props are valid

**Regression suite (after all sections complete)**
- `npx tsc --noEmit` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
session — automated PASS

---

## EVL Handoff Summary

- **Status:** PASS
- **Gates Verified:** `npx tsc --noEmit` exited with code 0 successfully inside `apps/web`.
- **Gaps/Drift:** None identified.
- **Next Step:** Ready for Step 7 (UPDATE PROCESS).
