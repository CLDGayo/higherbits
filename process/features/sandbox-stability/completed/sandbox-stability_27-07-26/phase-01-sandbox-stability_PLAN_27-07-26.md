---
name: plan:sandbox-stability-phase-01-sandbox-stability
description: "sandbox-stability — Phase 01: Initialization & Stability Fixes"
date: 27-07-26
metadata:
  node_type: memory
  type: plan
  feature: sandbox-stability
  phase: phase-01
---

# Phase 01 — Initialization & Stability Fixes

**Program:** sandbox-stability
**Umbrella plan:** process/features/sandbox-stability/active/sandbox-stability_27-07-26/sandbox-stability-umbrella_PLAN_27-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-01-sandbox-stability_REPORT_27-07-26.md (flat in the program task folder)

---

## Purpose

This phase focuses on fixing underlying issues that prevent the sandbox from loading quickly or without breaking errors. We will address the React DevTools console warning, the Clerk development keys warning, a Radix Dialog missing title error, and the Node contains exception triggered by handleScroll.js, while ensuring the CodeSandbox iframe preview works properly without being stuck on "Installing...".

---

## Entry Gate

- Phase 0 (Program Start) complete: umbrella plan and phase plans created.

---

## Blast Radius

- apps/web/app/layout.tsx (and/or where ClerkProvider is configured)
- apps/web/components/ui/dialog.tsx (or instances using DialogContent without DialogTitle)
- apps/web/components/features/studio/sandbox/hooks/use-sandbox.ts
- apps/web/components/features/studio/sandbox/components/live-preview.tsx (or equivalent preview wrapper)

---

## Implementation Checklist

### Step A — Sandbox VM Boot Reliability

- [ ] A1. Investigate `use-sandbox.ts` / CodeSandbox iframe initialization to fix the stuck "Installing..." state.
- [ ] A2. Ensure the dev server port mapping and polling logic correctly resolves.

### Step B — React & UI Error Fixes

- [ ] B1. Suppress or fix the React DevTools download warning (if possible, or ignore if it's a browser-level dev message).
- [ ] B2. Address the Clerk development keys warning by ensuring it doesn't break the UI, or ignore if it's purely a dev environment warning that can't be suppressed without prod keys.
- [ ] B3. Add `<DialogTitle className="sr-only">...</DialogTitle>` to DialogContent components that are missing them to satisfy Radix accessibility requirements.
- [ ] B4. Fix the `handleScroll.js` Node contains TypeError. This typically happens when a Radix UI component (like Dialog or Popover) is rendered without a proper DOM node ref, or when removing nodes incorrectly.

---

## Exit Gate

```bash
# Check build passes
corepack pnpm --filter web build
# Expected: exit 0

# Check typescript passes
corepack pnpm --filter web exec tsc --noEmit
# Expected: exit 0
```

- Sandbox loads and preview works without getting stuck on "Installing...".
- No DialogTitle missing errors in the console.
- No handleScroll.js TypeError in the console when using the Sandbox or Dialogs.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- CodeSandbox VM API is fundamentally broken or unresponsive for this environment.
- Radix UI or React issues require a major version upgrade that breaks other components.

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

- apps/web/app/layout.tsx
- apps/web/components/ui/dialog.tsx
- apps/web/components/features/studio/sandbox/hooks/use-sandbox.ts

---

## Public Contracts

- none

---

## Verification Evidence

```bash
corepack pnpm --filter web build
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/sandbox-stability/active/sandbox-stability_27-07-26/phase-01-sandbox-stability_PLAN_27-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
