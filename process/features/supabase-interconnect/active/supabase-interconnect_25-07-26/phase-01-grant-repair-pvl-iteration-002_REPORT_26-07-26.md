---
name: report:phase-01-grant-repair-pvl-iteration-002
description: "Supabase Interconnect Phase 01 — inner-PVL cycle 2 iteration report (Gate: BLOCKED, Gap 9 found)"
date: 26-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-01
  domain: plan
  cycle: 2
  loop: inner-pvl
---

# Phase 01 — Inner-PVL Iteration 002

**Plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md`
**Loop:** inner-pvl (plan-validate-fix), domain `plan`
**Cycle:** 2
**Date:** 26-07-26
**Gate:** BLOCKED
**Loop status:** RUNNING

---

## What ran

PVL supplement cycle 1 applied 8 edits + 4 bookkeeping items (Gaps 6/7/8 — `public_profiles` view +
redefinition of `components_with_username` and `demo_hunt_leaderboard`). vc-validate-agent re-ran the
full V1–V7 sequence from V1 against the supplemented plan.

## Result

`Gate: BLOCKED` — Gaps 6/7/8 confirmed correctly resolved (re-derived from source, not inherited),
but a new FAIL-level gap was found by tracing the same architecture one step further.

### Gap 9 (FAIL) — a third view with the identical defect, already live-broken

`supabase/enable-rls.sql:6-11` names **exactly three** views converted to `security_invoker=on`:
`components_with_username`, `demo_hunt_leaderboard`, and `component_dependencies_graph_view_v3`.
The plan had only ever addressed two of the three.

`component_dependencies_graph_view_v3` shares Gap 6's INNER-JOIN-to-`public.users` architecture AND
has **zero grant anywhere** (grep-confirmed) — so it is a live 42501 today, not a latent risk. It is
reached by 3 real browser-client callers — `preview.tsx`, `command-menu.tsx`, `use-dependencies.ts` —
all of which pass the browser `useClerkSupabaseClient` instance into
`resolveRegistryDependencyTree()` in `apps/web/lib/queries.server.ts`.

### Gap 10 (CONCERN) — missing column

The `public_profiles` column list omits `name`, which `info-section.tsx:182-224` reads as one rung of
a 3-way fallback chain. Omitting it silently degrades that consumer.

### Gap 11 (CONCERN, methodology — the important one)

Step A2's audit instruction ("extract every `.from()`/`.rpc()` call site") is a per-file grep. It
structurally **cannot see** relations reached only through a shared query-helper module that a
browser-client file imports and passes its client into. That indirection is exactly why Gap 9 stayed
hidden across four prior validate cycles.

This is a methodology defect, not a one-off miss. It plausibly affects the audit completeness claim
for the whole phase, and the same blind spot may apply to later phases of this program that audit
call sites the same way.

### Baselines re-confirmed live this cycle

`tsc --noEmit` → exit 2, 4 errors, all in `add-registry-modal.tsx` (foreign WIP). `pnpm test` →
57/62 passing, 5 pre-existing failures. Both match the plan's documented baseline exactly.

### Validator false-positive confirmed, not inherited

`validate-plan-artifact.mjs` FAILs are a harness false positive — it misclassifies phase-stub-shaped
files as legacy single-plan shape. `validate-phase-stub.mjs` is the correct validator and returns
clean. This cycle re-derived that conclusion rather than accepting the prior cycle's.

---

## Incident: agent-caused content loss during editing, self-detected and repaired

vc-validate-agent disclosed that mid-task it used an ambiguous string-replace anchor
(`"## Validate Contract"`) which matched a backtick-quoted in-text mention instead of the real
heading, silently deleting roughly six sections (Touchpoints, Public Contracts, Verification
Evidence, Resume and Execution Handoff, Test Infra Improvement Notes, Inner Loop Refresh Note). It
detected this via a heading-count check and reconstructed the file from its own earlier full-file
reads, then re-applied its edits with unambiguous anchors.

**Orchestrator verification performed (do not treat the agent's self-clearance as sufficient):**

- The plan file is **untracked by git** — there is no committed baseline to diff against. This is
  itself a program risk and is being fixed immediately (see Follow-up below).
- Heading count and order checked against the `##` heading list captured independently at session
  start, before any agent touched the file: the original 13 headings are all present, in the original
  order, plus the legitimately-added `## Inner Loop Refresh Note` = 14. No section is missing or
  reordered.
- The reconstructed `## Test Infra Improvement Notes` reproduces the original 25-07-26 prose
  verbatim — including the distinctive `PVL cycle 2: re-confirmed the exact code at clerk.ts:64-77`
  sentence read at session start — with later corrections layered on top rather than replacing it.
- Remaining reconstructed sections are substantive and internally consistent with every fact
  established during this session.

**Verdict: file integrity accepted.** Recorded here because a reconstruct-from-context repair is not
self-verifying and future readers must know it happened.

---

## Follow-up actions taken by the orchestrator

1. Committing the entire `process/features/supabase-interconnect/` task folder as a process-only
   baseline before any further agent edits, so a repeat incident is recoverable by `git checkout`.
   Scoped to `process/` paths only — the ~45 dirty working-tree files are untouched, per the
   program's hard safety constraint.
2. Gap 11 (methodology) should be carried beyond Phase 1. Any later phase that audits call sites by
   per-file grep inherits the same blind spot.

---

## Next action

PVL supplement cycle 2: spawn `vc-plan-agent` (PLAN-SUPPLEMENT mode) with the Gap 9 / 10 / 11
SUPPLEMENT REQUEST, then re-spawn `vc-validate-agent` from V1. Do NOT route to EXECUTE.

Cycle cap: 10. Cycles used in this loop: 2.
