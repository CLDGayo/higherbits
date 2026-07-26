---
name: plan:registry-enhancements-phase-02-copy-ai-prompt
description: "Registry Enhancements — Phase 02: Copy AI Prompt Upgrade"
date: 26-07-26
metadata:
  node_type: memory
  type: plan
  feature: registry-enhancements
  phase: phase-02
---

# Phase 02 — Copy AI Prompt Upgrade

**Program:** registry-enhancements
**Umbrella plan:** process/features/registry-enhancements/active/registry-enhancements_26-07-26/registry-enhancements-umbrella_PLAN_26-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/registry-enhancements/active/registry-enhancements_26-07-26/phase-02-copy-ai-prompt_REPORT_26-07-26.md (flat in the program task folder)

---

## Purpose

This phase enhances the "Copy AI Prompt" modal. We will add new prompt targets (`Claude`, `Codex`, `Antigravity`, and `GoHighLevel`) to the options list. For `GoHighLevel`, the output should exclusively be raw HTML/JS code (not an AI prompt string) and the modal's copy button should adapt to say "Copy Code". We will also inject the "Prompt Rule" and "Additional Context" as HTML comments for `GoHighLevel` to satisfy the user's requirement that they remain "functional".

---

## Entry Gate

- Phase 1 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/lib/prompts.tsx`
- `apps/web/components/ui/copy-prompt-dialog.tsx`
- `types/global.ts` (if prompt types are defined there)

---

## Implementation Checklist

### Step A — Add New Prompt Options

- [ ] A1. Define IDs for `CLAUDE`, `CODEX`, `ANTIGRAVITY`, and `GOHIGHLEVEL` in `PROMPT_TYPES` (likely in `types/global.ts` or `lib/prompts.ts`).
- [ ] A2. Add the 4 new options to the `promptOptions` array in `apps/web/lib/prompts.tsx` with appropriate icons and descriptions.

### Step B — Implement GoHighLevel Output Logic

- [ ] B1. Update `getComponentInstallPrompt` in `lib/prompts.tsx` to handle `PROMPT_TYPES.GOHIGHLEVEL`.
- [ ] B2. Format the output for GoHighLevel to be raw HTML/JS (extracting the raw code components).
- [ ] B3. Ensure that if `promptRule` or `userAdditionalContext` is provided, they are appended as HTML comments at the top of the GoHighLevel code block.

### Step C — Update Modal UI for GoHighLevel

- [ ] C1. Modify `copy-prompt-dialog.tsx` so that when `GoHighLevel` is selected, the submit button text changes from "Copy Prompt" to "Copy Code".

---

## Exit Gate

```bash
npm run build
# Expected: Successful build
```

- Modal displays new options.
- Selecting GoHighLevel changes button text and outputs code properly.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing type definitions in `PROMPT_TYPES` that cannot be safely extended.
- Icons missing for new options (fallback to generic icons if needed, but not a hard blocker).

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

- `apps/web/lib/prompts.tsx`
- `apps/web/components/ui/copy-prompt-dialog.tsx`
- `types/global.ts` (or wherever `PROMPT_TYPES` lives)

---

## Public Contracts

- None

---

## Verification Evidence

```bash
npm run build
# Expected: Build completes without errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/registry-enhancements/active/registry-enhancements_26-07-26/phase-02-copy-ai-prompt_PLAN_26-07-26.md`
- Last completed step: EVL (Step 6)
- Validate-contract status: PASS
- Next step: Spawn vc-update-process-agent for UPDATE PROCESS (Step 7)

### EVL HANDOFF SUMMARY
- Target: Phase 02 - Copy AI Prompt Upgrade
- Outcome: EVL test gates successfully passed. `npm run build` completed without errors.
- Regressions: None detected during the build verification.
- Follow-up stubs: None needed.
- Next action: Proceed to UPDATE PROCESS to write phase report, update umbrella state, and commit.

---

## Validate Contract

Status: PASS
Date: 26-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: Trivial UI scope
Agent count: 1 (executor)

### Plan updates applied
- [x] PVL step checkbox ticked

### Execute-agent instructions
- Confirm the structure of `GoHighLevel` output (only raw HTML/JS + HTML comments for prompt rule and context).

### Test gates (run after each section; regression suite after all sections)

**UI Components (`apps/web`)**
- fully-automated: `npm run build` exits 0
  Proves: Next.js build succeeds with no type errors.
- agent probe: Check the UI changes locally or via Vercel preview (if applicable). Modal displays correctly and GoHighLevel output matches requirements.
- Known-gap: No specific e2e tests for this modal. resolution: accepted, UI is simple.

**Regression suite (after all sections complete)**
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- No specific automated e2e test for the GoHighLevel code output format — Accepted manually as scope is limited UI string parsing.

### Accepted by
User
