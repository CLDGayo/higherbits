---
name: plan:21st-clone-phase-24-theme-system
description: "21st.dev Clone — Phase 24: Theme System"
date: 05-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-24
---

# Phase 24 — Theme System

**Program:** 21st-clone
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_05-07-26/21st-clone-umbrella_PLAN_05-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization-catalog/active/21st-clone_05-07-26/phase-24-theme-system_REPORT_05-07-26.md (flat in the program task folder)

---

## Purpose

Implement the site-wide three-theme system driven by CSS variables: Cozy Daylight (default), Lofi Dusk (dark), and Paper Café (opt-in).

---

## Entry Gate

- Phase 23 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/app/globals.css`
- `apps/web/tailwind.config.ts`
- `apps/web/components/theme-provider.tsx`

---

## Implementation Checklist

### Step A — Implementation
- [ ] A1. Install `next-themes` and create `apps/web/components/theme-provider.tsx`.
- [ ] A2. Wrap `apps/web/app/layout.tsx` in `<ThemeProvider attribute="class" defaultTheme="system" enableSystem />`.
- [ ] A3. Create `apps/web/components/theme-toggle.tsx` using a dropdown with sun/moon icons.
- [ ] A4. Inject `ThemeToggle` into `apps/web/components/site-header.tsx`.
- [ ] A5. Remove the hardcoded `/themes` stub in `apps/web/app/(catalog)/[category]/page.tsx`.

---

## Exit Gate

```bash
# Verify tests
corepack pnpm exec vitest run
# Expected: passing tests
```

- all checklist items checked
- validators exit 0
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- upstream phase exit gate not yet passed

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

- `apps/web/package.json`
- `apps/web/components/theme-provider.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/components/theme-toggle.tsx`
- `apps/web/components/site-header.tsx`
- `apps/web/app/(catalog)/[category]/page.tsx`

---

## Public Contracts

- None

---

## Verification Evidence

```bash
corepack pnpm exec vitest run
# Expected: passing tests
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_05-07-26/phase-24-theme-system_PLAN_05-07-26.md`
- Last completed step: PVL (Step 4)
- Validate-contract status: WRITTEN
- Next step: Spawn vc-execute-agent for EXECUTE (Step 5)

---

## Validate Contract

### 1. Status: PASS

### 2. Gate: CONDITIONAL PROCEED
- Architecture is viable (`next-themes` standard implementation).

### 3. Plan Updates Applied
- Replaced vague tasks with concrete `next-themes` installation and toggle implementation.
- Added task to remove the `/themes` routing stub.

### 4. Execute-Agent Instructions
- Install `next-themes` and `lucide-react` if missing.
- Create `ThemeProvider` and wrap `layout.tsx`.
- Create `ThemeToggle` component and inject into `site-header.tsx`.
- Remove the empty state return early for `category === "themes"` in `[category]/page.tsx`.

### 5. Test Gates
```bash
corepack pnpm exec vitest run
corepack pnpm exec tsc --noEmit
```

### 6. High-Risk Pack
- N/A

### 7. Backlog Artifacts
- None.

### 8. Known Gaps
- None.

### 9. Accepted By
vc-validate-agent (05-07-26)
