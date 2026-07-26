---
name: plan:registry-enhancements-phase-01-install-component
description: "Registry Enhancements — Phase 01: Install Component Fix"
date: 26-07-26
metadata:
  node_type: memory
  type: plan
  feature: registry-enhancements
  phase: phase-01
---

# Phase 01 — Install Component Fix

**Program:** registry-enhancements
**Umbrella plan:** process/features/registry-enhancements/active/registry-enhancements_26-07-26/registry-enhancements-umbrella_PLAN_26-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/registry-enhancements/active/registry-enhancements_26-07-26/phase-01-install-component_REPORT_26-07-26.md (flat in the program task folder)

---

## Purpose

This phase addresses the bug where the "Install component" button spins indefinitely (shows "Loading..."). The root cause is likely a Clerk timeout when calling `auth.getToken()` that isn't caught, leaving `installUrl` undefined. We will add a fallback mechanism so the URL is generated even if the token fetch fails. We will also generate an explanation of standard package managers (`bun`, `npm`, `yarn`, `pnpm`).

---

## Entry Gate

- Phase 0 complete (umbrella plan and stubs created)

---

## Blast Radius

- `apps/web/components/features/component-page/component-preview.tsx`

---

## Implementation Checklist

### Step A — Fix Install Component Loading

- [ ] A1. Locate `useInstallUrl` hook in `component-preview.tsx`.
- [ ] A2. Add a `.catch()` block to `auth.getToken()` to fallback to `url.toString()` without the token.
- [ ] A3. Ensure the `catch` block correctly triggers `setInstallUrl()`.

### Step B — Explain Package Managers

- [ ] B1. Provide a markdown artifact or chat explanation outlining what `bun`, `npm`, `yarn`, and `pnpm` are, and how they relate to installing components.

---

## Exit Gate

```bash
npm run build
# Expected: Successful build
```

- Install component button renders correctly without hanging on "Loading..."
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Fix requires deep changes to auth strategy that are out of scope.
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

- `apps/web/components/features/component-page/component-preview.tsx`

---

## Public Contracts

- External component APIs unchanged.

---

## Verification Evidence

```bash
npm run build
# Expected: Build completes without errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/registry-enhancements/active/registry-enhancements_26-07-26/phase-01-install-component_PLAN_26-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
