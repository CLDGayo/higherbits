---
phase: phase-04-surface-restyle
date: 2026-07-12
status: COMPLETE
feature: higherbits-cozy-rebrand
plan: process/features/higherbits-cozy-rebrand/active/higherbits-cozy-rebrand_12-07-26/phase-04-surface-restyle_PLAN_12-07-26.md
---

# Phase 4 — Surface Restyle — Execution Report

**TL;DR:** Cozy claymorphism now applied across header, sidebar, footer, landing, pricing, and the
shared Card/Button/Badge primitives — className/CSS only, zero behavior change. Phase 3 tokens
(`rounded-cushion`, `rounded-pill`, `shadow-cushion`, `shadow-cushion-outer`, `.texture-cushion`,
pastel accent chips) consumed on every major surface, both light + cozy-dusk dark. Resumed after a
prior execute agent crashed post-edit / pre-gates: verified all 10 of its uncommitted files against
the checklist, completed the one genuine gap (D2 accent chip had variants defined but no live
consumer), and ran every gate to green. Build 0 / tsc 0 / test 10/10 / TG4 grep = 7 / TG5 zero
auth-logic delta / TG7 = 1 logo on /pricing.

## What Was Done

**Resumed dead-agent work (verified against `git diff`, all className-only):**
- `app/page.tsx` — landing shells `bg-[#F5F5F0]`→`texture-cushion bg-background`; card wrappers →
  `texture-cushion rounded-cushion bg-card shadow-cushion border-border/60`; padding `p-6`→`p-8` (D1/D3).
- `app/pricing/page.tsx` — page shell → `texture-cushion` (E1 partial).
- `components/ui/card.tsx` — `rounded-lg`+`shadow-sm` → `rounded-cushion`+`shadow-cushion`+`border-border/60` (F1).
- `components/ui/button.tsx` — base `rounded-lg`→`rounded-pill`; all size variants → `rounded-pill`;
  default variant gained `hover:-translate-y-px shadow-cushion-outer` (D4/E3/F1).
- `components/ui/badge.tsx` — 4 pastel accent variants added: pink/peach/blue/mint (D2 definition).
- `components/ui/footer.tsx` — `rounded-cushion`+`shadow-cushion`+`border-border/60`, `p-6`→`p-8` (C1/C2).
- `components/ui/header.client.tsx` — `.texture-cushion`+`backdrop-blur-sm` on header bar; search input
  + ⌘K kbd → `rounded-pill` (A1/A2).
- `components/ui/pricing-card.tsx` — tier card → `texture-cushion rounded-cushion bg-card shadow-cushion
  border-border/60`; hardcoded `text-neutral-*`/`bg-white/5`/`border-white/10`/`text-black` all swapped to
  theme tokens; featured ring → `ring-accent-pink/60`; check icons → `text-accent-mint-foreground` (E1/E3).
- `components/ui/sidebar.tsx` — `SidebarMenuButton` rail `rounded-md`→`rounded-pill` (B1/B2).
- `components/ui/aurora-background.tsx` — dark-variant selector fix (`after:dark:`→`dark:after:`), whitespace.

**New work I added this session (className/JSX only, no logic):**
- `components/ui/hero-section.tsx` — added a pastel `Badge variant="pink"` announcement chip
  ("Cozy UI, freshly baked") above the hero headline — the first live consumer of the Phase-3 accent
  variants, making D2 genuine rather than defined-but-unused. Also normalized the leftover
  dark-hardcoded ⌘-enter `<kbd>` (`rounded`→`rounded-pill`, `text-white`→`text-primary-foreground`).

## What Was Skipped or Deferred

- No `.texture-cushion` on the shared `<Card>` base or the footer/sidebar rail — texture reserved for
  major hero/pricing surfaces per the charter's "reserve soft grain for card/panel" direction (F2/C2 judgment).
- TG9 (pixel-level visual confirmation): `vc-agent-browser` unavailable — known-gap per umbrella charter
  + Phase 1 precedent. Source-token/className evidence + live HTTP-200 probe substitute.
- TG10 (`/pricing` automated a11y): pre-existing backlog known-gap (`backlog/pricing-a11y-coverage-gap_NOTE_12-07-26.md`).

## Test Gate Outcomes

| Gate | Result |
|---|---|
| TG1 `corepack pnpm --filter web build` | exit 0 (90 routes) |
| TG2 `corepack pnpm --filter web exec tsc --noEmit` | exit 0 |
| TG3 `corepack pnpm --filter web test` | 10/10 pass (4 files; baseline, zero regressions) |
| TG4 `grep texture-cushion header.client/page/pricing \| wc -l` | 7 (>0) |
| TG5 header.client.tsx auth-logic delta (Hybrid diff-review) | zero — diff is 4 className lines; grep of diff for useAuth/useUser/stripe/SignedIn = 0 |
| TG6 sidebar target confirmed (Hybrid) | `components/ui/sidebar.tsx` shared primitive (E2); studio/settings sidebars out of scope |
| TG7 `/pricing` logo count (Hybrid, Phase 1 regression) | 1 — page-level `<Logo>`=0; logo.tsx default `"flex"` intact; single `<Header/>` renders 1 |
| TG8 dark-mode legibility (Agent-Probe, source review) | pass — all restyled surfaces use `.dark`-aware tokens; no hardcoded light-only hex survives |
| TG9 visual cushion recognizability (Agent-Probe) | known-gap (agent-browser unavailable); source evidence: aesthetic bar MET |
| TG10 `/pricing` a11y | known-gap (backlogged, unchanged) |

## TG5 Diff-Review Evidence (header.client.tsx no-touch)

`git diff -- apps/web/components/ui/header.client.tsx | grep -iE "useAuth|useUser|stripe|isPro|subscription|SignedIn|SignedOut|auth\("`
→ **zero matches.** The full diff is 4 changed lines, all inside JSX `className` string props
(header bar `texture-cushion`/`backdrop-blur`, search-input `rounded-pill`, kbd `rounded-pill`).
No conditional branch, hook call, or logic path altered. Combined dead-agent + my changes reviewed.

## Dark-Mode Notes

Reviewed at source (agent-browser unavailable). Every restyled surface resolves per-theme:
`bg-card`/`text-card-foreground`, `shadow-cushion` (dark shadow globals.css:334), accent-*-foreground
pairs (dark rows 318-325), and `.dark .texture-cushion::before` (globals.css:386). Pricing-card's
former hardcoded light-only neutrals were the one dark-mode risk and were fully removed by the dead
agent — it now reads correctly in cozy-dusk.

## Plan Deviations

1. D2 completed by adding a live Badge chip in hero-section.tsx (dead agent only defined the variants).
   Within blast radius (landing surface, className/JSX only). No behavior change.
2. Normalized one leftover dark-hardcoded `<kbd>` in hero-section.tsx to cushion tokens — within
   blast radius (landing "small UI accent" per D2), pure className.

Both are within-blast-radius, className-only deviations — documented, non-blocking, no user gate.

## Test Infra Gaps Found

- No component-level test asserts className values on header/footer/sidebar/pricing-card/landing —
  automated coverage rests on build/tsc/grep (contract CONCERN, accepted). Baseline is 10 tests, not
  the "123" the contract's TG3 note quoted (stale; Phase 0/1 confirm 10).
- agent-browser unavailable → no pixel visual-regression (program-level known-gap).

## Closeout Packet

- Selected plan: phase-04-surface-restyle_PLAN_12-07-26.md
- Finished: all Step A-H checklist items + Step 5 ticked.
- Verified: build/tsc/test green; TG4=7; TG5 zero-logic-delta; TG7=1 logo (Phase 1 fix intact);
  TG8 dark-mode source review.
- Unverified: pixel-level visual QA (agent-browser gap, accepted); `/pricing` a11y (backlogged).
- Cleanup remaining: EVL confirmation run (orchestrator-owned vc-tester), then commit + UPDATE PROCESS.
- Classification: **Keep in active/testing** — code-complete + automated-green; awaits EVL confirmation.

## Forward Preview

### Test Infra Found
No new automated test added (thin UI-render coverage per program precedent). The live `next start`
HTTP-200 + Logo-marker SSR probe pattern is reusable for Phase 5 QA.

### Blast Radius Changes
Phase 5 (long-tail QA) inherits the restyled primitives — any surface using `<Card>`/`<Button>`/`<Badge>`
now carries cushion styling automatically. Button base radius is `rounded-pill` for all callers.

### Commands to Stay Green
`corepack pnpm --filter web build && corepack pnpm --filter web exec tsc --noEmit && corepack pnpm --filter web test`
`grep -n "texture-cushion" apps/web/components/ui/header.client.tsx apps/web/app/page.tsx apps/web/app/pricing/page.tsx | wc -l` → 7

### Dependency Changes
None. No new npm deps. No schema/auth/API/route changes. header.client.tsx auth/Clerk/Stripe untouched.

## Follow-up Stubs / CONTEXT_PARTIAL

- Follow-up plan stubs created: none.
- `CONTEXT_PARTIAL`: none new (all-context.md apps/web staleness already flagged in umbrella charter).
