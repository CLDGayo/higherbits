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

### Step A — Access Logic Updates

- [ ] A1. Locate the logic gating "Pro" components.
- [ ] A2. Update the copy to reflect "Supporters only components".
- [ ] A3. Ensure the access check allows anyone with an active recurring subscription (regardless of amount) to access these components.

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
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
