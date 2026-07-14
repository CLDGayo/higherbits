---
name: plan:creator-studio-phase-03-live-preview
description: "Creator Studio — Phase 03: Live Preview & Validation"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio
  phase: phase-03
---

# Phase 03 — Live Preview & Validation

**Program:** creator-studio
**Umbrella plan:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/creator-studio-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-03-live-preview_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Integrate the editor with the live preview engine. Ensure secure code evaluation and rendering of the multi-file component drafts.

---

## Entry Gate

- Phase 2 complete.
- Editor UI renders with local state.

---

## Blast Radius

- `apps/web/components/studio/`
- `apps/web/components/preview/`

---

## Implementation Checklist

### Step A — Secure Code Evaluation

- [x] A1. Configure `customSetup.dependencies` in `<SandpackProvider />` within `editor-shell.tsx` to securely manage dependencies.
- [x] A2. Map the form's dependency state directly to `<SandpackProvider />` to continuously feed local state.

### Step B — Validation

- [x] B1. Ensure Sandpack's built-in `<ErrorOverlay />` is active for runtime/transpilation errors (verify `showOpenInCodeSandbox={false}`).
- [x] B2. Add a Zod refinement or form-level validation in `studio-form.tsx` that blocks dependencies like `electron`, `puppeteer`, etc., before they reach Sandpack.

---

## Decision Summary

### 1. Error UI
**Decision:** Rely on the built-in Sandpack `<ErrorOverlay />` for rendering runtime/transpilation errors directly over the preview.
**Rejected Alternatives:** Building a custom error console at the bottom of the editor using `useSandpack().sandpack.error`. The overlay provides immediate, inline feedback and saves screen real estate without extra custom UI work. We will skip `<SandpackConsole />` for now to maintain a clean interface.

### 2. Dependency Validation
**Decision:** Enforce dependency blocking via a Zod schema refinement on the metadata form. We will not expose `/package.json` in the Sandpack file editor to prevent bypassing the form. Dependencies will be strictly managed through the UI form state and passed directly to `customSetup.dependencies`.
**Rejected Alternatives:** Allowing manual `package.json` editing and attempting to intercept package resolution. Sandpack lacks a native hook to block dependencies at the bundler level, making UI-level validation the only robust option.

### 3. State Integration
**Decision:** The editor form state (for dependencies) and the code editor state (for file contents) will be managed via centralized state (e.g., Zustand or React context) and fed directly into the `files` and `customSetup.dependencies` props of the `<SandpackProvider />`. This ensures continuous, declarative synchronization.
**Rejected Alternatives:** Using manual "Run" buttons or imperative ref-based syncing, which leads to a disjointed developer experience and is less idiomatic in React.

---

## Exit Gate

```bash
# Type check the web app
corepack pnpm --filter web type-check
# Expected: exit 0
```

- Live preview evaluates code safely and renders it.
- Errors are caught and displayed.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Upstream Phase 2 exit gate not yet passed.
- Sandboxing escapes or security vulnerabilities found in evaluation model.
- validate-contract cannot be written due to missing prerequisite.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note if sections changed (or "n/a — research clean")
  - **Inner Loop Refresh Note:** Updated checklist A1/A2 and B1/B2 based on Decision Summary (using Sandpack Provider dependencies and ErrorOverlay).
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

- `apps/web/components/studio/`

---

## Public Contracts

- None

---

## Verification Evidence

```bash
# Verify build
corepack pnpm --filter web build
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-03-live-preview_PLAN_07-07-26.md`
- Last completed step: Step 7 (UPDATE PROCESS)
- Validate-contract status: PASS
- Phase status: ✅ COMPLETE

---

## Validate Contract

Status: PASS
Date: 07-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: Single-package UI component change
Agent count: 1 (executor)

### Plan updates applied
- None required; plan correctly delegates to Sandpack UI controls.

### Execute-agent instructions
- A1/A2: Ensure form state is debounced before feeding to `<SandpackProvider />` to avoid excessive evaluation triggers.
- B1: Confirm `<ErrorOverlay />` remains visible over the preview iframe when a runtime error occurs.
- B2: Ensure the Zod validation strictly disallows Node.js core modules and server-side dependencies.

### Test gates (run after each section; regression suite after all sections)

**apps/web/components/studio and preview**
- fully-automated: `corepack pnpm --filter web type-check` exits 0
  Proves: No typescript errors in Sandpack state integration.
- fully-automated: `corepack pnpm --filter web build` exits 0
  Proves: Next.js build passes with Sandpack dependencies.

**Regression suite (after all sections complete)**
- `corepack pnpm --filter web type-check` exits 0
- `corepack pnpm --filter web build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
session — initial validation

---

## EVL HANDOFF SUMMARY

### Test Results
- `type-check`: PASS
- `build`: PASS

### Follow-up Stubs
- None

### Handoff
- Tests are green. Ready for UPDATE PROCESS (Step 7).
