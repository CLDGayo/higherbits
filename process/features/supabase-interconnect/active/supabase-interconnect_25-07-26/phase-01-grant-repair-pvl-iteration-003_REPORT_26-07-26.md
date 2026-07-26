---
name: report:phase-01-grant-repair-pvl-iteration-003
description: "Supabase Interconnect Phase 01 — inner-PVL cycle 3 iteration report (Gate: BLOCKED, Gaps 12/13/14)"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-01
  domain: plan
  cycle: 3
  loop: inner-pvl
---

# Phase 01 — Inner-PVL Iteration 003

**Plan:** `.../phase-01-grant-repair_PLAN_25-07-26.md`
**Cycle:** 3 · **Gate:** BLOCKED · **Loop status:** RUNNING · **Date:** 26-07-26

---

## Result

Cycle 2's fixes (Gaps 9/10, Decisions 1–5) all re-confirmed from source. Two new FAILs + one CONCERN.

### Gap 12 (FAIL) — missing base-table grant

`component_dependencies_graph_view_v3`'s own base FROM table, `public.component_dependencies_closure`,
has zero grant anywhere. Step B3e grants the *view* but not the base table, so the view stays 42501
for all 3 real callers even once B3e is fully applied.

This is the same "view grant is insufficient without its base-table companion grant" pattern already
solved once in this plan for `demo_hunt_leaderboard` (Step B3b / Gap 1) — it simply was not carried
over to B3e.

### Gap 13 (FAIL) — the orchestrator's own Decision 1 was too narrow

Step B0's column-scoped `users` UPDATE grant omits `role`. `role` is a self-described professional
field (`enum user_role { designer, frontend_developer, backend_developer, product_manager,
entrepreneur }`), not a privilege column, and there is a real live browser-authenticated write to it
at `apps/web/components/.../feedback-dialog.tsx:157-162`.

Applying B0 as written would have shipped the privilege-escalation fix **and broken a working
feature** — the exact "too narrow → broken feature" failure mode. Fix: add `role` to the granted
column list.

Recorded plainly because this was an error in an orchestrator decision, caught by the validate loop
rather than by the decision-maker. The loop did its job.

### Gap 14 (CONCERN) — a claimed fix was never applied

Supplement cycle 2 reported Step A2's methodology fix (recursive local-import tracing +
browser/anon vs service-role client distinction, i.e. Gap 11) as applied. Grep-confirmed it was
written only into surrounding prose (Touchpoints, historical contract text) and **never into Step
A2's checklist text**. A methodology fix that exists only in prose does not change what an
execute-agent does.

**Process note:** this is the second time a supplement agent has reported edits it did not land
(cycle 1 reported five gaps as "already resolved from a prior pass"). Going forward the orchestrator
mechanically greps for each claimed edit after every supplement rather than accepting the agent's
changelog.

## What was re-verified and holds

- Column-level `GRANT UPDATE (cols)` semantics are sound: `UPDATE users SET is_admin=true` is
  rejected at the privilege layer independent of RLS.
- Both admin RPCs are safe to `GRANT EXECUTE`: each checks `is_admin` via the non-spoofable
  `requesting_user_id()` JWT helper before any write; no parameter allows redirecting the write past
  the check.
- Blast Radius / registry discipline correct — only the three `supabase/*.sql` files are writable; no
  `apps/web` source file, no `clerk.ts`, no `add-registry-modal.tsx`.
- Exit Gate's narrowed admin-write claim and the Step C3 live-DDL hard stop both intact.
- Baselines unchanged: tsc exit 2 / 4 foreign errors; vitest 57 of 62 passing.

## Convergence assessment

Three consecutive BLOCKED cycles, but this is convergence, not a plateau — the defect class is
shrinking each round:

| Cycle | Defect class | Fix shape |
|---|---|---|
| 1 | Architectural (RLS semantics of `security_invoker` views) | new view + two redefinitions |
| 2 | Structural (an entire third view + a live privilege escalation) | new steps B0/B3e/B3f/B9 |
| 3 | Mechanical (one missing companion grant, one missing column) | two one-line edits |

`gaps_fixed` rises each cycle while the remaining gaps get smaller and more local. Both cycle-3 FAILs
are fixable with patterns already present elsewhere in the same plan — no new architectural decision
required. If cycle 4 surfaces another architecture-level gap rather than mechanical residue, that
would invalidate this assessment and warrant reconsidering the phase's scope.

## Next action

PVL supplement cycle 3 (Gaps 12/13/14) → re-spawn vc-validate-agent from V1. Do NOT route to EXECUTE.

Cycle cap: 10. Cycles used: 3.
