---
name: plan:21st_replica-phase-01-foundation
description: "21st.dev 1:1 Replica — Phase 01: Foundation"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st_replica
  phase: phase-01
---

# Phase 01 — Foundation

**Program:** 21st_replica
**Umbrella plan:** process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/21st_replica/active/21st_replica_07-07-26/phase-01-foundation_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Implement the foundational design system and UI primitives matching 21st.dev exactly. This relies heavily on `vc-frontend-design` to achieve pixel perfection for typography, color palettes, spacing tokens, and base components (buttons, inputs, tooltips).

---

## Entry Gate

- Phase 00 complete (all checklist items done, validators green, Next.js builds)

---

## Blast Radius

- `tailwind.config.ts`
- `src/app/globals.css`
- `src/components/ui/*` (Radix primitives)
- `src/lib/utils.ts`

---

## Implementation Checklist

### Step A — Design Tokens

- [ ] A1. Append OKLCH design tokens to `globals.css` using a scoped class (e.g., `.theme-21st`) or prefixed variables. Do NOT remove or modify the existing `hsl` variables.
- [ ] A2. Update `tailwind.config.ts` to map the new `21st` prefix tokens (e.g., `colors: { '21st': { primary: '...' } }`) so they can be easily used by the new components.
- [ ] A3. Configure fonts in `layout.tsx` (Inter, Outfit, etc.).
- [ ] A4. Setup Tailwind variables for spacing and radii.

### Step B — UI Primitives

- [ ] B1. Create a new isolated namespace `packages/ui/src/21st/`. Build net-new `<Button>`, `<Input>`, `<Dialog>`, and `<DropdownMenu>` components within this namespace. Do NOT modify the existing Shadcn components.

### Step C — Helper Skills Integration

- [ ] C1. Run `vc-agent-browser` to take snapshots and visually compare primitives.
- [ ] C2. Use `vc-frontend-design` to refine CSS rules until parity is reached.

---

## Exit Gate

```bash
# Verify lint rules
npm run lint
# Expected: 0 errors
```

- all checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Missing font assets.
- Tailwind config not compiling.

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

- Base UI components created.

---

## Public Contracts

- none

---

## Verification Evidence

```bash
# Linting
npm run lint
# Expected: no errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/21st_replica/active/21st_replica_07-07-26/phase-01-foundation_PLAN_07-07-26.md`
- Last completed step: EVL (Step 6)
- Validate-contract status: written
- Next step: Spawn update-process-agent for UPDATE-PROCESS (Step 7)

---

## Validate Contract

Status: STANDING-GRANTED
Date: 07-07-26
Gate: PASS

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: S1 (Multi-package scope)
Agent count: 1

### Plan updates applied
- [x] None required.

### Execute-agent instructions
- Safely add `.theme-21st` and the new OKLCH tokens to `apps/web/app/globals.css` without touching `hsl` variables.
- Update `apps/web/tailwind.config.ts` with the new `21st` namespace mapping.
- Scaffold and build the new primitives (`Button`, `Input`, `Dialog`, `DropdownMenu`) cleanly under `packages/ui/src/21st/`.

### Test gates (run after each section; regression suite after all sections)

**Foundation Changes**
- fully-automated: `npm run lint` exits 0
  Proves: Syntax and standards are upheld
- fully-automated: `npx playwright test` exits 0
  Proves: Basic application flow and UI components behave correctly

**Regression suite (after all sections complete)**
- `npm run lint` exits 0
- `npx playwright test` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
session — Autonomous /goal execution
