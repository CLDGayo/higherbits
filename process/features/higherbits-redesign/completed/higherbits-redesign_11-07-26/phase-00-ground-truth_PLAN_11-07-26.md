---
name: plan:higherbits-redesign-phase-00-ground-truth
description: "HigherBits.dev Visual Redesign & Rebrand — Phase 00: Ground Truth + Safety Net"
date: 11-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-redesign
  phase: phase-00
---

# Phase 00 — Ground Truth + Safety Net

**Program:** higherbits-redesign
**Umbrella plan:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-redesign-umbrella_PLAN_11-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-00-ground-truth_REPORT_11-07-26.md (flat in the program task folder)

---

## Purpose

Establish reliable footing before any visual/brand change lands: confirm `packages/ui` is truly
unconsumed by `apps/web` (so it stays correctly out of scope), refresh the stale
`process/context/all-context.md` (currently describes a nonexistent "Cozy Downloads" app — a
direct hazard for every later phase's context loading), add a minimal jsdom smoke-test backstop
since apps/web has essentially zero UI test coverage today, and formally flag the prior programs
(`higherbits-full-port`, `cozy-21st-mirror`) whose plans claim overlapping/phantom completion so
later phases don't get misled by stale "VERIFIED" status elsewhere.

---

## Entry Gate

- Program start — no prior phase.
- Umbrella plan approved / PLAN-mode session complete.

---

## Blast Radius

- `process/context/all-context.md` — refresh to describe the REAL app (21st.dev-clone
  component-marketplace), not the phantom "Cozy Downloads" content.
- `apps/web/package.json` — add jsdom and @testing-library/react as devDependencies.
- `apps/web/vitest.config.ts` — configure with jsdom environment.
- New test files under `apps/web/` (e.g. `apps/web/components/ui/__tests__/header-smoke.test.tsx`,
  `footer-smoke.test.tsx`, `apps/web/app/__tests__/landing-smoke.test.tsx` or equivalent paths
  matching existing test conventions — confirm exact convention during RESEARCH).
- Read-only: `process/features/higherbits-full-port/`, `process/features/cozy-21st-mirror/` (for
  conflict documentation only — never edit these files).
- Read-only: `apps/web/**/*.ts(x)` for the `@repo/ui` consumption grep check (no edits).

---

## Implementation Checklist

### Step A — Confirm packages/ui non-consumption

- [ ] A1. Run `grep -rl "@repo/ui" apps/web --include="*.ts" --include="*.tsx"` and
      `grep -rl "packages/ui" apps/web --include="*.ts" --include="*.tsx"`; confirm both return
      zero matches (already confirmed once during umbrella-plan RESEARCH — Phase 0 RE-confirms as
      the formal gate, since this is a hard program boundary).
- [ ] A2. If ANY match is found (drift since umbrella-plan write), STOP and escalate to the
      orchestrator — this changes the program's out-of-scope boundary and may require an umbrella
      plan supplement before continuing.

### Step B — Refresh process/context/all-context.md

- [ ] B1. Read the current `process/context/all-context.md` in full; confirm it describes "Cozy
      Downloads" (Qdrant vector search storefront) rather than the real app (21st.dev-clone
      component marketplace with Prisma/Postgres, Clerk auth, Stripe billing).
- [ ] B2. Invoke `vc-generate-context` (or run its underlying regeneration flow) to produce an
      accurate `all-context.md` reflecting: real route structure (`apps/web/app/` ~20 segments),
      real stack (Prisma/`packages/db`, Clerk, Stripe, next-themes, lucide-react, GeistSans/Mono
      pre-Phase-1), real test coverage state (1 file), and the higherbits-redesign feature entry.
- [ ] B3. Preserve durable knowledge from the old file that is STILL accurate if any exists (e.g.
      generic RIPER-5/harness routing sections) — do not blindly overwrite everything if parts are
      shared/generic harness content rather than app-specific content. Use judgment; document the
      decision in the phase report.

### Step C — Add jsdom smoke-test backstop

- [ ] C1. Install `jsdom` and `@testing-library/react` as devDependencies in `apps/web`.
- [ ] C2. Configure `apps/web/vitest.config.ts` with `environment: "jsdom"` (or add the per-file override directive if keeping node globally).
- [ ] C3. Identify the exact existing test convention: read `apps/web/lib/registry.test.ts` (the one existing test file).
- [ ] C4. Write a smoke test for `apps/web/components/ui/header.client.tsx` (or equivalent) that
      renders it and asserts no throw + key nav elements present.
- [ ] C5. Write a smoke test for the footer component that renders it and asserts no throw + key
      elements present.
- [ ] C6. Write a smoke test for the landing page (`apps/web/app/page.tsx` /
      `page.client.tsx`) — reuse the async-Server-Component await-then-render RTL pattern already
      established in the repo (per Context Ground Truth: `cozy-21st-mirror` Phase 3 established
      this pattern for a different app, but the RTL technique itself is reusable — confirm during
      RESEARCH whether that pattern applies to THIS app's landing page shape).
- [ ] C7. Run `corepack pnpm --filter web test` and confirm all new smoke tests + existing
      registry.test.ts all pass.

### Step D — Document prior-program conflicts

- [ ] D1. Write a `higherbits-full-port-conflict_NOTE_11-07-26.md` note (flat in this task folder)
      documenting: higherbits-full-port claims Phases 1-4 VERIFIED for this exact design-system
      scope but NONE of the claimed changes exist on disk (verify: `grep -n "radius" apps/web/app/globals.css`
      still shows 0.5rem; `grep -n "GeistSans" apps/web/app/layout.tsx` still shows Geist imports).
      State plainly: higherbits-redesign supersedes higherbits-full-port's design/brand scope;
      recommend (but do not perform) a `vc-audit-plans` pass on higherbits-full-port as a
      follow-up outside this program.
- [ ] D2. Write a `cozy-21st-mirror-conflict_NOTE_11-07-26.md` note documenting that
      cozy-21st-mirror targets a phantom "Cozy Downloads" catalog not present in this repo; mark
      superseded for visual-direction scope.
- [ ] D3. Do NOT edit any file under `process/features/higherbits-full-port/` or
      `process/features/cozy-21st-mirror/` — these notes are read-only observations filed in THIS
      program's task folder only.

---

## Exit Gate

```bash
# packages/ui non-consumption re-confirmed
grep -rl "@repo/ui" apps/web --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0

# Test suite green including new smoke tests
corepack pnpm --filter web test
# Expected: exit 0, test count > 1 (baseline was 1 file/registry.test.ts)

# Context refresh sanity check — no more "Cozy Downloads" references
grep -c "Cozy Downloads" process/context/all-context.md
# Expected: 0 (or explicitly documented exception if intentionally retained)
```

- All checklist items (A1-D3) checked.
- ≥3 new jsdom smoke tests added and passing.
- `process/context/all-context.md` refreshed to describe the real app.
- Two conflict notes written (higherbits-full-port, cozy-21st-mirror) — read-only, filed in this
  program's task folder.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- `@repo/ui` consumption IS found in apps/web (drift since umbrella-plan write) — this would
  require an umbrella-plan scope supplement before Phase 0 can close.
- `vc-generate-context` cannot run or produces output that conflicts with concurrent edits from
  another in-flight program touching `all-context.md`.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read (none — first phase); test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (mostly mechanical — likely low INNOVATE depth)
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `process/context/all-context.md` (refresh)
- New jsdom smoke test files under `apps/web/` (exact paths TBD during RESEARCH — see Step C)
- `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/higherbits-full-port-conflict_NOTE_11-07-26.md` (new)
- `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/cozy-21st-mirror-conflict_NOTE_11-07-26.md` (new)

---

## Public Contracts

- None — this phase is read-only against production code except for adding NEW test files
  (additive only, no existing behavior touched).

---

## Verification Evidence

```bash
corepack pnpm --filter web test
# Expected: exit 0, includes new smoke tests

grep -rl "@repo/ui" apps/web --include="*.ts" --include="*.tsx" | wc -l
# Expected: 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-redesign/completed/higherbits-redesign_11-07-26/phase-00-ground-truth_PLAN_11-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

Status: CONDITIONAL
Date: 11-07-26
date: 2026-07-11
generated-by: inner-pvl: phase-00

Parallel strategy: sequential
Rationale: 0 parallel signals. Dominant signal points to sequential execution for a simple testing and context setup phase.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| jsdom-smoke | Explicitly adds a baseline test backstop for main UI components (header, footer, landing). | Fully-Automated | `corepack pnpm --filter web test` | A |

Legacy line form (retained so existing validate-contract consumers still parse):
- jsdom-smoke: Fully-automated: `corepack pnpm --filter web test`

Dimension findings:
- Infra fit: PASS — Adding `jsdom` and `@testing-library/react` with Vitest config aligns correctly with the standard testing stack.
- Test coverage: PASS — Explicitly adds a baseline test backstop for main UI components (header, footer, landing).
- Breaking changes: PASS — Safe; additive testing and context updates only without touching production code behavior.
- Security surface: PASS — No new APIs or authentication routes exposed.
- Structural Validation: CONCERN — Missing Date metadata, Status metadata, overview/context section, Complexity metadata, Phase Completion Rules, and Acceptance Criteria. (Accepted as non-blocking for phase-level plans)

Open gaps: none

What this coverage does NOT prove:
- jsdom-smoke: Does not prove real browser rendering, styling correctness, or end-to-end interactions with external APIs (Stripe, Clerk).

Gate: CONDITIONAL
Accepted by: user (The structural validation FAILs are formatting/linter conventions for general plans, but this is a phase-level plan authored as part of a 6-phase program; its structure is correct for its context. I accept these as non-blocking concerns.)

---

## Inner Loop Refresh Note

**Date:** 11-07-26
**Summary:** PLAN-SUPPLEMENT: Added jsdom/RTL devDependencies and vitest config changes to resolve test infra blocker.
