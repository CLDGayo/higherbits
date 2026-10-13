# HigherBits rebrand deployment — 2026-10-13

## Result

DEPLOYED and verified at https://higherbits.dev. Production build ID: `A3sMzAU7pgL4So6sorduj`. PM2 app `higherbits.dev` is online in `/home/higherbits/htdocs/higherbits.dev`, port 3005. This report records the explicitly authorized release after the completed local two-phase program; earlier no-commit/deployment restrictions remain accurate historical records.

## Published commits and scope

- Product source: `20f19b58` — `feat(rebrand): migrate first-party surfaces to HigherBits MCP`.
- Product closeout: `d738e1aa` — `chore(process): record HigherBits rebrand release closeout`.
- Vault preflight: `88b7f75` — `docs: record verified HigherBits rebrand and release preflight`.
- Both product commits were published by a verified fast-forward push to origin/main from an isolated checkout of upstream `369d4ca4`. No force push, branch creation, rebase, or overwriting the original dirty product/vault working branches occurred. Original product remote-tracking refs were refreshed only.
- Source scope: 124 explicit paths (91 files after rename detection); process bundle: 84 files. Excluded unrelated dirty work, local-only five commits, generated lockfile drift, private state/secrets, caches and large native evidence.

## Release verification

- Exact isolated release typecheck and lint passed; lint retained existing warnings. Minimal type-only corrections in three rebrand tests preserved behavior/assertions.
- 118 isolated migration-browser cases and 92 focused unit tests passed after those corrections.
- Matched safe-config full-unit comparison: upstream 152 files / 1,221 passing / 24 failing; release 159 files / 1,550 passing / 23 failing. All 23 release failures reproduce upstream with matching test/error signatures. Zero new failures; full-unit is not claimed green. One removed/replaced legacy test explains the different baseline count and is not claimed as a repaired failure.
- Independent exact-diff source review PASS and operational packaging/rollback review PASS. Original packaging metadata and incomplete rollback findings were corrected before execution.
- VPS optimized production build completed successfully using the documented bounded heap and validation-skip workaround after local typecheck/lint success. No dependency install, schema migration, secret changes or provider-probe campaign was run on production.
- The deployment script reported `DEPLOYED_HEALTHY`. Independent HTTPS checks: health, pricing, llms.txt and social-card image returned 200; `/magic?source=release&source=check` returned 308 to `/higherbits-mcp?source=release&source=check`.
- A real signed-out in-app browser at live /pricing rendered “Create beautiful UI with HigherBits MCP” and the HigherBits MCP comparison heading. Initial raw HTML was client-shell-only, so the initial raw-string assertion failed; rendered accessibility state subsequently established the actual branding. No historical public-baseline or live admin-flow certification is inferred.
- All 88 deployed present-file SHA-256 checks passed, and all 35 obsolete source paths were absent. The sole intentional difference from committed source is the clean three-way-merged sidebar preserving its already-deployed promotion-card removal; upstream authors/catalog/profile fixes remain intact.

## Production preservation and rollback

Production had existing uncommitted thumbnail, sidebar, modal, Next config and lockfile fixes. The scoped source overlay preserved unrelated files rather than pulling over them; production Git HEAD intentionally remains `369d4ca4` plus the documented overlays. Do not mistake HEAD alone for the deployed source identity.

Staging/rollback location: `/home/higherbits/rebrand-release-20261013/`.

- Runtime archive: exactly 88 unique approved files, no macOS metadata/extras; SHA-256 `c66ad466fb62d44dc9c2e987ca2161d55c1b9303def7bd52c51d0e5955fd3012`.
- Reviewed script SHA-256: `b6d7ecf852fd0b212ea59cf35d533200c7d6c6f50eb829d187444ceb1f6158c8`.
- Preserved tracked preflight diff, exact selected source backup, absent-path list, moved obsolete source, native build/deployment logs and runtime hash-check log.
- Previous build retained at `build-before/`, independently verified build ID `YZdwm5XltPb6cOym2u61M`. Phase-aware failure traps restore selected source/build and verify restored health. No destructive cleanup performed.

## Boundaries

This is a scoped release smoke check, not a fresh full accessibility audit, authenticated production journey, npm startup/provider delivery test or resolution of the inherited 23 unit failures. Existing missing historical public baseline and native capture limits remain disclosed under the user's accepted standard. Original dirty working trees are deliberately not reconciled or reset.
