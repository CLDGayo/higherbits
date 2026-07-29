---
name: report:phase-06-schema-truth-pvl-iteration-001
description: "Supabase Interconnect Phase 06 — inner-PVL cycle (CONDITIONAL accepted; 4 concerns closed via instructions)"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-06
  domain: plan
  cycle: 1
  loop: inner-pvl
---

# Phase 06 — Inner-PVL Iteration 001

**Plan:** `.../phase-06-schema-truth_PLAN_25-07-26.md`
**Cycle:** 1 (inner) · **Gate:** CONDITIONAL, accepted · **Loop status:** HALTED_ACCEPTED · **Date:** 29-07-26

Contract: `generated-by: inner-pvl: phase-6`, `date: 2026-07-29`, superseding the outer-pvl contract.
0 FAILs, 4 CONCERNs — all closed via Execute-Agent Instructions rather than left open. 16 headings,
721 lines; orchestrator-verified.

---

## What this cycle found

Four concerns, none trivial, two of which corrected work approved earlier in the same phase.

**1. The repoint was incomplete — and one site was a live bug.**
The plan scoped the project-ref fix to `apps/web/package.json:7`. A repo-wide grep found three more
source sites. The consequential one is `scripts/embed-all-demos.js:36`, which read from the *correct*
database but POSTed its embedding work to `https://vucvdpamtrjkzmubwlts.supabase.co/functions/v1/embed-oai`
— the *dead* project's Edge Function. That is not a stale string; that is work being sent nowhere.
The other two are admin dashboard deep-links in `SubmissionCard.tsx:21-22`.

Orchestrator confirmed the full set independently: exactly four source sites, everything else being
gitignored `.next-prod` build-cache binaries. All four were authorized as a Blast Radius extension.

**2. The Exit Gate was literally unsatisfiable.** It required "all tests pass" while citing a stale
"48/48 across 15 files" baseline. The real baseline, independently confirmed twice the same day, is
114 tests / 24 files with 113 passing — one known pre-existing `lib/registry.test.ts` failure,
unrelated to anything in this program. A gate that cannot be met is not a gate.

**3. A vacuous-green risk in the methodology the orchestrator had just approved.**
INNOVATE's fix for the tsc-noise problem — run the D0/D1 captures in a disposable scratch worktree of
the committed tree, keyed by (file, error-code) — was sound in shape and I approved it. PVL found the
hole: nothing instructed the executor to copy the regenerated `types.ts` into that scratch worktree
before the AFTER capture. As written, D1 would have diffed the worktree against itself and reported
"zero new errors" regardless of what actually broke.

Worth recording plainly: this is the second time this program has produced a check that would have
passed without exercising the thing it claimed to verify. The first was Phase 2's "verified locally"
nearly collapsing to a parse check. Both were caught, but the pattern is that a verification step
degrades quietly when the thing it depends on is missing rather than failing loudly.

**4. No test gate proved the B2b merge-back.** Nothing verified that Phase 2's four embedding-function
declarations survive regeneration — the specific regression B2b exists to prevent. Added as a gate row.

## What the cycle checked and found sound

Recorded so the acceptance is auditable rather than assumed:

- **B2b's scope is complete.** PVL checked whether anything *else* in `types.ts` is hand-authored ahead
  of live and would also be silently deleted — Phase 1's `public_profiles` view and its three re-pointed
  views, Phase 5's work. Nothing beyond the four already covered.
- **The two-tier baseline rule holds.** Phase 1/2/3's SQL is authored-but-unapplied; folding it into a
  baseline that claims to describe live schema would misrepresent it.
- **`apps/web/prisma/schema.prisma`'s staleness is deliberately out of scope** — Phase 5 found it missing
  `lemon_squeezy_subscription_id` and owns that gap separately.
- **Infra fit upgraded to PASS.** The earlier "CLI absent" concern was based on a wrong check
  (`which supabase` against a workspace devDependency). The CLI runs.

## Why the CONDITIONAL was accepted rather than supplemented again

All four concerns were closed inside the contract as Execute-Agent Instructions and test-gate rows;
none required a plan-structure change. `results.tsv` already records completed cycles for this phase.
A further supplement round would have re-edited a plan whose remaining items are execute-time
decisions — the same reasoning applied at Phase 4, and consistent with the routing rule that permits
accepting a CONDITIONAL after at least one recorded cycle.

The one item that genuinely needed more than an instruction — the Blast Radius extension for the three
newly-found ref sites — was authorized explicitly in the EXECUTE handoff and mirrored into the
registry, the same mechanism Phase 5 used for its additive files.

## Outcome

EXECUTE delivered the four-site repoint and all five `all-context.md` corrections. `types.ts`
regeneration and `0000_baseline.sql` are blocked on an unauthenticated Supabase CLI — no
`pg_dump`/`psql`/`docker` fallback exists, and credentials cannot be fabricated. The generator is now
correctly pointed, so the regeneration is mechanical once someone logs in.

That is the honest shape of this phase: the investigation is finished, the root cause is fixed, and
the last step is one human login away.

Cycles used: 1 of 10.
