---
name: plan:21st_replica-phase-02-layout
description: "21st.dev 1:1 Replica — Phase 02: Layout"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: 21st_replica
  phase: phase-02
---

# Phase 02 — Layout

**Program:** 21st_replica
**Umbrella plan:** process/features/21st_replica/active/21st_replica_07-07-26/21st_replica-umbrella_PLAN_07-07-26.md
**Phase status:** ✅ VERIFIED
**Report destination:** process/features/21st_replica/active/21st_replica_07-07-26/phase-02-layout_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Implement the global structural layout matching 21st.dev. This includes the responsive collapsing Sidebar with its precise navigation links, the floating Search Bar, the dark mode toggle, and the top navigation area. `vc-predict` must be used to analyze responsive layout edge cases before coding.

---

## Entry Gate

- Phase 01 complete (all checklist items done, validators green)

---

## Blast Radius

- `apps/web/components/21st/layout/Sidebar.tsx`
- `apps/web/components/21st/layout/TopNav.tsx`
- `apps/web/components/21st/layout/SearchBar.tsx`
- `apps/web/app/21st/layout.tsx`
- `apps/web/app/21st/page.tsx`
- `apps/web/app/layout.tsx`

---

## Implementation Checklist

### Step A — Sidebar Layout

- [ ] A1. Create the `Sidebar` component in `apps/web/components/21st/layout/`.
- [ ] A2. Implement responsive collapsible behavior.
- [ ] A3. Add all navigation links ("Explore components", "Themes", "Templates", "21st AI").

### Step B — Top Navigation & Search

- [ ] B1. Create the `TopNav` component in `apps/web/components/21st/layout/` containing the user profile button.
- [ ] B2. Implement the `SearchBar` UI in `apps/web/components/21st/layout/` with exact visual styling (fake search for now).
- [ ] B3. Add the Theme Toggle button.

### Step C — Integration & Refinement

- [ ] C1. Create a nested layout `apps/web/app/21st/layout.tsx` and integrate the Sidebar and TopNav. Create `apps/web/app/21st/page.tsx`.
- [ ] C2. Update the global `apps/web/app/layout.tsx` by wrapping the legacy `<SiteHeader>` and `<SiteFooter>` in a Client Component (using `usePathname()`) to conditionally hide them on any route starting with `/21st`.
- [ ] C3. Use `vc-agent-browser` and `vc-frontend-design` to compare visual output and fix any spacing or alignment drift.

---

## Exit Gate

```bash
# Verify lint rules
npm run lint
# Expected: 0 errors
```

- all checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Layout shifting issues or responsive behavior totally broken.

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

- Global layout files.

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

- Selected plan file path: `process/features/21st_replica/active/21st_replica_07-07-26/phase-02-layout_PLAN_07-07-26.md`
- Last completed step: EVL (Step 6)
- Validate-contract status: STANDING-GRANTED
- Next step: Spawn update-process-agent for UPDATE-PROCESS (Step 7)

---

## Validate Contract

**Status:** STANDING-GRANTED (Running under persistent autonomous `/goal`)

**Directives for the EXECUTE Agent:**
1. Update `apps/web/app/layout.tsx` to conditionally hide the legacy `<SiteHeader>` and `<SiteFooter>` on any route starting with `/21st`. Use a safe Next.js pattern, such as creating a Client Component wrapper (using `usePathname()`) around these elements.
2. Scaffold the nested layout and page: `apps/web/app/21st/layout.tsx` and `apps/web/app/21st/page.tsx`.
3. Build the new layout components (`Sidebar`, `TopNav`, `SearchBar`) cleanly under `apps/web/components/21st/layout/`.

**Test Gates:**
- Run `npm run lint`
- Run `npx playwright test`
