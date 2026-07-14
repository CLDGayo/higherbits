---
phase: search-ui-wiring
date: 2026-06-25
status: COMPLETE_WITH_GAPS — ARCHIVED
feature: ""
plan: process/general-plans/completed/search-ui-wiring_24-06-26/search-ui-wiring_PLAN_24-06-26.md
committed: b724a5d
archived: 2026-06-25
---

# Search UI Wiring — Execute Report

> **Archived 2026-06-25.** Committed as `b724a5d` (`feat(web): wire semantic search island into storefront header`). EVL re-confirmed green: `apps/web tsc --noEmit` exit 0. Moved active/ → completed/. Open known-gaps (live browser UI probe; populated-Qdrant result links) carry forward to the live-ingestion + app-integration workstreams tracked in `process/context/all-context.md` Open Questions.

## What Was Done

Wired live semantic search into the storefront header (blast radius: `apps/web` only).

- **CREATE** `apps/web/hooks/use-debounce.ts` — `useDebounce<T>(value, delay)` (`"use client"`; setTimeout/clearTimeout cleanup).
- **CREATE** `apps/web/components/search-island.tsx` — `"use client"` component: controlled input, 250ms debounce, ≥2-char gate, `AbortController` stale-request cancellation, anchored `z-30` dropdown, outside-click + Escape close, 4 states (loading "Searching…" / error "Search indexing..." / empty "No results found" / success list). Result items `<Link href={`/${r.category}/${r.slug}`}>`. Inline `ComponentSummary` type — no server-only import.
- **EDIT** `apps/web/components/site-header.tsx` — replaced disabled `<input>` with `<SearchIsland />`; outer `ml-auto w-full max-w-xs` div kept; header stays a server component (no `"use client"`).

Checklist A1–D4: all complete (D2/T2 with a harness-drift gap, see below).

## What Was Skipped or Deferred

- Live browser UI probe (T4 runtime) — deferred; no browser harness this phase, Qdrant unpopulated. T4 verified by code trace instead. (Accepted CONDITIONAL known-gap #3.)

## Test Gate Outcomes

- **T1** `cd apps/web && corepack pnpm tsc --noEmit` → **exit 0 (PASS)**. Confirms client/server boundary correct, inline type valid.
- **T2** `corepack pnpm --filter web lint` → **non-zero (harness-drift gap)**. `next lint` has no ESLint config anywhere in the repo and prompts "How would you like to configure ESLint?" — cannot run non-interactively. Pre-existing repo state (lint never configured this phase), NOT a code defect. tsc covers type-safety.
- **T3** dev server + `curl /api/search?q=button` → **PASS (graceful, no crash)**: `503 {"error":"OPENAI_API_KEY is not set"}`; empty `q` → `400 {"error":"missing query param \`q\`"}`. Dev server torn down.
- **T4** agent-probe (code trace) → **PASS** on all 9 scenarios: min-char gate, loading, error fallback, empty fallback, clear-closes, outside-click, Escape, SSR-closed (no hydration mismatch), stale-request cancel.

## Plan Deviations

None affecting intent. `use-debounce.ts` carries `"use client"` (required for a hooks file consumed by a client component) — within blast radius, consistent with the plan's "tiny debounce hook" intent.

## Test Infra Gaps Found

- **harness-drift:** `apps/web` has no ESLint configuration; `next lint` is interactive-only and cannot pass in CI/non-interactive shells. Needs an ESLint config (or migration to ESLint CLI per Next 16 deprecation) in a later phase. Classification: `harness-drift`, not `product-breakage`.

## E1/E2 Resolution

- **E1:** `results` field names could not be observed live (503 before Qdrant due to absent OPENAI_API_KEY). Per E1 fallback, kept the documented `lib/components.ts` shape (`name, category, slug, summary, score?`). Fetch reads `data.results ?? []`, so a 503 error body (no `results` key) routes to "error" status.
- **E2:** Confirmed the 5xx graceful path renders "Search indexing..." with no unhandled rejection (non-ok → throw → catch → "error"); AbortError swallowed.

## Closeout Packet

- **Selected plan:** `process/general-plans/active/search-ui-wiring_24-06-26/search-ui-wiring_PLAN_24-06-26.md`
- **Finished:** A1–D4; T1 green; T3 graceful JSON; T4 code-probe pass.
- **Verified vs unverified:** type-safety + API non-crash + behavior-by-code-trace verified. Unverified: live browser UI interaction and populated-Qdrant result links (known-gaps, deferred).
- **Cleanup remaining:** none in-code. Repo-level: configure ESLint (separate later task).
- **Best next state:** Keep in active/testing — code-complete; live UI probe pending. Ready for EVL re-run (note T2 is an environmental harness-drift gate, not a code failure).

## Forward Preview

### Test Infra Found
No test runner in `apps/web`. ESLint unconfigured (interactive prompt) — blocks `next lint` as an automated gate.

### Blast Radius Changes
`apps/web/components/search-island.tsx` (new), `apps/web/hooks/use-debounce.ts` (new), `apps/web/components/site-header.tsx` (edited). No new deps.

### Commands to Stay Green
`cd apps/web && corepack pnpm tsc --noEmit` (Node 22 via corepack).

### Dependency Changes
None.

## Follow-up Stubs Created
None (gaps deferred to existing CONDITIONAL known-gaps; ESLint setup recorded as harness-drift note).
