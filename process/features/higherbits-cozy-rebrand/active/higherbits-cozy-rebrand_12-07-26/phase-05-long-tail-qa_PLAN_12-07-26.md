---
name: plan:higherbits-cozy-rebrand-phase-05-long-tail-qa
description: "HigherBits Cozy Rebrand — Phase 05: Long-tail surfaces + final QA gates"
date: 12-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-cozy-rebrand
  phase: phase-05
---

# Phase 05 — Long-Tail QA

**Program:** higherbits-cozy-rebrand
**Umbrella plan:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/higherbits-cozy-rebrand-umbrella_PLAN_12-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-05-long-tail-qa_REPORT_12-07-26.md
**Hour budget:** 1.0h

---

## Purpose

Close out the program: apply a lighter restyle pass to remaining (lower-traffic) routes so the
whole site reads consistently, re-run the full logo-render matrix and brand-string sweep as final
proof of Definition of Done, confirm build/typecheck/test are green, and write (but do not
execute) a deploy checklist per the umbrella charter's "no autonomous deploy" hard constraint.

---

## Entry Gate

- Phase 04 exit gate passed: header/sidebar/footer/landing/pricing/component-card surfaces
  confirmed textured-cushion-styled in both themes.

---

## Blast Radius

- Remaining route segments from Phase 00's inventory not already covered by Phases 1/2/4: studio,
  publish, magic, settings, admin, contest, our-story, api-access, and any other remaining utility
  pages
- No new palette/token/logo-mechanic files — this phase only APPLIES existing Phase 3 tokens to
  the remaining surfaces and verifies previous phases' work

---

## Implementation Checklist

### Step A — Remaining route restyle pass

- [ ] A1. Apply the Phase 3 cushion tokens (radius, shadow, `.texture-cushion`, pastel accents) to
  remaining routes identified in Phase 00's inventory: studio, publish, magic, settings, admin,
  contest, our-story, api-access, and any others found.
- [ ] A2. Keep this pass lighter-touch than Phase 4 — these are lower-traffic surfaces; apply
  consistent token usage but do not chase pixel-perfect polish if budget is tight (this phase's
  1h budget is deliberately tighter than Phase 4's 2h).
- [ ] A3. Confirm settings/admin pages specifically do NOT touch any Clerk/Stripe-adjacent
  interaction logic — visual className changes only, per the charter's hard safety constraint. If
  billing-adjacent UI is too tightly coupled to styling classes to restyle safely, STOP that
  specific surface and route to backlog rather than risking behavior change.

### Step A0 -- Test coverage caveat (Phase 0 research finding, 12-07-26)

- [x] A0. Test coverage is thin at baseline: 4 test files / 10 tests total (per Phase 00's build
  baseline), covering only `/` plus header/footer smoke tests. This program's visual changes
  (Phases 3-5) carry regression risk with no automated visual-regression harness in this repo --
  same known-gap pattern as the prior higherbits-redesign program. Treat Step G's agent-probe
  checkpoint as the primary regression-detection mechanism for visual issues, not the vitest suite
  alone; document any suspected regression the agent-probe surfaces even if vitest stays green.

### Step B — Final logo-render matrix recheck

- [ ] B1. Re-run the full route inventory + logo-render check across ALL routes (not just the
  Phase 1 fix-list) to confirm no regression was introduced by Phases 2-4's edits.
- [ ] B2. Confirm mobile 375px + desktop widths both still show exactly one logo per route.

### Step C — Final brand-string sweep

- [ ] C1. Re-run the allow-list-aware sweep as the final program-exit proof:
  `grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public
  2>/dev/null | grep -v -e "@21st-dev/" -e "21st-vite" -e "21st-registry"` (refine the exclude
  pattern further if Phase 2's Step E0 confirmed the apps/backend CORS string must also remain).
- [ ] C2. Confirm zero matches (or the same documented allow-list exceptions carried from Phase 2,
  with no new occurrences introduced).

### Step D — Dark-mode audit

- [ ] D1. Sweep all restyled surfaces (Phases 4 + 5's Step A) in dark ("cozy dusk") mode for
  contrast/legibility issues, texture-overlay visibility, and token consistency.
- [ ] D2. Fix any dark-mode issues found within this phase's blast radius; document anything
  requiring deeper investigation as a known-gap.

### Step E — Final build/test gates

- [ ] E1. Run `corepack pnpm --filter web build`, `corepack pnpm --filter web exec tsc --noEmit`,
  `corepack pnpm --filter web test` — all must be green as the program-exit gate.
- [ ] E2. Diff the final test count/pass-rate against Phase 00's baseline to confirm zero
  regressions attributable to this program.

### Step F — Deploy checklist (document only — do NOT execute)

- [ ] F1. Write a deploy checklist referencing `process/context/all-context.md`'s existing
  gayo-vps deploy procedure (push to `origin main`, then `su - cozy` pull+build+pm2 restart) as a
  reminder of the exact steps — this phase does NOT run any of them.
- [ ] F2. Explicitly note in the phase report: "Deploy not executed — user-triggered only, per
  program charter hard constraint."

### Step G — Final agent-probe checkpoint (best-effort)

- [ ] G1. Attempt a final `vc-agent-browser` (or equivalent) full-site pass across the newly
  restyled long-tail routes, light + dark. Document known-gap if unavailable.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, zero regressions vs Phase 00 baseline

grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null | \
  grep -v -e "@21st-dev/" -e "21st-vite" -e "21st-registry" | wc -l
# Expected: 0 (allow-list-aware, matching Phase 02's Step A0 exceptions; unchanged from Phase 02)

grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"
# Expected: 0 matches — final proof of single-logo-per-route across the whole site
```

- All Step A-G checklist items checked.
- All remaining routes visually consistent with the cushion aesthetic (lighter-touch acceptable
  for long-tail surfaces).
- Final logo matrix: single logo per route across ALL routes, mobile + desktop.
- Final brand-string sweep: zero "21st" matches (program Definition of Done criterion #2 proven).
- Build+typecheck+test green with zero regressions.
- Deploy checklist documented, NOT executed.
- Phase report written to report destination above.
- This is the program's final phase — on exit gate pass, the umbrella's Program Net Gate can be
  set to PASS (or CONDITIONAL if any known-gaps are outstanding, e.g. agent-probe unavailable).

---

## Blockers That Would Justify BLOCKED Status

- A remaining route's restyle would require touching billing/settings interaction logic to apply
  the cushion className correctly — STOP that specific surface, document as backlog, do not block
  the whole phase on one route.
- Final brand-string sweep finds a NEW "21st" occurrence not present at Phase 02's exit (regression
  introduced by Phase 4 or this phase's own edits) — fix immediately within this phase's blast
  radius before declaring exit gate passed.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked. COMPLETE 12-07-26 -- thin test coverage + allow-list-aware grep gate noted (see supplement below).
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean"). COMPLETE 12-07-26 -- see Inner Loop Refresh Note below (Step A0 + Step C1 added).
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by). COMPLETE 12-07-26 -- Gate: CONDITIONAL (outer-pvl). [Re-run 12-07-26: prior session's contract write was interrupted mid-session (API session limit) and left only placeholder text despite this checkbox and the Resume section claiming completion -- this V1-V7 pass is the actual completed run; see ## Validate Contract below.]
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- Remaining route files under `apps/web/app/` (studio, publish, magic, settings, admin, contest,
  our-story, api-access, and any others per Phase 00's inventory)
- No new token/config files — consumes Phase 3's existing token system

---

## Public Contracts

- No behavior/logic/schema/auth/billing changes — visual className application only.
- No deploy action taken.

---

## Verification Evidence

```bash
corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null | wc -l
grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"
# Expected: build/typecheck/test green; 0 "21st" matches; 0 duplicate Logo renders
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-05-long-tail-qa_PLAN_12-07-26.md`
- Last completed step: PVL (Step 4) — outer PVL validate-contract written 12-07-26, Gate: CONDITIONAL
- Validate-contract status: written (12-07-26) — CONDITIONAL, 2 concerns accepted (see `## Validate Contract` below for the actual written contract; a prior session left a false "written" claim here pointing at placeholder text — corrected 12-07-26 by a fresh full V1-V7 re-run)
- Next step: Phase 05 EXECUTE (Step 5) is gated behind Phases 1-4 completing their own PVL/EXECUTE/EVL/UPDATE-PROCESS steps first (Join Conditions in umbrella plan — Phase 5 depends on Phase 4 exit gate). Do not spawn vc-execute-agent for Phase 5 until Phase 4's exit gate has passed. Before EXECUTE: re-run the Step C1 brand-string sweep and confirm the `apps/backend` CORS `21st.dev` allow-list decision from Phase 2 (see Open Gaps in the validate-contract) is folded into the exit-gate exclude pattern.

---

## Validate Contract

Status: CONDITIONAL
Date: 12-07-26
date: 2026-07-12
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: Score 1/7 (S4 phase-program membership only) — single self-contained QA-phase plan, no independent parallel workstreams, no container/infra/5+-package surface. Sequential/inline Layer1+Layer2 pass was sufficient.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| E1-build | Build succeeds after long-tail restyle edits | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| E1-tsc | No new TypeScript errors introduced | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` exits 0 | A |
| E1-vitest | Existing vitest suite green, zero regressions vs Phase 00 baseline (4 files/10 tests) | Fully-Automated | `corepack pnpm --filter web test` exits 0 | A |
| C1-brandsweep | Zero non-allow-listed "21st" string matches (program DoD #2) | Fully-Automated | `grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null \| grep -v -e "@21st-dev/" -e "21st-vite" -e "21st-registry" \| wc -l` → 0 | C |
| B1-logodedup | Zero duplicate `<Logo` renders outside chrome owner | Fully-Automated | `grep -rn "<Logo" apps/web/app --include="*.tsx" \| grep -v "header.client.tsx" \| wc -l` → 0 | A |
| D-a11y | Long-tail routes covered by the a11y matrix (`/magic`, `/studio`, `/api-access`, `/contest`, `/our-story`) pass Axe checks light+dark after restyle | Hybrid | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` — precondition: dev server startable, unauthenticated only | A |
| G1-visual | Cushion aesthetic applied consistently across all 8 long-tail route segments, light + dark | Agent-Probe | `vc-agent-browser` (or equivalent) full-site pass judged against umbrella charter's cushion-aesthetic description; document known-gap if unavailable | D |
| visual-regression | Pixel-level visual regression detection | Known-Gap (named residual) | — no automated visual-diff harness exists in this repo; explicitly out-of-scope per umbrella charter's deferred tier | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan (Phase 2 must resolve the `apps/backend` CORS `21st.dev` allow-list decision before this gate is provably green)
- D — backlog test-building stub (named residual; keep-active; continue)

Legacy line form:
- Build/typecheck/test: Fully-automated: `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test`
- Brand-string sweep: Fully-automated: `grep -ril "21st" apps/web/app apps/web/components apps/web/lib apps/backend apps/web/public 2>/dev/null | grep -v -e "@21st-dev/" -e "21st-vite" -e "21st-registry" | wc -l` (expect 0) — deferred pending Phase 2's CORS-string decision (see Open gaps)
- Logo dedup: Fully-automated: `grep -rn "<Logo" apps/web/app --include="*.tsx" | grep -v "header.client.tsx"` (expect 0 matches)
- Long-tail a11y: hybrid: `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` + precondition: dev server running
- Full-site visual judgment: agent-probe: `vc-agent-browser` full-site pass, light+dark, judged against charter's cushion-aesthetic bar
- Pixel-diff regression: known-gap: documented — no visual-regression harness in this repo (program-level deferred tier)

Failing stub (C1-brandsweep):
```
test("should confirm zero non-allow-listed 21st string matches across apps/web + apps/backend + public assets", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Zero non-allow-listed \"21st\" string matches")
})
```

Failing stub (B1-logodedup):
```
test("should confirm zero duplicate <Logo renders outside header.client.tsx across all routes", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Zero duplicate <Logo renders outside chrome owner")
})
```

Failing stub (E1-build):
```
test("should build apps/web cleanly after long-tail restyle edits", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Build succeeds after long-tail restyle edits")
})
```

Failing stub (E1-tsc):
```
test("should typecheck apps/web with zero errors after long-tail restyle edits", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: No new TypeScript errors introduced")
})
```

Failing stub (E1-vitest):
```
test("should pass the full apps/web vitest suite with zero regressions vs Phase 00 baseline", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub for: Existing vitest suite green, zero regressions vs Phase 00 baseline")
})
```

Dimension findings:
- Infra fit: PASS — commands verified against actual `apps/web/vitest.config.ts` and monorepo `pnpm --filter web` scoping; all 8 named route directories confirmed present on disk.
- Test coverage: CONCERN — baseline confirmed thin (4 test files / 10 tests: `apps/web/app/__tests__/landing-smoke.test.tsx`, `apps/web/components/ui/__tests__/footer-smoke.test.tsx`, `apps/web/components/ui/__tests__/header-smoke.test.tsx`, `apps/web/lib/registry.test.ts`) — matches the plan's own Step A0 caveat exactly; no route-level tests for any of the 8 long-tail surfaces; documented and accepted per program precedent (higherbits-redesign).
- Breaking changes: PASS — plan restricts to visual className-only edits; Step A3 has an explicit stop-and-backlog escape hatch for Clerk/Stripe-adjacent settings/admin coupling risk.
- Security surface: PASS — no auth/billing/secret/trust-boundary logic touched; the one plausible security-adjacent surface (settings/admin) is already guarded by Step A3's backlog-routing clause.
- Section A (route restyle pass): PASS — mechanically feasible; verified all 8 named route dirs exist (`studio`, `publish`, `magic`, `settings`, `admin`, `contest`, `our-story`, `api-access`).
- Section B (logo-render matrix recheck): PASS — exit-gate grep command verified runnable, currently returns 0 matches (confirms Phase 1's fix is holding).
- Section C (brand-string sweep): CONCERN — exit-gate grep command currently returns 23 non-allow-listed "21st" matches (expected: Phase 2, the brand-sweep phase, has not run yet — Phase 2 status is still PLANNED). Additionally found `apps/backend/src/routes/index.ts:17` has a CORS `staticAllowedOrigins` entry `"https://21st.dev"` NOT yet covered by the current exclude pattern — Phase 2's Step E0 must decide keep-vs-remove; if kept, Phase 5's Step C1 pattern needs a further exclude term.
- Section D (dark-mode audit): PASS — mechanically feasible, correctly scoped as best-effort agent-probe with backlog escape hatch.
- Section E (final build/test gates): PASS — commands verified against actual repo config; baseline test count independently confirmed.
- Section F (deploy checklist, document only): PASS — `all-context.md`'s gayo-vps deploy procedure text confirmed present and matches F1's reference; F2's "not executed" language matches the umbrella hard safety constraint.
- Section G (agent-probe checkpoint): PASS — correctly scoped best-effort with known-gap fallback, consistent with program precedent.

Open gaps:
1. `apps/backend/src/routes/index.ts:17` CORS `"https://21st.dev"` origin string is not yet reflected in Phase 5's Step C1 / exit-gate allow-list exclude pattern. Resolution owned by Phase 2 (brand sweep) — Phase 5 cannot resolve prospectively since Phase 2 has not run. Execute-agent instruction: before running the Step C1 exit-gate command, re-check whether this string still exists and whether Phase 2's report documents a keep-or-remove decision; if kept, add the appropriate exclude term to the grep pipeline before treating a non-zero result as a real regression.
2. Test coverage for the long-tail routes remains thin — `publish`, `settings`, `admin` are not in the current Playwright/Axe a11y matrix (`apps/web/e2e/a11y.spec.ts` covers `/`, `/magic`, `/magic-chat`, `/studio`, `/api-access`, `/contest`, `/our-story`, `/templates`). known-gap: documented as NEW PLAN REQUIRED — see backlog/pricing-a11y-coverage-gap_NOTE_12-07-26.md (related coverage-gap pattern; a dedicated follow-up note for publish/settings/admin a11y coverage may be created at program closeout if not resolved sooner).

What This Coverage Does NOT Prove (what this coverage does NOT prove):
- Build/typecheck/vitest gates: do not prove visual correctness, dark-mode contrast, or that the cushion aesthetic was actually applied — only that no existing behavior broke and no compile-time errors were introduced.
- Brand-string grep gate: proves source-level string absence only, not that every rendered surface is visually rebranded; also currently blind to the apps/backend CORS entry until the allow-list is finalized.
- Logo-dedup grep gate: proves source-level call-site count only, not actual rendered pixel output.
- Playwright/Axe a11y gate: unauthenticated only; covers 5 of 8 long-tail route segments (`magic`, `studio`, `api-access`, `contest`, `our-story`); does not cover `publish`, `settings`, `admin`; does not prove pixel-level cushion-aesthetic conformance, only accessibility-tree correctness.
- Agent-probe (Step G): best-effort, may be unavailable (known-gap fallback pre-authorized by charter); when it does run, it is a subjective judgment call, not a mechanical proof.
- Known-gap (visual regression): no automated pixel-diff exists anywhere in this repo; a subtle visual regression could ship undetected by any gate above except the agent-probe.

Gate: CONDITIONAL (concerns noted, accepted — see Accepted by)
Accepted by: session (autonomous outer-PVL re-run, 12-07-26) — accepted concerns: (1) apps/backend CORS `21st.dev` allow-list gap, deferred to Phase 2's resolution per gap-resolution "C"; (2) thin test coverage for long-tail routes (publish/settings/admin a11y gap + no visual-regression harness), accepted per program-level known-gap precedent established by the higherbits-redesign program and pre-authorized by this program's charter ("What verified means" section).


## Inner Loop Refresh Note

**Date:** 12-07-26
**Trigger:** Phase 0 RESEARCH (inner-loop Step 1) completed -- findings folded into this plan.
**Sections changed:** Implementation Checklist (new Step A0 test-coverage caveat, Step C1
allow-list-aware grep), Exit Gate (allow-list-aware grep command)
**Summary:** Test coverage confirmed thin (4 files/10 tests, only / + header/footer smoke) --
visual changes in this program carry regression risk with no automated visual-regression harness;
Step G's agent-probe checkpoint is the primary defense. Final brand-string grep gate updated to be
allow-list-aware (excludes @21st-dev/*, 21st-vite, 21st-registry functional identifiers per Phase
02's Step A0), matching Phase 02's exit-gate command exactly.
