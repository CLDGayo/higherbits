---
name: plan:precompiled-registry-phase-02-compilation
description: "Precompiled Registry — Phase 02: Compilation Pipeline"
date: 28-07-26
metadata:
  node_type: memory
  type: plan
  feature: precompiled-registry
  phase: phase-02
---

# Phase 02 — Compilation Pipeline

**Program:** precompiled-registry
**Umbrella plan:** process/features/precompiled-registry/active/precompiled-registry_28-07-26/precompiled-registry-umbrella_PLAN_28-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-02-compilation_REPORT_28-07-26.md (flat in the program task folder)

---

## Purpose

Create a backend compilation pipeline (a script, cron job, or API route) that iterates over all components in the registry (like Shadcn primitives and community components) that currently lack a valid `bundle_url` or `bundle_html_url`. It will format their code properly, pass it to the existing `api/bundle` service, and store the resulting HTML bundle URL back into the database.

---

## Entry Gate

- Phase 1 complete (Schema updated and ready)

---

## Blast Radius

- `apps/web/scripts/compile-missing-bundles.ts` (or equivalent new script)
- `apps/web/app/api/bundle/route.ts` (if modification is needed to accept bare components without demos)

---

## Implementation Checklist

### Step A — Analysis

- [ ] A1. Understand how `api/bundle/route.ts` processes payloads for `demos`.
- [ ] A2. Determine how to adapt the payload structure for `components` that don't have an explicit `demo_code` but do have standard code and registry dependencies.

### Step B — Pipeline Script

- [ ] B1. Create a script or API route to query the Supabase DB for components where `bundle_html_url` (or the equivalent new field) is null.
- [ ] B2. For each component, extract its files, registry dependencies, and global CSS/Tailwind configs.
- [ ] B3. Dispatch these payloads to the bundle service.
- [ ] B4. Write the received HTML URL back to the DB for that component.

---

## Exit Gate

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: clean exit
```

- A pipeline exists and can successfully generate a static bundle for at least one Shadcn component (e.g., Toggle Group).
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing backend environment variables or access to the bundle microservice, preventing bundle generation.

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
spawn vc-validate-agent first.

---

## Touchpoints

- Pipeline script/API
- `api/bundle` route

---

## Public Contracts

- Internal tooling only

---

## Verification Evidence

```bash
# Run the pipeline script in dry-run mode or against a test component
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-02-compilation_PLAN_28-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
