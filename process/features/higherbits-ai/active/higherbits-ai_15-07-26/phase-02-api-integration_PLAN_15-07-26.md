---
name: plan:higherbits-ai-phase-02-api-integration
description: "HigherBits AI Integration — Phase 02: API & Quota Integration"
date: 15-07-26
metadata:
  node_type: memory
  type: plan
  feature: higherbits-ai
  phase: phase-02
---

# Phase 02 — API & Quota Integration

**Program:** higherbits-ai
**Umbrella plan:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/higherbits-ai-umbrella_PLAN_15-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-02-api-integration_REPORT_15-07-26.md (flat in the program task folder)

---

## Purpose

This phase audits, hardens, and tests the backend `/api/magic/check` and `/api/magic/use` endpoints. We will ensure proper Supabase querying, test edge cases (like out-of-quota scenarios), and verify the API handles errors gracefully.

---

## Entry Gate

- Phase 01 complete

---

## Blast Radius

- `apps/web/app/api/magic/check/route.ts`
- `apps/web/app/api/magic/use/route.ts`
- `apps/web/app/api/magic/__tests__/*` (to be created)

---

## Implementation Checklist

### Step A — Code Audit

- [x] A1. Audit both endpoint routes for any security issues, rate limit bypasses, or race conditions.
- [x] A2. Refactor any repetitive Supabase query logic if necessary.
- [x] A3. Refactor `use/route.ts` to export `POST` instead of `GET` (and update `packages/ai/src/index.ts` accordingly).
- [x] A4. Document TOCTOU race condition in backlog (fixing requires DB RPC migration which violates safety constraints).

### Step B — Integration Tests

- [x] B1. Create integration/unit tests for `check` and `use` routes using Vitest.
- [x] B2. Mock Supabase interactions in the tests to verify both successful quota reduction and quota exceeded limits.

---

## Exit Gate

```bash
# Verify tests
corepack pnpm --filter web test
# Expected: tests for magic routes exit 0
```

- All implementation checklist items checked
- Phase report written

---

## Blockers That Would Justify BLOCKED Status

- Missing Next.js App Router testing utilities for `NextRequest`/`NextResponse`.

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

- `apps/web/app/api/magic/use/route.ts`
- `apps/web/app/api/magic/check/route.ts`
- `packages/ai/src/index.ts`

---

## Public Contracts

- `/api/magic/check` uses GET.
- `/api/magic/use` uses POST.

---

## Verification Evidence

```bash
corepack pnpm --filter web test
# Expected: PASS
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/higherbits-ai/active/higherbits-ai_15-07-26/phase-02-api-integration_PLAN_15-07-26.md`
- Last completed step: Step 4
- Validate-contract status: PASS
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

**Status:** CONDITIONAL PASS (TOCTOU deferred to backlog)
**Gate:** V7 Complete
**Plan updates applied:** Yes (A3, A4 added)
**Execute-agent instructions:**
1. Update `apps/web/app/api/magic/use/route.ts` to export `POST`.
2. Update `packages/ai/src/index.ts` to `fetch` the use endpoint with `POST`.
3. Create Vitest tests mocking Supabase to test `use` and `check` routes.
4. Record TOCTOU race condition in the backlog section of the phase report.
**Test gates:**
```bash
corepack pnpm --filter web test
```
**High-risk pack:** N/A
**Backlog artifacts:** Add to phase report: TOCTOU race condition requires `increment_usage` RPC.
**Known gaps:** TOCTOU race condition on concurrent API usage.
**Accepted by:** vc-validate-agent
