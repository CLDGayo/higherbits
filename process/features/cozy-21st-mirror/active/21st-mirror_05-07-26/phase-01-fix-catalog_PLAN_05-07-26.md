---
name: plan:cozy-21st-mirror-phase-01-fix-catalog
description: "Cozy 21st Mirror — Phase 1: Fix Catalog Errors"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: cozy-21st-mirror
  phase: phase-01
---

# Phase 01 — Fix Catalog Errors

**Program:** cozy-21st-mirror
**Umbrella plan:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/21st-mirror-umbrella_PLAN_05-07-26.md
**Phase status:** ✅ VERIFIED (EVL confirmed 05-07-26 — see Phase Completion Rules)
**Report destination:** process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-01-fix-catalog_REPORT_05-07-26.md (flat in the program task folder)
Date: 05-07-26
Status: VERIFIED
Complexity: SIMPLE

---

## Overview

Phase 1 of the cozy-21st-mirror program. Frontend-only bug-fix phase: the catalog detail-page
route (`/[category]/[slug]`) throws an unguarded Redis error on every render when usage-metering
env vars are absent, tripping the Next.js error boundary. Scope is limited to
`apps/web/lib/metering.ts` plus new unit test coverage — no schema, API contract, or dependency
changes. This phase is the foundation gate for the rest of the program: no later visual/content
phase can be verified while catalog detail routes are erroring.

---

## Purpose

Resolve the "Something went wrong" error boundary that fires on catalog **detail-page** routing
(`/[category]/[slug]`). This is the foundation phase for the whole program — no visual or content
upgrades in later phases can be verified while the underlying catalog detail routes are erroring.

**CORRECTED ROOT CAUSE (superseding the original hypothesis — see Inner Loop Refresh Note below):**
the crash is NOT in `apps/web/lib/catalog.ts` or the registry/legacy-slug fallback path (those are
confirmed null-safe). It is an unguarded Redis client throw in the usage-metering surface,
triggered on every detail-page render.

---

## Entry Gate

- Phase 0 (umbrella plan + phase stub creation) complete
- Repo builds green on `main` per current baseline (`corepack pnpm --filter web test` passing 87/87)

---

## Blast Radius

- `apps/web/lib/metering.ts` (PRIMARY fix target — `hasHitDailyLimit` + `recordComponentView` guards)
- New test file: `apps/web/__tests__/metering.test.ts` (degrade-path unit coverage)
- **Read-only confirmation, NOT modified:** `apps/web/lib/redis.ts` (Proxy lazy-singleton — do not touch), `apps/web/app/(catalog)/[category]/[slug]/page.tsx` (caller of the metering functions, lines 86-90 — no code change expected, confirm call sites only)
- **Explicitly OUT of blast radius (do not touch):** `apps/web/lib/rate-limit.ts` (9a3593d-hardened; checkout/connect/submit limiters stay fail-closed), `apps/web/lib/catalog.ts` (mid-refactor by an unrelated in-flight QStash/catalog.json pipeline effort — ambient uncommitted state, never revert or conflict with it), `apps/web/lib/registry.ts` (confirmed already null-safe, no changes needed)

---

## Implementation Checklist

### Step A — Confirm root cause (RESEARCH already complete — verification only)

- [x] A1. Reproduced/traced the "Something went wrong" boundary error via code inspection: `createRedis()` in `apps/web/lib/redis.ts:7-11` throws when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are absent (confirmed absent — no `.env*` file in repo). The throw is realized lazily via the Proxy singleton at `redis.ts:19-26` on first property access.
- [x] A2. Traced trigger path: `apps/web/app/(catalog)/[category]/[slug]/page.tsx:86-90` calls `hasHitDailyLimit()` and `recordComponentView()` (both in `apps/web/lib/metering.ts:19-29`) unconditionally on every detail-page RSC render. Neither call is wrapped in error handling. The uncaught rejection/throw propagates to the route segment's `error.tsx:21` boundary ("Something went wrong").
- [x] A3. Root cause documented here (superseding original catalog.ts/registry.ts hypothesis, which is confirmed WRONG — those paths are null-safe). Affects ALL detail routes (`/[category]/[slug]`) for both curated and legacy-placeholder slugs. Category list pages (`/[category]`) are unaffected — they do not call metering functions.

### Step B — Apply the fix

- [ ] B1. Edit `apps/web/lib/metering.ts`: wrap `hasHitDailyLimit` body in try/catch. On any Redis failure (client construction throw, or a rejected `redis.sismember`/`redis.scard` call), `console.warn` a clear message and return `false` (fail-open — this is a soft usage-metering surface, not a security/auth boundary, so open-by-default on infra failure is the correct default).
- [ ] B2. Edit `apps/web/lib/metering.ts`: wrap `recordComponentView` body in try/catch. On any Redis failure (client construction throw, or a rejected `redis.sadd`/`redis.expire` call), `console.warn` and no-op return (fail-silent best-effort telemetry — view counts are not correctness-critical).
- [ ] B3. Confirm behavior is byte-identical when Redis IS configured and healthy — the try/catch guards must only activate on an actual throw/rejection, never alter the happy-path return values or control flow.
- [ ] B4. Do NOT modify `apps/web/lib/redis.ts`, `apps/web/lib/rate-limit.ts`, or `apps/web/lib/catalog.ts` (see Blast Radius exclusions above). Do NOT touch `getAICredits`/`consumeAICredits` in `metering.ts` — those are not on this crash path; see Backlog Notes below.

### Step C — Add regression-proof test coverage (new coverage — was zero for this path)

- [ ] C1. Create `apps/web/__tests__/metering.test.ts`. Mock the `apps/web/lib/redis.ts` module's exported `redis` object per-test (`vi.mock("@/lib/redis", ...)`) to simulate rejection/throw — NOT the raw `@upstash/redis` package, since `metering.ts` imports `{ redis }` from `./redis`.
- [ ] C2. Test: `hasHitDailyLimit` returns `false` (does not throw) when `redis.sismember`/`redis.scard` reject.
- [ ] C3. Test: `recordComponentView` resolves without throwing when `redis.sadd`/`redis.expire` reject.
- [ ] C4. Test: happy-path behavior (Redis healthy/mocked success) is unchanged from pre-fix behavior — add or confirm existing coverage for this case to prove B3's byte-identical claim.

### Step D — Verify no regression

- [ ] D1. Run full vitest suite (`corepack pnpm --filter web test`) — confirm baseline 87/87 plus new metering tests, all green, zero new failures.
- [ ] D2. Run `corepack pnpm --filter @repo/ui type-check` — confirm exits 0.
- [ ] D3. Agent-probe tier: NOT REQUIRED — VALIDATE (V3) determined that unit coverage in Step C (C1-C4) fully covers the call path (both functions, both failure and happy paths) and is sufficient to prove the route-level fix by code-path inspection. Skip the live dev-server hit; do not spend agent-probe budget on this phase.

---

## Exit Gate

```bash
# Vitest full suite
corepack pnpm --filter web test
# Expected: all tests passing (baseline 87/87 + new metering tests), zero new failures

# Type check
corepack pnpm --filter @repo/ui type-check
# Expected: exits 0
```

- All checklist items (A, B, C, D) checked
- Catalog detail routes load without the "Something went wrong" boundary error (200 OK) for both curated and legacy-placeholder slugs
- Phase report written to report destination above

---

## Acceptance Criteria

- [ ] AC1. `hasHitDailyLimit` never throws or rejects — returns `false` on any Redis failure (proven by unit test).
- [ ] AC2. `recordComponentView` never throws or rejects — no-ops on any Redis failure (proven by unit test).
- [ ] AC3. Behavior when Redis is configured and healthy is unchanged (byte-identical happy path, proven by unit test).
- [ ] AC4. Full vitest suite green (baseline 87/87 + new metering tests), zero new failures.
- [ ] AC5. `@repo/ui` type-check exits 0.
- [ ] AC6. At least one curated route and one legacy-placeholder detail route load without the error boundary firing (satisfied by code-path inspection via Step C unit coverage — see D3 resolution above; no live dev-server hit required).
- [ ] AC7. No changes made to `redis.ts`, `rate-limit.ts`, `catalog.ts`, or `getAICredits`/`consumeAICredits`.

---

## Phase Completion Rules

- Phase is **CODE DONE** when Steps A-D of the Implementation Checklist are complete and the Exit Gate commands pass locally.
- Phase is **VERIFIED** only after: (1) validate-contract is written with Gate: PASS or an accepted CONDITIONAL, (2) EVL confirmation run (vc-tester re-running the exact gate commands) is green, (3) phase report is written documenting all Acceptance Criteria as met with evidence.
- Do not mark this phase `✅ VERIFIED` in the umbrella plan without both phase evidence and the EVL confirmation run — CODE DONE and VERIFIED are distinct states per `process/development-protocols/phase-programs.md`.
- If any Acceptance Criterion cannot be met without expanding scope beyond the declared Blast Radius, halt and escalate per "Blockers That Would Justify BLOCKED Status" below rather than silently widening scope.

---

## Blockers That Would Justify BLOCKED Status

- Root cause is found to trace to a Qdrant/`@repo/db` schema issue rather than the metering/Redis surface (would violate umbrella's frontend-only safety constraint — must be escalated, not fixed inline). NOTE: RESEARCH has already ruled this out — retained only as a defensive tripwire in case EXECUTE uncovers a second, independent failure mode.
- Root cause requires live Clerk env keys or live n8n/Qdrant connectivity to reproduce/verify (both are documented as out-of-scope/deferred per `process/context/all-context.md` Open Questions)

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked. Root cause corrected: unguarded Redis throw in `apps/web/lib/metering.ts`, not catalog.ts/registry.ts.
- [x] 2. INNOVATE — innovate-agent: approach decided (try/catch fail-open/fail-silent guards in metering.ts only); Decision Summary written; vc-predict verdict: GO.
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated with corrected root cause, revised checklist, revised blast radius, new test coverage item, and backlog notes. Inner Loop Refresh Note added below.
- [x] 4. PVL — vc-validate-agent: full V1-V7 complete; validate-contract written below (Gate: PASS).
- [x] 5. EXECUTE — metering.ts guards applied (B1-B4), metering.test.ts created (C1-C4), exit gates green (D1: vitest 96/96, D2: type-check exit 0). Scope confirmed clean (only metering.ts + new test).
- [x] 6. EVL — independent vc-tester confirmation run: `corepack pnpm --filter web test` 96/96 green, `corepack pnpm --filter @repo/ui type-check` exit 0. No follow-up stubs needed beyond the two already-registered backlog notes.
- [x] 7. UPDATE PROCESS — phase report finalized, umbrella `## Current Execution State` updated, process commit routed via orchestrator.

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Inner Loop Refresh Note

**Date:** 05-07-26

Inner RESEARCH + INNOVATE have run and supersede the original plan hypothesis. Summary of change:

- **Original hypothesis (WRONG):** root cause traced to `apps/web/lib/catalog.ts` legacy route
  entries and/or `apps/web/lib/registry.ts` handling of stale/missing registry data post the
  Phase-2 legacy registry purge.
- **Corrected root cause (RESEARCH, confirmed by code inspection):** `apps/web/lib/redis.ts:7-11`
  `createRedis()` throws when `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` are absent
  (confirmed absent — no `.env*` file in repo), realized via the Proxy lazy-singleton at lines
  19-26. This is triggered by unconditional calls to `hasHitDailyLimit()` /
  `recordComponentView()` (`apps/web/lib/metering.ts:19-29`) on every detail-page RSC render at
  `apps/web/app/(catalog)/[category]/[slug]/page.tsx:86-90`, caught by
  `apps/web/app/(catalog)/error.tsx:21`. Registry and catalog.ts paths are confirmed null-safe —
  they were never the problem. Category list pages are unaffected (no metering calls there).
- **Chosen approach (INNOVATE, vc-predict verdict: GO):** add try/catch guards inside
  `apps/web/lib/metering.ts` only — `hasHitDailyLimit` fail-open (return `false` + `console.warn`
  on Redis failure, since this is a soft usage-metering surface, not a security boundary);
  `recordComponentView` fail-silent (no-op + `console.warn`, since this is best-effort
  telemetry). Behavior when Redis IS configured stays byte-identical. Explicitly excluded from
  scope: `redis.ts`, `rate-limit.ts` (fail-closed by design, hardened in `9a3593d`), `catalog.ts`
  (unrelated in-flight refactor — ambient state), and `getAICredits`/`consumeAICredits` (not on
  this crash path — separate backlog item, no blanket fail-open for billing/credit surfaces
  without dedicated review).
- **Consequence for this plan:** Blast Radius, Implementation Checklist, and Verification
  Evidence sections rewritten to reflect the corrected target (`metering.ts` + new test file).
  Backlog notes written for the two deferred follow-ups (catalog.json degrade path;
  metering AI-credits guard).

---

## Touchpoints

- `apps/web/lib/metering.ts`
- `apps/web/__tests__/metering.test.ts` (new file)
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` (read-only confirmation of call sites — no expected code change)

---

## Public Contracts

- `hasHitDailyLimit` / `recordComponentView` function signatures unchanged — same params, same return types, same call sites
- No route URL structure changes
- No registry frontmatter schema changes
- No paywall gate (`IsPro` / `entry?.isPro`) behavior changes
- Behavior when Redis is configured and healthy is unchanged (guards activate only on failure)

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web test` — full vitest suite, baseline 87/87 + new metering tests | Fully-Automated | Catalog detail routes no longer crash on missing Redis env; no regression to existing 87 tests |
| `apps/web/__tests__/metering.test.ts` — `hasHitDailyLimit` returns `false` on Redis rejection | Fully-Automated | Fail-open guard proven for daily-limit check |
| `apps/web/__tests__/metering.test.ts` — `recordComponentView` resolves without throw on Redis rejection | Fully-Automated | Fail-silent guard proven for view-recording telemetry |
| `apps/web/__tests__/metering.test.ts` — happy-path (Redis mocked healthy) unchanged behavior | Fully-Automated | Byte-identical behavior claim (B3) proven when Redis is configured |
| `corepack pnpm --filter @repo/ui type-check` | Fully-Automated | No type regressions introduced by the guard edits |

(Agent-Probe dev-server route hit resolved as NOT REQUIRED — see D3/AC6 resolution.)

---

## Test Infra Improvement Notes

(none identified yet)

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-01-fix-catalog_PLAN_05-07-26.md`
- Last completed step: Step 4 (PVL) — validate-contract written, Gate: PASS
- Validate-contract status: PASS (written 05-07-26)
- Supporting context files loaded: umbrella plan (`21st-mirror-umbrella_PLAN_05-07-26.md`), `process/context/all-context.md`, `process/context/tests/all-tests.md`
- Next step: Spawn vc-execute-agent (Step 5 EXECUTE) against this plan — implement Steps B and C, run Exit Gate commands, confirm all green.

---

## Validate Contract

Status: PASS
Date: 05-07-26
date: 2026-07-05
generated-by: inner-pvl: phase-1

Parallel strategy: sequential
Rationale: Signal score 0/7 (single-package, single-file fix target, no schema/API/auth/billing surface, not a phase-program plan-creation fan-out, no 5+ blast-radius files, no user-requested depth). Trivial/low-complexity fix — sequential single-agent VALIDATE and EXECUTE is correct; no fan-out warranted for EXECUTE.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC1 | `hasHitDailyLimit` returns `false` (never throws) on any Redis failure | Fully-Automated | `apps/web/__tests__/metering.test.ts` — mock `@/lib/redis` to reject `sismember`/`scard`; assert `hasHitDailyLimit(...)` resolves `false` | A |
| AC2 | `recordComponentView` no-ops (never throws) on any Redis failure | Fully-Automated | `apps/web/__tests__/metering.test.ts` — mock `@/lib/redis` to reject `sadd`/`expire`; assert `recordComponentView(...)` resolves without throw | A |
| AC3 | Happy-path behavior unchanged when Redis is healthy | Fully-Automated | `apps/web/__tests__/metering.test.ts` — mock `@/lib/redis` to resolve successfully; assert both functions return identical values to pre-fix behavior | A |
| AC4 | Full vitest suite green, zero regressions | Fully-Automated | `corepack pnpm --filter web test` — expect 87 baseline + new metering tests, 0 failures | A |
| AC5 | No type regressions | Fully-Automated | `corepack pnpm --filter @repo/ui type-check` — expect exit 0 | A |
| AC6 | Route-level fix confirmed (curated + legacy-placeholder detail routes load without error boundary) | Fully-Automated | Satisfied transitively by AC1+AC2 unit proof — the only crash path was the two metering calls at `page.tsx:86-90`; no separate route-level test needed | A |
| AC7 | No edits to `redis.ts` / `rate-limit.ts` / `catalog.ts` / `getAICredits` / `consumeAICredits` | Fully-Automated | `git diff --name-only` post-EXECUTE — confirm only `metering.ts` + new test file changed | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: all 7 rows use Fully-Automated. No Known-Gap rows — all developed behavior in this phase's blast radius has a fully-automated proving gate; the net gate is a legitimate (non-vacuous) PASS.

Legacy line form (retained so existing validate-contract consumers still parse):
- metering.ts fail-open/fail-silent guards: Fully-automated: `corepack pnpm --filter web test` (new `apps/web/__tests__/metering.test.ts` covers hasHitDailyLimit + recordComponentView degrade paths + happy path)
- type safety: Fully-automated: `corepack pnpm --filter @repo/ui type-check`
- scope containment (no edits outside blast radius): Fully-automated: `git diff --name-only` reviewed against Blast Radius section

Dimension findings:
- Infra fit: PASS — No container/infra/port surfaces touched; plain server-side lib edit; vitest node environment + `@/` alias already configured; no new deps needed (uses `vi.mock`).
- Test coverage: PASS — Fully-automated tier fully covers both functions (failure path + happy path via module mock). Original conditional agent-probe item (D3) resolved as not needed; unit coverage of the two functions is sufficient to prove the route-level fix since the crash path is entirely inside these two calls.
- Breaking changes: PASS — Function signatures, route structure, registry schema, and paywall gate logic all confirmed unchanged in the Public Contracts section; call site at `page.tsx:86-90` requires no edit.
- Security surface: PASS — Soft usage-metering surface (view telemetry + non-security daily-limit soft cap), not auth/billing. Fail-open on `hasHitDailyLimit` justified (worst case: one extra view when Redis is down — no security impact). `rate-limit.ts` (the actual fail-closed security surface hardened in 9a3593d) is explicitly out of blast radius and untouched. `getAICredits`/`consumeAICredits` (billing-adjacent) explicitly excluded from this fix, correctly deferred to backlog rather than blanket fail-open.
- Section B feasibility (metering.ts fix): PASS — mechanical feasibility confirmed (isolated, single-purpose async functions, ~15 lines each); no gaps; no conflicts; highest-risk edit is ensuring the try/catch wraps the full function body (including the Proxy's synchronous throw on first property access), not just the `await` lines — execute-agent instruction E1 covers this.
- Section C feasibility (test coverage): PASS — mocking `apps/web/lib/redis.ts`'s exported `redis` object (not the raw `@upstash/redis` package) is the correct mock target per the import in `metering.ts:1`; standard vitest practice already used elsewhere in the suite.
- Section D feasibility (regression verification): PASS — exit gate commands (`corepack pnpm --filter web test`, `corepack pnpm --filter @repo/ui type-check`) confirmed correct against actual `package.json` filter conventions.

### Proposed Plan Updates Applied

| # | What changed | Where in plan | Why |
|---|---|---|---|
| P1 | D3 (agent-probe dev-server route check) changed from conditional-pending to resolved NOT REQUIRED | Step D3, AC6 | Layer 1 test-coverage dimension + Section C feasibility both concluded unit coverage (C1-C4) fully proves the route-level fix by code-path inspection; no live dev-server hit needed. Saves EXECUTE-phase effort without weakening proof. |
| P2 | C1 mock-target clarified: mock `@/lib/redis`, not `@upstash/redis` | Step C1 | Section C feasibility agent flagged ambiguity in "mock the redis module (or the underlying client dependency)" — pinned down to the correct import surface per `metering.ts:1`'s `import { redis } from "./redis"`. |
| P3 | Verification Evidence table's Agent-Probe row removed; replaced with a note pointing to the D3/AC6 resolution | Verification Evidence | Keeps the table consistent with P1 — avoids a stale conditional row that could confuse EXECUTE or EVL about what tier is actually required. |

### Execute-Agent Instructions

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | The try/catch in both `hasHitDailyLimit` and `recordComponentView` must wrap the ENTIRE function body — including the first line that touches `redis.<method>(...)`, since the Proxy's `createRedis()` throw fires synchronously on first property access (`redis.ts:19-26`), not only on the awaited promise rejection. A try/catch that only wraps the `await` expression and not the property-access itself would still crash. | Applying B1/B2 |
| E2 | Do not add a try/catch to `getAICredits` or `consumeAICredits` — those are out of scope per B4 and Blast Radius exclusions. If EXECUTE discovers they share a crash risk, stop and write a backlog note rather than expanding scope inline. | If EXECUTE is tempted to "fix while in the file" |
| E3 | Mock target for `apps/web/__tests__/metering.test.ts` is `vi.mock("@/lib/redis", ...)` returning a mock `redis` object with `sismember`/`scard`/`sadd`/`expire` as configurable mock functions (reject or resolve per test case) — do not mock `@upstash/redis` directly. | Writing Step C tests |
| E4 | After EXECUTE, run `git diff --name-only` and confirm the only changed/added files are `apps/web/lib/metering.ts` and `apps/web/__tests__/metering.test.ts` (new). Any other file appearing in the diff is a scope violation — halt and report, do not proceed to EVL. | Post-EXECUTE, pre-EVL handoff |

### Backlog Artifacts

| Artifact | Location | What it tracks |
|---|---|---|
| catalog-json-degrade-path_NOTE_05-07-26.md | process/features/cozy-21st-mirror/backlog/ | Deferred: whether `apps/web/lib/catalog.ts`'s in-flight QStash/catalog.json pipeline needs its own degrade-path guard (out of this phase's scope; ambient uncommitted state, not touched here). |
| metering-ai-credits-guard_NOTE_05-07-26.md | process/features/cozy-21st-mirror/backlog/ | Deferred: `getAICredits`/`consumeAICredits` in `metering.ts` are not on this crash path and were NOT given fail-open guards — billing/credit surfaces need dedicated review before any fail-open default, not a blanket fix bundled into this phase. |

(Note: these two backlog artifacts were already identified during PLAN-SUPPLEMENT per the Inner Loop Refresh Note; VALIDATE confirms they remain correctly out of this phase's scope and does not re-open them.)

### Known Gaps

None. All 7 Acceptance Criteria have a Fully-Automated proving gate (see Test Gates table above). No vacuously-green behavior — every developed behavior in this phase's blast radius is proven by an automated test, not a Known-Gap residual.

What this coverage does NOT prove:
- The vitest suite does not prove behavior under a live, real Upstash Redis instance in a degraded network state (e.g. slow response, partial timeout) — only full success or full rejection are simulated via mocks. This is an acceptable residual: the try/catch guards catch any thrown/rejected error regardless of cause, so the mechanism generalizes, but the specific "slow but eventually successful" case is not separately exercised.
- Concurrent-request race conditions on the daily-limit counter (e.g. two simultaneous requests both reading `count < limit` before either increments) are not tested — this existed before this fix and is unchanged by it; not a new gap introduced by this phase.
- Real dev-server / browser-level confirmation that the "Something went wrong" boundary no longer fires is not run live in this validate pass — the proof is by code-path inspection (the crash path is entirely inside the two mocked function calls). If EXECUTE or EVL later has dev-server access, a spot-check is low-cost but not required to close this gate.

Gate: PASS (no FAILs, no CONCERNs, plan updates applied — see Proposed Plan Updates Applied above)
Accepted by: session (autonomous, /goal execution) — no concerns required acceptance; net gate is a clean PASS with 0 FAILs / 0 CONCERNs across all 7 dimension/section checks.
