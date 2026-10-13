# HigherBits sidebar release — 2026-10-13

## Result

The user visually accepted the local sidebar and authorized repository/vault commits and production deployment. The focused product commit `3e9a5463` (`feat(sidebar): adapt HigherBits navigation to reference`) was fast-forward pushed to `origin/main`. The VPS-only production release completed with build ID `DO2FuagSmg9PmdxFrbHu_`; PM2 `higherbits.dev` is online and the deployment script reported `DEPLOYED_HEALTHY`.

The original product and vault working branches remain untouched. Production Git HEAD remains `369d4ca4` plus existing scoped overlays: the live checkout has 113 unrelated dirty paths and is a symlink to the creators release directory. Git HEAD alone does not identify the deployed source.

## Scope and verification

- Product commit contains the three reviewed sidebar application/test files and this task's plan, mapping, reference image, and four local visual evidence captures. It excludes baseline dirty-tree snapshots, generated build output, lockfile drift, and unrelated edits.
- The isolated release checkout passed 17/17 focused tests, `tsc --noEmit`, lint (existing warnings), and `git diff --check`. Local Next compilation succeeded; full local page-data collection lacked the production-only Supabase/API environment, so the complete optimized build was performed on the VPS.
- Production preflight compared live source with upstream: `navigation.ts` matched; `sidebar-layout.tsx` differed only by the already deployed pink promotion-card removal. The new sidebar retains that removal.
- The scoped runtime archive contained only `apps/web/lib/navigation.ts` and `apps/web/components/features/main-page/sidebar-layout.tsx`. Their deployed SHA-256 values match the release commit: `58f378eb65141ee227de87830c11cab15e6949556377caf995b7844dd3ad93e9` and `f39ffeb98ab9ba4e873ab510a6a6c734fe1fbcf5c3b137cd1347fcee7192fed3`.
- Independent public HTTPS requests returned 200 for `/`, `/?tab=components&sort=recommended`, `/api/health`, and `/s/avatars`. The live signed-in Chrome session rendered the adapted component sidebar, real category counts, disabled Coming soon badges, component cards, and Publish footer; visual inspection found no pink promotion card.

## Production preservation and rollback

Release stage: `/home/higherbits/sidebar-release-20261013/`. It retains the exact prior two source files under `backup/`, the prior build under `build-before/` (ID `A3sMzAU7pgL4So6sorduj`), the two-file runtime archive, deployment script, and build log. The script checks prior and new source hashes, builds to `.next-sidebar-release`, swaps only after a successful build, and restores source/build if the health check fails. No dependency install, schema change, secret change, bulk sync, Git pull or Vercel action was performed on the VPS.

## Limits

The earlier local desktop/light/mobile/browser-history verification and role-fixture tests remain the acceptance evidence. This release smoke check did not re-run the complete keyboard matrix or a separate authenticated admin/non-admin journey in production. The previous site-wide inherited test failures were outside this scoped change.
