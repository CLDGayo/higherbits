---
phase: release
date: 2026-10-14
status: COMPLETE_WITH_GAPS
feature: higherbits-redesign
plan: process/features/higherbits-redesign/active/home-discovery-adaptation_13-10-26/home-discovery-adaptation_PLAN_13-10-26.md
---

# HigherBits Home discovery release

The Home discovery implementation was committed as `d892a0afecf2d4e2d9668fe0e3edb61c9d27c71e` (`feat(home): adapt discovery page for HigherBits`) and fast-forward pushed to GitHub `main`. This release record supplements the local execution report in this task folder; that report remains the historical record of the earlier local-only verification.

## Verification before release

- The exact committed tree passed the PGlite public demo-tag count fixture, 15 focused tests across six files, TypeScript typecheck, lint (exit 0 with warnings), and `git diff --check`.
- The Supabase migration `public_demo_tag_counts_20261013` was applied and verified on the hosted database: 174 populated tags and 442 public demo-tag matches in total. Function execution was denied to `anon` and `authenticated`, granted to `service_role`, and the security-definer function used `search_path = pg_catalog, pg_temp`.

## VPS deployment

- Production was updated through the reviewed, failure-rehearsed VPS-only script `/home/higherbits/home-release-20261014/deploy.sh`. No Vercel service was used.
- The previous build `DO2FuagSmg9PmdxFrbHu_` was retained at the release's `build-before` rollback stage. The new live build ID is `bWPZok8EUne5RKQEzyd1k`; PM2 is online.
- Eight deployed runtime files were checked against their expected hashes. The script preserved 115 unrelated dirty files on the VPS. Production Git `HEAD` remains `369d4ca4` with source overlays, so the live build is not represented by that VPS commit alone.

## Live checks

- Public Home, health, hero category, and gradients category endpoints returned HTTP 200.
- The tag-count API returned 174 populated tags, including `hero: 9` and `gradients: 10`.
- Chrome displayed Home cards and category counts without observed errors. Clicking the Gradients category opened its correct page; the “More heroes” rail’s View all opened `/s/hero` with the title “Hero Components | HigherBits.dev”. At 390px, document scroll width equaled the 390px viewport.

## Remaining limits

- No full-site end-to-end pass was completed. The earlier broad Playwright run timed out.
- The light theme and authenticated admin banner have not received final browser visual verification.
- The VPS build includes pre-existing source overlays. A clean-checkout production parity claim would be inaccurate until those overlays are reconciled.

Rollback material is retained in `/home/higherbits/home-release-20261014/`, including the `build-before` stage. Use the reviewed deployment script and its staged backups for a rollback decision; this record does not claim a rollback was performed.
