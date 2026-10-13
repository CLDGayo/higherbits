---
phase: phase-02-config-baseline
date: 2026-10-13
status: COMPLETE_WITH_GAPS
feature: higherbits-redesign
plan: process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md
---

# Phase02 coordinator configs and pre-source baseline

TL;DR: Both owned runner wrappers implemented; config self-check and117-suite discovery PASS. Focused baseline4files/30tests PASS. Full safe-config baseline117files/928tests PASS with synthetic loopback-only Supabase constructor settings. All27guard and874existing source digests unchanged. Ready for main's disjoint workers; entire Phase02 remains active/testing, unverified.

## Context Envelope

| Field | Value |
|---|---|
| feature | higherbits-redesign |
| phase | EXECUTE |
| session-goal | Coordinator configs and secret-free pre-worker baseline only |
| branch | main; HEAD 3f091057644c0e9c8fd5ba3c703db27847091f4a |
| worktree | /Users/clarencelloydgayo/Gayo Sphere/HigherBits.dev |
| context-group | planning; tests |
| blast-radius-packages | apps/web; task-local report/evidence |
| active-plan | process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md |
| test-runner | vitest \| playwright config self-check only |
| validate-contract | Selected plan inline Validate Contract, line322 onward: PASS, inner-pvl: phase-02 |

## What Was Done

- Applied `vc-intent-clarify`: exact selected Phase02 coordinator handoff, no ambiguous scope; standing program consent applies.
- Ran Graphify query first; read exact plan, its inline contract/coverage tables and ownership handoff, routed context/tests/config sources, Phase01 final EVL/interphase update reports and umbrella dependency/current-progress sections. Phase01 VERIFIED; no dependency skipped. No flat phase blast-radius registry found. Plan discovery saved from `--feature higherbits-redesign --json`.
- Fresh branch/HEAD, cached upstream, conflicts/staged status, full filenames-only dirty status and body-free hunk map saved. All unrelated changes preserved.
- Captured fresh 27-file guards: all27 match PVL; captured874 package source/config/test JSON/JS/TS digests excluding env/auth/build/test-output files. Both owned configs absent before creation, recorded explicitly.
- Added `apps/web/vitest.first-party-identifiers.config.ts`: direct base/test spreads; only safe setup; envDir false; all discovery, exclusions, aliases and plugins inherited.
- Added `apps/web/e2e/first-party-identifiers-regression.config.ts`: inherited projects/global setup/stage metadata/auth guards; absolute testDir/globalSetup; unconditionally undefined webServer; zero retries including CI; unique validated Phase02 run/post/command directories; project/JSON outputs isolated; admin viewport1280×720.
- Collision guard runs in controller; Playwright's installed worker sets TEST_WORKER_INDEX before config reload, so workers can reuse their assigned directory. Synthetic config self-check proves reload behavior without launching a worker/browser or touching auth state contents.

## Mid-Implementation Progress

At the midpoint3/4 bounded coordinator items were complete: fresh snapshots, both wrappers and config/discovery self-check complete; focused baseline green. Remaining then: full baseline, after-snapshot/hash comparison, local Graphify update outcome and final handoff. No production migration worker/source edits started. Command drift and dotenv-dependent constructor settings were resolved in invocation/evidence only, as recorded below. Exit:4/4 bounded coordinator items complete.

## What Was Skipped or Deferred

Production migration, red-first behavioral tests/stubs, standalone browser fixture, all browser/runtime/provider/auth-state operations, Next startup/restart, dependency changes, commits and archival are outside this bounded handoff. Shared configs/setup and frozen Phase01 harness remain read-only. No .env contents read. No throw-only stubs created.

## Test Gate Outcomes

Evidence root: `evidence/phase-02/config-baseline-13-10-26/` relative to this task folder. Commands execute from repository root.

- `node <evidence-root>/config-selfcheck.mjs`: first attempt exit1 before configuration load because Vite is a transitive installed dependency rather than a direct web dependency; corrected only evidence-script resolution through Vitest's package. Second attempt exit0. Both attempts' stdout/stderr retained. Config comparison proves only the intended overrides, discovery117, unsafe ID/stage/collision rejection, CI/local no-server, inherited projects/metadata and admin viewport. Uses installed Vitest/Vite/TypeScript/Playwright; no dependency or runner added.
- PHASE01-UNIT exact command: `corepack pnpm --filter web exec vitest run --config vitest.first-party-identifiers.config.ts app/magic-chat/__tests__/page.client.test.tsx app/api/subscribe/__tests__/route.test.ts app/api/magic/__tests__/legacy-routes.test.ts app/api/higherbits-mcp/__tests__/route.test.ts`: exit0,4files/30tests. Raw stdout/stderr/command/exit/outcome retained in `phase01-unit-before/`.
- FULL-02 exact contract command: `corepack pnpm --filter web test --config vitest.first-party-identifiers.config.ts`: exit1 before Vitest, `Unknown option: 'config'`. Raw outcome retained in `full-02-before/`; not relabeled PASS.
- Corrected unrestricted runner command: `corepack pnpm --filter web exec vitest run --config vitest.first-party-identifiers.config.ts`: initial no-synthetic-env invocation exit1,117files discovered,3files/11tests failed,114files/917tests passed; every failure is the missing `supabaseUrl` constructor dependency in header suites after removing dotenv. Raw outcome retained in `full-02-before-corrected/`.
- Same unrestricted command with child-only synthetic environment `NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:1 NEXT_PUBLIC_SUPABASE_KEY=phase02-synthetic-not-a-provider-key`: exit0,117files/928tests PASS, Vitest duration11.57s, outer elapsed12.118s. Raw output/outcome in `full-02-before-synthetic/`. These are invented test values, not recovered configuration; no live environment mutation or secret loading. Existing safe fetch mocks retained; synthetic URL cannot target a live provider.
- Final exact-discovery recording repeats that unrestricted command with the same synthetic settings and reporter-only flags `--reporter=default --reporter=json --outputFile.json=<absolute-evidence-root>/full-02-before-recorded/results.json`. This repetition resolves the aggregate default reporter's omission of individual passing suite names; its native JSON is compared to the117-suite discovery manifest. Command/outcome/stdout/stderr/exit/JSON retained separately, not overwritten.
- Final recorded run: exit0,117files/928tests PASS, zero failed tests; outer elapsed11.371s. Native JSON file set equals the discovery manifest exactly,117/117. JSON SHA256: `261335b077223b4fbb2d2d11dc09299520f2a68aa031ad45be000ed3fc852353`. Final assertions in `after.json` include source/config/native JSON fingerprints and exact-discovery equality. All27guard and874source comparisons rerun after the recorded baseline: unchanged.
- Native Playwright discovery: `corepack pnpm --filter web exec playwright test --config e2e/first-party-identifiers-regression.config.ts e2e/higherbits-mcp-legacy-redirect.spec.ts e2e/higherbits-mcp-signed-out.spec.ts e2e/a11y.spec.ts --project=public --global-timeout 300000 --list`: exit0,16cases/3files. Environment IDs/stage/baseURL in `playwright-discovery.json`; inherited global setup/browser/webServer not executed. This proves native config path/discovery only.
- Fresh after comparison:27/27guards and874/874existing source digests unchanged; owned config SHA256 values below. Initial after-snapshot parser expected verbose suite lines, but the default passing reporter emits aggregate counts only; exact-discovery rerun above captures native JSON instead. The unsuccessful parser comparison is retained separately and is not a product failure.
- Local `graphify update .`: exit0; code graph updated. Existing missing SQL parser, historical Phase01 capture syntax warning and community-label refresh warning retained in raw stderr. No dependency installation or semantic provider used. Docs require separate semantic indexing; not claimed here.

Owned config hashes:

| Path | SHA256 |
|---|---|
| apps/web/vitest.first-party-identifiers.config.ts | 370ea603611d29457b217ba7aee8add7358a4a3dbe495b57a527286330c3e30a |
| apps/web/e2e/first-party-identifiers-regression.config.ts | 3d01cb8f67a3ac9eabb7c750dd43f6113bfdd6cbbab26d463e98a6a2ca217afc |

Original source-before manifest SHA256: `717c66553bed1a7f99c21ae14dae113a0b14ad7b7d116e1e61e09144a4dbb8ad`. Root Phase01 harness hashes are included in27guards; APPROVE/history unchanged. No original protected body or auth-state/env contents captured.

## Plan Deviations

Invocation-only differences: installed pnpm rejects the contract's shorthand `test --config`; execute identical package script `vitest run` via existing `pnpm exec`, retaining config override and zero file/name/change filters. Removing dotenv also removes constructor inputs used by11existing tests, so pass the two explicit synthetic loopback-only values above into the test child. Config still overrides only setupFiles/envDir; no global mock, test, production behavior, discovery, dependency or source scope changed. Final repetition adds reporter output only. Main must reconcile FULL-02 invocation/synthetic environment for later independent verification. Selected plan remains untouched under this report/config-only ownership handoff.

Self-review against exact selected plan/coordinator handoff: both config implementations match approved source scope and overrides; no source implementation deviation. CLI/synthetic-environment/reporter differences are disclosed above, not silently accepted as the original failed command. Entire selected plan remains in active/testing; coordinator result is ready for main-owned review and integration, not archival or Phase02 VERIFIED.

## Test Infra Gaps Found

- `stale-command-drift`: FULL-02 shorthand cannot forward the config option in installed pnpm. Corrected invocation is recorded above.
- Secret-free whole-package baseline needs two synthetic Supabase constructor settings; omitting them yields the retained11failures. Later workers/full-suite verification must reproduce these test settings. Do not restore dotenv to solve this.
- Existing tsconfig-paths plugin emits missing upstream pinned-source tsconfig-extension diagnostics; preserved plugin/runner output, no shared-config edits.
- CONTEXT_PARTIAL: root RTK.md is absent; prior supplement recorded the same absence. No substitute instructions invented.
- No follow-up plan stubs created; this command correction belongs to the current plan's coordinator reconciliation, not deferred product work.

## Closeout Packet

Selected plan is the exact phase02 path in frontmatter. Coordinator scope complete; source migration/verification and independent review remain pending. Keep in active/testing. Best next state: main reviews coordinator evidence/command correction and starts the3disjoint production workers; this worker does not spawn them. No whole-phase PHASE_COMPLETE or EVL-start claim is made by this bounded handoff.

## Forward Preview

### Test Infra Found

Installed Vitest4.1.10 observed live despite stale router/package version prose. Safe config discovers117suites; synthetic-env unrestricted baseline117files/928tests PASS. Installed Playwright1.62.1 worker marker verified in source. Self-check/native list do not prove actual browser/runtime gates.

### Blast Radius Changes

Only two planned configs plus this report/task-local evidence. Phase01 frozen harness, seven future-owned production/test paths, shared configs/setup and read-only guards hashed for comparison.

### Commands to Stay Green

Use the recorded corrected unrestricted Vitest command with the two explicit synthetic environment values and exact PHASE01-UNIT command. Later regression invocations require safe fresh run/command IDs, HIGHERBITS_E2E_STAGE=post, existing server3101 and authorized state prerequisites. No webServer branch exists in the wrapper. For stdout/stderr logs, create a sibling command directory rather than the wrapper's future destination: the wrapper correctly rejects pre-existing output destinations.

### Dependency Changes

None. Main must start workers only after this baseline handoff. Strategy comparison: sequential coordinator recommended (1×relative cost), parallel2×, workflow1.5×, coordinated parallel3× estimates; no provider-dollar estimate asserted. Next scope can use the plan's3disjoint workers after coordinator review; integration/full regression remain sequential.

## Invocation Reconciliation Supplement — 2026-10-13

User accepted the pre-worker baseline and started3disjoint production workers. Process-only follow-up reconciles both current FULL-02 command rows in the exact selected Phase02 plan, including its inline contract, to:

```sh
env NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:1 NEXT_PUBLIC_SUPABASE_KEY=phase02-synthetic-not-a-provider-key corepack pnpm --filter web exec vitest run --config vitest.first-party-identifiers.config.ts
```

The prefix reproduces the exact two child-only synthetic settings from the accepted raw outcome; no persistent environment mutation. The rejected shorthand survives only as historical failed evidence. Both command matrices retain unrestricted discovery and every required outcome; no new runner, dependency, product scope or PVL cycle. The earlier “main must reconcile” / “selected plan untouched” statements describe the original handoff and are superseded only for this authorized process correction.

Verification: native baseline JSON117files/928tests/zero failures and exact file-set equality remain attributed to the recorded pre-worker endpoint. Mechanical checks confirm both current FULL-02 rows are identical and corrected, baseline JSON SHA256 unchanged, failed raw outcomes retained and both owned config hashes unchanged. No package test rerun after workers started; current source edits belong to those workers.

Risk packet disposition: plan requires a separate Phase02 packet at `evidence/phase-02/pvl-13-10-26/harness/`, but coordinator baseline/config evidence does not prove implemented identity/privacy/API behavior or independent EVL. Main owns final packet disposition; no harness artifact is created, copied from Phase01 or approved here. Phase01 APPROVE/history and existing pending Phase02 packet remain untouched. Selected plan stays active/testing pending worker gates and independent review. No code change in this supplement; Graphify queried first, code update unnecessary.

Process verification outcome: `node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs process/features/higherbits-redesign/active/higherbits-current-rebrand_11-10-26/phase-02-first-party-identifiers_PLAN_12-10-26.md` exits0 with0failures/0warnings. Read-only assertions pass for both identical corrected FULL-02 rows, absence of the rejected executable shorthand in the plan, unchanged native baseline JSON/config SHA256 values and both retained exit1 raw outcomes. Only selected plan and this report changed in this follow-up.
