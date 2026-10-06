# Dependency & notice review — Edil-ozi (`accordion`, `drawer`, `pricing-card`)

## Upstream license
- Repository: https://github.com/Edil-ozi/edil-ozi
- License file: `LICENCE.md` at repo root — MIT, "Copyright (c) Edil Ozi".
- Pinned revision: `a2263dc28ff897bfd5688a5e7999bce31036f350` (HEAD at review time).
- No per-file SPDX headers or additional notices exist in the three staged source files; the root
  MIT license governs the whole repository, including `registry/components/edil-ozi/*.tsx`.

## Per-item review
- **accordion.tsx** — zero imports from npm; one bare alias import, `@/lib/utils` (used only for
  `cn(...)`, i.e. `twMerge(clsx(inputs))`). Edil-ozi's own `lib/utils.ts` is NOT pinned here because
  it bundles unrelated site-metadata helpers (`absoluteUrl`, `constructMetadata`) that import his
  `@/config/site` and `next`'s `Metadata` type — pulling that in would mean pinning unrelated,
  config-coupled code just to satisfy one `cn()` call. Instead `aliasImports` in `manifest.json`
  points `@/lib/utils` at the host app's own pre-existing `apps/web/lib/utils.ts`, which implements
  the identical standard `cn()` (`twMerge(clsx(inputs))`) already used across this codebase. No
  rights question: this is HigherBits' own file, not substituted Edil-ozi code.
- **drawer.tsx** — zero imports beyond `react`/`react-dom` (`createPortal`). No alias imports, no
  npm dependencies.
- **pricing-card.tsx** — zero imports beyond `react`. No alias imports, no npm dependencies.
- No remote URLs, embedded images, fonts, or other third-party assets appear in any of the three
  pinned files (confirmed by manual read-through of each file's full contents).

## Net-new npm dependencies introduced by this capture
None. See `dependency-license-evidence.json` (`packages: {}`).

## Items deliberately held out of this capture
See the "Held items" section of `README.md` and `ops/phase-e-pinned/checkpoints/Edil-ozi-review.json`
for `custom-checkbox`, `toggle`, `infinite-scroll`, `horizontal-scroll-carousel`, and
`scroll-velocity`, with per-item reasons.
