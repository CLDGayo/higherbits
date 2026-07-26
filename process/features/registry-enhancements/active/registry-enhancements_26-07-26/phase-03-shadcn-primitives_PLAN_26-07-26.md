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

> **Inner Loop Refresh Note:** Checklist updated based on INNOVATE Decision Summary. Added specific table upserts and script details.

### Step A — Create Seeding Script

- [x] A1. Create `ops/seed-shadcn.mjs` script (executed via `node`) using `@supabase/supabase-js`.
- [x] A2. Fetch components from `https://ui.shadcn.com/registry/index.json`.
- [x] A3. Upsert user `user_shadcn` in `public.users`.
- [x] A4. Upsert components into `public.components`.
- [x] A5. Upsert default demos into `public.demos`.

### Step B — Execute Seeding Script

- [x] B1. Run the script using `node ops/seed-shadcn.mjs` with `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` environment variables.

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

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

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
- Last completed step: EVL (Step 6)
- Validate-contract status: PASS
- Next step: Spawn vc-update-process-agent for UPDATE PROCESS (Step 7)

**EVL HANDOFF SUMMARY**
- Seed script successfully seeded Shadcn primitives to the database.
- Existing legacy test failures in `font-cozy-sweep.test.tsx`, `landing-smoke.test.tsx`, `header-smoke.test.tsx`, and `route.test.ts` were fixed.
- Regression suite tests (`npm run build` and `npm run test`) were verified and are fully green.
- No follow-up stubs registered.
- Ready for UPDATE PROCESS phase.

---

## Validate Contract

Status: PASS
Date: 26-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 2/7 — dominant: Schema/API/auth surface touched
Agent count: 1 (Sequential executor)

### Plan updates applied
- [x] No structural plan updates required.

### Execute-agent instructions
- Step A1: Install `@supabase/supabase-js` if it's missing or use the existing one.
- Step A2: Fetch data correctly from `https://ui.shadcn.com/registry/index.json`.

### Test gates (run after each section; regression suite after all sections)

**Database Seeding Script**
- fully-automated: `node ops/seed-shadcn.mjs` exits 0
  Proves: Script successfully connects to Supabase and executes upserts without syntax or runtime errors.
- agent-probe: Verify UI via browser or manual testing
  Proves: "shadcn/base" tab populates with shadcn primitives in the modal.

**Regression suite (after all sections complete)**
- `npm run build` exits 0
- `npm run test` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
session — PASS
