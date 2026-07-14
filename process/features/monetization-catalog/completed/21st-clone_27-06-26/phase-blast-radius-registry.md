# Phase Blast Radius Registry — 21st-clone Program

Program task folder: process/features/monetization-catalog/active/21st-clone_27-06-26/
Initialized: 27-06-26

Each phase claims its blast radius here. Append-only — never overwrite prior entries.
Status vocabulary: DONE | BLOCKED-skipped | SUPERSEDED | (no field = planned)

---

## Phase 1 — Billing + Auth + Pro-gate migration

Claimed files / areas:
- apps/web/app/api/checkout/route.ts (modify — add subscription mode + dual price IDs)
- apps/web/app/api/webhooks/stripe/route.ts (modify — extend to 5 events)
- apps/web/lib/tiers.ts (modify — delete hardcoded PRO_SLUGS Set; isPro reads registry)
- apps/web/lib/registry.ts (modify — expose IsPro/Author/etc. from YAML frontmatter)
- apps/web/app/(catalog)/[category]/[slug]/page.tsx (modify — read isPro from registry entry)
- .env.example (modify — add STRIPE_SUBSCRIPTION_PRICE_ID, STRIPE_LIFETIME_PRICE_ID)
- apps/web/middleware.ts (read-only — no changes expected)

High-risk class: billing + auth
ACs covered: 3, 4, 5, 6, 7, 8, 9, 15
Status: (planned)

---

## Phase 2 — Registry schema + ingest-tool hardening

Claimed files / areas:
- docs/evidence-manifest/registry/ (modify ALL existing .md frontmatter files — add new fields)
- scripts/validate-registry.mjs (create new — registry linter/validator)
- packages/db/src/schema.ts (modify — extend ComponentPayload + broaden Category type)
- ops/github-ingest.mjs (modify — add Content_Type, Author, Source_Repo, License_SPDX, IsPro fields; license gate; attribution validation; remove UI_SRC_DIR write; add heavy-dep warning gate)
- packages/db/src/index.ts (modify if needed for schema re-export)

ACs covered: 10, 11, 13
Depends on: Phase 1 (IsPro field contract defined)
Status: DONE

Amendment note (2026-06-28): Scope amended after INNOVATE + user PRUNE decision.
- PRUNE: DELETE 129 legacy registry files (text-animations__, animations__, backgrounds__, components__ prefixes) via scripted glob pass — keep only 5 curated entries (cozy-buttons__, lofi-cards__, minimalist-layouts__ prefixes). Verified count: 134 → 5 after delete.
- Validator validates ALL remaining files (no Content_Type:legacy skip mechanism — legacy files are gone).
- ops/__tests__/github-ingest.test.mjs added to blast radius (new test file, node --test runner).
- page.tsx and catalog.ts NOT touched in Phase 2 (force-dynamic + null-safe reads = build-safe; catalog.ts prune deferred to Phase 3).
- ACs covered expanded to include AC-13 (bundle/legacy cleanup via scripted delete).

EVL closeout note (2026-06-28): Two files outside the literal blast-radius list were modified as ACCEPTED deviations:
- apps/web/lib/components.ts — category type widened from ComponentCategory to string (rationale: toSummary() assigns payload.Category (now string) into a ComponentCategory field — hard build error without widening; ComponentCategory alias still exported from @repo/db)
- packages/db/src/points.ts — SearchOptions.category + listComponentsByCategory param widened from ComponentCategory to string (rationale: function signatures consume ComponentPayload.Category which is now string; widening is a no-op at runtime)
Forbidden files (apps/web/page.tsx, apps/web/lib/catalog.ts) were NOT touched. EI-1 (ComponentCategory alias) honored. Orchestrator ruling: ACCEPTED.

---

## Phase 3 — Catalog routing rebuild

Claimed files / areas:
- apps/web/lib/catalog.ts (modify — replace static list with getCatalog() reading registry dir)
- apps/web/app/(catalog)/[category]/page.tsx (modify — render from getCatalog())
- apps/web/app/(catalog)/[category]/[slug]/page.tsx (modify — notFound() guard for missing slugs)
- apps/web/components/site-header.tsx (modify — navigation reflects new category taxonomy)
- apps/web/app/layout.tsx (read-only — no changes expected)

ACs covered: 1, 13
Depends on: Phase 2 (registry schema with Content_Type/IsPro fields stable)
Status: (planned)

## Potential Blast Radius Conflicts

- apps/web/app/(catalog)/[category]/[slug]/page.tsx is claimed by BOTH Phase 1 (read isPro from registry) AND Phase 3 (notFound guard). Resolution: Phase 1 is first and establishes the registry-read pattern; Phase 3 adds the notFound guard in a subsequent pass. Phase 3 MUST read Phase 1's phase report before touching this file. No parallel execution for this file.

---

## Phase 4 — Ingestion run + Qdrant population + attribution display

Claimed files / areas:
- ops/github-ingest.mjs (RUN as a script — no source edits; ops modifications owned by Phase 2)
- docs/evidence-manifest/registry/ (WRITES new registry .md files — no edits to existing files modified by Phase 2)
- packages/db/src/search.ts (modify — update search queries to use new payload fields)
- apps/web/components/attribution-display.tsx (create new — attribution UI component)
- apps/web/app/(catalog)/[category]/[slug]/page.tsx (modify — add attribution display)
- n8n pipeline blueprint (modify ops/n8n/ — update to handle new frontmatter fields)

ACs covered: 1, 12, 14
Depends on: Phase 2 (schema), Phase 3 (catalog routing)
Status: (planned)

## Potential Blast Radius Conflicts (Phase 4)

- apps/web/app/(catalog)/[category]/[slug]/page.tsx is also claimed by Phase 1 and Phase 3. Phase 4 adds attribution display UI only. All three phases must serialize writes to this file in phase order (1 → 3 → 4). Phase 4 reads Phase 3's final version before editing.
- docs/evidence-manifest/registry/ — Phase 2 modifies existing files (and deletes 129 legacy); Phase 4 writes NEW files only. No conflict if phases are sequential.
