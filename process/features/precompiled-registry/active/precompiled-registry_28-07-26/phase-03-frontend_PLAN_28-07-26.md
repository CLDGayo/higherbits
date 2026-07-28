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
**Phase status:** ✅ COMPLETE
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

- [x] A1. Modify `AddRegistryModal` to prioritize `selectedComponent.bundle_html_url` (or equivalent) in an `iframe`.
- [x] A2. Only use Sandpack as a last-resort fallback for local editing where no bundle exists.

### Step B — Verification

- [x] B1. Manually test or write tests confirming that selecting a shadcn primitive instantly loads an iframe.

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

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (n/a — research clean)
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md` (Status / Gate / Plan updates applied / Execute-agent instructions / Test gates / High-risk pack / Backlog artifacts / Known gaps / Accepted by)
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

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
- Last completed step: UPDATE PROCESS (Step 7)
- Validate-contract status: PASS
- Next step: Phase complete. Program complete.

---

## Validate Contract

**Status:** PENDING EXECUTION
**Gate:** PASS
**Plan updates applied:** None
**Execute-agent instructions:** 
- Open `apps/web/components/add-registry-modal.tsx` and append `|| selectedComponent.component?.bundle_html_url` to the `bundleUrl` resolution fallback chain.
- Open `apps/web/components/features/component-page/preview-dialog.tsx` (if it exists under that path, else find `preview-dialog.tsx` in `apps/web/components`) and append `|| demo.component?.bundle_html_url` to its `bundleUrl` resolution fallback chain.
- Run `npx tsc --noEmit` to verify type safety.
- Open the dev server in the browser and verify the "Add Registry Modal" now instantly loads the iframe preview for a base component without a demo.
**Test gates:**
- **Automated:** `npx tsc --noEmit` (Must exit 0 or have 0 errors in our blast radius)
- **Hybrid:** None
- **Agent-probe:** Use Browser/Puppeteer or manual verification to open the Add Registry modal, select a base component (e.g. Toggle Group), and verify the iframe renders instead of Sandpack.
**High-risk pack:** No
**Backlog artifacts:** None
**Known gaps:** None
**Accepted by:** vc-validate-agent
