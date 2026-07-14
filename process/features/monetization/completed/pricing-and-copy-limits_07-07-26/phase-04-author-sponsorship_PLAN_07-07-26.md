---
name: plan:pricing-and-copy-limits-phase-04-author-sponsorship
description: "Pricing and Copy Limits — Phase 04: Author Sponsorship Modal"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization
  phase: phase-04
---

# Phase 04 — Author Sponsorship Modal

**Program:** pricing-and-copy-limits
**Umbrella plan:** process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-04-author-sponsorship_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Implement a "Support" button on author profile components that opens a Sponsorship Modal. This modal introduces the author, requires a checkbox acknowledging that the platform doesn't process payments or issue refunds, and then links out to a third-party sponsorship page (like GitHub Sponsors).

---

## Entry Gate

- Phase 0 complete. (Can run concurrently with other phases, no strict backend dependency).

---

## Blast Radius

- `apps/web/components/sponsor-modal.tsx` (new)
- `apps/web/components/attribution-display.tsx` (or wherever author info is displayed)
- `scripts/validate-registry.mjs`
- `apps/web/lib/registry.ts`
- `packages/db/src/schema.ts`

---

## Implementation Checklist

### Step 0 — Schema Extension

- [x] 0.1 Update `scripts/validate-registry.mjs`, `apps/web/lib/registry.ts`, and `packages/db/src/schema.ts` to support the new optional frontmatter field `Github_Sponsors_Url`.

### Step A — Support Button & Trigger

- [x] A1. Convert `apps/web/components/attribution-display.tsx` to a client component (`"use client"`).
- [x] A2. Add `githubSponsorsUrl?: string` to props.
- [x] A3. Render the "Support" button that toggles the modal if `githubSponsorsUrl` is present.

### Step B — Modal UI & Acknowledgment

- [x] B1. Build `apps/web/components/sponsor-modal.tsx` as a new client component utilizing the raw DOM layout patterns from `upgrade-modal.tsx`.
- [x] B2. Add local state for a controlled checkbox: "I understand 21st.dev doesn't process payments or issue refunds — I'm being redirected to GitHub Sponsors".
- [x] B3. Add the "Support on GitHub Sponsors" primary CTA button.
- [x] B4. Ensure the CTA button is disabled and prevents navigation until the checkbox is checked.

---

## Exit Gate

```bash
npm run test
npm run build
```

- Clicking "Support" opens the modal.
- Checking the box enables the redirect link.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing author sponsorship URL fields in the registry schema.

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

- `apps/web/components/sponsor-modal.tsx`
- `apps/web/components/attribution-display.tsx`

---

## Public Contracts

- No external API changes. UI only.

---

## Verification Evidence

```bash
npm run build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-04-author-sponsorship_PLAN_07-07-26.md`
- Last completed step: Step 7
- Validate-contract status: PASS
- Next step: None (Phase 4 complete)

---

## Validate Contract

Status: PASS
Date: 07-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: S7 (<5 files in blast radius)
Agent count: 1 (1 executor)

### Plan updates applied
- [x] None required for Phase 4.

### Execute-agent instructions
- Step 0.1: Ensure Drizzle migration or db:push is executed if modifying packages/db/src/schema.ts before proceeding.
- Step A1: Verify that turning attribution-display.tsx into a client component does not break non-serializable props passed from its parent.
- Step B1: Follow existing DOM layout patterns from `upgrade-modal.tsx` to match the UI precisely.
- Step B4: Validate `Github_Sponsors_Url` format properly in registry to prevent XSS payloads (`javascript:alert(1)`).

### Test gates (run after each section; regression suite after all sections)

**Author Sponsorship Modal**
- Fully-automated: `npm run test` exits 0
  Proves: Existing suite is not broken by the new client component.
- Agent probe: Spawn vc-web-testing or manually click "Support", verify checkbox controls the button, and the link goes to the expected URL.
  Proves: UI functional and checkbox enforcement works.
- Known-gap: Backend unit testing of the modal itself since it is a client component.
  Resolution: Relies on Agent Probe or Playwright E2E.

**Regression suite (after all sections complete)**
- `npm run test` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None.

### Known gaps on record
- Playwright E2E coverage for the sponsor modal is missing (known gap in test suite).

### Accepted by
session — [Test coverage gap accepted]
