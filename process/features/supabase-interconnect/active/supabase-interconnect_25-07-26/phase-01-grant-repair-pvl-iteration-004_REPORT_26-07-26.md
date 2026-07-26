---
name: report:phase-01-grant-repair-pvl-iteration-004
description: "Supabase Interconnect Phase 01 — inner-PVL cycle 4 iteration report (Gate: CONDITIONAL, first non-BLOCKED)"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-01
  domain: plan
  cycle: 4
  loop: inner-pvl
---

# Phase 01 — Inner-PVL Iteration 004

**Plan:** `.../phase-01-grant-repair_PLAN_25-07-26.md`
**Cycle:** 4 · **Gate:** CONDITIONAL · **Loop status:** RUNNING · **Date:** 26-07-26

---

## Result — first non-BLOCKED verdict

**0 FAILs.** Cycle 3's Gaps 12/13/14 all confirmed present in the executable checklist text (the
orchestrator had already grep-verified them independently before this cycle ran). Two new findings,
neither blocking.

### Gap 15 (CONCERN) — column-list partition is not exhaustive

`users` has 24 scalar columns (`apps/web/prisma/schema.prisma:616-644`). Step B0's granted list (12)
plus its EXCLUDING list (11) accounts for 23 — `pro_banner_url` appears in neither, so the step's
"every user-editable column EXCLUDING [...]" claim is not a true partition. No live browser-client
write to that column exists (full-repo grep), so nothing breaks today.

### Gap 16 (informational) — a stated rationale is wrong

Step B3f justifies adding `GRANT EXECUTE` on the two admin RPCs by claiming they are "likely
uncallable" without it. That contradicts Postgres semantics: `EXECUTE` is granted to `PUBLIC` by
default on function creation unless explicitly revoked. The plan's own evidence agrees — roughly 25
other functions in `rpc-functions.sql` are live-called via `.rpc()` from ~20 browser-client files
with zero `GRANT EXECUTE` anywhere in tracked SQL, and the plan never claims those are broken.

The grant itself is harmless (redundant at worst). Only the rationale is wrong, and a wrong rationale
in a plan propagates into future reasoning — worth correcting even though it changes no SQL.

## Completeness checks run this cycle — all clean

These were the highest-value checks, given that four prior cycles each surfaced a new relation:

- **`enable-rls.sql:6-11`'s "3 SECURITY DEFINER views" claim is exhaustive** — independently checked
  against `supabase/views.sql`; exactly 3 `CREATE OR REPLACE VIEW` statements exist. This claim had
  been treated as authoritative for four cycles without ever being verified.
- **`use-analytics.ts` is the only browser-executed raw anon-key `createClient()` site** in
  `apps/web`, so Step B9's out-of-scope declaration is complete rather than partial.
- **`demo_hunt_leaderboard`'s full dependency chain** (`demo_bookmarks`, `demo_tags`/`tags`) is
  already covered — no second instance of the Gap 12 missing-companion-grant defect.
- Baselines unchanged: tsc exit 2 / 4 foreign errors in `add-registry-modal.tsx`; vitest 57 of 62.

## Convergence assessment — hypothesis confirmed

| Cycle | Defect class | Verdict |
|---|---|---|
| 1 | Architectural — `security_invoker` view RLS semantics | BLOCKED |
| 2 | Structural — a third ungranted view; live privilege escalation | BLOCKED |
| 3 | Mechanical — missing companion grant; wrong grant column | BLOCKED |
| 4 | Residue — one unaccounted column; one wrong rationale sentence | CONDITIONAL |

Cycle 3's report predicted cycle 4 should find only mechanical residue, and stated that another
architecture-level gap would invalidate the assessment. It found residue. The assessment holds.

## Orchestrator decisions

- **Gap 15 — grant it.** Add `pro_banner_url` to Step B0's granted column list rather than excluding
  it. It is a user-editable profile image field, directly analogous to the already-granted
  `image_url` / `display_image_url`, and carries no privilege or billing meaning. Excluding it would
  set up a silent breakage the first time a Pro banner editor ships.
- **Gap 16 — correct the rationale, keep the grant.** The `GRANT EXECUTE` stays (harmless and
  explicit is better than implicit), but the "likely uncallable" justification is replaced with the
  accurate one: EXECUTE defaults to PUBLIC, so the grant is defensive/explicit rather than
  corrective. Do not let a wrong premise persist in a plan that later phases will read.
- **Do not accept these as known-gaps.** Both are one-line edits; carrying them would be more
  expensive than fixing them, and Gap 16 in particular is a correctness-of-reasoning issue.

## Minor process note

vc-validate-agent reported that no `results.tsv` or iteration-report files exist in this task folder
and that PVL bookkeeping had been tracked only inline in the plan. That is incorrect — `results.tsv`
and iteration reports 001-003 exist and are committed (baseline `254b3b8`). The agent did not look.
No corrective action needed; noted so the claim is not inherited as fact by a later reader.

## Next action

PVL supplement cycle 4 (Gaps 15 + 16, two one-line edits) → final PVL re-run from V1. Expect PASS.

Cycle cap: 10. Cycles used: 4.
