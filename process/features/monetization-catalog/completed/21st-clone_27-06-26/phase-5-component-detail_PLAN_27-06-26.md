---
name: plan:21st-clone-phase-5-component-detail
description: "21st-clone — Phase 5: Component detail experience audit and testing"
date: 27-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-5
---

# Phase 5 — Component Detail Experience

**Program:** 21st-clone monetization-catalog
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_27-06-26/21st-clone-umbrella_PLAN_27-06-26.md
**Phase status:** 🔨 IN PROGRESS (EXECUTE pending)
**Report destination:** process/features/monetization-catalog/active/21st-clone_27-06-26/phase-5-component-detail_REPORT_27-06-26.md

---

## Purpose

Finalize the Component Detail Experience. Research discovered that the core features of Phase 5 (Preview/Code tabs, copy-code button, `npx`-style install command, and dependency list) were already scaffolded during the legacy `04-preview-engine.md` phase. The goal of this phase is to harden the existing implementation by adding unit test coverage for the preview components and formally validating them against the SPEC.

---

## Blast Radius

- `apps/web/__tests__/preview.test.tsx` **[NEW]** — Vitest coverage for `InstallBlock` and `CopyButton`.
- `apps/web/package.json` — verify testing packages exist.

---

## Inner Loop Refresh Note (PLAN-SUPPLEMENT, 2026-06-29)

RESEARCH discovered that `apps/web/components/preview/preview-engine.tsx`, `preview-tabs.tsx`, `install-block.tsx`, and `copy-button.tsx` already exist and fully support the Phase 5 requirements. No new UI needs to be built. We will add a test file `apps/web/__tests__/preview.test.tsx` to lock in this behavior.

---

## Implementation Checklist

### Step A — Audit (COMPLETED by RESEARCH)
- [x] A1. Audit `preview-tabs.tsx`, `install-block.tsx`, and `copy-button.tsx` to confirm Phase 5 goals are met.

### Step B — Testing and Hardening
- [ ] B1. Create `apps/web/__tests__/preview.test.tsx`.
- [ ] B2. Test that `InstallBlock` correctly renders `pnpm dlx`, `npx`, `bunx` prefixes when the package managers are selected.
- [ ] B3. Test that `InstallBlock` accurately displays manual dependencies if provided.

### Step C — Execution and Validation
- [ ] C1. Run `corepack pnpm --filter web test` and ensure tests pass.
- [ ] C2. Run `corepack pnpm --filter web build` to ensure no build regressions.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Preview UI renders correctly | Hybrid | Phase 5 UI Completion |
| CLI commands match package manager | Fully-Automated | Component Installation Workflow |

---

## Test Infra Improvement Notes

- Adding UI component tests requires `@testing-library/react` and `jsdom`. We will check if these are installed. If not, we will install them or mock the DOM for vitest.

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-5-component-detail_PLAN_27-06-26.md`
- Last completed step: PLAN (2026-06-29)
- Validate-contract status: skipping PVL — plan gaps resolved inline by RESEARCH+PLAN-SUPPLEMENT
- Next step: EXECUTE — write the tests and run the test gates.
