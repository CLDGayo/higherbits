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
| 3 — Scheduler + seed | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-03-scheduler_PLAN_25-07-26.md` | crontab script + install artifact for embeddings backfill job only; seed minimal fixtures for AC6/AC7 verification | Phase 2 (hard) |
| 4 — Navigation | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-04-navigation_PLAN_25-07-26.md` | Resolve tab-vs-route conflicts (`/templates`), reconcile with WIP `useCategoryTagCounts()`, fix sidebar counts | Phase 1 |
| 5 — Billing unification | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_PLAN_25-07-26.md` | Provider-aware cancel/invoice routing on `/settings/billing`; dual-webhook mutual-exclusion guarantee | Phase 1 |
| 6 — Schema source of truth | `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_PLAN_25-07-26.md` | Regenerate `types.ts` from live DB; confirm `supabase/migrations/` covers every called RPC; delete 5 phantom hunt-scoring types entries; correct `all-context.md` stale claims | Phases 1-5 (baseline must include Phase 2's new functions; absorbs tsc fallout last) |

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
| 03 — Scheduler + seed | ⏳ PLANNED — hard-blocked on Phase 02's live apply landing |
| 04 — Navigation | ⏳ PLANNED |
| 05 — Billing unification | ⏳ PLANNED |
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

**Last updated:** 26-07-26 (UPDATE PROCESS, Phase 02 inner-loop Step 7)

**Current phase N of total:** Phase 2 of 6 (Phase 1 also still open — see below; Phase 2 is the
most recently closed-out phase and the one blocking Phase 3's start)

**Phase N name:** Phase 02 — Embedding DB functions

**Phase N status:** 🧪 TESTING — code-complete, locally verified for real (NOT vacuously — the
pglite harness ran the actual committed migration file end-to-end, not a mirror). All Step A-C
checklist items done except the two live-apply hard stops (C5 request, C6 apply), which remain
deliberately unchecked. 4 `CREATE FUNCTION` migrations exist in
`supabase/migrations/0001_embedding_functions.sql`, each with an explicit
`REVOKE`/`GRANT EXECUTE ... TO service_role` pair. Nothing applied to the live database. Closeout
classification: **Keep in active/testing** — not archivable; Phase 3's cron work is hard-blocked
on this phase's eventual live apply landing.

**Phase N EVL:** Independent EVL confirmation run (not trusting EXECUTE's self-report) found zero
gaps and closed in one cycle (`results.tsv`: `1 phase-02-evl tests 0 0 PASS HALTED_SUCCESS
2026-07-26`). All gates green: `tsc --noEmit` exit 0/0 errors; `pnpm --filter web test` 62/62
passing (17 files); `node ops/pglite-verify-embedding-functions.mjs` exit 0, 11/11 PASS;
`grep -c "CREATE FUNCTION" supabase/migrations/*.sql` == 4; `validate-agent-parity.mjs` and
`validate-context-discovery.mjs` both pass; `git diff --check` clean. The regression baseline is
**better** than documented at hand-off — the 4 foreign `tsc` errors and 5 vitest failures Phase 01
recorded were fixed by a concurrent session; re-measured independently twice this session
(pre-EXECUTE and at EVL), byte-identical both times. Test baseline corrected in
`process/context/tests/all-tests.md` and `process/context/all-context.md`. The one Agent-Probe gate
(AC5-d, live application + re-verification) is correctly unrun — it requires the live DB connection
gated behind Step C5, outside this phase's automated EVL scope.

**Phase N report:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_REPORT_26-07-26.md`

**Next phase:** Phase 2 remains current — it is NOT advancing to Phase 3 yet. Phase 3 has a HARD
dependency on Phase 2's live apply (Steps C5/C6) actually landing — a scheduler cannot be wired to
functions that exist only in a tracked migration file. Two independent user-approval decisions are
now outstanding across the program: Phase 1's Step C3 (grants/RLS live apply) and Phase 2's Step C5
(embedding functions live apply). Both should be presented together for review since they are
independent SQL statements against the same database. Once both are approved, applied, and
live-verified, re-enter UPDATE PROCESS to close both phases for real and advance to Phase 03
(scheduler + seed), inner loop Step 1 (RESEARCH). Phases 4 and 5 (parallel-safe, both depend only
on Phase 1) could start their RESEARCH/INNOVATE work once Phase 1's live apply lands, independent
of Phase 2/3's status — not yet started.

**Current loop step:** 7 (UPDATE-PROCESS) — complete for this pass; phase stays open pending C5/C6.

**Validate-contract status:** written, inline in `phase-02-embedding-functions_PLAN_25-07-26.md`;
`generated-by: inner-pvl: phase-2`; `Gate: PASS` (0 FAILs, 0 unresolved CONCERNs — reached in a
single inner-PVL cycle, see `results.tsv`).

**Phase 1 status (unchanged, still open):** 🧪 TESTING — code-complete, NOT live-verified.
`Gate: CONDITIONAL` (0 FAILs / 2 CONCERNs, accepted after 5 PVL supplement cycles). Blocked on
Step C3 user approval — see
`process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_REPORT_26-07-26.md`
for the exact pending-approval SQL. No change this UPDATE PROCESS pass.

Loop step values: RESEARCH | INNOVATE | PLAN-SUPPLEMENT | PVL | EXECUTE | EVL | UPDATE-PROCESS.
Orchestrator rule: read "Phase N status" and "Validate-contract status" before spawning any
subagent for this phase. Do not spawn execute-agent again for Phase 01 or Phase 02 until the user
has acted on the respective C3/C5 approval requests — the remaining live-apply work depends on
those decisions. Do not start Phase 03 (RESEARCH) until Phase 02's live apply (C5/C6) is confirmed
landed.

Note: The Stable Program Goal above is fixed. This section is the only part that changes —
update-process-agent rewrites it after every phase closeout (overwrite, not append — git history
is the audit log).

---

## Test Infra Improvement Notes

(none identified yet)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
