---
name: plan:registry-enhancements-phase-03-shadcn-primitives
description: "Registry Enhancements — Phase 03: Shadcn Primitives Integration"
date: 26-07-26
metadata:
  node_type: memory
  type: plan
  feature: registry-enhancements
  phase: phase-03
---

# Phase 03 — Shadcn Primitives Integration

**Program:** registry-enhancements
**Umbrella plan:** process/features/registry-enhancements/active/registry-enhancements_26-07-26/registry-enhancements-umbrella_PLAN_26-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/registry-enhancements/active/registry-enhancements_26-07-26/phase-03-shadcn-primitives_REPORT_26-07-26.md (flat in the program task folder)

---

## Purpose

This phase addresses the issue where the `shadcn/base` section in `add-registry-modal.tsx` shows "No shadcn components available." The front-end queries `supabase.rpc("get_user_profile_demo_list", { p_user_id: "user_shadcn" })`. The components are likely missing from the Supabase database. We will investigate the missing data and insert the Shadcn primitives into the database under `user_shadcn` so they render correctly.

---

## Entry Gate

- Phase 2 complete (all checklist items done, validators green)

---

## Blast Radius

- Backend / Database / Scripts (No source files directly affected unless a seeding script is created)
- `apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx` (for verification)

---

## Implementation Checklist

### Step A — Investigate Data Issue

- [ ] A1. Connect to or query the local Supabase instance to check if `user_shadcn` exists.
- [ ] A2. Verify if any components are linked to `user_shadcn`.

### Step B — Seed Shadcn Data

- [ ] B1. Create a script or use an existing mechanism to fetch components from `shadcn-ui/ui`.
- [ ] B2. Insert the components into the Supabase database for the `user_shadcn` user.

---

## Exit Gate

```bash
# Verify UI via browser or manual testing
# Expected: "shadcn/base" tab populates with shadcn primitives
```

- Components populate the registry modal.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing local Supabase credentials.
- `shadcn-ui/ui` repo structure is incompatible with current component schemas.
- validate-contract cannot be written due to missing prerequisite

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- Database seeding script (new)

---

## Public Contracts

- None

---

## Verification Evidence

```bash
# Manual verification step
# Expected: Components load in the Add Registry Modal
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/registry-enhancements/active/registry-enhancements_26-07-26/phase-03-shadcn-primitives_PLAN_26-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
