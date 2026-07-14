---
name: plan:cozy_promotion-phase-02-components
description: "Cozy Promotion — Phase 02: Components"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy_promotion
  phase: phase-02
---

# Phase 02 — Components

**Program:** cozy_promotion
**Umbrella plan:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/cozy_promotion-umbrella_PLAN_08-07-26.md
**Phase status:** ✅ COMPLETE
**Report destination:** process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-02-components_REPORT_08-07-26.md (flat in the program task folder)

---

## Purpose

Rename all components inside `apps/web/components/21st` to `apps/web/components/cozy`. Perform a massive text and copy rewrite across these components to strip literal "21st" / "21st.dev" mentions and replace with "Cozy Downloads". Update all tailwind classnames from `21st` to `cozy` (e.g. `bg-21st-background` to `bg-cozy-background`).

---

## Entry Gate

- Phase 1 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/components/21st/*` (moved to `cozy/*`)
- `apps/web/app/21st/*` (updated imports)

---

## Implementation Checklist

### Step A — Folder Renaming

- [ ] A1. Rename `apps/web/components/21st` to `apps/web/components/cozy`
- [ ] A2. Update all imports across `apps/web/app/21st` and `apps/web/components` to point to `@/components/cozy`, ensuring regex-based replacement targets relative import paths (e.g., `from '../components/21st/...'`) in addition to absolute aliases.

### Step B — Copy Rewrite

- [ ] B1. Run `vc-scout` to find all literal "21st" and "21st.dev" strings inside both `apps/web/components/cozy` AND `apps/web/app/21st/*`
- [ ] B2. Replace them contextually with "Cozy Downloads" or generic terms. Replacements of "21st.dev" -> "Cozy Downloads" and "21st" -> "Cozy" MUST explicitly exclude `href="/21st..."` or other path-like routing strings.
- [ ] B3. Replace mocked code snippet packages safely (e.g., `@21st/cli` to `@cozy/cli`).

### Step C — Classname Updates

- [ ] C1. Run a codebase replacement for `21st` tailwind classes (e.g., `text-21st-muted` -> `text-cozy-muted`) in all promoted components within both `apps/web/components/cozy` AND `apps/web/app/21st/*`

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

- Import conflict errors failing `npm run lint`.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")

**Inner Loop Refresh Note:** 
Scope expanded for Phase 2 based on INNOVATE decisions: 
- Added relative import replacement alongside absolute aliases in Step A2.
- Expanded scope of Step B & C text/classname replacements to include `apps/web/app/21st/*`.
- Added exclusion rules for routing strings (`href="/21st..."`) in Step B2.
- Added package name rewriting in snippets (e.g., `@21st/cli` -> `@cozy/cli`) in Step B3.
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

- `apps/web/components/21st/*`
- `apps/web/app/21st/*`

---

## Public Contracts

- External behavior unchanged.

---

## Verification Evidence

```bash
# Build exit 0 check
npm run build
# Expected: Build completes without import errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy_promotion/active/cozy_promotion_08-07-26/phase-02-components_PLAN_08-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

Status: PASS
Date: 08-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 2/7 — dominant: S7 (5+ files in blast radius)
Agent count: 1 (1 executor)

### Plan updates applied
- [x] N/A — no plan updates required

### Execute-agent instructions
- Step A: Verify the `apps/web/components/21st` folder exists before renaming. Ensure import replacements target files inside both `apps/web/components/cozy` and `apps/web/app/21st/`.
- Step B: When replacing strings, strictly enforce the exclusion of routing strings like `href="/21st..."` to avoid breaking Next.js app routes.

### Test gates (run after each section; regression suite after all sections)

**apps/web/components and apps/web/app**
- Fully-automated: `npm run lint` exits 0
  Proves: No import conflicts or basic syntax errors after rename and replacements.

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
vc-validate-agent (session) — no concerns
