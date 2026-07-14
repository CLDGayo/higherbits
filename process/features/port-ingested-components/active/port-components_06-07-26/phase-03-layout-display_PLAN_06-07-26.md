---
name: plan:port-components-phase-03-layout-display
description: "Port Ingested Components — Phase 3: Layout & Display Components"
date: 06-07-26
metadata:
  node_type: memory
  type: plan
  feature: port-ingested-components
  phase: phase-03
---

# Phase 3 — Layout & Display Components

**Program:** port-components
**Umbrella plan:** process/features/port-ingested-components/active/port-components_06-07-26/port-components-umbrella_PLAN_06-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/port-ingested-components/active/port-components_06-07-26/phase-03-layout-display_REPORT_06-07-26.md (flat in the program task folder)

---

## Purpose

Complete the component ingestion port by implementing the remaining layout and data display components (Tables, Cards, Backgrounds, Pricing, Heroes). By the end of this phase, all 21 ingested community components will render successfully in the Live Preview.

---

## Entry Gate

- Phase 2 complete (Radix complex components ported)
- `@repo/ui` builds without errors.

---

## Blast Radius

- `packages/ui/src/index.ts`
- `packages/ui/src/tables/*`
- `packages/ui/src/cards/*`
- `packages/ui/src/heroes/*`
- `packages/ui/src/backgrounds/*`
- `packages/ui/src/pricing/*`
- `apps/web/components/preview/live-preview.tsx`

---

## Implementation Checklist

### Step A — Port Display Components

- [x] A1. Port `shadcn-table`, `mantine-table` (re-implement `mantine-table` from scratch natively in `@repo/ui` using standard HTML table elements and Tailwind `cva` to mimic its distinct prop API and visual specs, rather than importing `@mantine/core`).
- [x] A2. Port `shadcn-card`.
- [x] A3. Port Pricing components (`pricing-badge`, `pricing-label`, `pricing-toggle`).

### Step B — Port Layout & Hero Components

- [x] B1. Port Hero components (`hero-aspect-ratio`, `hero-separator`).
- [x] B2. Port Background components (`skeleton-background`, `scroll-area`).

### Step C — Wire the Final Map

- [x] C1. Export all new components from `@repo/ui/src/index.ts`.
- [x] C2. Wire all of them into `COZY_PREVIEWS` in `live-preview.tsx`.
- [x] C3. Test catalog frontend render for all 21 items.

---

## Exit Gate

```bash
npm run type-check --workspace=@repo/ui
npm run build --workspace=@repo/ui
```
- All checklist items checked
- Phase report written

---

## Blockers That Would Justify BLOCKED Status

- Remaining unresolved dependencies for the final components.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

---

## Touchpoints

- `packages/ui/src/index.ts`
- `packages/ui/src/*` (various component directories)
- `apps/web/components/preview/live-preview.tsx`

---

## Public Contracts
- None

---

## Verification Evidence

```bash
npm run type-check --workspace=@repo/ui
# Expected: clean exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/port-ingested-components/active/port-components_06-07-26/phase-03-layout-display_PLAN_06-07-26.md`
- Last completed step: PLAN-SUPPLEMENT
- Validate-contract status: pending
- Next step: Spawn vc-validate-agent for PVL (Step 4)

---

## Validate Contract

Status: PASS
Date: 07-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 2/7 — dominant: S7: 5+ files in blast radius
Agent count: 1 (1 executor)

### Plan updates applied
- [x] N/A — Plan is clean and mechanically feasible

### Execute-agent instructions
- [All sections]: Execute component ports sequentially. Do not break apps/web compilation.

### Test gates (run after each section; regression suite after all sections)

**@repo/ui**
- Fully-automated: `npm run type-check --workspace=@repo/ui` exits 0
  Proves: TypeScript types are correct.
- Fully-automated: `npm run build --workspace=@repo/ui` exits 0
  Proves: Package builds successfully.
- Known-gap: No unit tests required for ingested UI components — resolution: accepted with rationale (pure visual components covered by agent probe / visual review).

**Regression suite (after all sections complete)**
- `npm run type-check --workspace=@repo/ui` exits 0
- `npm run build --workspace=@repo/ui` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- No automated UI tests (accepted as pure display components).

### Accepted by
session — (autonomous acceptance per /goal rules)
