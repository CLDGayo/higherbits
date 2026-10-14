---
phase: execute
date: 2026-10-14
status: COMPLETE_WITH_GAPS
feature: higherbits-redesign
plan: process/features/higherbits-redesign/active/home-discovery-adaptation_13-10-26/home-discovery-adaptation_PLAN_13-10-26.md
---

## What Was Done

- Added the service-only public demo tag-count SQL function and an in-memory PGlite verification runner. The Home query and API now report count failures instead of showing misleading zero counts.
- Composed the Home discovery sections in the approved order using existing cards, navigation, filters, and data sources. Unavailable actions and personalized history are visibly marked Coming soon.
- Updated slider controls for keyboard and reduced-motion behavior. Fixed the Home wrapper's mobile intrinsic-width overflow.
- Changed the collections empty state to describe the featured selection, without implying that no older public collections exist.
- Compacted the existing admin-only MCP banner at tablet width so its title and action fit on one row above the Home heading. At narrow mobile widths the banner hides its secondary description, shortens the visible action label, and frees space by hiding its decorative logo.
- Added a Home-only 32px top offset at tablet/desktop widths while the admin MCP banner is mounted, preserving the introductory label above the heading. The offset disappears with the banner.
- Made Home category links and `/s/*` rail destinations use native anchors. This follows the existing sidebar's full-document navigation behavior and preserves browser link actions such as opening in a new tab.
- Added focused API, Home, and browser test cases. Captured local browser screenshots at desktop, tablet, and mobile widths.

## What Was Skipped or Deferred

- No production migration, deployment, push, or commit. Hosted database parity remains unverified until migration deployment and a production read-only probe.
- Light-theme screenshots and complete browser accessibility automation remain unverified. The broad Playwright harness timed out during global setup; a focused in-app browser probe verified local rendering instead.
- The local database has not received the new function, so the Home category-count section correctly shows an unavailable state with Retry in browser screenshots.

## Test Gate Outcomes

- `node ops/pglite-verify-public-demo-tag-counts.mjs`: PASS.
- Six focused Vitest files: 29 tests PASS.
- Post-review collections wording test: four tests PASS in the focused Home sections file; diff check PASS.
- Post-review MCP banner and Home section unit tests: seven tests PASS; web typecheck and diff check PASS. At 820px before the final mobile-only banner adjustment, the live banner ended at y=117 and the Home heading began at y=136 (19px clearance); document scroll width equaled the viewport. The mobile-only adjustment was not recaptured after the parent requested a bounded stop to browser work.
- After the Home-only banner offset: seven focused banner/Home tests PASS, web typecheck PASS, and diff check PASS. The current Chrome 3201 session was signed out, so the admin banner did not mount for authenticated visual verification. CSS conditional behavior and final mobile visual state remain browser QA items.
- Post-review Home navigation tests: six focused assertions PASS; web typecheck and diff check PASS. In the isolated Chrome dev browser, Home Categories > Gradients and Gradients rail View all both loaded `/s/gradients` with the title “Gradients Components”; More heroes rail View all loaded `/s/hero` with the title “Hero Components”.
- `corepack pnpm --filter web typecheck`: PASS.
- `git -c core.fsmonitor=false diff --check`: PASS.
- Focused browser probe at verified isolated port 3201: real Popular/New additions cards and all planned section headings rendered; desktop/tablet/mobile dark screenshots saved in `evidence/`. At 390px, Home width is 358px and document scroll width is 390px after the fix.
- Broad Playwright run: one forced-count-error scenario passed; remaining cases timed out in global setup/navigation and are not counted as proof.

## Plan Deviations

- Added `w-full min-w-0` to the scoped Home wrapper after the mobile browser revealed clipping. This is a within-scope responsive fix.
- Used a non-frozen filtered install to repair the isolated dependency tree, then restored the tracked lockfile. No package or lockfile edits remain.

## Test Infra Gaps Found

- The broad Playwright global setup warms many routes and is too slow for bounded local verification. Narrow browser probes should avoid it.
- The admin-only HigherBits MCP banner's multiline copy initially overlapped the Home heading at 820px. Its tablet geometry was verified after compaction; a further Home-only conditional offset addresses the still-clipped eyebrow. Authenticated screenshot verification of this last offset and the final mobile compact state remains open.

## Closeout Packet

- Selected plan: `process/features/higherbits-redesign/active/home-discovery-adaptation_13-10-26/home-discovery-adaptation_PLAN_13-10-26.md`.
- Local implementation and focused automated proof are complete. Keep the plan in active/testing for independent review, light-theme/accessibility evidence, and hosted database migration proof before archival.

## Forward Preview

### Test Infra Found

Use a focused browser session against isolated port 3201; avoid the broad global Playwright setup.

### Blast Radius Changes

Home presentation/navigation/query and public tag-count SQL/API only. No auth, package, or deployment files changed.

### Commands to Stay Green

`node ops/pglite-verify-public-demo-tag-counts.mjs`; `corepack pnpm --filter web typecheck`; the focused six-file Vitest command used in the execution transcript.

### Dependency Changes

None.
