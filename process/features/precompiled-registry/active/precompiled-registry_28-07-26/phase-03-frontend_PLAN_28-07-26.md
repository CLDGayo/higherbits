---
name: plan:precompiled-registry-phase-03-frontend
description: "Precompiled Registry — Phase 03: Frontend Integration"
date: 28-07-26
metadata:
  node_type: memory
  type: plan
  feature: precompiled-registry
  phase: phase-03
---

# Phase 03 — Frontend Integration

**Program:** precompiled-registry
**Umbrella plan:** process/features/precompiled-registry/active/precompiled-registry_28-07-26/precompiled-registry-umbrella_PLAN_28-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-03-frontend_REPORT_28-07-26.md (flat in the program task folder)

---

## Purpose

Update the `AddRegistryModal` and `PreviewDialog` components on the frontend. They currently fall back to Sandpack when `bundle_url` is null. Since Phases 1 and 2 will populate `bundle_html_url` for all base components, this phase ensures the UI loads the instantaneous static iframe whenever a bundle URL is available, bypassing the slow in-browser compilation entirely.

---

## Entry Gate

- Phase 2 complete (Bundles are successfully generated for components)

---

## Blast Radius

- `apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx`
- `apps/web/components/features/component-page/preview-dialog.tsx`

---

## Implementation Checklist

### Step A — Modal Integration

- [ ] A1. Modify `AddRegistryModal` to prioritize `selectedComponent.bundle_html_url` (or equivalent) in an `iframe`.
- [ ] A2. Only use Sandpack as a last-resort fallback for local editing where no bundle exists.

### Step B — Verification

- [ ] B1. Manually test or write tests confirming that selecting a shadcn primitive instantly loads an iframe.

---

## Exit Gate

```bash
# Verify no TS errors
npx tsc --noEmit
# Expected: clean exit
```

- Clicking "Toggle Group" in the registry modal loads instantaneously without "Setting up Sandpack" loader.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing or malformed URLs from Phase 2.

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

- `apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx`

---

## Public Contracts

- Fast, instantaneous preview rendering via `iframe`.

---

## Verification Evidence

```bash
npx tsc --noEmit
# Expected: clean exit
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/precompiled-registry/active/precompiled-registry_28-07-26/phase-03-frontend_PLAN_28-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
