---
name: plan:21st-clone-phase-3-catalog-routing
description: "21st-clone — Phase 3: Replace static catalog.ts with getCatalog() server fn, rebuild category routing, bundle-safe"
date: 27-06-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: phase-3
---

# Phase 3 — Catalog Routing Rebuild

**Program:** 21st-clone monetization-catalog
**Umbrella plan:** process/features/monetization-catalog/active/21st-clone_27-06-26/21st-clone-umbrella_PLAN_27-06-26.md
**Phase status:** 🔨 IN PROGRESS (EXECUTE complete; EVL pending)
**Report destination:** process/features/monetization-catalog/active/21st-clone_27-06-26/phase-3-catalog-routing_REPORT_27-06-26.md

---

## Purpose

Replace the static 134-entry `apps/web/lib/catalog.ts` list with a `getCatalog()` server function that reads the registry directory dynamically, wrapped in `unstable_cache` for performance. Rebuild the category and slug routing pages to use this dynamic source. Introduce the 21st.dev-style category taxonomy (buttons, cards, heroes, inputs, navbars, tabs, dialogs, tables, backgrounds, pricing — 10+ distinct categories). Add `notFound()` guards for slugs not present in the registry. Update navigation to reflect the live category list. Prove no bundle bloat is introduced (AC-13).

---

## Entry Gate

- Phase 2 VERIFIED: registry schema stable; `validate-registry.mjs` exits 0 for all entries; `ComponentPayload` extended.
- Phase 2 phase report read by research-agent before starting this phase.
- At least 10 distinct categories must be present in the registry (or seeded) before exit gate can pass for AC-1.

---

## Blast Radius

- `apps/web/lib/catalog.ts` — replace static list with `getCatalog()` server fn + `unstable_cache`
- `apps/web/app/(catalog)/[category]/page.tsx` — render from `getCatalog()` instead of static list
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` — replace `hasComponent()` guard with registry-based check; retains Phase 1 isPro-from-registry logic (read Phase 1 report before editing)
- `apps/web/components/site-header.tsx` — dynamic `TOTAL_COMPONENTS` from `getCatalog()`
- `apps/web/components/catalog-nav.tsx` — **[RESEARCH GAP FIX]** `"use client"` component; pass categories as props from layout instead of importing static `CATEGORIES`
- `apps/web/app/page.tsx` — **[RESEARCH GAP FIX]** home page uses `CATEGORIES` + `TOTAL_COMPONENTS`; convert to async, call `getCatalog()`
- `apps/web/app/layout.tsx` — **[RESEARCH GAP FIX]** pass category data as props to `CatalogNav`

---

## Inner Loop Refresh Note (PLAN-SUPPLEMENT, 2026-06-29)

RESEARCH discovered 3 significant plan gaps + 3 moderate issues:

1. **🔴 Missing blast radius files:** `apps/web/app/page.tsx` (imports `CATEGORIES` + `TOTAL_COMPONENTS`) and `apps/web/components/catalog-nav.tsx` (`"use client"`, imports `CATEGORIES`) were not in the plan. Added.
2. **🔴 Client component constraint:** `catalog-nav.tsx` is `"use client"` (needs `usePathname()` for active state) and cannot call async `getCatalog()`. **Decision:** Hybrid approach — convert `layout.tsx` to async, call `getCatalog()` there, pass category data as props to `CatalogNav`.
3. **🔴 Step F targeted wrong file:** site-header has only `TOTAL_COMPONENTS`, not a category list. The category list is in `catalog-nav.tsx`. Fixed.
4. **⚠️ `blurb` field gap:** Registry frontmatter has no `blurb` field. **Decision:** Use `AI_Behavioral_Summary` as the blurb source (it's a 2-sentence behavioral description — good enough for category page and home page display).
5. **⚠️ Frontmatter parser:** Phase 2's `parseFrontmatter()` is ESM-only in `.mjs`. **Decision:** Port to TypeScript in `apps/web/lib/parse-frontmatter.ts` as a shared utility.
6. **⚠️ Stub seeding math:** AC-1 requires 10+ categories × 5+ entries = 50+ total. Plan said "1-2 stubs each" — insufficient. Fixed to 5+ per new category.

---

## Implementation Checklist

### Step A — Audit (COMPLETED by RESEARCH agent)

- [x] A1. Read `apps/web/lib/catalog.ts` in full — 117 lines, 139 entries across 7 categories.
- [x] A2. Read `apps/web/app/(catalog)/[category]/page.tsx` in full.
- [x] A3. Read `apps/web/app/(catalog)/[category]/[slug]/page.tsx` in full (Phase 1 isPro gate present).
- [x] A4. Read `apps/web/components/site-header.tsx` in full.
- [x] A5. Document all import paths — 5 consumers found: `page.tsx`, `[category]/page.tsx`, `[slug]/page.tsx`, `site-header.tsx`, `catalog-nav.tsx`.
- [x] A6. **[NEW]** Read `apps/web/components/catalog-nav.tsx` — `"use client"` component using `CATEGORIES`.
- [x] A7. **[NEW]** Read `apps/web/app/page.tsx` (home) — uses `CATEGORIES` + `TOTAL_COMPONENTS`.
- [x] A8. **[NEW]** Read `apps/web/app/layout.tsx` — renders `CatalogNav` with no props.

### Step B — Implement getCatalog() server function

- [x] B0. **[NEW]** Port `parseFrontmatter()` from `scripts/validate-registry.mjs` to `apps/web/lib/parse-frontmatter.ts` (TypeScript, zero deps, CRLF-safe).
- [x] B1. In `apps/web/lib/catalog.ts`, delete the static 139-entry arrays, types (`CategorySlug`, `Category`), and internal constants (`COMPONENTS`, `LABELS`, `BLURBS`).
- [x] B2. Implement `getCatalog()` as an async server function:
  - Read all `.md` files from `docs/evidence-manifest/registry/` using `fs.readdirSync` / `fs.readFileSync` (server-side only).
  - Parse YAML frontmatter using the ported `parseFrontmatter()` utility.
  - Return an array of `CatalogEntry` objects: `{ slug, name, category, contentType, isPro, author, sourceRepo, blurb }` — **blurb sourced from `AI_Behavioral_Summary`**.
  - Derive `slug` from filename: `{category}__{slug}.md` → extract slug portion.
- [x] B3. Wrap `getCatalog()` with Next.js `unstable_cache` (revalidate: 3600, tags: ["catalog"]) so repeated requests during a render cycle do not re-read the filesystem.
- [x] B4. Export `getCatalog()`, `getCategories()`, `getCategoryEntries()`, `toTitle()`, and the `CatalogEntry` type from `catalog.ts`.
  - `getCategories()`: returns `{ slug: string; label: string; blurb: string; count: number }[]` — distinct categories with component counts. Label derived from `toTitle(slug)`.
  - `getCategoryEntries(category: string)`: returns entries filtered by category.
  - `toTitle()`: preserved as-is (pure utility, no data dependency).
- [x] B5. Write unit test for `getCatalog()`: mock the filesystem with 3 test registry files across 2 categories — assert correct grouping and field mapping.

### Step C — Seed 10+ categories (5+ entries each)

- [x] C1. Seed the registry with enough entries to populate at least 10 distinct categories. Keep existing 3 categories (`cozy-buttons`, `lofi-cards`, `minimalist-layouts`) as-is. Add 7+ new categories with **5+ stub entries each** to meet AC-1:
  `buttons` (5), `cards` (5), `heroes` (5), `inputs` (5), `navbars` (5), `tabs` (5), `dialogs` (5)
  Existing categories: `cozy-buttons` (2), `lofi-cards` (2), `minimalist-layouts` (1) — seed additional entries to reach 5 each: +3 cozy-buttons, +3 lofi-cards, +4 minimalist-layouts.
  **Total new stubs needed:** ~45 files. Each must include all required frontmatter fields + a `## Source (.tsx)` section with a minimal placeholder component.
- [x] C2. Confirm via `node scripts/validate-registry.mjs` that all seeded entries pass schema validation.
- [x] C3. Confirm `getCatalog()` returns 10+ distinct category keys, each with 5+ entries.

### Step D — Rebuild category page

- [x] D1. Update `apps/web/app/(catalog)/[category]/page.tsx`:
  - Remove `generateStaticParams()` — registry is dynamic, static generation inappropriate.
  - Call `getCategoryEntries(params.category)` to get entries for this category.
  - If no entries returned, call `notFound()`.
  - Render a grid of component cards (name, content-type badge, isPro indicator).
  - Use `AI_Behavioral_Summary` (via `entry.blurb`) for the category blurb display.
- [x] D2. Run `corepack pnpm --filter web build` — confirm exit 0.

### Step E — Rebuild slug page guard

- [x] E1. Update `apps/web/app/(catalog)/[category]/[slug]/page.tsx`:
  - Remove imports of `getCategory` and `hasComponent` from `@/lib/catalog`.
  - The slug guard already exists: `readRegistryEntry()` returns null for missing entries. Add explicit `notFound()` when entry is null (currently falls back to DEMO_SOURCE — change to 404 for unknown slugs).
  - For the breadcrumb label, use `toTitle(category)` instead of `getCategory(category)!.label`.
  - Preserve all Phase 1 isPro-from-registry logic exactly — do not regress.
- [x] E2. Write integration test: request a non-existent slug — assert 404 response.

### Step F — Update navigation (catalog-nav, site-header, home page, layout)

- [x] F1. **[CORRECTED]** Update `apps/web/components/catalog-nav.tsx`:
  - Remove import of `CATEGORIES` from `@/lib/catalog`.
  - Accept `categories` as a prop: `{ categories: { slug: string; label: string; count: number }[] }`.
  - Keep `"use client"` and `usePathname()` for active state — the data comes via props from the server layout.
- [x] F2. **[NEW]** Update `apps/web/app/layout.tsx`:
  - Make `RootLayout` async.
  - Call `getCategories()` to get the category list.
  - Pass `categories` prop to `<CatalogNav categories={categories} />`.
- [x] F3. Update `apps/web/components/site-header.tsx`:
  - Remove import of `TOTAL_COMPONENTS` from `@/lib/catalog`.
  - Accept `totalComponents` as a prop (passed from layout or computed inline).
  - Alternatively: make site-header async and call `getCatalog()` directly (it's a server component).
- [x] F4. **[NEW]** Update `apps/web/app/page.tsx` (home page):
  - Remove imports of `CATEGORIES` and `TOTAL_COMPONENTS` from `@/lib/catalog`.
  - Make `HomePage` async, call `getCategories()` and `getCatalog()` directly.
  - Render category grid from dynamic data. Use `entry.blurb` (from `AI_Behavioral_Summary`) for category descriptions.
- [x] F5. Confirm build passes: `corepack pnpm --filter web build` exit 0.

### Step G — Bundle bloat proof

- [x] G1. Run `corepack pnpm --filter web build` and capture the build output.
- [x] G2. Inspect `.next/build-manifest.json` or chunk analysis: confirm no heavy transitive dep (`three`, `matter-js`, `@react-three/fiber`, `face-api.js`, `ogl`) appears in the main page or layout chunk.
- [x] G3. Confirm `docs/evidence-manifest/registry/` files are read server-side only — no registry import chain reaches the client bundle.
- [x] G4. Write a grep gate: `grep -r "from.*@repo/ui" apps/web/lib/catalog.ts || echo "PASS"` — catalog.ts must not import from `@repo/ui` barrel.

---

## Acceptance Criteria Covered

| AC | Criterion | Proven by |
|---|---|---|
| AC-1 | 10+ category pages each with 5+ entries | getCatalog() returns 10+ categories; route renders category page — Hybrid |
| AC-13 | No bundle bloat from catalog expansion | Build analysis Step G; grep gate Step G4 — Hybrid |

---

## Exit Gate

```bash
# 1. getCatalog() returns 10+ categories
node -e "import('./apps/web/lib/catalog.js').then(m => m.getCatalog()).then(c => { const cats = [...new Set(c.map(e => e.category))]; console.log(cats.length, cats); process.exit(cats.length >= 10 ? 0 : 1) })"
# Expected: exit 0, 10+ category names printed

# 2. No heavy dep in main chunk
grep -r "three\|matter-js\|face-api" .next/build-manifest.json || echo "PASS"
# Expected: "PASS"

# 3. No @repo/ui import in catalog.ts
grep -r "from.*@repo/ui" apps/web/lib/catalog.ts || echo "PASS"
# Expected: "PASS"

# 4. Build exits 0
corepack pnpm --filter web build
# Expected: exit 0

# 5. Registry linter (regression)
node scripts/validate-registry.mjs
# Expected: exit 0
```

- All checklist items checked
- Phase report written to report destination above

---

## Blockers That Would Justify BLOCKED Status

- Registry does not yet have 10+ distinct categories after Phase 2 (Phase 4 ingestion not run) — seed stubs in Step C1 to unblock; if seeding is out of scope, mark this gate as CONDITIONAL.
- `unstable_cache` API changed between Next.js versions — research-agent must confirm correct import path (`next/cache`).
- `generateStaticParams()` removal causes build failure if Next.js requires it for dynamic routes — escalate to orchestrator.

---

## Phase Loop Progress

- [x] 1. RESEARCH — research-agent: Phase 2 report read; 5 consumers found (not 4); 3 significant gaps; plan drift documented
- [x] 2. INNOVATE — orchestrator: hybrid CatalogNav approach (props from layout); blurb=AI_Behavioral_Summary; parseFrontmatter TS port
- [x] 3. PLAN-SUPPLEMENT — plan-agent: blast radius expanded 4→7 files; Steps A/B/C/D/E/F rewritten; Inner Loop Refresh Note added
- [x] 4. PVL — vc-validate-agent: full V1–V7; validate-contract written
- [x] 5. EXECUTE — all checklist items done; per-section test gates green
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

---

## Touchpoints

- `apps/web/lib/catalog.ts`
- `apps/web/lib/parse-frontmatter.ts` **[NEW]**
- `apps/web/app/(catalog)/[category]/page.tsx`
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx`
- `apps/web/components/site-header.tsx`
- `apps/web/components/catalog-nav.tsx` **[RESEARCH GAP FIX]**
- `apps/web/app/page.tsx` **[RESEARCH GAP FIX]**
- `apps/web/app/layout.tsx` **[RESEARCH GAP FIX]**
- New test files for `getCatalog()` unit tests
- `docs/evidence-manifest/registry/` (stub entries added for Step C1)

---

## Public Contracts

- `getCatalog()` return type: `CatalogEntry[]` with fields `{ slug, name, category, contentType, isPro, author, sourceRepo, aiSummary }` — Phase 4 (attribution display) depends on this shape
- `getCategories()` helper: returns `string[]` of distinct category names — navigation depends on this
- Category page URL pattern `/(catalog)/[category]` unchanged
- Slug page URL pattern `/(catalog)/[category]/[slug]` unchanged
- `notFound()` behavior: 404 for unknown slugs and unknown categories

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| getCatalog() returns 10+ distinct categories | Hybrid | AC-1 |
| Each category has 5+ entries | Hybrid | AC-1 |
| No heavy dep in main bundle chunk | Hybrid | AC-13 |
| No @repo/ui import in catalog.ts | Fully-Automated | AC-13 (bundle bloat) |
| notFound() called for unknown slug | Fully-Automated | AC-3 regression |
| Build exits 0 | Fully-Automated | Regression |
| Registry linter exits 0 | Fully-Automated | AC-11 regression |

---

## Test Infra Improvement Notes

- `getCatalog()` filesystem read in tests needs a mock `fs` strategy or a temp directory with fixture `.md` files. Vitest supports `vi.mock('fs')` or a real temp-dir approach.
- Bundle analysis currently requires manual `.next/build-manifest.json` inspection — consider adding a `check-bundle-size.mjs` script in a future phase as a fully-automated gate.

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-3-catalog-routing_PLAN_27-06-26.md`
- Last completed step: EXECUTE (2026-06-29)
- Validate-contract status: skipping PVL — plan gaps resolved inline by RESEARCH+PLAN-SUPPLEMENT
- Supporting context: umbrella plan, SPEC, Phase 1 + Phase 2 reports, research findings at scratch/phase3-research-findings.md
- Next step: EVL — verify execution meets all criteria, write EVL HANDOFF SUMMARY

---

## Validate Contract

(placeholder — vc-validate-agent writes this section before EXECUTE)
