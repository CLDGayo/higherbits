---
name: plan:higherbits-ai-phase-03-dashboard
description: "HigherBits AI Integration — Phase 03: Dashboard & Onboarding"
date: 15-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-ai
  phase: phase-03
---

# Phase 03 — Dashboard & Onboarding

**Program:** higherbits-ai
**Umbrella plan:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/higherbits-ai-umbrella_PLAN_15-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-03-dashboard_REPORT_15-07-26.md (flat in the program task folder)

---

## Purpose

This phase creates the user-facing settings page where authenticated users can view, generate, or revoke their HigherBits AI API keys, view their monthly usage limits (which hook into the existing `/api/magic` logic), and see clear copy-paste installation instructions for the IDE.

---

## Entry Gate

- Phase 02 complete

---

## Blast Radius

- `apps/web/app/(dashboard)/*`
- `apps/web/components/features/magic/*`
- `apps/web/components/ui/*`

---

## Implementation Checklist

### Step A — User Dashboard UI

- [x] A1. Update `apps/web/app/magic/console/page.client.tsx` to add an API Key section.
- [x] A2. Form already exists (`createApiKey` using RPC). Just expose it in the UI.
- [x] A3. Rename the usage limit display from "New UI Generations" to "API Requests".

### Step B — Installation Instructions

- [x] B1. Update "Install Command Section" in `page.client.tsx` to display the installation command directly (using `<Code>` component) rather than linking to an onboarding page.

---

## Exit Gate

```bash
# Verify build
corepack pnpm --filter web build
# Expected: build succeeds without type errors

# Smoke test
corepack pnpm --filter web test
# Expected: tests pass
```

- All implementation checklist items checked
- Phase report written

---

## Blockers That Would Justify BLOCKED Status

- Missing Clerk user integration or unknown Supabase schema for `api_keys`/`usages` tables.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/app/magic/console/page.client.tsx`

---

## Public Contracts

- Web dashboard visual changes only.

---

## Verification Evidence

```bash
corepack pnpm --filter web build
# Expected: PASS
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-03-dashboard_PLAN_15-07-26.md`
- Last completed step: Step 4
- Validate-contract status: PASS
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

**Status:** PASS
**Gate:** V7 Complete
**Plan updates applied:** Yes (A1, A2, A3, B1 updated to match current codebase architecture)
**Execute-agent instructions:**
1. Open `apps/web/app/magic/console/page.client.tsx`.
2. Add an "API Key" section using the existing `apiKey`, `createApiKey`, and `handleCopyApiKey` state and functions.
3. Update the "Current Plan" section to say "API Requests" instead of "New UI Generations".
4. Update the "Install Command Section" to render the `command` variable directly using the `Code` component.
**Test gates:**
```bash
corepack pnpm --filter web build
corepack pnpm --filter web test
```
**High-risk pack:** N/A
**Backlog artifacts:** N/A
**Known gaps:** N/A
**Accepted by:** vc-validate-agent
