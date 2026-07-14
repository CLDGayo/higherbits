---
name: plan:21st_replica-phase-05-ai_mcp
description: "21st.dev 1:1 Replica — Phase 05: AI & MCP"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st_replica
  phase: phase-05
---

# Phase 05 — AI & MCP

**Program:** 21st_replica
**Umbrella plan:** process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/21st_replica/active/21st_replica_07-07-26/phase-05-ai_mcp_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Implement the "21st AI" Build interface and the "CLI & MCP" tools page. The AI Build UI features a complex chat-like input area with specific focus states, and requires security validations to prevent unauthorized interactions. The MCP page showcases code copy components for terminal setups. Heavy usage of `vc-security` is required for the interactive chat endpoints.

---

## Entry Gate

- Phase 04 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/package.json`
- `apps/web/app/21st/ai/page.tsx`
- `apps/web/app/21st/mcp/page.tsx`
- `apps/web/components/21st/ai/PromptInput.tsx`
- `apps/web/components/21st/mcp/CliInstructions.tsx`

---

## Implementation Checklist

### Step 0 — Dependencies

- [ ] Install `react-resizable-panels` in `apps/web` (e.g., `npm install react-resizable-panels`).

### Step A — 21st AI Interface

- [ ] A1. Create the `/21st/ai` route layout matching the distinct chat UI (full-height, constrained width) at `apps/web/app/21st/ai/page.tsx`.
- [ ] A2. Build `PromptInput` at `apps/web/components/21st/ai/PromptInput.tsx` with auto-expanding textarea, "Submit" button, and mock loading states.
- [ ] A3. Implement the generative mock layout showing generated components in a resizable split-pane view utilizing `react-resizable-panels` in the main AI layout component.

### Step B — MCP & CLI Page

- [ ] B1. Create the `/21st/mcp` route highlighting CLI installation instructions at `apps/web/app/21st/mcp/page.tsx`.
- [ ] B2. Build `CliInstructions` at `apps/web/components/21st/mcp/CliInstructions.tsx` with step-by-step markdown-like copy blocks.

### Step C — Helper Skills Integration

- [ ] C1. Run `vc-security` to audit the mock endpoint handlers for the AI prompt submission (preventing XSS / injection even in mock).
- [ ] C2. Use `vc-predict` to review the split-pane architecture using `react-resizable-panels` for the AI interface and address responsive breaking points.
- [ ] C3. Final pass with `vc-frontend-design` to ensure exact spacing and button styling.

---

## Exit Gate

```bash
# Verify Playwright interaction tests
npx playwright test tests/ai-mcp.spec.ts
# Expected: All tests passing
```

- all checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Complex split-pane layout failing on mobile viewports.
- Security audit flags the mock API input handling.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
- [x] 4. PVL — vc-validate-agent: full V1-V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [x] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [x] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

---

## Touchpoints

- AI Build layout and MCP tool pages.

---

## Public Contracts

- none

---

## Verification Evidence

```bash
# Linting
npm run lint
# Expected: no errors
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/21st_replica/active/21st_replica_07-07-26/phase-05-ai_mcp_PLAN_07-07-26.md`
- Last completed step: EVL (Step 6)
- Validate-contract status: valid
- Next step: Spawn update-process-agent for UPDATE-PROCESS (Step 7)

---

## Validate Contract

**Status: STANDING-GRANTED**
(Because this program is running under a persistent autonomous `/goal`)

**Directions to EXECUTE Agent:**

1. Install `react-resizable-panels` within the `apps/web` workspace.
2. Scaffold `apps/web/app/21st/ai/page.tsx` and `apps/web/app/21st/mcp/page.tsx`.
3. Build the `PromptInput` and split-pane UI components securely under `apps/web/components/21st/ai/`.
4. Build the `CliInstructions` component under `apps/web/components/21st/mcp/`.

**Test Gates:**

- `npm run lint`
- `npm run build`
  These must confirm integration.
