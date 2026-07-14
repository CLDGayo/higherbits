---
name: plan:pricing-and-copy-limits-phase-03-copy-interceptor
description: "Pricing and Copy Limits — Phase 03: Copy Interceptor & Limit Enforcer"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization
  phase: phase-03
---

# Phase 03 — Copy Interceptor & Limit Enforcer

**Program:** pricing-and-copy-limits
**Umbrella plan:** process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-03-copy-interceptor_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Enforce the copy limits introduced in Phase 1 on the client side. When a user attempts to copy code, prompt, or component source, ping the telemetry API. If they are over limit, block the copy action and pop up an upgrade modal or directly redirect to the newly built `/pricing` page.

---

## Entry Gate

- Phase 1 and Phase 2 complete.

---

## Blast Radius

- `apps/web/components/preview/copy-button.tsx`
- `apps/web/components/preview/preview-tabs.tsx`
- `apps/web/components/preview/install-block.tsx`
- `apps/web/components/upgrade-modal.tsx`

---

## Implementation Checklist

### Step A — Modify `CopyButton` Component
- [ ] A1. Update `apps/web/components/preview/copy-button.tsx` to accept a `slug?: string` prop.
- [ ] A2. Inside `CopyButton`, before clipboard API, check if `slug` is provided. If present, `fetch('/api/metering/copy', { method: 'POST', body: JSON.stringify({ slug }) })`.
- [ ] A3. If 429 Too Many Requests, `setShowUpgradeModal(true)` and `return` early. Else proceed.
- [ ] A4. Render `UpgradeModal` directly within `CopyButton` when limit is hit.

### Step B — Wire Up Callers
- [ ] B1. Update `apps/web/components/preview/preview-tabs.tsx` to pass its `slug` prop down to `CopyButton`.
- [ ] B2. Update `apps/web/components/preview/install-block.tsx` to pass its `slug` prop down to `CopyButton`.

---

## Exit Gate

```bash
npm run test
npm run build
```

- Hitting the copy limit successfully prevents copying and shows upgrade CTA.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing toast/modal context to show the error globally.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH
- [x] 2. INNOVATE
- [x] 3. PLAN-SUPPLEMENT
- [x] 4. PVL
- [x] 5. EXECUTE
- [x] 6. EVL
- [x] 7. UPDATE PROCESS

**Validate-contract required before execute.**

---

## Touchpoints

- `apps/web/components/preview/copy-button.tsx`
- `apps/web/components/preview/preview-tabs.tsx`
- `apps/web/components/preview/install-block.tsx`
- `apps/web/components/upgrade-modal.tsx`

---

## Public Contracts

- Client behavior changes upon copy actions.

---

## Verification Evidence

```bash
npm run build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-03-copy-interceptor_PLAN_07-07-26.md`
- Last completed step: Step 7
- Validate-contract status: completed
- Next step: Spawn Phase 4

---

## Validate Contract

Status: CONDITIONAL
Date: 07-07-26
Gate: CONDITIONAL — 1 concern resolved: 0 plan fixes, 1 execute-agent instructions, 0 known-gaps accepted

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: small blast radius (4 files)
Agent count: 1 (1 executor)

### Plan updates applied
- [x] None

### Execute-agent instructions
- Step A3: Ensure CopyButton handles 401 Unauthorized (by prompting login or showing appropriate UI) in addition to 429 Too Many Requests (showing upgrade modal).

### Test gates (run after each section; regression suite after all sections)

**CopyButton UI and Telemetry**
- fully-automated: `npm run test` exits 0
  Proves: Component renders without crashing
- agent-probe: Run the dev server, try to copy a component while logged out (should prompt login), logged in under limit (should copy), and logged in over limit (should show UpgradeModal).
  Proves: End-to-end copy interception and upgrade prompt flow works.
- Known-gap: Load testing the telemetry API — resolution: accepted with rationale (not needed for this UI phase, handled in Phase 1 backend).

**Regression suite (after all sections complete)**
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- Load testing telemetry API — accepted (handled in backend phase)

### Accepted by
session — Execute-agent instructions added for 401 handling
