---
name: report:phase-01-grant-repair-pvl-iteration-001
description: "Supabase Interconnect Phase 01 — inner-PVL cycle 1 iteration report (Gate: BLOCKED)"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-01
  domain: plan
  cycle: 1
  loop: inner-pvl
---

# Phase 01 — Inner-PVL Iteration 001

**Plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md`
**Loop:** inner-pvl (plan-validate-fix), domain `plan`
**Cycle:** 1
**Date:** 26-07-26
**Gate:** BLOCKED
**Loop status:** RUNNING

---

## Why this cycle ran

The plan carried a `Gate: PASS` contract with `generated-by: outer-pvl`, `date: 2026-07-25`, written
before inner-loop RESEARCH and INNOVATE existed. Inner-loop RESEARCH + INNOVATE ran on 26-07-26 and
PLAN-SUPPLEMENT (Step 3c) wrote an `## Inner Loop Refresh Note` dated 26-07-26 — strictly newer than
the contract. Per the Step 4b `generated-by` rule that mandates a PVL re-run from V1. The re-run was
explicitly instructed not to take the V1 auto-proceed early-exit.

---

## Result

`Gate: BLOCKED` — 3 FAILs tracing to one root cause, 2 CONCERNs (one fixed inline during the cycle).

New validate-contract written into the plan with `generated-by: inner-pvl: phase-1`,
`date: 2026-07-26`, `supersedes: 2026-07-25 (outer-pvl)`.

### Root cause (Gap 6, FAIL)

`components_with_username` is a `security_invoker=on` view whose FROM clause is
`components c JOIN public.users u ON u.id = c.user_id` (`supabase/views.sql:32-33`) — an INNER JOIN.
`public.users` has exactly one SELECT policy, own-row-only (`users_select_self`,
`supabase/restore-authenticated-grants.sql:151-155`). Under `security_invoker` semantics that RLS
applies inside the JOIN, so a query for a component authored by anyone else returns **zero rows
silently** — not a 42501.

The live consumer (`apps/web/components/features/component-page/info-section.tsx:79-90`) uses this
view to resolve registry *dependency* components, which are overwhelmingly authored by other users.

Step B3c as planned (`GRANT SELECT ... TO authenticated`, "no RLS policy needed") therefore does not
fix the feature. It converts a loud permission error into a silent empty result. That is precisely
the vacuous-green outcome the program goal bans.

### Independently confirmed by the orchestrator (post-verdict scout)

- `restore-authenticated-grants.sql:47-261` contains **13** real relation grants, not 14:
  `components, demos, submissions, sandboxes, users, tags, component_tags, demo_tags, api_keys,
  usages, users_to_plans, mcp_generation_requests, component_hunt_rounds` (plus schema + sequence
  grants at :47-48). **`public_profiles` is NOT granted** — its only occurrence is inside the
  commented-out prescription block at `:295-299`. The plan's and SPEC's "14-relation baseline" is
  itself drifted.
- `components_with_username` emits `to_jsonb(u.*) AS "user"` (`views.sql:29`) — the entire `users`
  row. Today own-row RLS masks this; any future widening of `users_select_self` would leak `email`,
  `paypal_email`, `stripe_id`, `lemon_squeezy_customer_id`, `ref`, `is_admin` to the browser. The
  view redefinition closes this latent exposure as a side effect.
- `demo_hunt_leaderboard` joins `public.users` **twice** (`cu`, `du` — `views.sql:124-125`), so it
  carries the identical mechanism.
- The grants file's own KNOWN LIMITATION block (`:284-304`) prescribes the exact remedy: a
  `public_profiles` view with `security_invoker = off` over a safe column list, plus a SELECT grant.
  It is currently commented out, and the plan's Step C2 treats creating it as optional. It is not
  optional.

### Gap 7 (CONCERN)

`demo_hunt_leaderboard` (Step B3b) has the same INNER-JOIN-to-`users` mechanism. Scored CONCERN
rather than a second FAIL because its only browser-client consumer (`getRoundSubmissions()`) has no
live callers — the live `/contest/leaderboard` page uses a service-role client that bypasses RLS.
The defect is latent, not dead: any future browser-client caller inherits it.

### Gap 8 (CONCERN, fixed inline this cycle)

Residual hardcoded "41 files" prose. The TDD stub name was reworded during the cycle; remaining
prose mentions are cosmetic and were swept.

### Plan-artifact validator

`validate-plan-artifact.mjs` reports 3 structural FAILs (missing generic Overview / Complexity /
Phase-Completion-Rules sections). Confirmed **harness false positives**: `validate-phase-stub.mjs` is
the correct validator for phase-stub-shaped files and returns clean, and the same false positive
reproduces across all 6 phase plans in this program. Not a plan defect.

---

## Orchestrator decision (autonomous, per standing /goal)

**Take the view-redefinition fix. Do not descope cross-user correctness.**

Rationale: descoping would ship a feature that silently returns empty for its primary use case
(cross-author registry dependencies), which the program goal's vacuous-green / Known-Gap ban
forbids for developed behavior. The remedy is already designed and documented in the repo's own
grants file; implementing it is following an existing prescription, not inventing new architecture.
It additionally closes a latent full-`users`-row exposure in the view's `to_jsonb(u.*)` projection.

Blast Radius extends by one file: `supabase/views.sql`. This overlaps Phase 6's claimed
`supabase/*.sql` surface — Phase 6 runs later and sequentially, so there is no concurrency conflict,
but the registry must record the claim.

---

## Next action

PVL supplement cycle: spawn `vc-plan-agent` (PLAN-SUPPLEMENT mode) with the SUPPLEMENT REQUEST
(Gaps 6/7/8) plus the orchestrator decision above, then re-spawn `vc-validate-agent` from V1.
Do NOT route to EXECUTE.

Cycle cap: 10. Cycles used in this loop: 1.
