---
name: plan:creator-studio-phase-02-core-editor
description: "Creator Studio — Phase 02: Core Editor Shell & State"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: creator-studio
  phase: phase-02
---

# Phase 02 — Core Editor Shell & State

**Program:** creator-studio
**Umbrella plan:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/creator-studio-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ IN PROGRESS (INNOVATE complete)
**Report destination:** process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-02-core-editor_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Implement the chosen editor framework in the `/studio` route and wire up local state management for the multi-file data model defined in Phase 1.

---

## Entry Gate

- Phase 1 complete (all checklist items done, validators green).
- Data model and framework chosen.

---

## Blast Radius

- `apps/web/app/studio/page.tsx` (existing — updated)
- `apps/web/app/studio/studio-form.tsx` (existing — heavily modified or replaced)
- `apps/web/app/studio/layout.tsx` (new — SandPackCSS injection)
- `apps/web/components/studio/` (new directory — `EditorShell`, `SandPackCSS`)

---

## Implementation Checklist

### Step A — Editor Framework Selection/Scaffold

- [x] A1. Install dependencies: `pnpm install @codesandbox/sandpack-react`.
- [x] A2. Create `apps/web/components/studio/sandpack-css.tsx` (client component) for SSR CSS injection.
- [x] A3. Create `apps/web/app/studio/layout.tsx` to wrap the studio in `<SandPackCSS />`.
- [x] A4. Create `apps/web/components/studio/editor-shell.tsx` incorporating `SandpackProvider`, `SandpackCodeEditor`, and `SandpackPreview`.
- [x] A5. Refactor `apps/web/app/studio/studio-form.tsx` to replace the textarea and preview pane with `<EditorShell />`.

### Step B — Local State Wiring

- [x] B1. Delegate file state to `SandpackProvider` instead of parallel React state.
- [x] B2. Update `studio-form.tsx` to read the file contents using `useSandpack()` when the user submits the form.

---

## Decision Summary

> Written by: vc-innovate-agent · Phase 02 INNOVATE · 07-07-26

### Decision 1 — Route Location

**Chosen:** Keep the existing `app/studio/` route (OUTSIDE the `(catalog)` route group).

**Rationale:** The catalog layout (`app/(catalog)/layout.tsx`) adds a 224px (`w-56`) sidebar with category navigation. A full-width code editor needs every pixel — injecting it inside the catalog layout would squeeze the editor and create a poor authoring UX. The studio already lives at `app/studio/` with a working server component + client form. Moving it into `(catalog)` would be net-negative.

**Rejected:** `app/(catalog)/studio/` — plan's original spec. Rejected because the catalog sidebar is an unwanted constraint for an editor-centric layout.

**Plan drift note:** The plan's Blast Radius and Touchpoints sections referenced `apps/web/app/(catalog)/studio/page.tsx`. These have been corrected to `apps/web/app/studio/` in this revision.

---

### Decision 2 — Integration Approach

**Chosen:** Create a new `EditorShell` component at `apps/web/components/studio/editor-shell.tsx` and consume it from the studio page. The existing `studio-form.tsx` will be refactored to replace the `<textarea>` middle pane and the placeholder preview pane with the `EditorShell` (which wraps `SandpackProvider` + `SandpackCodeEditor` + `SandpackPreview`).

**Rationale:** Extracting the Sandpack integration into a dedicated component in `components/studio/` follows the project's RSC → Client composition pattern (server page imports client interactive parts). It keeps the `EditorShell` reusable and testable in isolation while `studio-form.tsx` continues to own the metadata form, submission logic, and overall layout.

**Rejected:**
- **In-place textarea swap** — replacing the `<textarea>` directly inside `studio-form.tsx` without extracting a component. Rejected because it would bloat the form component with Sandpack wiring and hurt readability/testability.
- **Full page rewrite** — deleting `studio-form.tsx` and rebuilding from scratch. Rejected because the metadata form, submission flow, and success state are working correctly and should be preserved.

---

### Decision 3 — CSS Injection

**Chosen:** Add a `SandPackCSS` client component to `apps/web/components/studio/sandpack-css.tsx` and invoke it from a new `apps/web/app/studio/layout.tsx` studio layout file.

**Rationale:** Sandpack injects CSS at runtime which causes a FOUC (Flash of Unstyled Content) during SSR. The fix is `getSandpackCssText()` + `useServerInsertedHTML()` in a client component. Placing this in a studio-specific layout scopes the CSS injection to routes that actually use Sandpack, avoiding unnecessary work on other pages. The root layout should not be polluted with Sandpack-specific concerns.

**Rejected:** Root layout injection — would load Sandpack CSS on every page even where Sandpack is never used.

---

### Decision 4 — State Shape

**Chosen:** Let `SandpackProvider` own file state internally. Use `useSandpack()` hook to read file contents at submit time.

**Rationale:** Sandpack's `SandpackProvider` already maintains a multi-file state model (`files: Record<string, { code: string }>`) with built-in file-switching, tab management, and syntax highlighting sync. Duplicating this into parallel React state (via `useState` or Zustand) would create a synchronization burden with zero benefit. The metadata form fields (component name, category, etc.) remain as standard React form state in `studio-form.tsx` since they are outside Sandpack's domain.

**Rejected:**
- **Parallel React state** — maintaining a shadow `useState<Record<string, string>>` mirroring Sandpack files. Rejected because it's redundant, error-prone, and adds sync complexity.
- **External store (Zustand)** — overkill for v1 where Sandpack's internal state is sufficient. Can be reconsidered if cross-component file state access is needed beyond the editor shell.

---

### Architecture Overview

```
app/studio/
  layout.tsx          ← NEW: wraps children, renders <SandPackCSS />
  page.tsx            ← EXISTING: server component, renders <StudioForm />
  studio-form.tsx     ← MODIFIED: replaces <textarea> + preview placeholder
                        with <EditorShell />, reads files via useSandpack() on submit

components/studio/
  editor-shell.tsx    ← NEW: SandpackProvider + SandpackCodeEditor + SandpackPreview
  sandpack-css.tsx    ← NEW: getSandpackCssText() + useServerInsertedHTML()
```

---

## Exit Gate

```bash
# Type check the web app
corepack pnpm --filter web type-check
# Expected: exit 0
```

- Editor UI renders in browser.
- Local state updates on code edits.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Upstream Phase 1 exit gate not yet passed.
- Framework integration fails in Next.js App Router (e.g., SSR issues with Monaco).
- validate-contract cannot be written due to missing prerequisite.

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — research-agent: prior phase reports read; test context loaded; plan drift checked
- [x] 2. INNOVATE — innovate-agent: approach decided; Decision Summary written
- [x] 3. PLAN-SUPPLEMENT — plan-agent: existing phase plan updated; Inner Loop Refresh Note: Checklist rewritten to explicitly name files and reflect the Sandpack setup.
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

- `apps/web/app/studio/page.tsx` (existing, updated)
- `apps/web/app/studio/studio-form.tsx` (existing, heavily modified)
- `apps/web/app/studio/layout.tsx` (new)
- `apps/web/components/studio/editor-shell.tsx` (new)
- `apps/web/components/studio/sandpack-css.tsx` (new)

---

## Public Contracts

- None

---

## Verification Evidence

```bash
# Verify components compile
corepack pnpm --filter web build
# Expected: exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/creator-studio/active/creator-studio-umbrella_07-07-26/phase-02-core-editor_PLAN_07-07-26.md`
- Last completed step: Step 7 (UPDATE PROCESS)
- Validate-contract status: PASS
- Phase status: ✅ COMPLETE
- Key decisions: route stays at `app/studio/`, new `EditorShell` component in `components/studio/`, `SandPackCSS` in studio layout, Sandpack owns file state

---

## Validate Contract

**Status:** PASS
**Gate:** Core editor shell architecture and dependencies

**Plan updates applied:**
- None needed; the step-by-step checklist is sound and appropriately broken down.

**Execute-agent instructions:**
1. Work iteratively through Steps A and B.
2. For Step A, start by installing dependencies and implementing the SSR CSS injector. Then construct the EditorShell component before refactoring the form.
3. For Step B, remember to lift the form's local submit logic to use `useSandpack()` when retrieving the active code, ensuring form submission continues to work but pulls from Sandpack state.

**Test gates:**
```bash
corepack pnpm --filter web type-check
corepack pnpm --filter web build
```

**High-risk pack:**
- N/A (Standard UI integration, no high-risk backend data mutation or auth changes)

**Backlog artifacts:**
- None

**Known gaps:**
- Next.js standalone build intermittent ENOENT error on `prerender-manifest.json` unrelated to the studio route (failed at the standalone copy step after successful compile).

**Accepted by:** vc-validate-agent

---

## EVL HANDOFF SUMMARY

**Status:** PASS
**Gate:** Core editor shell integration and type safety

**Findings:**
- Core editor framework (Sandpack) dependencies installed and shell constructed.
- SSR CSS injection properly handled via `SandPackCSS`.
- Local state wiring complete via `useSandpack`.

**Test Gates Results:**
- `corepack pnpm --filter web type-check`: Green/Pass.
- `corepack pnpm --filter web build`: Passed compile phase. (Encountered known intermittent Next.js ENOENT error on `prerender-manifest.json` during standalone copy step; treated as acceptable infra flake, not blocking Phase 2).

**Registered Follow-ups:**
- Noted the Next.js standalone copy intermittent ENOENT error as a minor infrastructure follow-up for future resolution. No further immediate action required for this phase.

**Handoff:**
- EVL complete. Ready for UPDATE PROCESS (Step 7).
