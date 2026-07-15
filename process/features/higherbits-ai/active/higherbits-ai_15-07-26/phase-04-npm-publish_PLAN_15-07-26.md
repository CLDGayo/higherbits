---
name: plan:higherbits-ai-phase-04-npm-publish
description: "HigherBits AI Integration — Phase 04: NPM Publish & Production"
date: 15-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-ai
  phase: phase-04
---

# Phase 04 — NPM Publish & Production

**Program:** higherbits-ai
**Umbrella plan:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/higherbits-ai-umbrella_PLAN_15-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-04-npm-publish_REPORT_15-07-26.md (flat in the program task folder)

---

## Purpose

This final phase prepares the `packages/ai` folder for publishing to npm as `higherbits-ai` so users can easily run the MCP via `npx`. We will also finalize any landing page/marketing copy reflecting the new "HigherBits AI" feature.

---

## Entry Gate

- Phase 03 complete

---

## Blast Radius

- `packages/ai/package.json`
- `.github/workflows/npm-publish.yml` (if using Actions) or a publish script
- `apps/web/components/marketing/*`

---

## Implementation Checklist

### Step A — Publishing Configuration

- [ ] A1. Validate `packages/ai/package.json` has correct `name`, `version`, `bin`, and `exports`.
- [ ] A2. Create a GitHub Actions workflow or a `pnpm release` script for automated or manual publishing to npm.

### Step B — Marketing Polish

- [ ] B1. Review landing page marketing components to ensure "HigherBits AI" is featured correctly.
- [ ] B2. Perform a final End-to-End smoke test of the MCP server.

---

## Exit Gate

```bash
# Verify build
corepack pnpm build
# Expected: All workspace packages build successfully
```

- All implementation checklist items checked
- Phase report written

---

## Blockers That Would Justify BLOCKED Status

- Missing NPM Auth Token (this will be safely bypassed/mocked if unavailable, leaving just the workflow in place).

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

- `.github/workflows/*`
- `packages/ai/package.json`

---

## Public Contracts

- `npx higherbits-ai` is the public API.

---

## Verification Evidence

```bash
corepack pnpm build
# Expected: PASS
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-04-npm-publish_PLAN_15-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
