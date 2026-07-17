---
name: note:foreign-build-tsc-red
description: "Program-wide build/tsc gate red, 100% foreign-attributed to uncommitted user files (lib/queries.ts, hooks/use-analytics.ts) — not caused by any claymorphism-reference-parity phase"
date: 18-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: claymorphism-reference-parity
  phase: cross-phase
---

# Foreign build/tsc red — cross-phase known-gap

## Problem

`corepack pnpm --filter web exec tsc --noEmit` and `corepack pnpm --filter web build` (strict) are
RED across the whole program as of Phase 2 and Phase 3 EVL closeouts (17-07-26 / 18-07-26).

- `apps/web/lib/queries.ts` — 33 type errors
- `apps/web/hooks/use-analytics.ts` — 2 type errors
- **0 errors in any claymorphism-reference-parity phase file** across Phase 1, 2, or 3.

## Root cause / provenance

Phase 2 EVL confirmed `build`/`tsc` were GREEN on 17-07-26 (see
`phase-02-chart-fixes-evl-iteration-001_REPORT_17-07-26.md`). Breakage post-dates that pass. Both
files are currently `git status` "modified, uncommitted" and correspond to the touchpoints of the
user's in-flight general plan `process/general-plans/active/console-errors-cleanup_17-07-26/` (PVL
pending as of this note). Neither file is imported by, nor imports, any Phase 1/2/3 claymorphism
file — Phase 3's `page.client.tsx` uses a local `fetchAuthorPayouts` via react-query's `useQuery`,
not `lib/queries.ts`.

## Resolution path

- Owner: user, via `process/general-plans/active/console-errors-cleanup_17-07-26/` (complete that
  plan's PVL/EXECUTE, or revert/finish the in-flight edits to `lib/queries.ts` /
  `hooks/use-analytics.ts`).
- The `claymorphism-reference-parity` program MUST NOT edit these two files — they are outside
  every phase's blast radius (Phase 1: CSS/tokens/assets; Phase 2: chart components; Phase 3:
  sidebar/dashboard/hero; Phase 4: font sweep + QA only).
- **Phase 4 inherits this attribution rule.** Phase 4's full QA gate run (build/tsc/vitest/a11y)
  will also show build/tsc red until this backlog item resolves — Phase 4 EVL should re-confirm
  the same 0-in-radius-errors finding rather than treating it as a Phase 4 regression, and should
  not attempt to fix `lib/queries.ts` / `hooks/use-analytics.ts` itself.

## Status

Open — attributed, non-blocking known-gap. Accepted as CONDITIONAL at Phase 2 and Phase 3 EVL.
