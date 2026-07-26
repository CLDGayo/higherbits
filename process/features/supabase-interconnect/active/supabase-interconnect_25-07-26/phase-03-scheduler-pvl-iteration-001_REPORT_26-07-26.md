---
name: report:phase-03-scheduler-pvl-iteration-001
description: "Supabase Interconnect Phase 03 — inner-PVL cycle 1 (PASS, loop closed in one cycle)"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-03
  domain: plan
  cycle: 1
  loop: inner-pvl
---

# Phase 03 — Inner-PVL Iteration 001

**Plan:** `.../phase-03-scheduler_PLAN_25-07-26.md`
**Cycle:** 1 · **Gate:** PASS · **Loop status:** HALTED_SUCCESS · **Date:** 26-07-26

Contract: `Status: PASS`, `generated-by: inner-pvl: phase-3`, `date: 2026-07-26`, superseding the
25-07-26 outer-pvl CONDITIONAL. 0 FAILs. 15 headings, 628 lines — orchestrator-verified after the
write.

---

## The contradiction this phase had to resolve first

RESEARCH surfaced a genuine conflict inside the program's own artifacts. The umbrella's
`## Current Execution State` asserted Phase 3 was **hard-blocked on Phase 2's live apply**. But
Phase 2's own Exit Gate says live application is optional — "otherwise phase exit gate is met by the
scratch-schema verification alone" — and Phase 3's Entry Gate, Exit Gate, and validate-contract all
accept scratch-verified functions, tiering only two named Agent-Probe legs as live-dependent.

Orchestrator ruling: **the phase plans govern.** The umbrella's line was informal narrative added
during Phase 2 closeout, not a formal gate condition, and it contradicted the very plan it was
summarizing. Phase 2's pglite verification was non-vacuous — the real migration file executed, with
real assertions, independently EVL-audited precisely against the charge of hollowness. Blocking a
phase on an approval the governing plans never required would have stalled the program on a
bookkeeping artifact rather than a technical fact.

The umbrella narrative is corrected at UPDATE PROCESS. Live legs stay deferred where the plan
already put them.

Worth recording as a program-level lesson: closeout narrative can drift stricter than the gates it
describes, and a later phase will read the narrative first. When they disagree, the gate text wins —
but the drift itself is a defect to fix, not just to route around.

## Two agents disagreed; the orchestrator checked

RESEARCH reported `ops/seed-placeholder-components.mjs` as absent, invalidating Step D2's precedent
citation. INNOVATE contradicted it and said the file exists. Rather than pick the more recent claim,
the orchestrator checked disk directly: the file **exists**, 26.9K, alongside `ops/README-seed.md`.
INNOVATE was right; Step D2 needed no change.

The same check confirmed the other half: `apps/web/scripts/tsconfig.json` genuinely does **not**
exist, which means `apps/web/package.json`'s `generate-embeddings` script is already dead code
pointing at a missing config. That absence is what settled Fork 1 toward reusing the existing route
rather than authoring a new TS script against a broken convention.

## What cycle 1 found

Three real gaps — all introduced by the 26-07-26 PLAN-SUPPLEMENT itself, so the outer-pvl pass could
not have caught them. All three fixed in-plan rather than deferred:

1. **A referenced artifact with no step that creates it.** The plan named
   `route.test.ts` in Blast Radius, Touchpoints, and the Exit Gate, but no checklist step actually
   instructed anyone to write it. EXECUTE would have had a gate it was never told to satisfy. Fixed:
   added Step A5 with four concrete assertions.

2. **A self-contradiction about backward compatibility.** The plan claimed "default behavior
   (neither param present) is unchanged" while specifying an `EMBEDDING_CRON_BATCH_CAP` env default
   that applies unconditionally. Both cannot be true — adding a default cap of 20 to a previously
   uncapped job *is* a behavior change. Fixed the wording and stated why the change is safe: the
   route has zero live traffic today (its only reference is the dormant `vercel.json` cron entry on
   an app that runs under pm2, not Vercel).

3. **Under-specified seed SQL.** Step D1 said "add a components/demos row" without accounting for
   `components`' real NOT NULL and FK constraints. Fixed with exact column guidance — the `user_id`
   FK subquery pattern, required columns, conflict target, and the empty-database edge case.

## What was checked and found clean

Recorded so the PASS is auditable rather than merely asserted:

- **`get_missing_usage_embedding_items()` is `STABLE`** — it recomputes from live state on every
  call. This is what makes the batch cap safe: items beyond the cap are not dropped, they simply
  reappear on the next run. A cap over a non-recomputing source would have starved the backlog
  permanently.
- **Nothing else in the repo calls this route** or depends on its currently-uncapped behavior
  (repo-wide grep; only `vercel.json`'s dormant entry references it).
- **Provider keys stay in the edge function's own Deno env** — the reuse path needs no new secret in
  `apps/web` beyond the `CRON_SECRET` the route already reads.
- **Two real precedent test files exist** (`magic/__tests__/route.test.ts`,
  `lemonsqueezy/__tests__/webhook.test.ts`), so the mocking pattern Step A5 needs is well-trodden
  rather than invented.
- `flock` advisory-lock reboot semantics and `curl -fsS` failure visibility both check out as the
  plan describes.

## Residuals

Two Agent-Probe legs stay deferred, both SPEC-documented and non-blocking: live search-result
verification (AC7) and live cron firing. Neither is a hidden gap — the crontab install is
operator-only by explicit hard stop, so an agent cannot prove live firing under any arrangement.

## Next action

EXECUTE (`vc-execute-agent`, opus). Delivers the route extension, its test, the install artifact, and
the seed SQL. The crontab install and any live seed apply remain operator actions.

Cycles used: 1 of 10.
