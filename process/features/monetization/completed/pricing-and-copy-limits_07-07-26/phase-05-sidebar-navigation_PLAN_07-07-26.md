---
name: plan:pricing-and-copy-limits-phase-05-sidebar-navigation
description: "Pricing and Copy Limits — Phase 05: Sidebar Navigation & Search"
date: 07-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization
  phase: phase-05
---

# Phase 05 — Sidebar Navigation & Search

**Program:** pricing-and-copy-limits
**Umbrella plan:** process/features/monetization/active/pricing-and-copy-limits-umbrella_07-07-26/pricing-and-copy-limits-umbrella_PLAN_07-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-05-sidebar-navigation_REPORT_07-07-26.md (flat in the program task folder)

---

## Purpose

Enhance the sidebar navigation by incorporating a search component at the top of the sidebar and adding quick links for "Featured", "Newest", and "Top Authors" above the existing categories, matching the provided screenshot design.

---

## Entry Gate

- Phase 0 complete (Can run concurrently with any phase).

---

## Blast Radius

- `apps/web/components/catalog-nav.tsx` — expand with SearchIsland + quick links + icons
- `apps/web/app/featured/page.tsx` — NEW
- `apps/web/app/top-authors/page.tsx` — NEW
- No changes to: `layout.tsx`, `search-island.tsx`, `site-header.tsx`, `catalog.ts`

---

## Implementation Checklist

### Step 0 — Route Stubs

- [ ] 0.1. Create `apps/web/app/featured/page.tsx` using `getFeaturedCatalog()` outside the `(catalog)` route group.
- [ ] 0.2. Create `apps/web/app/top-authors/page.tsx` using inline aggregation from `getCatalog()` outside the `(catalog)` route group.

### Step A — Sidebar Search

- [ ] A1. Expand `CatalogNav` to include `SearchIsland` at the top.
- [ ] A2. Ensure search functionality works seamlessly from the sidebar without fragmenting into the layout file.

### Step B — Quick Links

- [ ] B1. Add "Featured", "Latest", and "Top Authors" as prominent quick links in the sidebar above the regular component categories, ensuring they route to the full-width discovery pages outside the `(catalog)` route group.
- [ ] B2. Style them to match the active/inactive state of existing category links, adding Lucide icons.

---

## Exit Gate

```bash
npm run test
npm run build
```

- Sidebar contains the new search input.
- Sidebar contains the three new quick links.
- Phase report written to report destination above.

---

## Blockers That Would Justify BLOCKED Status

- Missing routing logic for the new quick links (e.g., if `/featured` or `/top-authors` pages do not exist, they may need to be stubbed).

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH
- [x] 2. INNOVATE
- [x] 3. PLAN-SUPPLEMENT
- [x] 4. PVL
- [x] 5. EXECUTE
- [x] 6. EVL
- [x] 7. UPDATE PROCESS

**Validate-contract required before execute.**

---

## Touchpoints

- `apps/web/components/catalog-nav.tsx`

---

## Public Contracts

- Sidebar layout changes.

---

## Verification Evidence

```bash
npm run build
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization/active/pricing-and-copy-limits_07-07-26/phase-05-sidebar-navigation_PLAN_07-07-26.md`
- Last completed step: Step 7
- Validate-contract status: PASS
- Next step: DONE

---

## Validate Contract

Status: PASS
Date: 07-07-26
Gate: PASS — no FAILs, all fixes applied

### Parallel strategy
Choice: sequential
Signals: 1/7 — dominant: Phase program classification
Agent count: 1 (Sequential executor)

### Plan updates applied
- [x] Mechanical feasibility verified: `CatalogNav` can safely be edited to include `SearchIsland` and quick links.
- [x] Confirmed `apps/web/app/featured/page.tsx` and `apps/web/app/top-authors/page.tsx` do not exist yet and are safe to create.

### Execute-agent instructions
- Step 0: Create the new page files as specified in the plan.
- Step A & B: Update `CatalogNav` to include `SearchIsland` and quick links with icons.

### Test gates (run after each section; regression suite after all sections)

**Sidebar Navigation**
- fully-automated: `npm run build` exits 0
  Proves: Next.js build succeeds with new routes and modified components.
- agent-probe: Visually verify sidebar includes search input and new quick links.
  Proves: UI matches requirements.

**Regression suite (after all sections complete)**
- `npm run test` exits 0
- `npm run build` exits 0

### High-risk pack
Required: no

### Backlog artifacts to create during durable capture
- None

### Known gaps on record
- None

### Accepted by
session — automated V5 acceptance
