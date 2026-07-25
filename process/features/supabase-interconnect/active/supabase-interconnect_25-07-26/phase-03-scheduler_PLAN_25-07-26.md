---
name: plan:supabase-interconnect-phase-03-scheduler
description: "Supabase Interconnect — Phase 03: Scheduler foundation (embeddings backfill only) + seed data"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: phase-03
---

# Phase 03 — Scheduler Foundation (Embeddings Only) + Seed Data

**Program:** supabase-interconnect
**Umbrella plan:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

Build a plain-crontab-based scheduler (Fork E1) that invokes the Phase 2 embedding functions on a
recurring schedule, deliver every artifact the operator needs to install it as a repo asset, and
hand off the one privileged VPS install step to the user as a documented, non-blocking checkpoint.
**Scope note (session-locked):** this phase schedules the embeddings backfill job ONLY — no
hunt-scoring cron is built, since the 5 hunt-scoring functions are out of scope (see umbrella
`## Out-of-Scope Corrections`). Seed minimal fixtures needed to make the embedding job's dry-run
verifiable; no contest round is seeded (AC8 is descoped).

---

## Entry Gate

- Phase 2 exit gate passed — hard dependency (F3): no scheduler may reference functions that don't
  yet exist, whether in scratch-schema or live form
- Confirmed `pg_cron` is not an installed extension (already established via live-DB audit — no
  re-verification needed)

---

## Blast Radius

- **Step A0 decision-dependent:** possibly ZERO new app code (see Step A0) — if the existing
  `apps/web/app/api/cron/gen-usage-embeddings/route.ts` is reused as-is, the only new file is the
  install artifact + seed SQL. If a standalone script is genuinely justified, new cron script at
  `apps/web/scripts/run-embedding-backfill-cron.ts` (or `ops/` equivalent, matching the repo's
  existing `ops/` script conventions) — invokes `supabase.functions.invoke("generate-embeddings",
  ...)` (NOT a direct OpenAI/Gemini call — see Step A1's clarified call path), calling the Phase 2
  `get_missing_usage_embedding_items` function first
- New crontab entry documentation/install artifact (plain text — a copy-pasteable `crontab -e` line
  or a small install helper script), NOT a systemd unit pair (Fork E1 rejects E3/E4). The line must
  include log redirection and `flock` wrapping (see Step B).
- Minimal seed-data SQL file(s) — idempotent (`ON CONFLICT DO NOTHING` or existence-guarded),
  checked in for auditability (Fork F)

---

## Implementation Checklist

### Step A — Reuse decision + author the cron path

- [ ] **A0. Reuse-vs-author decision (mandatory, first).** Read
      `apps/web/app/api/cron/gen-usage-embeddings/route.ts` fresh. It ALREADY implements almost
      exactly this phase's target behavior: `CRON_SECRET`-guarded (401 on mismatch), non-interactive,
      calls `supabase.rpc("get_missing_usage_embedding_items")` then
      `supabase.functions.invoke("generate-embeddings", {...})` per missing item — the same Phase-2
      function this phase is gated on, and it already reuses the existing edge function rather than
      calling OpenAI/Gemini directly. `apps/web/vercel.json`'s hourly cron declaration points at this
      exact route (it never fires today because the app runs on gayo-vps pm2, not Vercel).
      **Strongly prefer reuse:** the crontab line becomes
      `curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://higherbits.dev/api/cron/gen-usage-embeddings`
      — zero new app code, only the install artifact + a real `CRON_SECRET` on gayo-vps. Only author
      a standalone script (A1-A3 below) if there is a concrete, documented reason the existing route
      cannot be reused (e.g. `maxDuration` insufficient, or a genuine need to run outside the
      Next.js server process). **Document the decision explicitly in the Phase 3 report either way**
      before proceeding to A1.
- [ ] A1. (Only if A0 concludes "author new") Write `apps/web/scripts/run-embedding-backfill-cron.ts`
      (or equivalent), reusing `generate-embeddings.ts`'s existing logic/imports rather than
      duplicating it. **Clarified call path:** the script calls
      `supabase.functions.invoke("generate-embeddings", ...)` — it does NOT call OpenAI/Gemini
      directly. This means **no new secret is needed in `apps/web`'s runtime**: `GEMINI_API_KEY`/
      `ANTHROPIC_API_KEY` live only in the edge function's own Deno env
      (`supabase/functions/generate-embeddings/index.ts`, `ai-config.ts`) and stay there. If a
      direct-provider-call design is ever chosen instead (not recommended), `GEMINI_API_KEY` must be
      explicitly provisioned into `apps/web`'s env as a new prerequisite step — do not fold that into
      an optional env-doc note.
- [ ] A2. Ensure the script (if authored) is runnable via the repo's standard invocation convention —
      `ts-node --project scripts/tsconfig.json scripts/run-embedding-backfill-cron.ts` per
      `apps/web/package.json`'s existing `generate-embeddings` script pattern, NOT plain
      `node file.ts` (Node 22.22.2 cannot run unflagged `.ts` files) — with no interactive input,
      exiting 0 on success and non-zero on failure (for crontab log-visibility).
- [ ] A3. Confirm required env vars (`OPENAI_API_KEY`/Supabase connection vars, or just `CRON_SECRET`
      if A0 concludes reuse) are documented — cross-reference the SPEC's Known Gap about no
      `apps/web/.env.example` existing; consider authoring one as a side effect if AC6's env-var
      needs make it natural (non-blocking, optional).
- [ ] A4. **Batch cap + dry-run (mandatory, applies whether A0 concludes reuse or author-new).** The
      per-item embedding loop calls a paid, rate-limited API — add an explicit item-count cap (env
      var or CLI flag, e.g. default 20/run) and a real `--dry-run` mode that lists missing items
      WITHOUT invoking the edge function/API. If A0 concludes "reuse the existing route," the cap
      and dry-run flag must be added to that route (small, additive change) since it does not
      currently have either; document this as an in-scope addition to the reused route, not a new
      script.

### Step B — Author the install artifact

- [ ] B1. Write the exact `crontab -e` line — either the `curl`-based reuse form from A0, or the
      `ts-node` invocation from A2 if a standalone script was justified — running as the `higherbits`
      user (never root), per deploy memory: install via `su - higherbits`, never `sudo -u` (HOME
      pollution breaks corepack).
- [ ] B2. Document the exact schedule cadence (recommend hourly or daily — confirm against
      `vercel.json`'s original declared cron cadence for continuity if one is stated there).
- [ ] B3. **Log redirection (mandatory).** The crontab line must redirect output to a log file, e.g.
      `>> /home/higherbits/logs/embedding-cron.log 2>&1`, so the operator can confirm success/failure
      without relying on cron's default mail behavior (commonly unconfigured on a fresh VPS). State
      in the README how the operator checks this log to confirm a run happened.
- [ ] B4. **Overlap/concurrency protection (mandatory).** Wrap the crontab command in
      `flock -n /tmp/embedding-cron.lock -c "..."` to prevent two overlapping runs if a slow run is
      still in flight when the next fires. Near-zero cost; do not build a DB-level lock for this
      phase's scope.
- [ ] B5. Write the install artifact as a short `ops/README-embedding-cron.md` (or similar) with:
      the exact crontab line (including the `flock` wrapper and log redirection from B3/B4), the
      working directory, required env vars, the batch-cap/`--dry-run` flag documented (A4), and a
      dry-run command the operator can run manually first to confirm the script works before
      installing the schedule.
- [ ] B6. State explicitly in the artifact: this is the ONE privileged step the user runs personally
      on gayo-vps (`ssh root@72.62.196.231` per deploy memory, then `su - higherbits` for the
      crontab edit) — no agent executes this step.

### Step C — Local dry-run verification

- [ ] C1. Run the cron path locally (or in a disposable environment) against the Phase 2
      scratch-verified functions (or live, if Phase 2's live application was approved) and confirm
      it successfully invokes `get_missing_usage_embedding_items` → calls
      `supabase.functions.invoke("generate-embeddings", ...)` (the edge function itself handles the
      OpenAI/Gemini call internally) without error.
- [ ] C2. Confirm the exit code and log output are crontab-friendly (non-interactive, exits cleanly)
      and that the log-redirection destination from B3 actually receives output.
- [ ] C3. If `OPENAI_API_KEY`/`GEMINI_API_KEY` is not available to the edge function in this session's
      environment (per SPEC Known Gaps), document this as a Known Gap for the dry-run's live-API leg
      specifically — the control flow up to the edge-function invoke can still be verified.
- [ ] C4. Confirm `--dry-run` (A4) correctly lists missing items without invoking the edge function —
      run it once as part of this verification.

### Step D — Seed minimal fixtures for verification (Fork F)

- [ ] D1. Write an idempotent SQL seed file (`ON CONFLICT DO NOTHING` or existence-guarded) adding
      at least one `demos`/`components` row with no existing embedding, so
      `get_missing_usage_embedding_items()` has something real to find during verification.
- [ ] D2. Check the seed file into `supabase/` or `ops/` following the existing repo's seed-file
      pattern (`ops/seed-placeholder-components.mjs` precedent).
- [ ] D3. **No contest round is seeded in this phase** — AC8 is descoped (see umbrella
      `## Out-of-Scope Corrections`); do not create `component_hunt_rounds` seed data here.
- [ ] D4. **HARD STOP — request explicit user approval before running the seed SQL against the live
      database.** Present the exact seed statements for review before execution.

---

## Exit Gate

```bash
# Local dry-run of the cron path (mocked OpenAI/Gemini call acceptable if credentials absent)
# Exact command depends on A0's decision: either a curl against the reused route, or
# `ts-node --project scripts/tsconfig.json scripts/run-embedding-backfill-cron.ts` for a new script
# Expected: exits 0, logs show get_missing_usage_embedding_items → generate-embeddings invoke path

corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: all tests pass, no regression
```

- All Step A-D checklist items checked (including A0's documented reuse-vs-author decision)
- Cron path + install artifact (crontab line w/ `flock` + log redirection + README) delivered as
  repo files (SPEC AC6)
- Local dry-run confirms the path invokes `get_missing_usage_embedding_items` →
  `generate-embeddings` edge-function invoke (SPEC AC6 `proven by:` note)
- `--dry-run` flag and item-count cap verified functional (A4/C4)
- Minimal seed fixtures added (idempotent, checked in) enabling AC7's search-result verification
- Phase report explicitly states the VPS crontab install is NOT YET DONE and is not a blocking gate
  for this program's completion (SPEC AC6, Constraints)
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Phase 2 exit gate not yet passed — hard F3 dependency, cannot proceed.
- `OPENAI_API_KEY`/`GEMINI_API_KEY` genuinely unavailable to the edge function and no mocking
  strategy can meaningfully verify the control flow — document as Known Gap, do not block the whole
  phase; the artifact delivery (Step A/B) and DB-only verification (function calls without the
  embedding-generation leg) can still satisfy most of the exit gate.
- User does not approve the seed SQL (Step D4) — AC7's search-result verification is deferred with
  a documented reason; the cron artifact delivery itself is not blocked by this.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: read Phase 2 report; confirm functions are scratch/live-verified; test context loaded
- [ ] 2. INNOVATE — innovate-agent: confirm Fork E1 (plain crontab) + Fork F (committed idempotent seed SQL) still hold; Decision Summary written; MUST explicitly resolve Step A0's reuse-vs-author decision
- [x] 3. PLAN-SUPPLEMENT — plan-agent: this PVL-supplement pass applied (25-07-26) — Gaps 1-5 addressed via Step A0 (reuse decision), Step A1 (clarified call path, no direct OpenAI/Gemini call), Step A4 (batch cap + dry-run), Step B3 (log redirection), Step B4 (flock overlap protection). All 5 gaps are now first-class checklist items, not just narrative Execute-Agent Instructions.
- [ ] 4. PVL — vc-validate-agent: re-run V1-V7 against this supplemented plan to confirm gaps are closed — see `## Validate Contract` below for the prior CONDITIONAL contract (superseded once re-validation completes)
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first.

**Note on sequencing:** the prior outer PVL pass (25-07-26) found 5 CONCERN-class gaps (P1-P5). This
PLAN-SUPPLEMENT pass folded all 5 into the checklist itself (Steps A0, A1, A4, B3, B4) so they are
binding implementation steps rather than narrative instructions only. A fresh PVL pass (Step 4)
should confirm the gaps are structurally closed before EXECUTE begins.

---

## Touchpoints

- `apps/web/app/api/cron/gen-usage-embeddings/route.ts` (existing — likely reused per A0, possibly
  extended with A4's batch-cap/`--dry-run` addition)
- `apps/web/scripts/run-embedding-backfill-cron.ts` (new, ONLY if A0 concludes a standalone script is
  justified)
- `ops/README-embedding-cron.md` (new install artifact)
- new idempotent seed SQL file (location TBD by execute-agent, following existing `ops/` or
  `supabase/` conventions — `supabase/seed.sql` is the closest existing precedent)

---

## Public Contracts

- No new API routes or public interfaces — this phase delivers an operator-facing install artifact
  and (at most) a small additive change to an existing internal cron route, neither of which is a
  runtime-facing contract for external callers.
- The seed data added is additive-only (idempotent) and does not alter any existing row.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Local dry-run of cron path invokes correct code path | Fully-Automated (DB leg) / Hybrid (embedding-generation leg, may be mocked) | AC6 |
| `--dry-run` flag lists missing items without invoking edge function | Fully-Automated | AC6 (P3 gap closure) |
| Install artifact reviewed for correctness (crontab line incl. `flock` + log redirection, README) | Hybrid | AC6 (P4/P5 gap closure) |
| Search returns results after job run against seeded fixture | Agent-Probe (requires OPENAI_API_KEY/GEMINI_API_KEY + live Qdrant/Supabase) | AC7 |
| Live schedule firing confirmation | Agent-Probe (operator-run, non-blocking) | AC6 |

```bash
# Exact command depends on A0's reuse-vs-author decision — see Exit Gate above
corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test
# Expected: exit 0, DB-leg function calls succeed
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_PLAN_25-07-26.md`
- Last completed step: PLAN-SUPPLEMENT (PVL-supplement pass) — 25-07-26 — Gaps 1-5 addressed
- Validate-contract status: prior CONDITIONAL contract below is superseded by this supplement; a
  fresh PVL pass (Step 4) is required before EXECUTE
- Next step: Spawn vc-validate-agent for a fresh PVL pass (Step 4) — after Phase 2 exit gate
  confirmed. INNOVATE (Step 2, still unrun) must explicitly resolve Step A0's reuse-vs-author
  decision before EXECUTE begins.

---

## Test Infra Improvement Notes

- No vitest coverage exists for the cron pathway today (neither the existing dormant
  `apps/web/app/api/cron/gen-usage-embeddings/route.ts` nor any new script). `apps/web`'s vitest
  config only globs `**/__tests__/**/*.test.ts` — a bare `scripts/*.ts` file is never auto-covered by
  `corepack pnpm --filter web test` regardless of what gets authored. If any pure/extractable logic
  (arg parsing, batch-cap logic, missing-item filtering) is added, it should live in a small module
  under `apps/web/lib/` or `apps/web/scripts/` with a companion `__tests__/*.test.ts` file so it is
  picked up automatically.

---

## Validate Contract

Status: CONDITIONAL (prior pass — superseded by this PLAN-SUPPLEMENT; re-validation pending)
Date: 25-07-26
date: 2026-07-25
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: Score 2/7 (S4 phase-program classification, S6 high-risk data-mutation/schema-adjacent
class named at umbrella level) → nominal MEDIUM-tier signal would suggest parallel subagents (4
Layer 1 + 1 Layer 2 = 5 agents), but this validate-agent instance has no Agent/Task spawn tool
available in its own tool grant for this invocation — the four Layer 1 dimension checks and the
single Layer 2 section check were performed sequentially by this agent using Read/Bash fact-finding
(Deep-Mode-equivalent: read all program artifacts, ran the plan-artifact/phase-stub/umbrella
validators, traced the actual `apps/web/app/api/cron/gen-usage-embeddings/route.ts` +
`supabase/functions/generate-embeddings/index.ts` code paths, grepped `GEMINI_API_KEY`/`CRON_SECRET`
across the repo, confirmed the Node 22.22.2 toolchain and the `ts-node` script-invocation
convention). Findings quality is not degraded by the missing spawn tool; only wall-clock
parallelism is.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC6 (predecessor F3) | Cron pathway's DB-leg control flow (`get_missing_usage_embedding_items` → per-item loop) reaches the RPC boundary without throwing | Fully-Automated | Exact invocation depends on Step A0's decision — if reuse, an integration test against the existing `apps/web/app/api/cron/gen-usage-embeddings/route.ts` handler; if author-new, `ts-node --project scripts/tsconfig.json` invocation per the repo's `generate-embeddings` script convention — NOT plain `node file.ts` (Node 22.22.2 cannot run unflagged `.ts` files). | B |
| AC6 | No regression | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` && `corepack pnpm --filter web test` | A |
| AC6 | `--dry-run` flag + batch cap functional (Step A4) | Fully-Automated | Run `--dry-run` once, confirm no edge-function invocation occurs; confirm cap is respected | B |
| AC6 | Install artifact correctness (crontab line incl. `flock` wrapper + log redirection, README, env vars) | Hybrid | Manual review of `ops/README-embedding-cron.md` + the exact crontab line, checked against Steps B3/B4 | B |
| AC6 (predecessor) | Full local dry-run including the embedding-generation leg | Hybrid — precondition: Phase 2 functions verified (scratch or live) + `OPENAI_API_KEY`/`GEMINI_API_KEY` reachable to the edge function | Local/disposable run against seeded fixture (Step D1) | B |
| AC7 | Search returns non-empty results after a real job run | Agent-Probe — requires live `OPENAI_API_KEY`/`GEMINI_API_KEY` + live Qdrant/Supabase (currently absent per SPEC Known Gaps) | Operator/agent-run job against seeded fixture, then `/api/search` check | D — named residual; may end INCONCLUSIVE if no live key is ever provisioned this program |
| AC6 | Live schedule firing on gayo-vps | Agent-Probe — operator-only, non-blocking per SPEC Constraints | Operator confirms post-install | D — named residual; explicitly non-blocking for program completion |
| — | Concurrent cron-run overlap protection | Hybrid (was Known-Gap; now closed via Step B4) | Manual review of the `flock`-wrapped crontab line | B |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

Legacy line form (retained so existing validate-contract consumers still parse):
- Cron path DB-leg control flow: Fully-automated: reused route integration test OR `ts-node --project scripts/tsconfig.json scripts/run-embedding-backfill-cron.ts` (per A0 decision) | Hybrid: embedding-generation leg requires reachable credentials to the edge function | agent-probe: search-result verification (AC7), live cron firing (AC6) | Hybrid: concurrent-run locking via `flock` (Step B4, reviewed not executed)

Dimension findings (from prior outer-PVL pass, 25-07-26 — gaps below now addressed by this PLAN-SUPPLEMENT):
- Infra fit: CONCERN → ADDRESSED — Step A2 now specifies the `ts-node --project scripts/tsconfig.json` convention explicitly (if a new script is authored); Step A0 makes reuse of the existing route the default path, sidestepping the issue entirely in the common case.
- Test coverage: CONCERN (unresolved) — zero existing test coverage for the cron pathway either via the dormant route or a new script; `apps/web`'s vitest glob (`**/__tests__/**/*.test.ts`) never auto-covers a bare `scripts/*.ts` file regardless of what's authored — see `## Test Infra Improvement Notes` above. Not closed by this supplement (test-authoring is an EXECUTE-time action); the new `--dry-run`/batch-cap logic (A4) should live in a small testable module per the Test Infra note.
- Breaking changes: PASS — no schema/API/auth contract changes; seed data is additive-only; no existing function signature altered by this phase.
- Security surface: PASS — `CRON_SECRET` is a local-only placeholder in gitignored `.env`/`.env.local` (not a live secret exposure); D4's hard-stop before live seed insert is correctly gated; no secrets logged per the established `ops/` convention. Note: whichever approach ships (reused route or new script) must resolve to a REAL `CRON_SECRET` value on gayo-vps before the crontab call will authenticate — this is a deploy-time action, not a code gap.
- Section feasibility (Phase 03 — Scheduler + Seed): CONCERN → ADDRESSED — the 5 gaps (P1-P5) are now first-class checklist steps (A0, A1, A4, B3, B4) rather than narrative-only Execute-Agent Instructions.

Open gaps (STATUS: addressed by this PLAN-SUPPLEMENT pass; awaiting fresh PVL confirmation):
- **P1 — Existing code not discovered/reused → CLOSED via Step A0.** Step A0 now mandates reading
  `apps/web/app/api/cron/gen-usage-embeddings/route.ts` first and strongly prefers reuse (curl-based
  crontab line, zero new app code) over authoring a duplicate script. The decision must be documented
  in the Phase 3 report.
- **P2 — Internal contradiction on the embedding-generation call path → CLOSED via Step A1.** Step A1
  now states explicitly: the call path is `supabase.functions.invoke("generate-embeddings", ...)`,
  NOT a direct OpenAI/Gemini call — no new secret is needed in `apps/web`'s runtime.
  `GEMINI_API_KEY`/`ANTHROPIC_API_KEY` stay in the edge function's Deno env only.
- **P3 — No batch cap / cost control / dry-run flag → CLOSED via Step A4.** Explicit item-count cap
  (default 20/run) and a real `--dry-run` mode are now mandatory checklist items, applying to
  whichever path A0 selects (including an additive change to the existing route if reused).
- **P4 — No observability / log destination → CLOSED via Step B3.** Log redirection
  (`>> /home/higherbits/logs/embedding-cron.log 2>&1`) is now a mandatory checklist item with an
  explicit operator-facing confirmation method documented in the README.
- **P5 — No overlap/concurrency protection → CLOSED via Step B4.** `flock -n /tmp/embedding-cron.lock`
  wrapping is now a mandatory checklist item, documented in the README.
- **Phase 2 hard dependency (F3) is unmet today (UNCHANGED — sequencing gate, not a plan-quality gap).**
  Umbrella Program Status Table shows Phase 2 as `⏳ PLANNED` (not yet executed) — Phase 2's own
  `## Validate Contract` is still the placeholder. **Execute-agent instruction / orchestrator note:**
  do not spawn vc-execute-agent for this Phase 3 plan until Phase 2's exit gate (4 `CREATE FUNCTION`
  migrations verified against scratch/seeded schema) is confirmed passed.
- **Hunt-scoring scope check (session lock, confirmed clean, unchanged):** the plan's Purpose, Blast
  Radius, and Implementation Checklist all correctly scope to the embeddings job only — no
  hunt-scoring cron entry, no `component_hunt_rounds` seeding (Step D3 explicit exclusion). No FAIL
  on scope creep.
- **Structural plan-artifact check (informational, not a real gap, unchanged):**
  `node .claude/skills/vc-generate-plan/scripts/validate-plan-artifact.mjs` reports FAILs for
  missing SIMPLE/COMPLEX-plan metadata — this is the wrong validator for a phase-program sub-plan;
  the correct validator, `node .claude/skills/vc-generate-phase-program/scripts/validate-phase-stub.mjs`,
  passes with 0 failures/0 warnings, as does the umbrella validator on the umbrella plan. No action
  needed.

What this coverage does NOT prove:
- The Fully-Automated DB-leg control-flow test proves the path reaches the RPC/edge-function-invoke
  call boundary without throwing — it does NOT prove the embedding-generation leg (the edge
  function's internal OpenAI/Gemini call) succeeds, since that leg's tier is Hybrid/Agent-Probe
  depending on credential availability inside the edge function's own Deno env.
- The Hybrid full-dry-run test proves the chain end-to-end against a scratch/seeded schema — it does
  NOT prove production cron scheduling actually fires on gayo-vps (that is AC6's Agent-Probe leg,
  operator-confirmed, explicitly non-blocking per SPEC).
- The Agent-Probe search-result check proves AC7 only if a live `OPENAI_API_KEY`/`GEMINI_API_KEY` and
  live Qdrant/Supabase connection are available this program — per SPEC Known Gaps, this may end
  INCONCLUSIVE rather than pass.
- The Hybrid review of the `flock`-wrapped crontab line proves the artifact is *correctly specified*
  — it does NOT prove concurrent-run safety under load, since no automated test exercises two
  overlapping cron firings.
- No test in this plan proves the install artifact is followed correctly by the human operator —
  Hybrid review proves the artifact is *correct*, not that it will be *executed* correctly.

Gate: CONDITIONAL (prior pass; 0 FAILs; 5 CONCERN-class gaps — P1-P5 — now closed via this
PLAN-SUPPLEMENT's checklist additions; Phase-2 hard dependency remains a sequencing gate, not a
plan-quality FAIL). **A fresh PVL pass (Phase Loop Progress Step 4) should confirm this gate can be
upgraded to PASS before EXECUTE begins.**
Accepted by: session (autonomous — see prior pass's rationale; this supplement was authored per an
explicit SUPPLEMENT REQUEST listing all 5 gaps by section/concern/severity/suggested-addition)

## Autonomous Goal Block

(BRANCH B — this phase belongs to the `supabase-interconnect` phase program, which has an umbrella
plan containing `## Stable Program Goal` at
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md`.
Per the BRANCH B rule, no separate `## Autonomous Goal Block` is written into this phase plan — the
umbrella's `## Stable Program Goal` governs. Reference for latest state: the umbrella plan path
above, `## Current Execution State` section.)
