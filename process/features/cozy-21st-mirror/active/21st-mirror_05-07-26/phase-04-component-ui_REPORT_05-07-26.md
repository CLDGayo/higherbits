---
phase: phase-04-component-ui
date: 2026-07-06
status: COMPLETE
feature: cozy-21st-mirror
plan: process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-04-component-ui_PLAN_05-07-26.md
---

# Phase 04 — Component UI — EXECUTE Report

## What Was Done

Presentation-only premium-token migration across 5 blast-radius files + 2 new locked-state test files.

- **A1/A2 `[slug]/page.tsx`** (className-only): `<header>` and closing attribution `<p>` given `rounded border border-border bg-surface … shadow-soft` premium card treatment; nav link got `transition-colors`. Line-92 `locked` derivation, `installToken` HMAC block, `stripDemoPaywall`/`recordComponentView`/`hasHitDailyLimit` calls, `contentType` ternary (line 151), and all prop wiring untouched.
- **B1 `preview-tabs.tsx`**: outer frame `rounded … shadow-soft`; tablist bar `bg-surface/70 backdrop-blur-md` glass; code panel `rounded … shadow-soft`; `DemoPill` inactive hover → `hover:bg-accentSecondary/20 hover:text-accent`, active → added `shadow-soft`. `preview-canvas` className verbatim (grep-confirmed at line 164); `aria-pressed`, `activeDemoId` state, `IntersectionObserver`, `isValidVideoPath`/`safeVideoSrc` unchanged.
- **B2 `paywall-overlay.tsx`**: full `stone-*` → theme-token rewrite. `BUTTON_CLASS` rewritten once (used in both SignInButton child + CheckoutButton — unforked); overlay container/badge/copy migrated to `--surface`/`--border`/`--accent`/`shadow-soft`. All `SignedIn`/`SignedOut`/`CheckoutButton` fetch logic + `locked`/`overLimit` props byte-for-byte identical. Zero `stone-*` remaining (grep-confirmed).
- **B3 `theme-detail.tsx`**: `border-hairline`→`border-border`, `bg-panel`→`bg-surface` (both were undefined no-op tokens), added `shadow-soft`. Note: `hairline`/`panel` are NOT tailwind tokens in this repo — replaced with real tokens per premium recipe. `LOCKED_MESSAGE` substitution + escaped `<code>` logic untouched.
- **C1 `[category]/page.tsx`**: card-grid `<Link>` given `rounded … shadow-soft transition-all hover:shadow-md`. `getCategoryEntries`/`getCategories`/metadata logic untouched.
- **D1 `paywall-overlay.test.tsx`** (new, jsdom): 3 tests — signed-out lock UI + no source leak, signed-in CheckoutButton + no source leak, overLimit copy. Clerk mock per site-header precedent.
- **D2 `theme-detail.test.tsx`** (new, jsdom, no Clerk mock): locked strips snippet / unlocked shows snippet.

## What Was Skipped or Deferred

- **E2 manual Pro/non-Pro visual check across 3 themes** — Agent-Probe, known-gap. Blocked on missing Clerk dev keys (pre-existing program-level runtime blocker, `all-context.md` Open Questions). Owed as a program-level visual checkpoint; NOT a silent skip. Automated D1/D2 already prove the security-critical DOM state (source/snippet absent when locked).

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| Full vitest | `corepack pnpm --filter web test` | PASS — 107/107 (102 baseline + 5 new) |
| tsc web | `corepack pnpm --filter web exec tsc --noEmit` | PASS — exit 0 |
| @repo/ui type-check | `corepack pnpm --filter @repo/ui type-check` | PASS — exit 0 |
| Build differential | `corepack pnpm --filter web build` | KNOWN-GAP PASS — `✓ Compiled successfully`; fails at page-data collection on `/api/webhooks/qstash` with `QSTASH_CURRENT_SIGNING_KEY/QSTASH_NEXT_SIGNING_KEY required` — the documented ambient qstash signing-key differential (contract Gate C), route outside this phase's blast radius. Same signature, not a regression. |

## Plan Deviations

- **Within-blast-radius (documented):** Wrote 5 new tests (3 D1 + 2 D2) vs the plan's stated ~2. Extra D1 `overLimit` case is additive coverage only. Actual suite total is 107, not the plan's projected 104. No scope expansion; all green.

## Test Infra Gaps Found

None new. Pre-existing: build cannot fully green locally without QSTASH signing keys (ambient, unrelated to this phase).

## Closeout Packet

- Selected plan: `process/features/cozy-21st-mirror/active/21st-mirror_05-07-26/phase-04-component-ui_PLAN_05-07-26.md`
- Finished: all checklist items A/B/C/D/E1
- Verified: vitest 107/107, tsc web 0, @repo/ui 0, build compiles clean (page-data fails only on known ambient qstash gap)
- Unverified: E2 visual check (Clerk-dev-keys blocker, owed)
- Remaining: EVL confirmation run, then UPDATE PROCESS
- Best next state: EVL (vc-tester re-run of gate commands), then Keep-active until program-level Clerk visual checkpoint

## Forward Preview

- **Test Infra Found:** jsdom Clerk-mock precedent (`site-header.test.tsx`) transfers cleanly to any Clerk-client-component test; pure-SSR components need no mock.
- **Blast Radius Changes:** none beyond planned 5 files + 2 tests.
- **Commands to Stay Green:** `corepack pnpm --filter web test` (107/107); `corepack pnpm --filter web exec tsc --noEmit`.
- **Dependency Changes:** none.
