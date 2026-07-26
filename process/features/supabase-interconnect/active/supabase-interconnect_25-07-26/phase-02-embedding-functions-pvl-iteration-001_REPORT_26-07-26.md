---
name: report:phase-02-embedding-functions-pvl-iteration-001
description: "Supabase Interconnect Phase 02 — inner-PVL cycle 1 (PASS, loop closed in one cycle)"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-02
  domain: plan
  cycle: 1
  loop: inner-pvl
---

# Phase 02 — Inner-PVL Iteration 001

**Plan:** `.../phase-02-embedding-functions_PLAN_25-07-26.md`
**Cycle:** 1 · **Gate:** PASS · **Loop status:** HALTED_SUCCESS · **Date:** 26-07-26

Contract: `Status: PASS`, `generated-by: inner-pvl: phase-2`, `date: 2026-07-26`, superseding the
25-07-26 outer-pvl CONDITIONAL. 0 FAILs, 0 unresolved CONCERNs. 14 headings, 686 lines —
orchestrator-verified after the write.

---

## Why one cycle here, five in Phase 1

Phase 1 needed five because its outer-PVL contract was written against a surface nobody had audited
with an adequate method — each cycle's fix exposed the next layer. Phase 2 entered PVL with the
expensive work already done: inner RESEARCH re-derived every plan claim, INNOVATE resolved five
forks, and a feasibility probe converted the riskiest assumption from belief into evidence. PVL had
little left to find because the gaps had already been closed upstream.

That ordering is the reusable lesson. The Phase 1 loop was expensive precisely because R and I were
skipped before the outer contract was written.

## The two findings this cycle

Both were completeness gaps, found by repo-wide grep rather than by re-reading the plan, and both
were fixed directly in the plan text rather than deferred:

1. **An existing caller the plan never referenced.** `apps/web/app/api/cron/gen-usage-embeddings/route.ts`
   already calls `get_missing_usage_embedding_items()` and is explicitly designated for reuse by
   Phase 3's own plan. The plan's Blast Radius, Touchpoints, and Step A5 made no mention of it. The
   design turned out to be compatible already — zero-arg call, `{item_id, item_type}` return shape
   matches Step A2 — so this was not a bug, but authoring a function against an unexamined live
   caller is how signature mismatches ship. Fixed: added as a read-reference in Blast Radius, added
   a cross-check to Step A5, added Execute-Agent Instruction E5.

   Context worth carrying: this route is one of the two crons in `apps/web/vercel.json` that this
   repo's own context notes record as never firing, because the app is self-hosted on the VPS rather
   than deployed to Vercel. It is wired but dormant — which is exactly why a grep found it and a
   behavioral audit would not have.

2. **An uncited evidence source weakening the fail-closed rationale.** Step B0 justified the new
   `(item_id, item_type)` unique index against a hypothetical duplicate-row risk without noting that
   the SPEC's own live-DB audit (25-07-26) already recorded **0 live rows** in both
   `usage_embeddings` and `code_embeddings`. The index cannot fail on existing duplicates because
   there is no existing data. Fixed: evidence-note citation appended to Step B0.

   This materially lowers the risk profile the prior cycle reasoned about. It does not change the
   design — the index is still correct and still required for `ON CONFLICT` to have a target.

## What the cycle confirmed rather than assumed

- **B7 privilege lockdown covers all four functions**, checked individually, not sampled. Also
  confirmed the intended caller (`supabaseWithAdminAccess`) really is the service-role client, so
  `GRANT EXECUTE ... TO service_role` targets the right role rather than merely being defensively
  narrow.
- **Two of the probe's three known-gaps do not apply to this phase.** Grep confirmed Phase 2's
  migration uses neither pgvector similarity operators (`<=>`) nor the `authenticated`/`anon` roles,
  so those probe caveats are out of scope here rather than carried forward as risk.
- **`get_missing_usage_embedding_items` UNIONs both `components` and `demos`**, verified from the
  checklist text rather than from the changelog claiming it.

## The one residual

Running the **real** `0001_embedding_functions.sql` through pglite end-to-end. The probe proved the
seven mechanisms against isomorphic mirrors, not the actual file. This is scheduled as EXECUTE work
(Step C0b) and is what converts AC5-b from partially-proven to proven.

This is a legitimate Known-Gap exclusion rather than a hidden pass: AC5-b's proving test is real
execution at Hybrid tier, not a parse check. The vacuous-green ban targets gates that claim success
without exercising the behavior — here the behavior gets exercised, just in the next phase step.

## Editing safety

The validate agent avoided the failure mode that corrupted a plan during Phase 1: the literal string
`## Validate Contract` also appears in prose at line 287 of this file, so a naive string-anchored
replace would have matched the wrong occurrence. It used a line-sliced replacement instead, verified
anchor uniqueness before applying the three additive edits, and confirmed the heading count held at
14 before and after each one. `validate-phase-stub.mjs` passes 0/0.

## Next action

EXECUTE (`vc-execute-agent`, opus). No live-database hard stop applies to Phase 2 — its work is a
migration file plus a local pglite harness, all authored and verified locally. The Phase 1 Step C3
approval remains outstanding but does not gate this phase.

Cycles used: 1 of 10.
