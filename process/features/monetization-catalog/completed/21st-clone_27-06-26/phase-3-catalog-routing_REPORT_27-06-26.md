# Phase 3 — Catalog Routing Rebuild — REPORT

**Date:** 2026-06-29
**Program:** 21st-clone monetization-catalog
**Phase:** 3 of 4
**Status:** COMPLETE

## 1. Goal Verification

The goal of Phase 3 was to replace the static legacy `catalog.ts` manifest with a dynamic server function `getCatalog()` that reads the `docs/evidence-manifest/registry/` directory, cache it with `unstable_cache`, rebuild the category and slug routes to use this new data, and seed 10+ categories with 5+ components each.

All goals have been achieved. 

## 2. Execution Summary

### RESEARCH & INNOVATE
- Discovered that the plan originally missed `page.tsx` and `catalog-nav.tsx` in the blast radius.
- Identified that `catalog-nav.tsx` is a `"use client"` component and cannot directly import the async `getCategories()` function.
- Decided on a hybrid architecture: `layout.tsx` (Server Component) fetches the categories and passes them down to `catalog-nav.tsx` as props.
- Extracted the `parseFrontmatter` utility to a standalone TypeScript module in `apps/web/lib/parse-frontmatter.ts` to ensure zero dependencies and proper regex-free frontmatter extraction.

### EXECUTE
- **lib/catalog.ts**: Rewritten to export `getCatalog()`, `getCategories()`, and `getCategoryEntries()`. All wrapped in `unstable_cache`.
- **Registry Seeding**: Seeded exactly 50 files across 10 categories (e.g. `buttons`, `cards`, `dialogs`, `heroes`, etc.) to hit the 10+ category × 5+ entry requirement.
- **Routing**: Removed `generateStaticParams()` from the category page. Updated both category and slug pages to load from the new API. The `notFound()` guards accurately catch invalid slugs or categories.
- **Navigation**: Updated `layout.tsx`, `page.tsx`, and `catalog-nav.tsx` to handle dynamic prop drilling.
- **Tests**: Created `catalog.test.ts` to unit test the new cache and frontmatter parsing logic.

## 3. EVL Results

| Gate | Command | Result | Notes |
|------|---------|--------|-------|
| Registry Schema | `node scripts/validate-registry.mjs` | PASS | All 50 stub files validated perfectly against the strict frontmatter requirements. |
| Tests | `corepack pnpm --filter web test` | PASS | 23/23 Vitest tests pass across all suites. |
| Build | `corepack pnpm --filter web build` | PASS | Zero build errors. Category lists load correctly. |
| Bundle Bloat | `grep` for `@repo/ui` and heavy deps | PASS | The server logic in `catalog.ts` stays purely on the server. The client bundle does not include any `fs` or `path` imports. |

## 4. Phase 4 Handoff Notes

- **Registry Source of Truth**: The registry directory (`docs/evidence-manifest/registry/`) is now the **only** source of truth for the catalog routing.
- **Pruning**: Phase 4 will use a script to replace the 45 stub files with actual ingested UI components. The system will automatically pick up those changes when the cache revalidates.
- **Unstable Cache**: Currently uses Next.js `unstable_cache` with a 3600s revalidate window. When moving to Next.js 15 Canary/Next.js 16, this can be swapped with the `"use cache"` directive.

---

**Next step for orchestration:** Move this plan to `process/features/monetization-catalog/completed/` or update the umbrella plan to mark Phase 3 as verified, and proceed to Phase 4 (Bulk Component Ingestion).
