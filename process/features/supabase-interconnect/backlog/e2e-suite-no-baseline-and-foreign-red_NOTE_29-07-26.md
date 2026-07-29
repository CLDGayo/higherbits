---
name: report:e2e-suite-no-baseline-and-foreign-red
description: "Backlog — the Playwright e2e suite is 19-red on routes this program never touched, with no pre-change baseline, so it cannot currently detect regressions"
date: 29-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-04
---

# Backlog — Playwright e2e suite has no working baseline

**Raised by:** supabase-interconnect Phase 4 (Navigation reconciliation), EVL close (29-07-26).
Not fixed this phase — genuinely out of Phase 4's blast radius and not attributable to this
program's changes.

## What

Running the full `playwright test e2e/` gate during Phase 4's EVL returned **19 failed / 13 passed
/ 2 skipped**. Every single failure is on a route this phase never touched — `/`, `/magic`,
`/magic-chat`, `/studio`, `/api-access`, `/contest`, `/our-story` — and Phase 4 has no pre-change
full-e2e run to diff against, because no prior phase in this program (or its predecessors) captured
one. As a result, nobody can currently say with certainty "this change introduced zero new e2e
failures" for *any* phase — the gate is red by default, not by regression.

## Root cause (two families, both foreign to this program)

1. **Color-contrast debt.** The same `--muted-foreground` / `text-primary` WCAG AA violation family
   already tracked in `process/context/tests/all-tests.md` (originally surfaced by the
   `claymorphism-reference-parity` program) accounts for most of the failures. Phase 4 itself added
   one *new* instance of this same foreign family — 58 violations on `/?tab=templates` — see
   `process/context/all-context.md`'s Phase 04 entry; that is recorded there, not duplicated here.
2. **Clerk dev keys absent.** Every route that renders Clerk-gated UI fails or degrades because
   `apps/web/.env.local` has no real `CLERK_SECRET_KEY`/`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — a
   pre-existing, already-documented blocker (see `all-context.md` Open Questions). Clerk middleware
   also intercepts and rewrites document requests before app-level logic (e.g. Phase 4's
   `permanentRedirect()`) can run, which is why `e2e/templates-redirect.spec.ts` is currently
   `test.describe.skip`'d rather than green.

## Why this matters going forward

The gate cannot function as a regression detector for anyone — this program's phases (or any
future phase) can add a real e2e bug on an untouched route and the suite will look exactly as red
as it does today. "82/82 vitest passing" is a real, working gate; "19 failed / 13 passed" for
Playwright is not currently a gate at all, just a known bad state.

## Fix options (not attempted this phase — needs its own scoped decision)

- **(a) Capture and freeze a baseline now.** Record today's exact 19-fail / 13-pass / 2-skip result
  as the accepted baseline (with per-test attribution to contrast-debt vs. Clerk-absent), so future
  phases can diff against it and catch *new* regressions even while the underlying debt is unfixed.
  Cheapest option; does not fix anything, only makes the gate meaningful again.
- **(b) Fix the color-contrast debt.** Requires a design-token pass (own scoped program) — out of
  size for a quick fix.
- **(c) Provision real Clerk dev keys.** Already blocked on the user (see `all-context.md` Open
  Questions) — would resolve the Clerk-absent failure family but not the contrast family.
- **(d) Split the suite.** Separate "known-foreign-red, informational only" routes from
  "this-program-owns-this-route, must stay green" routes so a program's own EVL gate isn't drowned
  out by unrelated debt.

## Recommendation

(a) is the cheapest unblock and should probably happen before Phase 5 or Phase 6 EVL runs the same
full-suite command and hits the same wall. (b)/(c) are pre-existing, already-tracked blockers with
their own backlog homes; this note exists to name the *aggregate* symptom (no working baseline),
not to re-litigate the individual root causes.
