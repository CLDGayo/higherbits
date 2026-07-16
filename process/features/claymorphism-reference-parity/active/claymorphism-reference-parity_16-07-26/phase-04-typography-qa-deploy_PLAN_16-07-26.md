---
name: plan:claymorphism-reference-parity-phase-04-typography-qa-deploy
description: "Claymorphism Reference Parity — Phase 04: font-cozy sweep, full QA, extended visual evidence, deploy request"
date: 16-07-26
metadata:
  node_type: memory
  type: plan
  feature: claymorphism-reference-parity
  phase: phase-04
---

# Phase 04 — Typography, QA & Deploy

**Program:** claymorphism-reference-parity
**Umbrella plan:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

`font-cozy` (Quicksand) is wired at the layout/tailwind-config level but has zero consuming usages
anywhere in `apps/web/app` or `apps/web/components` — the "cozy" brand identity is defined but
invisible. This final phase applies `font-cozy` to headings and primary stat numbers on the 4
touched surfaces (dashboard, sidebar, hero, header where relevant), extends the established
`e2e/visual-evidence.spec.ts` screenshot pattern to cover the new surfaces from Phases 1-3, runs
the full program-wide QA gate (build/tsc/vitest/a11y), confirms zero regression against the
baseline, and drafts (but does not execute) the gayo-vps deploy request per the existing
user-gated deploy protocol.

---

## Entry Gate

- Phase 01 exit gate passed (CSS foundation + assets)
- Phase 02 exit gate passed (chart fixes)
- Phase 03 exit gate passed (sidebar/tiles/mascot)

---

## Blast Radius

- `apps/web/app/globals.css` or component-level className edits (font-cozy application — read-only
  on Phase 1's CSS, additive className changes only)
- Touched surfaces from Phases 1-3: dashboard, sidebar, hero, header (className-only font-cozy sweep)
- `apps/web/e2e/visual-evidence.spec.ts` (extended with new screenshot scenarios)
- No new source files beyond test files and the deploy-request draft note

---

## Implementation Checklist

### Step A — font-cozy application sweep

- [ ] A1. Enumerate every heading and primary stat-number element on the 4 touched surfaces
      (dashboard tile numbers, sidebar section labels if applicable, hero heading, header brand
      text if in scope) — confirm the exact element list against the SPEC's Open Question on
      font-cozy sweep scope (PLAN-level decision, finalized here). **VALIDATE correction
      (16-07-26):** the umbrella/Phase 3 plan's referenced hero file path
      `apps/web/components/marketing/hero-section.tsx` does not exist on disk (confirmed via
      `find`, 16-07-26) — the real file is `apps/web/components/ui/hero-section.tsx`. If Phase 3's
      execution created the wrong path, resolve that conflict in Phase 3 first; Phase 4 must
      target the real file. The concrete header-component candidate (if brand text is judged
      in-scope) is `apps/web/components/ui/header.client.tsx` — confirmed present on disk.
- [ ] A2. Apply the `font-cozy` Tailwind class (or equivalent utility resolving to the Quicksand
      CSS variable) to each enumerated element. className-only change, no new components.
- [ ] A3. Visually confirm (spot-check) the rounded display font renders distinctly from body text
      on each touched surface.

### Step B — Extend visual evidence + full QA

- [ ] B1. Extend `apps/web/e2e/visual-evidence.spec.ts` with new screenshot scenarios covering:
      dashboard (5-tile grid + charts), sidebar (pill-nav + Go-Premium card), hero (mascot
      integration) — light + dark mode, matching the existing 8-screenshot pattern's naming
      convention. Extend, do not replace, the existing spec. **VALIDATE correction (16-07-26):**
      the spec's `OUTPUT_DIR` constant is hardcoded to
      `process/features/claymorphism-3d-redesign/active/claymorphism-3d-redesign_14-07-26` —
      confirmed that program has since been archived (now at
      `process/features/claymorphism-3d-redesign/completed/claymorphism-3d-redesign_14-07-26/`;
      its `active/` folder is empty on disk). Update `OUTPUT_DIR` to point at THIS program's task
      folder (`process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/`)
      before adding new screenshot scenarios, so both existing and new screenshots land in the
      correct, current task folder rather than silently recreating a stale archived path.
- [ ] B2. Run the full test/build/type gate suite; confirm zero regression vs the 29-test/11-file
      baseline (accounting for new tests added across Phases 1-3). **VALIDATE note (16-07-26):**
      baseline empirically re-confirmed during outer PVL — `corepack pnpm --filter web test`
      currently passes 29/29 tests across 11/11 files with zero failures.
- [ ] B3. Run `e2e/a11y.spec.ts`; confirm zero NEW violations vs the 5-known-gap baseline, and
      confirm every new pastel-on-pastel token pair introduced by Phases 1-3 passes AA (>=4.5:1) —
      cross-check against Phase 1's recorded AA values. **VALIDATE note (16-07-26):** the spec
      currently covers 9 routes (not 10 as stated in the umbrella/SPEC background text) × 2 themes
      = 18 test cases; this is a pre-existing documentation drift in the umbrella, not a Phase 4
      defect — no plan action required, noted for the record.
- [ ] B4. Run the reference-string grep gate: confirm zero matches for literal music-app copy
      ("Songs Played", "Top Artists", etc.) on all touched files (AC7).
- [ ] B5. Run the billing-surface grep/diff gate across the full program's blast radius: confirm
      zero new files under `app/api/checkout`, `app/api/webhooks`, or billing-related directories
      (AC10, program-wide confirmation).

### Step C — Draft deploy request (user-gated, do not execute)

- [ ] C1. Confirm the current live deploy path/user/pm2-name via `pm2 list` and `ls
      /home/*/htdocs/` on gayo-vps per the standing deploy-protocol re-verification note in
      `process/context/all-context.md` (deploy path has drifted once before without a harness
      update — do not assume the documented path is still current without this check).
      **VALIDATE correction (16-07-26):** this is a read-only recon step, not deploy execution —
      permitted without an additional user gate under the Program Goal Charter's hard-stop scoping
      (only *executing* the deploy is a hard stop). If the execute-agent's tool sandbox has no SSH
      credentials for gayo-vps, do NOT block phase completion on this — ask the user to run these
      two commands and report the result back, and proceed to draft C2 using the
      last-documented path, explicitly flagged as unverified in the deploy request presented at C3.
- [ ] C2. Draft the exact deploy command sequence (push to origin main; `su - higherbits` pull +
      heap-bounded build + `pm2 restart higherbits.dev`) as a REQUEST for explicit user
      authorization — do NOT run it. This is a hard-stop action per the program's Program Goal
      Charter and the repo-wide deploy protocol.
- [ ] C3. Present the deploy request alongside a summary of all program gates passing, so the user
      can authorize with full context.

---

## Exit Gate

```bash
corepack pnpm --filter web build
# Expected: exit 0

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: exit 0, no regression vs baseline

corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts
# Expected: exit 0, zero NEW violations vs the 5-known-gap baseline

corepack pnpm --filter web exec playwright test e2e/visual-evidence.spec.ts
# Expected: exit 0, new + existing screenshots captured

grep -rn "Songs Played\|Top Artists" apps/web/app apps/web/components 2>/dev/null | wc -l
# Expected: 0

git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks'
# Expected: empty output

node .claude/skills/vc-audit-vc/scripts/validate-agent-parity.mjs
node .claude/skills/vc-audit-vc/scripts/validate-skills.mjs
node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs
node .claude/skills/vc-audit-plans/scripts/validate-plan-inventory.mjs
# Expected: all exit 0
```

- All checklist items (A1-C3) checked
- `font-cozy` visibly applied on the 4 touched surfaces (test-verified)
- Visual-evidence spec extended with new screenshots for all touched surfaces
- All 10 SPEC acceptance criteria proven-by their named gate
- Deploy request drafted and presented to user for explicit authorization (not executed)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- A11y gate shows a NEW violation introduced by any of Phases 1-3's changes that cannot be fixed
  without touching an out-of-blast-radius shared token — hard stop per program safety constraints,
  route back to the offending phase for a fix cycle (not a Phase 4 scope expansion).
- The live gayo-vps deploy path/user/pm2-name has drifted again since the last documented
  re-verification — phase documents the new state in the deploy request and in a context-update
  follow-up note, but does not block Phase 4's own exit gate (deploy execution is separate from
  Phase 4's own QA/typography work).
- Reference-string grep gate finds a literal music-app copy leak on a touched file — must be fixed
  inline (small, in-blast-radius) before Phase 4 can close.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read (all 3 prior phases in full); test context loaded; plan drift checked; live deploy path re-verified
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written (exact font-cozy element list, visual-evidence scenario naming)
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by) — outer PVL complete 16-07-26, see `## Validate Contract` below
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated (program marked complete or carried-forward), commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

Note: Step 4 (this outer PVL pass) is complete. Steps 1-3 (RESEARCH / INNOVATE / PLAN-SUPPLEMENT)
still need to run for this phase's own inner loop before EXECUTE, per the umbrella's outer-vs-inner
PVL distinction — this contract validates plan feasibility ahead of that inner loop, not in place
of it. Execute-agent MUST NOT be spawned directly off this outer contract without Steps 1-3 having
run, UNLESS the orchestrator explicitly determines the plan requires no further research/innovate
work (e.g., the corrections applied above are sufficient and Phases 1-3 are already verified).

---

## Touchpoints

- Touched surfaces from Phases 1-3 (className-only font-cozy additions)
- `apps/web/e2e/visual-evidence.spec.ts` (extended)

---

## Public Contracts

- No new public API/schema/billing surface — this phase is QA, typography polish, and a deploy
  request draft only.

---

## Verification Evidence

```bash
corepack pnpm --filter web test && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web build
# Expected: all exit 0

corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts e2e/visual-evidence.spec.ts
# Expected: exit 0, zero new a11y violations
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/claymorphism-reference-parity/active/claymorphism-reference-parity_16-07-26/phase-04-typography-qa-deploy_PLAN_16-07-26.md`
- Last completed step: Outer PVL (V1-V7) complete, 16-07-26 — Gate: CONDITIONAL
- Validate-contract status: written (16-07-26), see `## Validate Contract` below
- Next step: Spawn vc-research-agent for RESEARCH (Step 1) — only after Phases 1-3 exit gates all pass. Phases 1-3 have not yet been executed as of this outer PVL pass (Program Status Table on the umbrella shows all phases ⏳ PLANNED) — Phase 4's own RESEARCH must re-confirm Phases 1-3 are actually complete before proceeding past Step 1.

---

## Validate Contract

Status: CONDITIONAL
Date: 16-07-26
date: 2026-07-16
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: 3/7 signals present (S4 phase-program classification, S6 deploy/runtime high-risk class touched via Step C, S7 ~5 files in blast radius). Score nominally suggests parallel-subagents, but Phase 4's own work is 3 tightly sequential steps (A→B→C, each depending on the prior completing) over a small file set with trivial className-level edits per file — sequential execution by a single vc-execute-agent fits better than fan-out overhead. Parallel subagents remain a valid alternative for Step A's 4 independent surface edits if wall-clock time matters more than coordination simplicity.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC5 | font-cozy applied to headings/stat-numbers on 4 touched surfaces | Fully-Automated | new RTL test asserting `font-cozy` class present on targeted heading/stat elements per surface (e.g. `apps/web/app/__tests__/font-cozy-sweep.test.tsx`) | B |
| AC1/AC4/AC6 (visual) | dashboard/sidebar/hero screenshots show correct pastel styling, no checkerboard artifact | Agent-Probe | extended `e2e/visual-evidence.spec.ts` screenshots (dashboard, sidebar, hero — light+dark) reviewed by agent/human | B |
| AC7 | zero literal music-app copy on touched files | Fully-Automated | `grep -rn "Songs Played\|Top Artists" apps/web/app apps/web/components \| wc -l` == 0 | A |
| AC8 | zero NEW a11y violations vs 5-known-gap baseline | Fully-Automated | `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts` | A |
| AC9 | build/tsc/test all exit 0, no regression vs 29-test/11-file baseline | Fully-Automated | `corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test` | A |
| AC10 | zero new billing surface; Go-Premium link is `/pricing` | Fully-Automated | `git diff --stat -- 'apps/web/app/api/checkout' 'apps/web/app/api/webhooks'` empty | A |
| Phase-4-local | visual-evidence.spec.ts `OUTPUT_DIR` points at the current program's task folder, not the stale archived `claymorphism-3d-redesign` path | Fully-Automated | `grep -c "claymorphism-3d-redesign" apps/web/e2e/visual-evidence.spec.ts` == 0 (after fix applied per B1 correction above) | B |
| Phase-4-local | live gayo-vps deploy path/user/pm2-name confirmed current before drafting the deploy request | Agent-Probe | `pm2 list` + `ls /home/*/htdocs/` output reviewed (executed by user if execute-agent lacks SSH credentials, per C1 correction above) | D |

gap-resolution legend:
- A — proven now (gate passes in this cycle; empirically re-confirmed during this VALIDATE pass for AC8/AC9's underlying baseline where cheap: vitest 29/29 across 11/11 files confirmed via live run)
- B — fixed in this plan (gate added by this plan's checklist, corrections applied at V6 above)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue — deploy-path recon may require user hand-off if execute-agent has no SSH credentials)

C-4 reconciliation: the `strategy:` column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). Known-Gap is NEVER a `strategy:` value — it is a named residual row carried via gap-resolution D, never a strategy that proves a behavior.

Legacy line form (retained so existing validate-contract consumers still parse):
- Typography sweep (AC5): Fully-automated: new RTL test asserting `font-cozy` class on 4-surface heading/stat elements
- Visual evidence (AC1/AC4/AC6): agent-probe: extended `e2e/visual-evidence.spec.ts` screenshot review after OUTPUT_DIR fix (see plan correction)
- Reference-copy leak (AC7): fully-automated: `grep -rn "Songs Played|Top Artists" apps/web/app apps/web/components`
- A11y (AC8): fully-automated: `corepack pnpm --filter web exec playwright test e2e/a11y.spec.ts`
- Build/tsc/test (AC9): fully-automated: `corepack pnpm --filter web build && tsc --noEmit && test`
- Billing surface (AC10): fully-automated: `git diff --stat -- apps/web/app/api/checkout apps/web/app/api/webhooks`
- Deploy path re-verification: agent-probe/known-gap: `pm2 list` + `ls /home/*/htdocs/` on gayo-vps — may require user hand-off if SSH creds unavailable to execute-agent sandbox

Dimension findings:
- Infra fit: CONCERN — two path discrepancies found and corrected in-plan: (1) umbrella/Phase-3-claimed hero file `apps/web/components/marketing/hero-section.tsx` does not exist; real file is `apps/web/components/ui/hero-section.tsx`. (2) `e2e/visual-evidence.spec.ts`'s `OUTPUT_DIR` points to the now-archived `claymorphism-3d-redesign/active/...` path (folder emptied, program moved to `completed/`). Both fixed via inline plan corrections above (Execute-agent instructions + checklist edits). `font-cozy` Tailwind utility confirmed real (`tailwind.config.js` `fontFamily.cozy` → `var(--font-cozy)`, defined via `next/font/google` Quicksand in `layout.tsx`), zero consuming usages found outside the definition site — matches Phase 4's stated premise exactly.
- Test coverage: PASS — existing test infra (vitest, Playwright a11y, Playwright visual-evidence) is real, present, and extendable; vitest baseline empirically re-run and confirmed at 29/29 tests across 11/11 files (matches plan/umbrella claim exactly). `e2e/a11y.spec.ts` exists and covers 9 routes × 2 themes = 18 cases (umbrella/SPEC background text says "10 routes" — minor pre-existing documentation drift, non-blocking, noted in-plan).
- Breaking changes: PASS — no schema/API/auth changes; all component prop signatures stated as unchanged; className-only edits confirmed as the only source-level change type in this phase's blast radius.
- Security surface: CONCERN — Step C1 requires an SSH connection to the live production VPS (gayo-vps) to run read-only recon (`pm2 list`, `ls`). This is explicitly NOT deploy execution (Step C2 correctly gates the actual deploy command as a draft-only, user-authorized action), but autonomous SSH access to a production host by an agent still warrants caution. Resolved via plan correction: execute-agent instructed to ask the user to run the two commands and report back if SSH credentials are unavailable in its sandbox, rather than blocking or improvising credential access.
- [Section A — font-cozy sweep] feasibility: CONCERN — mechanically blocked pending correct file-path confirmation (now resolved in-plan); plan gap found (header candidate file was unnamed, now named); highest-risk edit is the hero heading edit, mitigated by the path correction above.
- [Section B — visual evidence + QA] feasibility: CONCERN — mechanically blocked pending OUTPUT_DIR correction (now resolved in-plan); no other gaps found; highest-risk edit is extending a shared e2e spec file without breaking the 8 existing passing screenshot scenarios (mitigation: extend, never replace, per existing plan instruction — confirmed sound).
- [Section C — deploy draft] feasibility: PASS with note — mechanically sound; correctly separates read-only recon (C1) from draft (C2) from execution (never, in this phase); the plan's hard-stop guard is honored — no step in this plan executes ssh/pm2/git-push against the live VPS.

Open gaps:
- Deploy-path SSH recon (C1) may require user hand-off if execute-agent's sandbox lacks gayo-vps SSH credentials — resolution: ask user, do not block phase completion (gap-resolution D above).
- a11y route-count documentation drift ("10 routes" claimed vs 9 actual) — cosmetic, non-blocking, not fixed in this pass (lives in umbrella/SPEC text, out of this Phase-4-file-only VALIDATE's write scope); flagged for a future `vc-audit-context`/`vc-audit-plans` pass.
- Phase 4's own inner-loop RESEARCH (Step 1) has not yet run — this outer PVL validates plan feasibility ahead of that RESEARCH step, not in place of it; RESEARCH must re-confirm Phases 1-3 are actually complete (Program Status Table currently shows all phases ⏳ PLANNED) before EXECUTE can begin for Phase 4.

What this coverage does NOT prove:
- The RTL font-cozy test (AC5) does not prove the font renders correctly in a real browser viewport, only that the class is present in the DOM — visual confirmation is covered separately by the Agent-Probe visual-evidence row.
- The visual-evidence Agent-Probe row does not prove pixel-perfect parity with the reference image — it proves absence of checkerboard artifacts and overall pastel density via human/agent judgment, which is inherently subjective.
- The a11y gate (AC8) proves zero NEW violations against the specific 9-route/2-theme matrix already covered by `e2e/a11y.spec.ts` — it does not extend automatic coverage to any new route Phase 4 might touch that isn't already in that route list (dashboard, hero via `/`, and other 7 routes are covered; no new routes are introduced by this phase).
- The build/tsc/test gate (AC9) proves no regression in the existing 29-test suite — it does not prove new tests were added for Phase 4's own font-cozy behavior unless the AC5 RTL test row above is actually implemented (currently a planned addition, not yet written — Known-Gap until Step A/B execution writes it).
- The deploy-path recon (C1) proves the path was correct AT THE TIME the commands were run — it is a point-in-time check, not a standing guarantee; if the path drifts again between recon and actual deploy execution, this gate does not catch that.
- The billing-surface grep/diff gate (AC10) proves no NEW files were added under the checkout/webhook paths — it does not prove existing files under those paths were not modified in an unrelated harmful way (out of this program's scope by design; those files aren't in any phase's blast radius).

Gate: CONDITIONAL (0 FAILs, 2 dimension-level CONCERNs + 2 section-level CONCERNs, all resolved via in-plan corrections applied at V6 above — path corrections, OUTPUT_DIR fix, and an execute-agent hand-off instruction for the SSH-dependent deploy recon step)
Accepted by: session (autonomous, /goal execution) — accepted concerns: (1) hero-section.tsx path discrepancy [resolved via plan correction], (2) visual-evidence.spec.ts OUTPUT_DIR stale-path [resolved via plan correction], (3) header file unnamed [resolved via plan correction], (4) deploy-path SSH recon dependency on execute-agent sandbox credentials [resolved via ask-user hand-off instruction, gap-resolution D]
