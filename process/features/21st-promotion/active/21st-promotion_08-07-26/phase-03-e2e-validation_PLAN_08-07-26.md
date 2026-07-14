---
name: plan:21st-promotion-phase-03-e2e-validation
description: "21st.dev Promotion — Phase 03: E2E Validation & Polish"
date: 08-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st-promotion
  phase: phase-03
---

# Phase 03 — E2E Validation & Polish

**Program:** 21st-promotion
**Umbrella plan:** process/features/21st-promotion/active/21st-promotion_08-07-26/21st-promotion-umbrella_PLAN_08-07-26.md
**Phase status:** ✅ VERIFIED — FINAL phase of the program; all 7 steps complete
**Report destination:** process/features/21st-promotion/active/21st-promotion_08-07-26/phase-03-e2e-validation_REPORT_08-07-26.md (flat in the program task folder)

---

## Purpose

This phase runs the first-ever unscoped (root-level, non-`--filter`) build and test pass for this
program, plus a manual dev-server sanity checkpoint, and performs a narrowly scoped cleanup of
confirmed stray files left over from the 21st-dev merge. Full live-browser E2E and Clerk-authenticated
click-through testing are explicitly out of scope for this phase (see Known Gaps below) — this phase
proves build/unit-test/static-integration health, not live user-flow behavior.

---

## Entry Gate

- Phase 2 complete (Next.js app successfully builds with merged UI)

---

## Decisions from INNOVATE (Step 2)

**A3 narrowed (stray-file cleanup, not subfolder deletion).** RESEARCH found that the original A3
("clean up leftover config from 21st-dev") directly conflicts with the umbrella charter's explicit
out-of-scope tier, which defers deleting the `21st-dev/` subfolder itself to a final cleanup task.
INNOVATE narrowed A3 to delete exactly 3 confirmed stray files (`search_results.json`,
`supabase-demo-update-function.sql`, `supabase-email-notifications.sql`) that are dead artifacts with
no structural role, while leaving every structural file (`package.json`, `pnpm-workspace.yaml`,
`turbo.json`, `next.config.js`, `.git`, `apps/`, `packages/`) untouched — full subfolder deletion
remains deferred per the charter.

**E2E scope redefined to be achievable without live-provider spend or fabricated results.**
RESEARCH found no local Playwright/E2E infra exists anywhere in the repo, `vc-agent-browser` requires
a live paid Browserbase account (cost-class `needs-live-provider`, a hard-stop under this program),
and live Clerk auth click-through is blocked by a pre-existing, program-unrelated missing-dev-keys
gap. RESEARCH also found the one genuinely live-wired DB surface (`local_users` Clerk sync) is already
covered by Phase 1's 8/8 test suite, and — the key new finding — this program has never once run an
unscoped root `pnpm build`/`pnpm test` (every prior phase used `--filter`). INNOVATE redefined this
phase's proof surface around that gap: an unscoped build/test pass (A1a) plus a manual dev-server
checkpoint (A1b), with live-browser E2E and authenticated flows carried forward as documented,
honest known-gaps rather than silently skipped or falsely claimed complete.

---

## Blast Radius

- `21st-dev/search_results.json` (delete)
- `21st-dev/supabase-demo-update-function.sql` (delete)
- `21st-dev/supabase-email-notifications.sql` (delete)
- `turbo.json` (add a `test` task definition — see Validate Contract E1; required for A1a's unscoped
  `pnpm test` to be runnable at all — confirmed missing at V2, not a pre-existing task being modified)
- `apps/web/app/*` (only files touched fixing regressions found by A1b, if any)
- `apps/web/tests/*` (only if A1b findings require new/updated test coverage)
- Explicitly excluded: all other `21st-dev/` content — `.git`, `package.json`, `pnpm-workspace.yaml`,
  `turbo.json` (the file itself, not `21st-dev/`'s), `next.config.js`, `apps/`, `packages/`, and any
  other structural file. The subfolder itself is not deleted or restructured in this phase.

---

## Implementation Checklist

### Step A — Unscoped Build/Test Verification + Manual Checkpoint
- [ ] A1a. Run unscoped root `pnpm build` and `pnpm test` (NOT `--filter`-scoped) — confirm both exit
      0. This is the first time this program verifies full-workspace integration rather than
      per-package builds; every prior phase (0-2) used `corepack pnpm --filter <package>` exclusively.
      **Pre-condition confirmed at VALIDATE (V2):** root `turbo.json` has no `test` task registered
      (`turbo run test --dry` returns `Missing tasks in project`) — see Validate Contract E1 for the
      required one-time fix before this command can succeed.
- [ ] A1b. Start the dev server (`corepack pnpm --filter web dev` or equivalent), confirm the app
      loads without console errors, spot-check the catalog pages and any pages touching Phase 2's
      ported UI primitives render correctly. This is a manual/agent-observed visual sanity check, not
      automated visual regression (no such harness exists in this repo — documented repo-wide gap).
      Auth click-through is explicitly OUT of this check's scope.
- [ ] A2. Fix any visual inconsistencies or regressions found by A1b. If nothing is found, note that
      explicitly — a clean A1b result is a valid, complete outcome.
- [ ] A3. Delete exactly 3 confirmed stray files from `21st-dev/`: `search_results.json`,
      `supabase-demo-update-function.sql`, `supabase-email-notifications.sql`. Do NOT delete or
      modify any other file in `21st-dev/` — the subfolder itself, its `.git`, its workspace/turbo
      config, and all `apps/`/`packages/` content remain untouched. Full `21st-dev/` subfolder
      deletion is explicitly deferred per the umbrella charter's out-of-scope tier and is NOT this
      phase's job. **Verification note (V2 finding):** `21st-dev/` is untracked at the root repo
      (nested `.git`, per existing B1 known-gap) — `git status 21st-dev/ --short` shows only
      `?? 21st-dev/` both before and after deletion; it will NOT show individual deletion lines. Use
      the file-existence check in Validate Contract E2 as the actual proof mechanism instead.

---

## Known Gaps (carried forward, not phase failures)

- **Live-browser E2E deferred.** No local Playwright/E2E infra exists in this repo.
  `vc-agent-browser`/Browserbase requires live-provider spend, which is never auto-approved under
  this program (cost-class `needs-live-provider`, hard-stop). Deferred pending optional opt-in.
- **Clerk-authenticated auth-flow click-through deferred.** Blocked by a pre-existing missing
  Clerk dev-keys environment gap (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` not set),
  unrelated to this program's work. Deferred pending real dev keys being provisioned.

---

## Exit Gate

```bash
pnpm build
pnpm test
```
- Unscoped root `pnpm build` and `pnpm test` both exit 0 (requires the `turbo.json` `test` task fix
  in Validate Contract E1 to be applied first).
- A1b manual dev-server checkpoint completed, with findings noted (clean or fixed).
- A3's 3 named stray files confirmed deleted via file-existence check (not `git status`, per E2); no
  other `21st-dev/` file touched.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Critical runtime panics requiring major rollback of Phase 1 or 2.
- Unscoped root `pnpm build`/`pnpm test` failing for reasons outside this phase's blast radius
  (e.g. a pre-existing cross-package issue not caused by this phase).

---

## Phase Loop Progress

- [x] 1. RESEARCH — research-agent: found A3/charter conflict, no local E2E infra, live-provider
      hard-stop on Browserbase, pre-existing Clerk dev-keys gap, and that this program has never run
      an unscoped root build/test pass.
- [x] 2. INNOVATE — innovate-agent: decided to narrow A3 to 3 named stray-file deletions and redefine
      E2E scope around an achievable unscoped build/test pass (A1a) + manual dev-server checkpoint
      (A1b), carrying live-browser/auth-flow testing forward as documented known-gaps.
- [x] 3. PLAN-SUPPLEMENT — plan-agent: phase plan updated with narrowed A3, redefined A1a/A1b/A2
      checklist, Known Gaps section, and revised Exit Gate/Blast Radius.
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written. Gate: CONDITIONAL (2 concerns,
      both resolved inline as execute-agent instructions E1-E2; no supplement cycle required).
- [x] 5. EXECUTE — all checklist items done; gates green. Evidence: (A1a) E1 applied — added `test`
      task to `turbo.json` (`{"dependsOn":["^build"],"outputs":[]}`) + matching `"test":"turbo run test"`
      script to root `package.json` (pnpm needs the package.json script; mirrors existing build/lint/
      type-check shape — same missing-task gap, within A1a scope). Unscoped `pnpm build` = 3 successful/3
      total; unscoped `pnpm test` = 4 successful/4 total (web vitest 123 passed across 27 files + packages/db
      node --test smoke). E1 verified additive (re-ran `pnpm build` + `pnpm --filter web type-check`, both
      green — no regression). No E3 new failures surfaced. (A1b) Dev server booted clean (Ready in 1795ms,
      loading real `.env.local`); catalog root `/`, all 3 live Cozy UI primitives (`/cozy-buttons/soft-button`,
      `/lofi-cards/lofi-card`, `/minimalist-layouts/calm-stack`), `/themes/cozy-daylight`, `/studio` all
      HTTP 200 with zero runtime-error markers; dev log had zero error/warn lines. CLEAN. (A2) No regressions
      found → clean, no fix needed. (A3) Exactly 3 stray files deleted; E2 file-existence check PASS (all 3
      absent); `git status 21st-dev/ --short` unchanged from baseline `?? 21st-dev/`; no other 21st-dev file
      touched; `packages/ui` untouched (hard safety constraint honored).
- [x] 6. EVL — independent vc-tester re-run: all 5 gates green (unscoped build 3/3, unscoped test
      123/123 + packages/db smoke, A3 file-existence check, `packages/ui` clean, `21st-dev/` unchanged
      untracked state). Closeout classification: CLEAN. No follow-up stubs required beyond the 2
      pre-existing documented Known Gaps (live-browser E2E, Clerk auth click-through).
- [x] 7. UPDATE PROCESS — archived; context updated; committed (phase report written to
      `phase-03-e2e-validation_REPORT_08-07-26.md`; umbrella Program Closeout, Current Execution State,
      and Program Status Table all updated; `process/context/all-context.md` 21st-promotion paragraph
      updated to FULL PROGRAM COMPLETE)

---

## Validate Contract

Status: CONDITIONAL
Date: 09-07-26
date: 2026-07-09
generated-by: inner-pvl: phase-3

Parallel strategy: sequential
Rationale: Score 0/7 signals — single phase, no multi-package scope beyond the already-decided
5-package build graph, no schema/API/auth surface, no phase-program plan-creation fan-out (plan
already exists), <5 blast-radius files. In-session Layer 1 (4 dimensions) + Layer 2 (4 sections)
analysis run directly by vc-validate-agent, proportionate to phase size — no parallel subagent
spawn warranted at this scale.

### Layer 1 dimensions

| Layer 1 dimensions | Status |
|---|---|
| Infra fit | CONCERN |
| Test coverage | CONCERN |
| Breaking changes | PASS |
| Security surface | PASS |

### Layer 2 sections

| Layer 2 sections | Status |
|---|---|
| Section A1a — Unscoped build/test | CONCERN |
| Section A1b — Manual dev-server checkpoint | PASS |
| Section A2 — Fix regressions found | PASS |
| Section A3 — Delete 3 stray files | CONCERN |

**Totals: 0 FAILs / 4 CONCERNs (2 distinct root causes, restated at both dimension and section level) / 4 PASSes**

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| A1a-build | Unscoped root build succeeds across all 5 workspace packages (incl. `backend` no-op) | Fully-Automated | `pnpm build` (root, unscoped) — exit 0 | B |
| A1a-test | Unscoped root test task runs and passes across all packages with test scripts | Fully-Automated | `pnpm test` (root, unscoped) — exit 0, AFTER `turbo.json` test-task fix (E1) | B |
| A1b-visual | Dev server starts, catalog pages + Phase 2 UI primitives render without console errors | Agent-Probe | Manual dev-server checkpoint: `corepack pnpm --filter web dev`, spot-check catalog + primitive-touching pages | A |
| A2-regressions | Any regressions found by A1b are fixed, or explicitly confirmed clean | Agent-Probe | Conditional on A1b outcome; execute-agent must state result explicitly either way | A |
| A3-cleanup | Exactly 3 named stray files deleted; no other `21st-dev/` file touched | Hybrid | File-existence check (see E2) + `git status 21st-dev/ --short` baseline-comparison (not deletion-line expectation) | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist, specifically A1a itself)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

Legacy line form:
- Build: Fully-automated: `pnpm build` (root, unscoped) exit 0
- Test: Fully-automated: `pnpm test` (root, unscoped) exit 0 — blocked until E1 applied
- Visual checkpoint: Agent-probe: manual dev-server spot-check, no automated visual-regression harness exists in this repo
- Stray-file cleanup: Hybrid: file-existence check + git-status baseline comparison, precondition: understanding that `21st-dev/` is untracked (nested `.git`)
- Live-browser E2E / auth-flow click-through: known-gap: documented in plan's `## Known Gaps` section, cost-class `needs-live-provider` / pre-existing Clerk dev-keys gap

### What this coverage does NOT prove

- `pnpm build`/`pnpm test` passing does NOT prove live browser behavior, visual correctness across
  the repo's 3 site themes, or authenticated user flows — those are the two explicitly documented
  Known Gaps (live-browser E2E, Clerk auth click-through), not silently absorbed into this gate.
- The A1b manual dev-server checkpoint proves "loads without console errors + spot-checked pages
  render" — it does NOT prove pixel-level visual regression across themes (no harness exists) or
  exhaustive route coverage (only catalog pages + Phase 2 UI-primitive-touching pages are checked).
- The A3 file-existence check proves the 3 named files are gone and `git status 21st-dev/` is
  unchanged from baseline — it does NOT prove no other file inside `21st-dev/` was silently modified
  in content (only that no new git status line/untracked-state change occurred, which for an
  entirely-untracked directory is a weaker guarantee than a tracked-file diff would give). This is an
  accepted limitation given `21st-dev/`'s untracked nested-git state (B1 known-gap); execute-agent
  should additionally spot-check no unintended file timestamps changed if this weaker guarantee is a
  concern in a later phase.
- The `21st-dev/apps/backend` package's build/test/lint/type-check tasks resolving to `<NONEXISTENT>`
  (Turbo no-op) is confirmed SAFE behavior, not evidence the Bun backend app actually works — it has
  no scripts to run at all, so "success" here only means "did not block the rest of the graph."

Dimension findings:
- Infra fit: CONCERN — root `turbo.json` has no `test` task registered; `pnpm test` unscoped fails
  immediately with `Missing tasks in project` as written. Confirmed via direct `turbo run test --dry`
  probe at V2. Resolved via E1 below (add `test` task to `turbo.json`, in A1a's own scope).
- Test coverage: CONCERN — A1a is the program's first-ever unscoped gate and IS expected to
  potentially surface new failures (confirmed here: the missing `test` task itself is exactly that
  kind of new finding). A1b/A2 correctly tiered Agent-Probe; no Known-Gap in this plan rests
  un-named (both deferred items have explicit rationale, satisfying the vacuous-green ban).
- Breaking changes: PASS — no public API/schema/contract surface touched; the 3 deleted files are
  dead Supabase-editor SQL functions and a stale scraped JSON, confirmed unreferenced by content
  inspection and Phase 1's prior zero-live-wiring grep gate.
- Security surface: PASS — no auth/identity, billing/credits, schema/migration, public-API,
  deploy/container, or secrets/trust-boundary class touched. No high-risk evidence pack required
  (matches Phase 0/Phase 2 precedent — UI/build-verification scope only).

### Plan updates applied

None required in plan text beyond the notes already inserted above (Blast Radius `turbo.json`
addition, A1a/A3 verification-method annotations) — both CONCERNs are resolved as execute-agent
instructions (E1, E2), not plan rewrites, since they are precise mechanical fixes squarely inside
A1a/A3's own existing scope.

### Execute-Agent Instructions

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | Before running `pnpm test` unscoped in A1a: add a `test` task to root `turbo.json` (e.g. `"test": {"dependsOn": ["^build"], "outputs": []}`). Verify the edit is additive-only — re-run `pnpm build` and `pnpm --filter web type-check` after the edit to confirm no regression to existing tasks. Document the exact diff in the phase report. | A1a entry, before first `pnpm test` invocation |
| E2 | For A3 verification: do NOT rely on `git status 21st-dev/ --short` to show deletion lines — it will not, because `21st-dev/` is untracked (nested `.git`, per B1 known-gap). Instead use: `ls 21st-dev/search_results.json 21st-dev/supabase-demo-update-function.sql 21st-dev/supabase-email-notifications.sql` (expect "No such file or directory" for all 3), THEN confirm `git status 21st-dev/ --short` output is unchanged from the pre-A3 baseline (`?? 21st-dev/`, nothing new/structural). Document both checks' output in the phase report. | A3 completion, before marking A3 done |
| E3 | If `pnpm build` or `pnpm test` unscoped surfaces a genuinely NEW failure (not the known `turbo.json` test-task gap fixed by E1) — e.g. a cross-package type error, a Turbo graph issue, or an unexpected `backend` package warning — treat this as legitimate new information requiring a real fix cycle, not a formality to paper over. If the fix is small and inside this phase's blast radius: fix now, re-run, confirm green, document in phase report. If the fix is outside blast radius or non-trivial: do NOT force a workaround; document as a genuine finding in the phase report and flag for EVL/backlog per the standard Hybrid Failure Resolution Priority (`vc-test-coverage-plan`). | Any exit code ≠ 0 from A1a's `pnpm build`/`pnpm test`, after E1 is applied |

### Backlog Artifacts

None required this phase — both CONCERNs resolved inline as execute-agent instructions.

### Open gaps

- Live-browser E2E: known-gap: documented in plan's `## Known Gaps` section — cost-class
  `needs-live-provider`, hard-stop per program charter, deferred pending optional opt-in.
- Clerk-authenticated auth-flow click-through: known-gap: documented in plan's `## Known Gaps`
  section — pre-existing, program-unrelated missing Clerk dev-keys gap.

Gate: CONDITIONAL (2 concerns, both resolved inline as execute-agent instructions E1-E2; E3 is a
contingency instruction, not an unresolved concern; no supplement cycle required — matches Phase 0/
Phase 1/Phase 2 precedent exactly)
Accepted by: session (autonomous, /goal execution) — accepted concerns: (1) missing `turbo.json`
test task, resolved via E1; (2) A3's git-status verification method needing correction to a
file-existence check, resolved via E2.

---

## Test Infra Improvement Notes

- Root `turbo.json` has no `test` task — this is a repo-wide gap, not phase-specific (every prior
  phase used `--filter`-scoped commands that bypass root task dispatch entirely). Fixing it in A1a
  (per E1) benefits every future phase/program that wants to run an unscoped `pnpm test`, not just
  this one. Consider whether this fix should be called out explicitly in the phase report as a
  durable infra improvement, not just an unblocking step.

---

## Resume and Execution Handoff

1. Selected plan file path: `process/features/21st-promotion/active/21st-promotion_08-07-26/phase-03-e2e-validation_PLAN_08-07-26.md`
2. Last completed step: Step 4 (PVL) — validate-contract written, Gate: CONDITIONAL (accepted)
3. Validate-contract status: written (09-07-26), generated-by: inner-pvl: phase-3, Gate: CONDITIONAL,
   2 concerns resolved inline (E1: add `turbo.json` test task; E2: correct A3 verification method to
   file-existence check), E3 is a standing contingency instruction for A1a's first-ever-unscoped-run risk.
4. Supporting context files loaded: `process/context/all-context.md`, `process/context/tests/all-tests.md`,
   umbrella plan for 21st-promotion, Phase 2 report (for connection-drop resume-safety pattern)
5. Next step: Spawn vc-tester for EVL confirmation run — Step 6. Re-run the validate-contract
   Fully-Automated gates independently: unscoped `pnpm build` (exit 0) and unscoped `pnpm test`
   (exit 0). Both were green in EXECUTE after E1's `turbo.json` + `package.json` test-task fix.
   Agent-Probe gates (A1b dev-server checkpoint) recorded CLEAN. Hybrid gate (A3) verified via
   E2 file-existence check. Known-gaps (live-browser E2E, Clerk auth click-through) carried
   forward, not closed.
