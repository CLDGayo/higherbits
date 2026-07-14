---
name: plan:search-ui-wiring
description: "Wire client-side semantic search UI to /api/search in the Cozy Downloads storefront header"
date: 24-06-26
feature: ""
---

# Search UI Wiring — Implementation Plan

**Date** 24-06-26
**Status** PLAN (pending VALIDATE)
**Complexity** SIMPLE
**Phase:** 05 → UI Integration: Search Wiring

Context: `process/context/all-context.md` → apps/web section. Test context: `process/context/tests/all-tests.md` (no automated tests in this phase — verification via tsc + lint + agent-probe).

---

## Overview

Replace the disabled search `<input>` in the Cozy Downloads storefront header with a live `SearchIsland` client component that calls the existing `/api/search` route. The header (`site-header.tsx`) remains a server component; only the search island is client-side. This is Phase 05 UI Integration work — the API route and Qdrant/OpenAI backend are already in place; this plan wires the UI layer only.

## Session Goal

Replace the disabled search input in `site-header.tsx` with a live `SearchIsland` client component that calls `/api/search`, debounces at 250ms, cancels stale requests, and renders graceful empty/error/loading/results states in an anchored dropdown panel.

---

## Touchpoints

| File | Action |
|---|---|
| `apps/web/components/search-island.tsx` | CREATE — new "use client" component |
| `apps/web/components/site-header.tsx` | EDIT — remove disabled `<input>`, import and render `<SearchIsland />` |
| `apps/web/hooks/use-debounce.ts` | CREATE (optional) — tiny debounce hook (~10 lines); may be inlined |

Read-only references (no changes):
- `apps/web/app/api/search/route.ts` — confirmed API contract
- `apps/web/lib/components.ts` — `ComponentSummary` type (server-only, do NOT import client-side)
- `apps/web/app/globals.css` — theme token definitions

---

## Public Contracts

None. `SearchIsland` is an internal component consumed only by `SiteHeader`. No new API routes, no schema changes, no exports to other packages.

---

## Blast Radius

- **Packages touched:** `apps/web` only
- **Files changed:** 2–3 (`search-island.tsx` create, `site-header.tsx` edit, optional hook file)
- **Risk class:** LOW — no schema, auth, billing, or public API surface changes
- **Downstream consumers:** none (SiteHeader already renders in the root layout)

---

## Approach

**Anchored dropdown** (Approach A, chosen over floating command palette).

`SearchIsland` is a single "use client" component. It:
1. Holds a controlled `<input>` with the same Tailwind tokens as the current disabled input.
2. Debounces user input at 250ms.
3. Gates on ≥2 chars before firing a fetch; clearing the input closes the panel.
4. Uses an `AbortController` ref to cancel in-flight requests when a new debounced call fires.
5. Renders an absolutely-positioned results panel (`z-30`) anchored to the input container.
6. Closes the panel on outside-click (`document` mousedown listener in `useEffect`) and Escape key.
7. Shows four states: loading ("Searching…"), empty ("No results found"), error ("Search indexing..."), results list.
8. Result items link to `/{category}/{slug}`.

`ComponentSummary` type is re-declared inline in `search-island.tsx` (fields: `name`, `category`, `slug`, `summary`, `score?`) — the server-only `lib/components.ts` is never imported client-side.

---

## Implementation Checklist

### Section A — Debounce hook (optional extraction)

- [ ] A1. Create `apps/web/hooks/use-debounce.ts`
  - Export `function useDebounce<T>(value: T, delay: number): T`
  - Uses `useState` + `useEffect` with a `setTimeout` / `clearTimeout` cleanup
  - ~12 lines; no external deps

### Section B — SearchIsland component

- [ ] B1. Create `apps/web/components/search-island.tsx` with `"use client"` directive
- [ ] B2. Declare inline `ComponentSummary` type:
  ```ts
  type ComponentSummary = { name: string; category: string; slug: string; summary: string; score?: number }
  ```
- [ ] B3. State: `query` (string), `debouncedQuery` (via hook or inline), `results` (ComponentSummary[]), `status` ("idle" | "loading" | "error" | "empty" | "success"), `open` (boolean, default false)
- [ ] B4. AbortController ref: create a `useRef<AbortController | null>(null)`. Before each fetch: abort previous, create new, store in ref.
- [ ] B5. Fetch effect: `useEffect` on `debouncedQuery` — skip if length < 2 (set status "idle", close panel); otherwise fetch `/api/search?q=${encodeURIComponent(debouncedQuery)}`, handle loading/success/empty/error transitions. Catch ALL rejections (AbortError = ignore; other errors → "error" status).
- [ ] B6. Outside-click handler: `useEffect` adding `mousedown` listener to `document`; if click target is outside the component's root ref → set `open(false)`. Cleanup on unmount.
- [ ] B7. Escape key handler: `useEffect` adding `keydown` listener; on Escape → set `open(false)`. Cleanup on unmount.
- [ ] B8. Render — input: same tokens as current disabled input minus `disabled` attribute. Add `onChange`, `value`, `onFocus` (open if query ≥ 2). `aria-label="Search components"`.
- [ ] B9. Render — panel: `absolute top-full left-0 right-0 mt-1 z-30 rounded-md border border-border bg-background shadow-lg` — visible when `open && status !== "idle"`.
  - loading: `<p className="px-3 py-2 text-sm text-muted">Searching…</p>`
  - error: `<p className="px-3 py-2 text-sm text-muted">Search indexing...</p>`
  - empty: `<p className="px-3 py-2 text-sm text-muted">No results found</p>`
  - success: `<ul role="listbox" aria-label="Search results">` with `<li>` items containing `<Link href={`/${r.category}/${r.slug}`}>` that close the panel on click
- [ ] B10. Root element: `<div className="relative w-full">` with a `useRef` attached for outside-click detection

### Section C — Site header wiring

- [ ] C1. Open `apps/web/components/site-header.tsx`
- [ ] C2. Add import: `import { SearchIsland } from "@/components/search-island";`
- [ ] C3. Replace the `<div className="ml-auto w-full max-w-xs">...</div>` block (lines 12-19) with:
  ```tsx
  <div className="ml-auto w-full max-w-xs">
    <SearchIsland />
  </div>
  ```
  Keep the outer `div` with `ml-auto w-full max-w-xs` intact; only the inner `<input>` is replaced by `<SearchIsland />`.
- [ ] C4. Verify `SiteHeader` remains a server component (no `"use client"` directive added)

### Section D — Smoke verification

- [ ] D1. Run TypeScript typecheck: `cd apps/web && corepack pnpm tsc --noEmit`
- [ ] D2. Run Next.js build (or lint): `corepack pnpm --filter web lint`
- [ ] D3. Start dev server and curl smoke test: `curl -s "http://localhost:3000/api/search?q=button" | jq .` — confirms graceful response (empty results with Qdrant unpopulated, or 5xx error with `{ error: ... }` body, never a crash)
- [ ] D4. Manual: type in search box → loading state visible → error or empty state shown (Qdrant not yet populated) → clear input → panel closes

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `tsc --noEmit` exits 0 | Fully-Automated | TypeScript types correct; inline ComponentSummary matches fetch shape; server imports not leaked |
| `pnpm lint` exits 0 (or `next build`) | Fully-Automated | No lint errors, no React client/server boundary violations |
| `curl /api/search?q=button` returns JSON (not crash) | Hybrid (dev server running) | /api/search route handles requests; graceful non-crash on Qdrant-unpopulated collection |
| Typing ≤1 char → no request fired | Agent-probe | Min-length gate enforced |
| Typing 2+ chars → loading state shown | Agent-probe | UX loading indicator works |
| Qdrant not populated → "Search indexing..." shown | Agent-probe | Error fallback state correct |
| Clear input → panel closes | Agent-probe | Panel close on empty query |
| Click outside panel → panel closes | Agent-probe | Outside-click handler works |
| Escape key → panel closes | Agent-probe | Escape handler works |
| SSR renders without panel open | Agent-probe (first-render check) | No hydration mismatch |

---

## Test Infra Improvement Notes

(none identified yet — no unit test infrastructure exists in apps/web this phase; tests planned for later phases)

---

## Resume and Execution Handoff

1. **Selected plan file path:** `process/general-plans/active/search-ui-wiring_24-06-26/search-ui-wiring_PLAN_24-06-26.md`
2. **Last completed phase/step:** PLAN written; VALIDATE pending
3. **Validate-contract status:** pending (written by vc-validate-agent after VALIDATE)
4. **Supporting context files loaded:**
   - `apps/web/components/site-header.tsx` (read — lines 1-24; current disabled input at lines 12-19)
   - `apps/web/app/(catalog)/[category]/[slug]/page.tsx` (read — confirmed route shape `[category]/[slug]`)
   - `apps/web/components/preview/copy-button.tsx` (read — confirmed "use client" component pattern)
   - `apps/web/app/globals.css` (read — confirmed theme tokens: `--background`, `--surface`, `--foreground`, `--muted`, `--border`, `--accent`)
   - `apps/web/app/api/search/route.ts` — NOT read (orchestrator pre-confirmed API contract; do not read server-only libs)
5. **Next step for a fresh agent:** implement Sections A → B → C → D in order; do not import from `lib/db.ts` or `lib/components.ts` in the client component; run tsc after each section.

---

## Acceptance Criteria

1. Typing ≥2 chars in the header search box fires a debounced request to `/api/search?q=<query>`.
2. Loading state ("Searching…") appears while the request is in-flight.
3. With Qdrant unpopulated, the component shows "Search indexing..." (error fallback) or "No results found" (empty fallback) — never crashes.
4. Clearing the input (or typing <2 chars) closes the panel with no pending requests.
5. Clicking outside the panel or pressing Escape closes the panel.
6. `SiteHeader` remains a server component — no `"use client"` added to `site-header.tsx`.
7. `tsc --noEmit` exits 0 with no new errors.
8. No server-only imports (`lib/db.ts`, `lib/components.ts`) appear in the client component.

## Phase Completion Rules

- **CODE DONE:** all checklist items A1–D4 complete, tsc exits 0, lint exits 0.
- **VERIFIED:** manual agent-probe confirms all 4 UI states render correctly; outside-click and Escape close the panel; SSR renders without hydration warnings in browser console.
- Do not mark VERIFIED based on code completion alone — the agent-probe steps in Section D are required.

## Validate Contract

Gate: CONDITIONAL
Date: 2026-06-24
generated-by: outer-pvl

### Gate Status

CONDITIONAL — 0 FAILs, 3 CONCERNs (all accepted as known-gaps or execute-agent instructions). Proceed to EXECUTE.

### Dimension Results

| Dimension | Status |
|---|---|
| Infra fit | PASS |
| Test coverage | CONCERN (known-gap: hybrid smoke test requires running dev server) |
| Breaking changes | PASS |
| Security surface | PASS |
| Section A — use-debounce hook | PASS |
| Section B — SearchIsland component | CONCERN (see E1) |
| Section C — site-header.tsx wiring | PASS |
| Section D — smoke verification | CONCERN (known-gap: Qdrant unpopulated; graceful output expected) |

### Execute-Agent Instructions

**E1 — Verify ComponentSummary field names before finalizing the inline type:**
Start `next dev` and run `curl "http://localhost:3000/api/search?q=button" | head -c 500` to confirm the actual JSON field names in the `results` array. The plan assumes `{ name, category, slug, summary, score? }` from the orchestrator's pre-confirmed API contract. If any field name differs (e.g. `component_slug` instead of `slug`), use the actual field name in the inline type declaration.

**E2 — Smoke test expected outcomes (D3/D4):**
With Qdrant unpopulated, `/api/search?q=button` will return either:
- `{"results":[],"count":0}` (200) → browser must show "No results found"
- `{"error":"..."}` (5xx) → browser must show "Search indexing..."
Both are valid graceful outcomes. Confirm one of these two states renders without a JavaScript console error or unhandled promise rejection.

### Test Gates

| # | Command | When to run | Tier |
|---|---|---|---|
| T1 | `cd apps/web && corepack pnpm tsc --noEmit` | After Section C complete | Fully-Automated |
| T2 | `corepack pnpm --filter web lint` | After Section C complete | Fully-Automated |
| T3 | Start dev server; `curl "http://localhost:3000/api/search?q=button"` returns JSON (not crash) | After T1+T2 pass | Hybrid (requires `next dev`) |
| T4 | Agent-probe: type 2+ chars → loading state → error or empty state; clear → panel closes; Escape → panel closes; click outside → panel closes | After T3 | Agent-probe |

### Known Gaps

1. No unit tests for `SearchIsland` — no test runner configured in `apps/web` this phase. Deferred to later phases.
2. Hybrid smoke (T3) cannot run in CI without a running Next.js dev server.
3. Result links cannot be end-to-end tested until Qdrant is populated (Phase 05 n8n ingestion).

### Plans Updated Applied

None — plan was complete as written; CONCERNs resolved via execute-agent instructions only.

### Autonomous Goal Block

SESSION GOAL: Wire semantic search UI to /api/search in the Cozy Downloads storefront
Charter + umbrella plan: N/A — single plan
Autonomy: auto-proceed on all reversible decisions; surface only hard stops
Hard stop conditions:
- Do NOT import from lib/db.ts or lib/components.ts in any client component
- Do NOT add "use client" to site-header.tsx
- Do NOT touch packages/db, apps/web/app/api/search/route.ts, or any server-only lib
Next phase: EXECUTE: process/general-plans/active/search-ui-wiring_24-06-26/search-ui-wiring_PLAN_24-06-26.md
Validate contract: inline in plan (## Validate Contract)
Execute start: cd apps/web && corepack pnpm tsc --noEmit | e2e spec: T3+T4 agent-probe | high-risk pack: no
