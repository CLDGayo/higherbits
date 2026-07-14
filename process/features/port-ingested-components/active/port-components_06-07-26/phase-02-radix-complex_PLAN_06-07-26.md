---
name: plan:port-components-phase-02-radix-complex
description: "Port Ingested Components — Phase 2: Radix Complex Components"
date: 06-07-26
metadata:
  node_type: memory
  type: plan
  feature: port-ingested-components
  phase: phase-02
---

# Phase 2 — Radix Complex Components

**Program:** port-components
**Umbrella plan:** process/features/port-ingested-components/active/port-components_06-07-26/port-components-umbrella_PLAN_06-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/port-ingested-components/active/port-components_06-07-26/phase-02-radix-complex_REPORT_06-07-26.md (flat in the program task folder)

---

## Purpose

Port the complex Radix UI-dependent components (Dialogs, Tabs, Navbars) into `@repo/ui`. This expands on the foundation established in Phase 1 by adding rich interactive primitives and wiring them for live rendering.

---

## Entry Gate

- Phase 1 complete (Foundation and Primitives ported and tested)
- `@repo/ui` builds without errors and exports basic components.

---

## Blast Radius

- `packages/ui/package.json`
- `packages/ui/src/index.ts`
- `packages/ui/src/dialogs/*`
- `packages/ui/src/tabs/*`
- `packages/ui/src/navbars/*`
- `apps/web/components/preview/live-preview.tsx`

---

## Implementation Checklist

### Step A — Install Radix Dependencies

- [x] A1. Install `@radix-ui/react-dialog`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-tabs`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu` in `@repo/ui`.

### Step B — Port Dialogs & Navbars

- [x] B1. Port `dialogs__shadcn-dialog.md` and `dialogs__shadcn-alert-dialog.md` into `@repo/ui`.
- [x] B2. Port `navbars__shadcn-menubar.md` and `navbars__shadcn-nav-menu.md` into `@repo/ui`.
- [x] B3. Export them from `@repo/ui/src/index.ts`.
- [x] B4. Wire them into `COZY_PREVIEWS`.

### Step C — Port Tabs

- [x] C1. Port `tabs__shadcn-tabs.md` and `tabs__mantine-tabs.md` (re-implementing mantine-tabs from scratch using standard Tailwind/CVA or as a stylized wrapper over `@radix-ui/react-tabs` to match the visual spec, rather than importing Mantine AST directly).
- [x] C2. Export them from `@repo/ui/src/index.ts`.
- [x] C3. Wire them into `COZY_PREVIEWS`.

---

## Exit Gate

```bash
npm run type-check --workspace=@repo/ui
npm run build --workspace=@repo/ui
```
- All checklist items checked
- Phase report written

---

## Blockers That Would Justify BLOCKED Status

- Missing UI library dependencies or incompatible peer dependencies.

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

- `packages/ui/package.json`
- `packages/ui/src/index.ts`
- `packages/ui/src/dialogs/*`
- `packages/ui/src/tabs/*`
- `packages/ui/src/navbars/*`
- `apps/web/components/preview/live-preview.tsx`

---

## Public Contracts
- None

---

## Verification Evidence

```bash
npm run type-check --workspace=@repo/ui
# Expected: clean exit 0
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/port-ingested-components/active/port-components_06-07-26/phase-02-radix-complex_PLAN_06-07-26.md`
- Last completed step: PVL
- Validate-contract status: written
- Next step: Spawn vc-execute-agent for EXECUTE

---

## Validate Contract

Status: PASS
Date: 07-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 2/7 — dominant: S7 (5+ files in blast radius)
Agent count: 1 (1 executor)

### Plan updates applied
- [x] None required

### Execute-agent instructions
- Install dependencies: Ensure `@radix-ui/react-slot` or other transient dependencies are added if required by the radix components during Step A.
- Porting: When porting ingested components in Steps B and C, ensure the actual `.tsx` code is extracted from the markdown source, not the markdown itself.
- Conflicts: Proceed sequentially to prevent git merge conflicts on `packages/ui/src/index.ts` and `apps/web/components/preview/live-preview.tsx`.

### Test gates (run after each section; regression suite after all sections)

**@repo/ui package**
- fully-automated: `npm run type-check --workspace=@repo/ui` exits 0
  Proves: TypeScript types are correct for the ported components.
- fully-automated: `npm run build --workspace=@repo/ui` exits 0
  Proves: The components bundle successfully and have no missing imports.

**apps/web package**
- fully-automated: `npm run type-check --workspace=apps/web` exits 0
  Proves: Previews integrate correctly with the web application without type errors.
- agent-probe: Run the development server and manually confirm the new components render in the live preview.
  Proves: Visuals and Radix interactive states (tabs, dialogs) work as expected in the browser.

**Regression suite (after all sections complete)**
- `npm run type-check --workspace=@repo/ui` exits 0
- `npm run build --workspace=@repo/ui` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
session — Agent self-decided at V5 per umbrella plan autonomy rules.
