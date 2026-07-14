---
name: plan:port-components-phase-01-foundation
description: "Port Ingested Components — Phase 1: Foundation & Primitives"
date: 06-07-26
metadata:
  node_type: memory
  type: plan
  feature: port-ingested-components
  phase: phase-01
---

# Phase 1 — Foundation & Primitives

**Program:** port-components
**Umbrella plan:** process/features/port-ingested-components/active/port-components_06-07-26/port-components-umbrella_PLAN_06-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/port-ingested-components/active/port-components_06-07-26/phase-01-foundation_REPORT_06-07-26.md (flat in the program task folder)

---

## Purpose

Establish the necessary foundation in the `@repo/ui` package by installing core utility libraries (class-variance-authority, clsx, tailwind-merge) and basic Radix primitives. Port the simplest components (buttons and inputs) to verify the new `cn` utility and the updated `live-preview.tsx` wiring logic.

---

## Entry Gate

- Phase 0 complete (umbrella plan and all phase plans created)
- The Next.js dev server is running and the catalog successfully displays the 24 registry items.

---

## Blast Radius

- `packages/ui/package.json`
- `packages/ui/src/lib/utils.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/buttons/shadcn-button.tsx`
- `packages/ui/src/buttons/mantine-button.tsx`
- `packages/ui/src/inputs/shadcn-input.tsx`
- `packages/ui/src/inputs/shadcn-textarea.tsx`
- `packages/ui/src/inputs/mantine-input.tsx`
- `apps/web/components/preview/live-preview.tsx`

---

## Implementation Checklist

### Step A — Setup Dependencies & Utilities

- [x] A1. Install `clsx`, `tailwind-merge`, and `class-variance-authority` in `@repo/ui`.
- [x] A2. Create `packages/ui/src/lib/utils.ts` exporting the `cn` function (standard Shadcn setup).
- [x] A3. Install `@radix-ui/react-slot` and `lucide-react` in `@repo/ui`.

### Step B — Port Buttons

- [x] B1. Create `shadcn-button.tsx` (from `buttons__shadcn-button.md`) and adapt imports to use local `utils.ts`.
- [x] B2. Create `mantine-button.tsx` (re-implement from scratch using Tailwind/`cva` to mimic visual specs: rounded-2xl, soft diffused shadows, pastel palette; rather than direct AST port).
- [x] B3. Export these components from `packages/ui/src/index.ts`.
- [x] B4. Add them to `COZY_PREVIEWS` inside `apps/web/components/preview/live-preview.tsx`.

### Step C — Port Inputs

- [x] C1. Create `shadcn-input.tsx` and `shadcn-textarea.tsx` based on their respective markdown registries, and `mantine-input.tsx` (re-implement from scratch using Tailwind/`cva` to mimic visual specs: rounded-2xl, soft diffused shadows, pastel palette; rather than direct AST port).
- [x] C2. Export them from `packages/ui/src/index.ts`.
- [x] C3. Add them to `COZY_PREVIEWS` inside `apps/web/components/preview/live-preview.tsx`.

---

## Exit Gate

```bash
# Verify @repo/ui builds without errors
npm run type-check --workspace=@repo/ui

# Verify UI exports
npm run build --workspace=@repo/ui
```

- All checklist items checked
- The Next.js dev server does not crash and compiles the new `live-preview.tsx` map
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- `@repo/ui` build cannot resolve dependencies
- `live-preview.tsx` cannot lazily import the newly added components

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

- `packages/ui/package.json`
- `packages/ui/src/lib/utils.ts`
- `packages/ui/src/index.ts`
- `packages/ui/src/buttons/shadcn-button.tsx`
- `packages/ui/src/buttons/mantine-button.tsx`
- `packages/ui/src/inputs/shadcn-input.tsx`
- `packages/ui/src/inputs/shadcn-textarea.tsx`
- `packages/ui/src/inputs/mantine-input.tsx`
- `apps/web/components/preview/live-preview.tsx`

---

## Public Contracts

- None (internal implementations only)

---

## Verification Evidence

```bash
npm run type-check --workspace=@repo/ui
# Expected: clean exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/port-ingested-components/active/port-components_06-07-26/phase-01-foundation_PLAN_06-07-26.md`
- Last completed step: PVL (Step 4)
- Validate-contract status: written
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

Status: PASS
Date: 06-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: parallel-subagents
Signals: 2/7 — dominant: Phase program classification (3+ phases)
Agent count: 4 (1 orchestrator, 3 executors for sections A, B, C)

### Plan updates applied
- [x] None required. Plan is mechanically sound.

### Execute-agent instructions
- Step B/C: Verify `packages/ui/src/index.ts` exists before attempting to export components; create it if necessary.
- Step B/C: Verify `apps/web/components/preview/live-preview.tsx` update does not break existing `COZY_PREVIEWS` objects.

### Test gates (run after each section; regression suite after all sections)

**@repo/ui**
- Fully-automated: `npm run type-check --workspace=@repo/ui` exits 0
  Proves: TypeScript compilation succeeds for new components.
- Fully-automated: `npm run build --workspace=@repo/ui` exits 0
  Proves: UI library exports correctly.

**apps/web**
- Fully-automated: `npm run type-check --workspace=apps/web` exits 0
  Proves: Preview wiring does not break Next.js app types.

**Regression suite (after all sections complete)**
- `npm run type-check --workspace=@repo/ui` exits 0
- `npm run build --workspace=@repo/ui` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
vc-validate-agent (auto-accepted PASS gate)
