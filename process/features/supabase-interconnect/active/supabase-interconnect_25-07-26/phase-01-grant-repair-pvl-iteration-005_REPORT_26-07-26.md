---
name: report:phase-01-grant-repair-pvl-iteration-005
description: "Supabase Interconnect Phase 01 — inner-PVL cycle 5 + loop closure (CONDITIONAL accepted)"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-01
  domain: plan
  cycle: 5
  loop: inner-pvl
---

# Phase 01 — Inner-PVL Iteration 005 (loop closure)

**Plan:** `.../phase-01-grant-repair_PLAN_25-07-26.md`
**Cycle:** 5 · **Gate:** CONDITIONAL (accepted) · **Loop status:** HALTED_ACCEPTED · **Date:** 26-07-26

---

## Cycle 5 result

`Gate: CONDITIONAL`, **0 FAILs**, 2 new CONCERNs — both pure documentation text with zero SQL,
checklist, or Blast Radius impact:

- **Gap 17:** the Exit Gate's narrowed-claim block named the two `useSubmissions.ts` admin-write
  exclusions but omitted the anon-role `component_analytics` exclusion (correctly documented in
  Blast Radius Decision 4, Step B9, and Public Contracts — just not in the Exit Gate).
- **Gap 18:** two annotations still read "pending SUPPLEMENT resolution" for gaps resolved at
  supplement cycles 1-3 and re-confirmed clean in cycles 4 and 5.

Both fixed by a text-only supplement (cycle 5). Orchestrator verified both directly rather than
accepting the changelog: Exit Gate now contains the `component_analytics` exclusion; the Gap 6/7
bullet reads "resolved by PVL supplement cycle 1"; box `4h` ticked; handoff next-step is EXECUTE.
14 headings, 1530 lines.

Nine remaining occurrences of "pending SUPPLEMENT resolution" were deliberately left in place — they
sit inside Phase Loop Progress / Inner Loop Refresh Note / Validate Contract narrative that records
what *earlier cycles found*. Rewriting them would falsify the audit record. Correct call.

## Cycle 5's clean findings (auditable)

Re-derived from source, not inherited:

- **24-column partition verified mechanically** — `users` has 24 scalar columns
  (`apps/web/prisma/schema.prisma:616-640`); Step B0 grants 13 and excludes 11, zero overlap, zero
  omission.
- **No privileged column in the granted list** — `is_admin`, `email`, `ref`, `paypal_email`,
  `is_partner`, `bundles_fee`, `stripe_id` all excluded. The privilege-escalation hole stays closed.
- All three writable SQL files re-read in full; every plan citation confirmed against live content.
- Baselines unchanged: tsc exit 2 / 4 foreign errors in `add-registry-modal.tsx`; vitest 57 of 62.
- Blast Radius writable set is exactly the three `supabase/*.sql` files — no `apps/web` source.

## Why the loop closes here

Plateau reached in the vc-autoresearch sense: cycles 4 and 5 both returned CONDITIONAL with zero
FAILs, and cycle 5's only findings were documentation wording. Continuing would risk an unbounded
cosmetic loop with no correctness return.

Under the standing `/goal`, the orchestrator accepts the CONDITIONAL. This is legal per
`orchestration.md` §PVL routing rule (b) — CONDITIONAL with ≥1 recorded fix cycle; `results.tsv`
records five.

**This is not a vacuous green.** The goal bans Known-Gap as a terminal PASS for *developed behavior*.
Nothing developed by this phase is being closed by a known-gap: Gaps 17/18 were fixed rather than
accepted, and the surfaces this phase does not cover (the two `useSubmissions.ts` admin write flows,
the anon-role `component_analytics` path) are now explicitly named as out of scope in the Exit Gate
itself, so the phase cannot claim success over them.

## Loop summary — five cycles

| Cycle | Defect class | Gate |
|---|---|---|
| 1 | Architectural — `security_invoker` view RLS semantics silently returning empty rows | BLOCKED |
| 2 | Structural — a third ungranted view (live-broken) + a live privilege escalation | BLOCKED |
| 3 | Mechanical — missing companion base-table grant; a wrongly-excluded grant column | BLOCKED |
| 4 | Residue — one unaccounted column; one factually wrong rationale | CONDITIONAL |
| 5 | Documentation — one missing exclusion line; stale status annotations | CONDITIONAL (accepted) |

Monotonic convergence. Each cycle's predicted next-class held.

## What the loop actually caught

Worth recording, because a PASS on the first cycle would have shipped all of it:

1. A fix that would have converted a loud 42501 into a **silent empty result** for cross-author
   registry dependencies — the exact vacuous-green failure the program goal bans.
2. A **live production privilege escalation**: table-level `GRANT UPDATE` on `users` with only
   row-level RLS, letting any authenticated user set `is_admin = true` on themselves.
3. An orchestrator decision error — the privilege-escalation fix's first column list omitted `role`
   and would have broken a live write at `feedback-dialog.tsx:156-161`.
4. A third `security_invoker` view, ungranted and 42501-ing in production, invisible to the audit
   methodology.
5. That audit methodology's own blind spot (per-file grep cannot see relations reached through
   shared query-helpers), now corrected in Step A2 itself.

## Process learnings for later phases

- **Supplement agents over-report.** Three cycles claimed edits that were never written. The
  orchestrator now greps for each claimed edit after every supplement. Carry this to Phases 2-6.
- **Untracked artifacts are unrecoverable.** A corruption incident in cycle 2 had no baseline to
  diff against. The folder is now committed; commit early in each phase.
- **Ambiguous edit anchors corrupt files.** One agent anchored on `"## Validate Contract"`, matched a
  prose mention, and deleted six sections. Line-splice editing was reliable; string-anchor was not.

## Next action

EXECUTE (`vc-execute-agent`, opus). The Step C3 live-DDL user-approval hard stop is mandatory before
any SQL reaches the production database — it is NOT satisfied by any PVL verdict.

Cycles used: 5 of 10.
