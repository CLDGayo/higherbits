---
name: plan:higherbits-cozy-rebrand-phase-00-ground-truth
description: "HigherBits Cozy Rebrand — Phase 00: Ground truth + full-site audit"
date: 12-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-cozy-rebrand
  phase: phase-00
---

# Phase 00 — Ground Truth + Full-Site Audit

**Program:** higherbits-cozy-rebrand
**Umbrella plan:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-00-ground-truth_REPORT_12-07-26.md
**Hour budget:** 1.0h

---

## Purpose

Establish a factual, source-verified baseline before any fix or restyle work begins: a complete
route inventory, a per-route logo-render matrix (double / single / none), a complete "21st" brand
residue inventory across apps/web + apps/backend + public assets + metadata, a design-token ground
truth (current globals.css/tailwind.config.js state), a packages/ui consumption check, and a
build/typecheck/test baseline. This phase exists so Phases 1-5 have a verified starting point
instead of relying on stale `all-context.md` claims or the orchestrator's initial scout notes
(which are a starting hint, not verified ground truth).

---

## Entry Gate

- Program start — no upstream phase.
- Feature folder + task folder exist (already created by this PLAN session).

---

## Blast Radius

- No source files modified in this phase — read-only audit + one context-doc correction note.
- `process/context/all-context.md` — corrective note only (not the full apps/web section rewrite;
  that stays a follow-up per §Context Update Protocol, this phase just flags the drift).

---

## Implementation Checklist

### Step A — Route inventory

- [ ] A1. Enumerate every route segment under `apps/web/app/` (list all `page.tsx` files with
  their route paths) — this is the base list every subsequent audit step maps against.
- [ ] A2. Cross-reference against the orchestrator scout's named routes
  (`app/page.tsx`, `magic/console/page.tsx`, `s/[tag_slug]/page.tsx`, `contest/page.tsx`,
  `contest/leaderboard/page.tsx`, `c/[collection_slug]/page.tsx`, `q/[query]/page.tsx`,
  `pricing/page.tsx`) and confirm/correct the list.
- [ ] A3. Record the full route inventory in the phase report as a table: route path -> page file.

### Step B — Logo-render matrix

- [ ] B1. For each route in the Step A inventory, determine how many `<Logo` renders occur in its
  render tree: does the route's layout/page render `<Header />` (which itself renders `<Logo />`
  at `header.client.tsx:230`)? Does the page ALSO render its own `<Logo />` directly?
- [ ] B2. Classify each route as DOUBLE (header + page both render Logo), SINGLE (exactly one
  render), or NONE (confirm the `pricing` page case — `Header` renders but user screenshot shows
  no visible logo; determine if this is a CSS/z-index/conditional-render issue, not just a missing
  `<Logo />` call).
- [ ] B3. Record the full logo-render matrix in the phase report — this is the exact input Phase 1
  needs to know which files to touch.

### Step C — Brand-string ("21st") residue inventory

- [ ] C1. Run `grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend
  2>/dev/null` (plain grep, explicit dirs, never `rg`, never traverse `.next`/node_modules) and
  record the full file list with counts.
- [ ] C2. Extend the sweep to `apps/web/public/` (favicon, OG image, manifest.json, robots.txt,
  sitemap-related static assets) and `apps/web/package.json` / root `package.json` name/description
  fields, plus any `metadata`/OG tag exports in `apps/web/app/layout.tsx` or route-level `metadata`
  exports.
- [ ] C3. Specifically confirm `components/ui/brand-assets-menu.tsx`'s `Logo21SVG` usage (name,
  import path, what it renders) — Phase 2 needs the exact retirement plan.
- [ ] C4. Record the complete residue inventory (file, line count, category: source code / asset /
  metadata / config) in the phase report as the authoritative Phase 2 input list.

### Step D — Design-token ground truth

- [ ] D1. Read `apps/web/app/globals.css` in full; record current `:root` and `.dark` CSS variable
  blocks (palette, radius, shadow values) as the "before" baseline Phase 3 will diff against.
- [ ] D2. Read `apps/web/tailwind.config.js` in full; record how CSS variables are currently wired
  into Tailwind's theme (color tokens, radius scale, any existing shadow utilities).
- [ ] D3. Note current border-radius values in use (e.g. `--radius: 0.5rem` or similar) as the
  explicit "before" number for Phase 3's 20-28px cushion-radius target.

### Step E — packages/ui consumption check

- [x] E1. Run `grep -rl "@repo/ui\|packages/ui" apps/web/app apps/web/components apps/web/lib
  --include="*.ts" --include="*.tsx"` and record the result. RESULT: zero matches confirmed.
- [x] E2. If zero matches: confirm packages/ui is OUT OF SCOPE for this program (matches the
  higherbits-redesign program's prior finding) and record this explicitly in the phase report.
  RESULT: CONFIRMED -- hard-stop question resolved, packages/ui is out of scope for the entire program.
- [ ] E3. If any matches exist: STOP and flag as a hard-stop item for the orchestrator — a
  packages/ui edit would require charter-level scope expansion approval before Phase 1 proceeds.

### Step F — Build/test baseline

- [x] F1. Run `corepack pnpm --filter web build`; record exit code and any warnings. RESULT: exit 0, 90 routes built.
- [x] F2. Run `corepack pnpm --filter web exec tsc --noEmit`; record exit code. RESULT: exit 0.
- [x] F3. Run `corepack pnpm --filter web test`; record exit code, test count, and pass/fail
  breakdown as the "before" baseline every later phase's exit gate compares against. RESULT: exit 0,
  4 test files / 10 tests, all passing. Git tree dirty only with process/harness files -- no apps/web
  source drift found.

### Step G — Context correction note

- [ ] G1. Write a short note (in the phase report, not a full `all-context.md` rewrite) confirming
  apps/web is the full 21st.dev-derived port (not the stale "5 curated components" description),
  for the record. Do not rewrite `all-context.md` in this phase — that stays a separate,
  out-of-program follow-up per the umbrella charter's out-of-scope tier, UNLESS the phase decides
  a one-line correction is trivial and low-risk enough to land inline (execute-agent's call,
  document either way in the report).

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0 (baseline recorded even if non-zero — document actual result)

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0 (baseline recorded even if non-zero — document actual result)

corepack pnpm --filter web test
# Expected: exit 0 (baseline recorded even if non-zero — document actual result)

grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend 2>/dev/null | wc -l
# Expected: matches orchestrator scout's ~23 estimate; exact count recorded in report
```

- All Step A-G checklist items checked.
- Route inventory, logo-render matrix, and 21st-residue inventory are complete tables in the
  phase report — these are the load-bearing inputs Phases 1 and 2 read directly.
- packages/ui scope decision (in or out) recorded explicitly.
- Build/typecheck/test baseline numbers recorded (pass or fail — this phase does not need to fix
  anything, only establish ground truth).
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- packages/ui is confirmed CONSUMED by apps/web (Step E3) — this requires charter-level scope
  decision before the program can safely proceed; document and escalate, do not silently expand
  scope.
- Build fails at baseline in a way that blocks accurate route/logo auditing (e.g. app cannot even
  compile) — document the failure and note whether Phase 1 must fix it as a prerequisite.

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

- No source files modified (read-only audit phase).
- `process/context/all-context.md` — optional inline one-line correction (execute-agent's call,
  documented in report either way).

---

## Public Contracts

- None — this phase does not change any behavior or contract; it is audit-only.

---

## Verification Evidence

```bash
corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
# Expected: baseline results recorded in phase report regardless of pass/fail
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-00-ground-truth_PLAN_12-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)


## Inner Loop Refresh Note

**Date:** 12-07-26
**Trigger:** Phase 0 RESEARCH (inner-loop Step 1) completed -- findings folded into this plan.
**Sections changed:** Phase Loop Progress (Step 1 ticked), Step F (test baseline), Step E (packages/ui check)
**Summary:** Audit complete. Baseline gates all green (build exit 0/90 routes, tsc exit 0, vitest 4 files/10 tests pass). Git tree dirty only with process/harness files, no apps/web source drift. packages/ui has ZERO imports from apps/web -- confirmed out of scope for entire program, resolving the Phase 0 hard-stop question.
