---
name: plan:supabase-interconnect-umbrella
description: "Supabase Interconnect — umbrella/orchestration plan for the 6-phase program"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: umbrella
---

# Supabase Interconnect — Umbrella Plan

**Date:** 25-07-26
**Complexity:** COMPLEX
**Status:** ⏳ PLANNED

- Program type: PHASE PROGRAM (6 phases; 1→2→3 sequential, 4∥5 parallel-safe, 6 last)
- Date: 25-07-26
- Feature folder: `process/features/supabase-interconnect/`
- SPEC: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect_SPEC_25-07-26.md`

---

## Program Goal Charter

```
Supabase Interconnect — Program Goal Charter

North star:
- Every browser-facing Supabase call, background job, nav link, and billing path actually does
  what its code and label claim, verified against the LIVE database — no new product features,
  only repair + connect + document what already exists (or is a hard AC5 predecessor function).

Definition of done (an unattended agent must be able to do all of these):
1. Grant a bookmark from the component detail page or preview dialog and have it persist across
   reload, with zero 42501 errors across all 41 browser-client files (live-verified).
2. Point at any of the 4 embedding functions (get_missing_usage_embedding_items, insert_embedding,
   insert_code_embedding, vec_dim) and find a matching version-controlled CREATE FUNCTION in
   supabase/migrations/, invocable against a scratch/seeded schema without error.
3. Hand the operator one crontab install command (backed by a delivered, locally-verified script)
   that will run the embedding backfill job on a schedule once installed.
4. Click any main-nav item and land on the one page the label promises — no route/tab disagreement.
5. As a Lemon Squeezy subscriber fixture, hit /settings/billing and get routed to LS-aware
   cancel/invoice endpoints, not silently redirected to Stripe-only code.
6. Diff apps/web/types/supabase.ts against the live pg_proc/pg_class catalogs and get zero gaps in
   either direction for anything apps/web actually calls.

What "verified" means (program level):
- Each phase's acceptance criteria (traced to the SPEC's numbered ACs) are proven by the tier
  named in the SPEC's `strategy:` tag (Fully-Automated / Hybrid / Agent-Probe) — never by a
  Known-Gap-only gate for developed behavior (vacuous-green ban).
- validate-contract gates must be recorded alongside phase gates and regression evidence for a
  phase to reach VERIFIED. A phase without a validate-contract (or documented skip reason) cannot
  be marked VERIFIED.
- Data-dependent criteria (contest leaderboard, billing history, bookmarks list) are verified as
  "wiring is correct given seeded/real data" per the SPEC's Cross-Cutting Requirement — an
  acceptance criterion is unprovable against a genuinely empty table, so the implementing phase
  seeds minimal fixtures as part of its own verification step.

Scope tiers → phase mapping:
- Tier 1 (confirmed live prod bug — grants/RLS) → Phase 1
- Tier 2 (F3 dependency: 4 embedding DB functions authored before any scheduler) → Phase 2
- Tier 3 (scheduler + embeddings-only backfill job + seed data) → Phase 3
- Tier 4 (navigation truth) → Phase 4
- Tier 5 (billing unification) → Phase 5
- Tier 6 (schema source of truth + doc correction) → Phase 6
- This program retires Tiers 1-6 as scoped by the SPEC's 14 acceptance criteria (AC5's hunt-scoring
  half is explicitly descoped this session — see Out-of-Scope Corrections below).

Explicitly out of scope (deferred tier):
- Collection membership UI, creator-payout write path, referral program, bundle purchases (SPEC
  Out of Scope).
- Hunt/contest scoring engine (5 functions: update_all_hunt_scores, process_next_round,
  process_single_round, update_single_demo_score, update_hunt_demos_metrics) — user-locked
  descope this session; see "Out-of-Scope Corrections" below and the backlog note.
- Deleting dead tables/orphaned views/RPCs — documented, not dropped.
- Historical embedding backfill at scale; live-provider billed feasibility probes; authoring any
  DB function beyond the 4 embedding functions now in scope.

Hard safety constraints (non-negotiable, per phase):
- Never run DDL against the live production database without explicit user approval for that
  specific statement — Phase 1/2/6 SQL work is authored + verified against a scratch/seeded
  schema or via read-only introspection first; live application of grants/migrations requires an
  explicit user go-ahead documented in that phase's report.
- The VPS crontab install step (Phase 3) is executed by the user personally on gayo-vps — never
  by an agent. The program is not blocked on the user completing it.
- Do not clobber or duplicate the ~45 uncommitted working-tree files, especially the WIP
  useCategoryTagCounts()/sidebar-layout.tsx work Phase 4 must reconcile with, not overwrite.
- Any code change ships only via the documented gayo-vps pm2 deploy procedure — never Vercel,
  despite vercel.json's presence. No phase in this program performs a live deploy; deploy is a
  separate, explicitly user-authorized action outside this program's scope.
- Dual-write safety: Phase 5's billing fix must not weaken existing webhook signature verification
  or the existing payment_status allow-list gate.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context
  commits separate from execution commits.
```

---

## Out-of-Scope Corrections (session-locked, supersedes SPEC AC5 in part)

The SPEC's AC5 names 9 functions. **This session's INNOVATE/PLAN pass dropped the 5 hunt-scoring
functions from active scope** after Fork B investigation proved the upstream `manfromexistence/ui`
repo contains only 2 migration files and none of the named functions — porting is impossible, and
authoring them from scratch (inventing ranking math + a round lifecycle for a feature with zero
historical rounds/votes/scores) was classified as new product work by the user, not a repair.

Consequences encoded in this program:

- **Phase 2** authors only the **4 embedding functions**: `get_missing_usage_embedding_items`,
  `insert_embedding`, `insert_code_embedding`, `vec_dim`.
- **Phase 3**'s scheduler runs only the **embeddings backfill job**. No hunt-scoring cron.
- **Phase 6** deletes the 5 phantom hunt-scoring functions from `apps/web/types/supabase.ts`
  rather than implementing them; contest/leaderboard stays documented-dormant.
- **SPEC AC8 (leaderboard renders rankings) is DESCOPED.** No phase in this program satisfies AC8.
  Contest revival is recorded as a backlog candidate:
  `process/features/supabase-interconnect/backlog/hunt-scoring-engine_NOTE_25-07-26.md`.
- Phase 3's seed-data work no longer needs a contest round (AC8's seeding requirement drops with
  it); Phase 3 still seeds fixtures needed for AC6/AC7 (embedding job dry-run) verification.

All other SPEC acceptance criteria (AC1-AC7, AC9-AC14) remain in scope as written.

---

## Stable Program Goal (copy-paste this to start autonomous execution)

```
SESSION GOAL: supabase-interconnect — Supabase Interconnect
Ref: process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md

TARGET: Complete ALL 6 phases until:
- Phase 1: authenticated grants cover all 41 browser-client files; live 42501 audit clean
- Phase 2: 4 embedding functions exist as CREATE FUNCTION in supabase/migrations/, verified locally
- Phase 3: cron script + install artifact delivered; embedding job dry-run confirmed; fixtures seeded
- Phase 4: every nav item resolves to one destination; sidebar counts are live-queried
- Phase 5: LS-aware billing routing verified via fixtures; dual-webhook mutual exclusion tested
- Phase 6: types.ts matches live DB (33 fns/4 views/41 tables); 3+ all-context.md claims corrected
- Test tiers: automated (iterate-until-green) / hybrid (fix-if-in-blast-radius) / agent-probe (record-judgment)
- Known-Gap is never a terminal PASS for developed behavior — vacuous-green ban applies throughout

AUTONOMY: Before ANY subagent spawn, read:
1. Umbrella ## Current Execution State → loop step + validate-contract status
2. Phase plan ## Phase Loop Progress → first unchecked box = next subagent to spawn

PER-PHASE LOOP (7-step inner loop R -> I -> P -> PVL -> E -> EVL -> UP, never skip, never reorder; SKIPS SPEC):
  1. RESEARCH -> 2. INNOVATE -> 3. PLAN-SUPPLEMENT -> 4. PVL -> 5. EXECUTE -> 6. EVL -> 7. UPDATE-PROCESS
- PLAN-SUPPLEMENT: plan-agent writes research/innovate gaps into phase plan (or marks "n/a — clean")
- PVL NEVER skipped; contract must follow example-validate-output.md full format; partial contract = blocked
- Every subagent FIRST ACTION: run vc-context-discovery + vc-plan-discovery
- Every phase-END: invoke vc-agent-strategy-compare for next step strategy recommendation

Report via phase reports. No approval between phases unless hard stop hit.

HARD STOPS (pause, wait for user):
- Any live DDL/data write against production Supabase without explicit per-statement user approval
- The VPS crontab install step — operator-only, never agent-executed
- Net gate = BLOCKED with no backlog resolution path
- Validate-contract is placeholder and vc-validate-agent cannot run

SAFETY (never override):
- Never mutate live production DB without explicit approval for that specific statement
- Never duplicate/clobber the ~45 uncommitted files, esp. useCategoryTagCounts()/sidebar-layout.tsx WIP
- Never deploy — deploy is a separate user-authorized action outside this program
- Commit each phase before advancing; process and execution commits separate

TEST GATES (every phase exit; see phase plans for exact per-phase gate commands):
  corepack pnpm --filter web exec tsc --noEmit
  corepack pnpm --filter web test
  node .claude/skills/vc-audit-vc/scripts/validate-agent-parity.mjs
  node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs

VALIDATE CONTRACT: Per-phase contracts written by vc-validate-agent into each phase plan before EXECUTE.

START: Phase 1, loop step RESEARCH (pending). Spawn vc-research-agent for Phase 1.
```

---

## Phase Sequence

| Phase | Plan file | Scope summary | Depends on |
|---|---|---|---|
| 0 (pre-program) | this file | Confirm folder structure, baseline audit, create sub-phase plans | — |
| 1 — Grant/RLS repair | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md` | Extend `restore-authenticated-grants.sql` for `demo_bookmarks`/`prompt_rules`/`demo_hunt_leaderboard`, per-table RLS decision for `plans`/`component_analytics`/`collections`/`feedback`, revoke `templates` anon writes, verify live | Phase 0 |
| 2 — Embedding DB functions | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_PLAN_25-07-26.md` | Author 4 embedding functions as version-controlled migrations, verify against scratch/seeded schema | Phase 1 |
| 3 — Scheduler + seed | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_PLAN_25-07-26.md` | crontab script + install artifact for embeddings backfill job only; seed minimal fixtures for AC6/AC7 verification | Phase 2 (hard — on **scratch-verified** functions; see correction note below) |
| 4 — Navigation | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_PLAN_25-07-26.md` | Resolve tab-vs-route conflicts (`/templates`), reconcile with WIP `useCategoryTagCounts()`, fix sidebar counts | Phase 1 |
| 5 — Billing unification | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_PLAN_25-07-26.md` | Provider-aware cancel/invoice routing on `/settings/billing`; dual-webhook mutual-exclusion guarantee | Phase 1 |
| 6 — Schema source of truth | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_PLAN_25-07-26.md` | Regenerate `types.ts` from live DB; confirm `supabase/migrations/` covers every called RPC; delete 5 phantom hunt-scoring types entries; correct `all-context.md` stale claims | Phases 1-5 (baseline must include Phase 2's new functions; absorbs tsc fallout last) |

**Correction (26-07-26, recorded at Phase 03's UPDATE PROCESS close):** the "Phase 3 (hard —)"
dependency in the table above was, until this correction, phrased more strictly than the phases'
own gates ever required — an earlier revision of this umbrella claimed Phase 3 was blocked until
Phase 2's SQL was *applied to the live database*. That was wrong. Phase 2's own Exit Gate and
Phase 3's own Entry Gate/validate-contract both accept Phase 2's **scratch-verified** proof (the
real `0001_embedding_functions.sql` migration run end-to-end through
`ops/pglite-verify-embedding-functions.mjs`, EVL-audited) as sufficient to satisfy the F3
dependency — a live apply was never actually required to start Phase 3. An orchestrator ruling on
26-07-26 (recorded verbatim in `phase-03-scheduler_PLAN_25-07-26.md`'s "Orchestrator ruling"
section) resolved the conflict in favor of the phase plans' gate text over this file's stricter
prose, and Phase 3 proceeded on that basis — it has since completed with all gates green and
without any live database connection, vindicating the ruling. **Root cause, for future phases:**
this umbrella's closeout narrative had drifted stricter than the validate-contracts and entry/exit
gates it was meant to summarize, and a later phase read the narrative first instead of the
governing gate text. The old wording is not deleted — it is superseded here, and downstream phases
should treat entry/exit gate text as authoritative over this table's prose whenever the two
disagree.

### Join Conditions

- Phase 1 MUST NOT start until Phase 0 exit gate passes.
- Phase 2 MUST NOT start until Phase 1 exit gate passes (grants must be sane before authoring
  functions that will be called through the same relations).
- Phase 3 MUST NOT start until Phase 2 exit gate passes (F3 hard dependency — no scheduler wired
  to non-existent functions).
- **Phase 4 and Phase 5 are PARALLEL-SAFE** — both depend only on Phase 1, touch disjoint file
  sets (Phase 4: `hooks/use-navigation.ts`, `lib/atoms.ts`, `lib/navigation.ts`,
  `components/features/main-page/sidebar-layout.tsx`, `app/templates/`; Phase 5:
  `app/settings/billing/`, `app/api/lemonsqueezy/`, `app/api/stripe/`, `lib/lemonsqueezy.ts`,
  `lib/stripe.ts`). May run as parallel-subagent or agent-team fan-out once Phase 1 exits.
- Phase 6 MUST NOT start until Phases 1-5 exit gates all pass — it must baseline against Phase 2's
  new functions and absorb tsc fallout only after everything else has settled.

---

## Pre-PVL Conflict Resolution

Phase 4 and Phase 5 are declared **parallel-safe** — no shared package or file overlap:

| Phase | Owned packages/paths |
|---|---|
| Phase 4 | `apps/web/hooks/use-navigation.ts`, `apps/web/lib/atoms.ts`, `apps/web/lib/navigation.ts`, `apps/web/components/features/main-page/sidebar-layout.tsx`, `apps/web/app/templates/`, `apps/web/lib/queries.ts` (sidebar-count reads only, reconciled with WIP `useCategoryTagCounts()`) |
| Phase 5 | `apps/web/app/settings/billing/`, `apps/web/app/api/lemonsqueezy/`, `apps/web/app/api/stripe/`, `apps/web/lib/lemonsqueezy.ts`, `apps/web/lib/stripe.ts` |

No package conflicts identified between Phase 4 and Phase 5 — both parallel-safe. Phases 1, 2, 3,
and 6 are sequential and touch disjoint surfaces from 4/5 (Supabase SQL/migrations, cron scripts,
and `types.ts`/`all-context.md` respectively) — no conflicts identified across the full phase set.

---

## Per-Phase Entry / Exit Gates

| Phase | Entry | Exit gate |
|---|---|---|
| 0 | Program start | Phase plan files created; SPEC/INNOVATE decisions recorded |
| 1 | Phase 0 complete | Live `information_schema.role_table_grants` query shows all confirmed-missing relations granted; `BookmarkButton` interaction check passes; `templates` anon write grants revoked |
| 2 | Phase 1 exit met | 4 `CREATE FUNCTION` definitions exist in `supabase/migrations/`; each invokes without error against a scratch/seeded schema |
| 3 | Phase 2 exit met | Cron script + systemd/crontab unit + install command delivered as repo artifacts; local dry-run of script confirmed to invoke the same code path as `generate-embeddings.ts` + the new Phase 2 functions; minimal fixtures seeded |
| 4 | Phase 1 exit met | Automated route-reachability check shows every nav-declared destination resolves to one page; sidebar counts render from a live-query hook, not hardcoded values; WIP reconciled not duplicated |
| 5 | Phase 1 exit met | Fixture-based test asserts correct cancel/invoice routing per provider; unit test confirms webhook mutual exclusion |
| 6 | Phases 1-5 exits met | `types.ts` diffed against live catalogs shows zero gaps for anything `apps/web` calls; `supabase/migrations/` covers every called RPC; ≥3 `all-context.md` stale claims corrected; `vc-audit-context` passes |

---

## Per-Phase Loop

Each phase executes the canonical 7-step inner loop `R → I → P → PVL → E → EVL → UP`. This inner
loop SKIPS SPEC — SPEC runs once in the outer program loop, not per phase. The 7 steps map to:

1. **RESEARCH** — spawn research-agent: load context, read prior phase reports, check plan drift, document findings
2. **INNOVATE** — spawn innovate-agent: decide approach; write Decision Summary (chosen approach + rejected alternatives)
3. **PLAN-SUPPLEMENT** — spawn plan-agent: if research/innovate found gaps/pre-conditions not in checklist, add them; otherwise mark "n/a — research clean" and tick step 3
4. **PVL** — spawn vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` format (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
5. **EXECUTE** — spawn vc-execute-agent per approved plan and validate-contract
6. **EVL** — spawn vc-tester: run phase test gates to green; register follow-up stubs; write EVL HANDOFF SUMMARY
7. **UPDATE-PROCESS** — write phase report to durable report path, rewrite umbrella `## Current Execution State` section (overwrite, not append — git history is the audit log)

**PVL is NEVER skipped.** A placeholder `## Validate Contract` = blocked. Do not spawn execute-agent while the Validate Contract section reads "(placeholder — vc-validate-agent writes this section before EXECUTE)".

**Live-DB actions inside the loop:** Phase 1/2/6's PVL and EXECUTE steps that touch the live
production database must gate on the "Never run DDL against the live DB without explicit user
approval" hard safety constraint — RESEARCH/INNOVATE/PLAN work is desk work against the recorded
audit findings and scratch/seeded schemas; only the final live-verification query/application step
needs a live connection, and that is Agent-Probe per the SPEC's own strategy tags.

---

## Autonomous Execution Rules (During /goal)

During /goal execution of a phase program:
- Agent self-decides at all V5 gates — no user approval needed between phases
- CONDITIONAL net gate: proceed autonomously, fixes applied in-flight, gaps on record
- BLOCKED net gate: document items in backlog, continue with remaining phase plans; backlog is always a valid resolution — always find a path forward
- Hard stops (must pause for user approval):
  - Any live DDL/data write against production Supabase without explicit per-statement approval
  - The VPS crontab install step (Phase 3) — operator-only
  - Plan file explicitly marks "pause required" at a step
- Agent writes phase reports, updates phase plans, creates new sub-plans as needed — all autonomously
- The phase report is the communication channel for conflicts, errors, and learnings — not inline questions

---

## Global Constraints

- Never lower the existing vitest/tsc/build gate baseline — no phase may regress the current green state.
- Never widen any allowlist (grants, RLS policies, anon privileges) beyond what SPEC AC1/AC3/AC13 name without explicit user approval.
- After every phase that touches agent/skill files, run the parity validator and confirm it exits 0 before declaring the phase DONE.
- Commit each phase's execution changes before starting the next phase. Keep process/plan/context commits separate from execution commits.
- Wiring-correctness vs data-presence must be distinguished in every test/verification artifact (Cross-Cutting Requirement) — a passing test against an empty table proves nothing.

---

## Durable Report Destinations

| Phase | Report path (inside task folder) |
|---|---|
| 0 (pre-program) | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-00-planning_REPORT_25-07-26.md` |
| 1 — Grant/RLS repair | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_REPORT_{dd-mm-yy}.md` |
| 2 — Embedding functions | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_REPORT_{dd-mm-yy}.md` |
| 3 — Scheduler + seed | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_REPORT_{dd-mm-yy}.md` |
| 4 — Navigation | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_REPORT_{dd-mm-yy}.md` |
| 5 — Billing unification | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_REPORT_{dd-mm-yy}.md` |
| 6 — Schema source of truth | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_REPORT_{dd-mm-yy}.md` |

---

## Program Status Table

| Phase | Status |
|---|---|
| 0 — Pre-program (plan creation) | ✅ COMPLETE |
| 01 — Grant/RLS repair | 🧪 TESTING — code-complete; live verification blocked on Step C3 user approval |
| 02 — Embedding DB functions | 🧪 TESTING — code-complete, locally verified for real (11/11 pglite harness, EVL-confirmed); live application deferred behind Step C5 user approval |
| 03 — Scheduler + seed | 🧪 TESTING — code-complete, locally verified for real (73/73 vitest incl. 11 new; tsc 0 errors; EVL-confirmed); crontab install + seed apply are operator-only and outstanding |
| 04 — Navigation | 🧪 TESTING — code-complete, EVL-confirmed (82/82 vitest, tsc clean); e2e/a11y residuals in backlog |
| 05 — Billing unification | 🧪 TESTING — code-complete, EVL-confirmed after 1 fix cycle (CRITICAL fifth-writer defect found by independent review, closed, re-verified; 113/114 vitest, tsc clean); no live-provider/live-DB verification possible |
| 06 — Schema source of truth | ⏳ PLANNED |

Status values: ⏳ PLANNED | 🔨 CODE DONE | 🧪 TESTING | ✅ VERIFIED | 🚧 BLOCKED | ✅ COMPLETE

---

## Program-Wide Learnings (carried forward from Phase 01, 26-07-26)

Cross-phase methodology findings Phase 01 surfaced — apply these to Phases 02-06 as they run.
Full detail: `phase-01-grant-repair_REPORT_26-07-26.md` §Program-Wide Learnings.

1. **Audit Supabase call sites via recursive local-import closure, not a flat per-file grep.** A
   flat grep across browser-client seed files misses relations reached through shared query-helper
   modules (e.g. `apps/web/lib/queries.server.ts`). Phase 01's corrected method (seed files →
   recursive local-import closure to fixpoint → classify each `.from()`/`.rpc()` call site as
   `authenticated` / `anon` / service-role) found 3 relations a flat grep missed across 4 PVL
   cycles before the fix.
2. **Grep-verify every claimed supplement edit before trusting it.** PLAN-SUPPLEMENT / EXECUTE
   supplement cycles have claimed edits that were never written to disk. Verify with grep after
   every supplement cycle, not just after execute.
3. **Prefer line-splice edits over ambiguous string-anchor replace on plan files.** A string-anchor
   replace on `"## Validate Contract"` matched a prose mention instead of the heading and deleted
   ~6 sections in one cycle. Anchor plan-file edits on exact line numbers from a fresh `Read`.
4. **Commit task-folder artifacts early.** An uncommitted task folder has no diff baseline to
   recover from if a supplement cycle corrupts a file (see #3). Commit regularly across PVL/EVL
   cycles, not only at phase close.
5. **Postgres grant semantics for any Phase 02-06 SQL:** a column-scoped `GRANT UPDATE (cols)`
   does not remove a pre-existing table-level `GRANT UPDATE` — REVOKE must precede it in file
   order. `EXECUTE` defaults to `PUBLIC` on function creation, so an explicit `GRANT EXECUTE` is
   defensive documentation, not a corrective fix — don't over-claim it as closing a live bug.

## Program-Wide Learnings (carried forward from Phase 02, 26-07-26)

6. **Doing RESEARCH and INNOVATE before the contract is written is what made Phase 02 cheap.**
   Phase 01 needed five PVL cycles to reach a gate; Phase 02 needed one, reaching `PASS` outright
   (not just `CONDITIONAL`). The difference was not luck — Phase 01's outer contract was written
   before the surface had been audited with an adequate method, so each cycle exposed the next
   layer. Phase 02 entered PVL with research, innovate, and a feasibility probe already done and
   folded into the plan via the Inner Loop Refresh Note mechanism.
7. **A cheap-local feasibility probe converts the riskiest assumption into evidence before PVL
   can bless it.** Phase 02's "verified locally" target rested on an unproven pglite premise; no
   container runtime is available in this environment, so the fallback would have been a
   static-only check — exactly the vacuous green this program bans. One scratchpad probe
   (`pglite-local-verification_FEASIBILITY_26-07-26.md`) made the real thing achievable and handed
   EXECUTE the exact package names, export name, and the `CREATE ROLE service_role;` bootstrap
   line needed. Apply this pattern to Phase 6's schema-introspection work, which will hit the
   identical "no live DB connection, no container runtime" constraint.
8. **Grep-driven completeness beats re-reading the plan.** Both of Phase 02's PVL findings
   (an already-wired caller the plan never referenced, and a missing evidence citation) came from
   repo-wide grep during the validate pass, not from re-reading the plan text. Grep for every
   function/table name a phase's SQL touches before trusting the plan's own reference list is
   complete.
9. **`apps/web/types/supabase.ts` is not ground truth — it is stale in both directions.** Two of
   Phase 02's 4 function signatures in `types.ts` are phantoms (`insert_code_embedding`'s 6-arg
   entry references a `code` column that does not exist on `code_embeddings`). Derive signatures
   from real call sites and tracked SQL, never from `types.ts`. Phase 6 owns correcting the file
   from the real functions, not the other way around.
10. **Baselines move under you — re-measure at the start of each phase.** The tsc/vitest baseline
    documented at Phase 02's hand-off was stale in the *better* direction: a concurrent session
    (outside this program) fixed the 4 foreign tsc errors and 5 vitest failures Phase 01 had
    recorded. Trust a fresh measurement over the documented figure at the start of every phase,
    not just when something looks worse than expected.

## Program-Wide Learnings (carried forward from Phase 03, 26-07-26)

11. **Documented baselines in this repo go stale within hours, not days.** The tsc baseline moved
    three times within this single program — 4 foreign errors → 0 → 1 (a *different* line number
    on the same file) → 0 again — all from concurrent uncommitted work outside this program's
    blast radius. This is now a recurring pattern across three consecutive phases, not an anomaly.
    Every phase must re-measure the gate baseline at EXECUTE start rather than trusting the
    hand-off figure, no matter how recently it was recorded.
12. **Closeout narrative can drift stricter than the gates it summarizes — and the drift itself is
    a defect to fix, not just route around.** This file's Phase Sequence table claimed Phase 3 was
    hard-blocked on Phase 2's *live* apply; the phase plans' own Entry/Exit Gates and
    validate-contracts never actually required that. The orchestrator ruled the gate text governs
    (see the correction note under Phase Sequence above) and Phase 3 proceeded and completed clean
    — but a later phase reads this umbrella's narrative before it reads the gate text of two other
    files, so the mismatch was a live hazard, not a harmless technicality. Apply this check to
    Phases 4-6: when this file's prose and a phase plan's own gates disagree, fix the umbrella's
    prose at that phase's UPDATE PROCESS rather than silently proceeding on the gate text alone.
13. **Two agents contradicted each other on a plain, cheaply-checkable fact.** During this program
    a dispute arose over whether `ops/seed-placeholder-components.mjs` exists on disk — INNOVATE
    said yes, RESEARCH (a more recent claim) said no. The orchestrator checked disk directly rather
    than trusting recency; INNOVATE was right. When two agent outputs disagree on a fact that a
    single `ls`/`find`/`grep` can settle, check disk before writing either version forward into a
    plan or report.
14. **A plan can ask an operator to watch a signal the implementation never exposes.** Phase 3's
    plan told the operator to trust that "the missing-item count trends down over time relative to
    the hourly cap," but the route's dry-run response originally reported only the capped count
    (`wouldProcess`), which reads identically whether the real backlog is 20 or 20,000. Caught
    during EXECUTE review, fixed additively (`totalMissing` + `cap` fields added, zero-invoke
    guarantee unaffected). Worth a deliberate check in every future phase: for each observable a
    plan asks an operator to monitor, confirm the implementation actually exposes that value.

## Program-Wide Learnings (carried forward from Phase 04, 29-07-26)

15. **A plan's checklist can contradict its own locked decisions.** Phase 4's Step D2 literally said
    "remove" while D1a, directly above it, locked "retain." EXECUTE only got it right because
    Execute-Agent Instruction E1 stated the precedence explicitly ("this instruction is authoritative
    over the checklist text where they conflict"). When a PLAN-SUPPLEMENT cycle locks a decision that
    reverses an earlier checklist bullet, sweep the whole checklist for text that decision
    invalidates — don't assume the newer prose alone is enough for a future reader skimming only the
    checklist.
16. **A fix that reads sensibly can be structurally impossible.** The rejected SEO option for
    Phase 4's `/templates` redirect — keeping the page's own `metadata` export while also redirecting
    from it — would have shipped as a silent no-op: a page that calls `redirect()`/`permanentRedirect()`
    returns a 3xx with no body, so a `metadata` export on that same page never reaches HTML any
    crawler sees. Verify a proposed mechanism can actually execute end-to-end, not just that it
    sounds plausible on paper.
17. **An agent reverting its own change mid-EXECUTE can be the correct outcome, not a failure.**
    Phase 4's execute-agent first wired `/?tab=templates` into the a11y audit list, discovered 58
    pre-existing contrast violations that would have made 2 tests permanently red, and reverted to
    removing the route from the audit list instead (documenting why in-file). A documented coverage
    gap is preferable to a gate that is red by construction — this is not scope creep to avoid, it
    is the correct call when a naive fix would corrupt the regression gate itself.

## Program-Wide Learnings (carried forward from Phase 05, 29-07-26)

18. **Green gates are not evidence of correctness on a high-risk surface.** All 5 EVL gates passed
    both before and after a CRITICAL billing defect existed (a fifth, unguarded `users_to_plans`
    writer that could plant a Stripe ownership marker on a Lemon-Squeezy-owned row on an ordinary
    page load). No automated gate could have caught it — it was found only because an agent was
    told to assume something was still wrong and go looking. Apply this to Phase 6: schema
    regeneration gates (tsc, vitest) will not catch a semantic mismatch between the regenerated
    types and real call-site usage either.
19. **The self-review disclosure was load-bearing, not a formality.** `vc-execute-agent` volunteered
    that its own `review-decision.json` was a self-review rather than filing it as the evidence
    pack's independent-review leg, and left `mustStopBeforeFinalize` set. That is the only reason an
    independent adversarial pass ran at all. A high-risk evidence pack's self-review disclosure
    should be treated as an actionable signal, not a checkbox.
20. **Scope a guard by the data it reads, not the field it protects.** Phase 5 scoped its
    mutual-exclusion guard to "writers of `status`" and missed a writer of `meta` — but `meta`
    feeds the same ownership derivation, so a `meta`-only write changes ownership just as
    decisively, and silently. The plan even *named* the missed file as a place `meta` gets written,
    in a "where does provider data live" sense — but its write path was never evaluated against the
    guard's own invariant. Being mentioned in a plan is not the same as being analyzed. Apply this
    check to any future guard/invariant work: enumerate by the fields the invariant reads, not by a
    plausible-sounding category of route.
21. **A reviewer's suggested fix can itself be unsafe — verify it against the same invariants before
    accepting it.** The independent review proposed routing the fifth writer through the existing
    guard helper; execute-agent correctly rejected it, because that helper only blocks *active*
    cross-provider rows (an inactive row would still be corrupted) and its clearing-patch behavior
    would have nulled a real subscription id as a side effect of a read-only invoice fetch. A
    reviewer finding a real defect does not mean their proposed remedy is automatically correct.

---

## Touchpoints

- `supabase/restore-authenticated-grants.sql` (Phase 1)
- `supabase/migrations/` — new directory, embedding function migrations (Phase 2), full baseline (Phase 6)
- new cron script + systemd/crontab unit under `apps/web/scripts/` or `ops/` (Phase 3)
- `apps/web/hooks/use-navigation.ts`, `apps/web/lib/atoms.ts`, `apps/web/lib/navigation.ts`, `apps/web/components/features/main-page/sidebar-layout.tsx`, `apps/web/app/templates/` (Phase 4)
- `apps/web/app/settings/billing/`, `apps/web/app/api/lemonsqueezy/`, `apps/web/app/api/stripe/`, `apps/web/lib/lemonsqueezy.ts`, `apps/web/lib/stripe.ts` (Phase 5)
- `apps/web/types/supabase.ts`, `process/context/all-context.md` (Phase 6)

---

## Public Contracts

- Existing browser-client Supabase call signatures (`.from()`/`.rpc()` call sites across the 41
  files) are unchanged — only grants/RLS state changes, not the query shape.
- Existing RPC function signatures used by `apps/web` are unchanged; only the 4 new embedding
  functions are net-new additions, and no existing function's contract is altered.
- Existing nav route paths are unchanged; only the resolved destination for ambiguous items
  (`/templates`) is unified to a single target.
- Existing billing webhook payload contracts (Stripe, Lemon Squeezy) are unchanged — only the
  internal routing/mutual-exclusion logic changes.

---

## Blast Radius

Files directly modified or created across the program (see individual phase plans for full lists):

- `supabase/restore-authenticated-grants.sql` (extended)
- `supabase/migrations/*.sql` (new directory + baseline + 4 embedding function migrations)
- new cron script + unit file (new)
- `apps/web/hooks/use-navigation.ts`, `apps/web/lib/atoms.ts`, `apps/web/lib/navigation.ts`,
  `apps/web/lib/queries.ts`, `apps/web/components/features/main-page/sidebar-layout.tsx`,
  `apps/web/app/templates/page.tsx` (or equivalent redirect)
- `apps/web/app/settings/billing/page.client.tsx`, `apps/web/app/api/lemonsqueezy/webhook/route.ts`,
  `apps/web/app/api/stripe/webhook/v2/route.ts`, `apps/web/lib/lemonsqueezy.ts`, `apps/web/lib/stripe.ts`
- `apps/web/types/supabase.ts` (regenerated)
- `process/context/all-context.md` (≥3 stale claims corrected)
- `process/features/supabase-interconnect/backlog/hunt-scoring-engine_NOTE_25-07-26.md` (new)

Risk class: schema/migration, auth/permission (RLS), billing/credits, public API surface — HIGH.
Every phase touching these surfaces requires a validate-contract before EXECUTE; live DB writes
require explicit per-statement user approval per Hard Safety Constraints above.

---

## Verification Evidence

```bash
# Program-level regression gates (run after every phase touching harness or shared surfaces)
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0

corepack pnpm --filter web test
# Expected: all tests pass, no regression vs baseline recorded in process/context/tests/all-tests.md

node .claude/skills/vc-audit-vc/scripts/validate-agent-parity.mjs
# Expected: exit 0

node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs
# Expected: exit 0

node .claude/skills/vc-generate-phase-program/scripts/validate-umbrella-artifact.mjs process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
# Expected: exit 0 (or documented warnings only)
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md`
- Last completed phase: Phase 0 (this umbrella plan file = Phase 0 artifact)
- Validate-contract status: pending (vc-validate-agent writes per-phase)
- Supporting context files loaded: `process/context/all-context.md`, SPEC file at
  `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect_SPEC_25-07-26.md`
- Next step for a fresh agent: Read this umbrella plan, read the Phase 1 plan
  (`phase-01-grant-repair_PLAN_25-07-26.md`), then run Phase 1 RESEARCH subagent before any EXECUTE
  work.
- Current phase: Phase 1 (Grant/RLS repair)
- Next action: Spawn vc-research-agent for Phase 1
- Execute-agent start instruction: Read this file. Read Phase 1 plan. Run research subagent first.

---

## Current Execution State

**Last updated:** 29-07-26 (UPDATE PROCESS, Phase 05 inner-loop Step 7)

**Current phase N of total:** Phase 5 of 6 (Phases 1-4 also still open — see below; Phase 5 is the
most recently closed-out phase and the next phase to start is Phase 6)

**Phase N name:** Phase 05 — Billing unification

**Phase N status:** 🧪 TESTING — code-complete, EVL-confirmed after 1 fix cycle. All Steps A-E
checklist items done (A4 invoices branch explicitly deferred to backlog per plan decision). A new
shared guard (`apps/web/lib/billing-provider-guard.ts`) is wired into **five** `users_to_plans`
writers (Stripe v2, Stripe v1, the LS webhook, the dormant Stripe cron, and `get-invoices` — the
fifth was found and closed during EVL, see below); the billing page's Cancel button is now
provider-aware with a fail-safe (never silently falls through to Stripe); `lib/stripe.ts` is
lazy-init. Closeout classification: **Keep in active/testing** — code is complete and
independently verified, but no live-provider or live-database verification is possible in this
environment (0 live `users_to_plans` rows; per SPEC's own Cross-Cutting Requirement), Stripe
webhook v1's production liveness remains genuinely undetermined (guarded defensively, not assumed
dead), and AC10's button-wiring half is proven only at the decision-function level, not via a full
component render. Consistent with how Phases 1-4 were each left open pending their own residual
items.

**Phase N EVL:** All 5 gates passed on the first run (tsc scoped-clean, 110/111 vitest, both harness
validators, clean diff-check) — but `vc-execute-agent` disclosed, unprompted, that its own
`review-decision.json` was a self-review and left `mustStopBeforeFinalize` set. That disclosure
triggered an independent adversarial review, which found **1 CRITICAL defect**: `GET
/api/stripe/get-invoices` was a fifth, unguarded `users_to_plans` writer, reachable on an ordinary
paying-user page load, capable of planting a Stripe ownership marker onto a Lemon-Squeezy-owned row
and later letting a stale Stripe event deactivate it. Also found 1 MEDIUM write-ordering issue in
the LS webhook. Both were fixed in EVL Fix Cycle 1 (29-07-26) and independently re-confirmed: 3 new
tests (113/114 total vitest, the sole failure being the pre-existing unrelated
`lib/registry.test.ts` case), zero `tsc` errors in every touched path. `mustStopBeforeFinalize` is
now CLEARED — see the phase report's `## Closeout Finalization` section for the full basis.
`results.tsv`: `1 phase-05-evl tests 0 0 PASS HALTED_SUCCESS 2026-07-29` then
`1 phase-05-evl-fix tests 2 2 PASS CYCLE_COMPLETE 2026-07-29`. Test baseline corrected in
`process/context/tests/all-tests.md` (113 tests / 24 files, 1 pre-existing unrelated failure) and
`process/context/all-context.md`.

**Phase N report:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_REPORT_29-07-26.md`
(+ `phase-05-billing-evl-iteration-001_REPORT_29-07-26.md` for the fix-cycle detail)

**Next phase:** Phase 5 stays current — it does NOT need further agent work. Phase 6 (Schema
source of truth) depends on Phases 1-5 (baseline must include Phase 2's new functions; absorbs tsc
fallout last) — all of Phases 1-5 are code-complete/EVL-confirmed, so Phase 6 is NOT blocked from
starting. **Recommended next action:** Phase 6, loop step 1 (RESEARCH). Three independent
user-approval decisions remain outstanding across the program: Phase 1's Step C3 (grants/RLS live
apply), Phase 2's Step C5 (embedding functions live apply), and Phase 3's operator crontab install +
seed SQL apply — none block Phase 6 from proceeding. Additionally, Phase 5 carries 3 new backlog
follow-ups (LS invoices branch, get-invoices backfill removal, Stripe webhook v1 dead-code
confirmation) that are genuine future work, not blockers.

**Current loop step:** 7 (UPDATE-PROCESS) — complete for this pass; phase stays open pending the
same class of residual items (missing live credentials/DB access, not agent work) that also keep
Phases 1-4 open.

**Validate-contract status:** written, inline in `phase-05-billing_PLAN_25-07-26.md`;
`generated-by: inner-pvl: phase-5`; `Gate: PASS` (0 FAILs; all CONCERNs resolved via direct plan-text
edits in the same PVL cycle — see `results.tsv`: `1 phase-05-inner plan 3 3 PASS HALTED_SUCCESS
2026-07-29`).

**Phase 1 status (unchanged, still open):** 🧪 TESTING — code-complete, NOT live-verified.
`Gate: CONDITIONAL` (0 FAILs / 2 CONCERNs, accepted after 5 PVL supplement cycles). Blocked on
Step C3 user approval — see
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_REPORT_26-07-26.md`
for the exact pending-approval SQL. No change this UPDATE PROCESS pass.

**Phase 2 status (unchanged, still open):** 🧪 TESTING — code-complete, locally verified for real
(11/11 pglite harness, EVL-confirmed), NOT live-applied. `Gate: PASS`. Blocked on Step C5 user
approval — see
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_REPORT_26-07-26.md`.
No change this UPDATE PROCESS pass.

**Phase 3 status (unchanged, still open):** 🧪 TESTING — code-complete, locally verified for real
(73/73 vitest incl. 11 new, EVL-confirmed). `Gate: PASS`. Crontab install and seed SQL apply remain
operator-only actions — see
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_REPORT_26-07-26.md`.
No change this UPDATE PROCESS pass.

**Phase 4 status (unchanged, still open):** 🧪 TESTING — code-complete, locally verified for real
(82/82 vitest, tsc clean, EVL-confirmed, 3 assertions mutation-tested). `Gate: CONDITIONAL`
(0 FAILs / 4 CONCERNs, accepted autonomously per `/goal`). e2e/a11y residuals carried to backlog.
No change this UPDATE PROCESS pass.

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS.
Orchestrator rule: read "Phase N status" and "Validate-contract status" before spawning any
subagent for this phase. Do not spawn execute-agent again for Phase 01, 02, 03, 04, or 05 — each is
code-complete with its own accepted gate; their remaining items are operator/user-approval actions
or named backlog follow-ups, not agent work. Phase 06 RESEARCH may start now — it is not blocked on
any outstanding operator action from Phases 1-5.

Note: The Stable Program Goal above is fixed. This section is the only part that changes —
update-process-agent rewrites it after every phase closeout (overwrite, not append — git history
is the audit log).

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
