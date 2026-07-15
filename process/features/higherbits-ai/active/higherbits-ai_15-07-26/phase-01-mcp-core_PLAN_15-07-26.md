---
name: plan:higherbits-ai-phase-01-mcp-core
description: "HigherBits AI Integration — Phase 01: MCP Server Core"
date: 15-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-ai
  phase: phase-01
---

# Phase 01 — MCP Server Core

**Program:** higherbits-ai
**Umbrella plan:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/higherbits-ai-umbrella_PLAN_15-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-01-mcp-core_REPORT_15-07-26.md (flat in the program task folder)

---

## Purpose

This phase formalizes and hardens the `@higherbits/ai` MCP server package created in the previous session. It ensures robust error handling, adds unit/integration tests for the core MCP endpoints, and verifies the packaging output matches our expectations for an NPM package.

---

## Entry Gate

- Phase 0 complete (all checklist items done, validators green)

---

## Blast Radius

- `packages/ai/src/index.ts`
- `packages/ai/package.json`
- `packages/ai/__tests__/*` (to be created)
- `packages/ai/vitest.config.ts` (to be created)

---

## Implementation Checklist

### Step A — Review and Hardening

- [ ] A1. Audit `packages/ai/src/index.ts` for uncaught promise rejections and clean exit handlers.
- [ ] A2. Ensure error outputs returned to the IDE are nicely formatted as per MCP standard.

### Step B — Testing

- [ ] B1. Create a `vitest.config.ts` for `packages/ai`.
- [ ] B2. Write a unit test `packages/ai/__tests__/index.test.ts` to mock the `fetch` API and test the search component logic.
- [ ] B3. Ensure `pnpm test` successfully executes the tests in `packages/ai`.

---

## Exit Gate

```bash
# Verify build
corepack pnpm --filter @higherbits/ai build
# Expected: exit 0

# Verify tests
corepack pnpm --filter @higherbits/ai test
# Expected: test suite exits 0
```

- All implementation checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- `@modelcontextprotocol/sdk` incompatible with test setup

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

- `packages/ai/src/index.ts`
- `packages/ai/__tests__/index.test.ts`

---

## Public Contracts

- `npx higherbits-ai` must start the stdio server.

---

## Verification Evidence

```bash
corepack pnpm --filter @higherbits/ai test
# Expected: PASS
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-01-mcp-core_PLAN_15-07-26.md`
- Last completed step: not started
- Validate-contract status: pending
- Next step: Spawn vc-research-agent for RESEARCH (Step 1)

---

## Validate Contract

**Status:** PASS
**Gate:** V7 Complete
**Plan updates applied:** Yes (Research and Innovate findings incorporated)
**Execute-agent instructions:**
1. Update `packages/ai/src/index.ts` to add exit handlers, update `main().catch`, and move validation inside `try-catch`.
2. Update `packages/ai/package.json` to add `vitest` to `devDependencies` and a `test` script.
3. Create `packages/ai/vitest.config.ts`.
4. Create `packages/ai/__tests__/index.test.ts` with mocked `fetch`.
**Test gates:**
```bash
corepack pnpm --filter @higherbits/ai build
corepack pnpm --filter @higherbits/ai test
```
**High-risk pack:** N/A
**Backlog artifacts:** None
**Known gaps:** None
**Accepted by:** vc-validate-agent
