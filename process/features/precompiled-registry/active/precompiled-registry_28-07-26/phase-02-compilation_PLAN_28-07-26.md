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
**Phase status:** ✅ COMPLETE
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

- [x] A1. Understand how `api/bundle/route.ts` processes payloads for `demos`.
- [x] A2. Analyze how to extract the payload generation logic out of the route and into a shared utility (e.g. `lib/bundler.ts`) that accepts a type parameter (`demo` or `component`).

### Step B — Pipeline Script

- [x] B1. Create `apps/web/lib/bundler.ts` and migrate the resolution logic from `api/bundle/route.ts` into it.
- [x] B2. Update `api/bundle/route.ts` to use this new shared utility for `demos`.
- [x] B3. Create the batch script `apps/web/scripts/compile-missing-bundles.ts`.
- [x] B4. In the script, query components missing a bundle_html_url, use the shared utility in `lib/bundler.ts` to generate and fetch the bundle, and save it back to the DB.

---

## Exit Gate

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: clean exit
```

- [x] A pipeline exists and can successfully generate a static bundle for at least one Shadcn component (e.g., Toggle Group).
- [x] Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing backend environment variables or access to the bundle microservice, preventing bundle generation.

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

**Status:** PENDING EXECUTION
**Gate:** PASS
**Plan updates applied:** None
**Execute-agent instructions:** 
- Create `apps/web/lib/bundler.ts` and extract the dependency resolution and fetch logic from `api/bundle/route.ts` into it.
- Ensure the utility can bundle both `demos` and base `components`.
- Update `apps/web/app/api/bundle/route.ts` to use this new utility for demos, preserving existing behavior.
- Create `apps/web/scripts/compile-missing-bundles.ts` that uses `dotenv`, initializes Supabase, queries `components` where `bundle_html_url` is null, uses `lib/bundler.ts` to bundle, and updates the database.
- Run `npx tsc --noEmit` to verify type safety.
- Test the script via dry-run or against a single test component to ensure it successfully generates a bundle HTML URL.
**Test gates:**
- **Automated:** `npx tsc --noEmit` (Must exit 0)
- **Hybrid:** Run `npx tsx apps/web/scripts/compile-missing-bundles.ts --dry-run` or similar to verify it successfully queries and processes components.
- **Agent-probe:** Review the script output to confirm it generated a valid URL for at least one component (e.g. Toggle Group).
**High-risk pack:** No
**Backlog artifacts:** None
**Known gaps:** None
**Accepted by:** vc-validate-agent
