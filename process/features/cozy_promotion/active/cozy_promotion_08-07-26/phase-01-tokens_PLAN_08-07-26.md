---
name: plan:cozy_promotion-phase-01-tokens
description: "Cozy Promotion — Phase 01: Tokens"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy_promotion
  phase: phase-01
---

# Phase 01 — Tokens

**Program:** cozy_promotion
**Umbrella plan:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/cozy_promotion-umbrella_PLAN_08-07-26.md
**Phase status:** ✅ COMPLETE
**Report destination:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-01-tokens_REPORT_08-07-26.md (flat in the program task folder)

---

## Purpose

Rename the isolated `/21st` CSS tokens, Tailwind configuration, and UI package namespace to a global `cozy` namespace. This will prepare the foundation for the components to drop their 21st branding.

---

## Entry Gate

- Phase 0 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/app/globals.css`
- `apps/web/tailwind.config.ts`
- `packages/ui/src/21st/*` (moved to `cozy/*`)
- `packages/ui/package.json` (exports)
- `packages/ui/src/index.ts` (exports)

---

## Implementation Checklist

### Step A — Token Migration

- [x] A1. Rename `.theme-21st` to `.theme-cozy` in `globals.css`
- [x] A2. Refactor variables inside `.theme-cozy` (e.g., `--21st-background` to `--cozy-background`)

### Step B — Tailwind Migration

- [x] B1. Update `tailwind.config.ts` colors and borderRadius to use `cozy` instead of `21st`

### Step C — UI Package Namespace

- [x] C1. Rename `packages/ui/src/21st` to `packages/ui/src/cozy`
- [x] C2. Update `packages/ui/src/index.ts` to refactor the 21st exports to `cozy`. All export declarations pointing to `./21st/*` must be updated to point to `./cozy/*`. Safety Note: keep the named aliases as-is for now (e.g., `export { Dialog as TwentyFirstDialog } from './cozy/dialog';`).

---

## Exit Gate

```bash
# Lint exit 0 check
npm run lint
# Expected: 0 failures / 0 warnings

# Build exit 0 check
npm run build
# Expected: successful Next.js production build output
```

- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Missing UI package export configurations blocking the build.

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

- `apps/web/app/globals.css`
- `apps/web/tailwind.config.ts`
- `packages/ui/src/21st/*`
- `packages/ui/package.json`
- `packages/ui/src/index.ts`

---

## Public Contracts

- External behavior unchanged.

---

## Verification Evidence

```bash
# Build exit 0 check
npm run build
# Expected: Build completes without namespace errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-01-tokens_PLAN_08-07-26.md`
- Last completed step: UPDATE PROCESS (Step 7)
- Validate-contract status: PASS
- Next step: Advance to Phase 2

---

## Validate Contract

Status: PASS
Date: 08-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 2/7 — dominant: 5+ files in blast radius
Agent count: 1 (executor)

### Plan updates applied
- [x] None needed (plan is structurally sound)

### Execute-agent instructions
- Section C: Ensure `packages/ui/package.json` exports pointing directly to `./src/21st/...` paths are updated to `./src/cozy/...`.

### Test gates (run after each section; regression suite after all sections)

**Namespace Migration**
- fully-automated: `npm run lint` exits 0
  Proves: Imports and syntax remain correct.
- fully-automated: `npm run build` exits 0
  Proves: Next.js build succeeds, resolving new namespaces without errors.

**Regression suite (after all sections complete)**
- `npm run lint` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
session
