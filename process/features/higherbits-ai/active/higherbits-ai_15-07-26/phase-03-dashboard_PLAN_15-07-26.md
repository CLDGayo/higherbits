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

- [ ] A1. Build or update a dashboard route (e.g. `/dashboard/agent` or `/dashboard/api-keys`).
- [ ] A2. Create a form to generate a new `API_KEY` (inserts into Supabase `api_keys` table with Clerk user id).
- [ ] A3. Create a usage card to display `usages` vs `limit` for the user.

### Step B — Installation Instructions

- [ ] B1. Add an installation instruction component showing how to configure the `higherbits-ai` MCP server in Windsurf or Cursor.

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

- [ ] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [ ] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [ ] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [ ] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written per `.claude/skills/vc-validate-findings/references/example-validate-output.md`
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or `## Validate Contract`
reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator must
spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder.

---

## Touchpoints

- `apps/web/app/(dashboard)/*`

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
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
