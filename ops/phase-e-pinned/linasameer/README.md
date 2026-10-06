# lina.sameer capture

`manifest.json` pins the single component listed for row 429 of the 21st creators sheet
(`scroll-area-1`) from `SameerJS6/lina`. Source files and the root MIT license (`LICENSE`,
Copyright (c) 2025 Sameer Singh) are copied from Git commit
`6c1934820003c6289dd603ea9bceb0de066c8489`, re-verified live against `raw.githubusercontent.com`
in this session (byte-for-byte sha256 match on LICENSE, `registry/radix-ui/scroll-area.tsx`,
`hooks/use-has-primary-touch.tsx`, and the demo example at `registry/radix-ui/examples/vertical-scroll.tsx`),
and confirmed to be the live HEAD of the repository's `main` branch at review time (not archived,
not a fork). The repository tree was enumerated via the GitHub API and contains exactly one
license/notice file (root `LICENSE`) — no nested or conflicting license applies to the pinned
paths.

The staged item is a single self-contained `.tsx` file plus one small hook file
(`hooks/use-has-primary-touch.tsx`, pinned as a `registry:hook` file alongside the component). Its
only runtime npm dependency is `@radix-ui/react-scroll-area`, already installed in this repo's
`apps/web/package.json` at `^1.2.9` (matching the `^1.2.9` range lina.sameer's own `package.json`
uses — same major version, no vendoring needed). The only alias import, `@/lib/utils`, resolves to
the host app's own pre-existing `cn()` helper, confirmed byte-for-byte identical in implementation
to lina.sameer's own `lib/utils.ts` — see `DEPENDENCY_LICENSE_REVIEW.md`.

The local stage includes a HigherBits-authored demo wrapper (`demos/scroll-area-1.tsx`), a review
guidance note (`guidance/scroll-area-1.txt`), and produces the same artifact set as the
BelkacemYerfa/Edil-ozi/Urvish captures:
- Browser-checked standalone preview bundle + PNG under `apps/web/public/auto-index/`
- Self-contained, interactive GoHighLevel export: `ghl/scroll-area-1.html`
- Ten saved copy prompts: `copy-prompts.json`
- Playwright interaction-check screenshots proving the scroll-position fade mask reacts to real
  scroll (top/bottom masks toggle correctly at top, mid-scroll, and bottom): `interaction-check/`

Run `node ops/emit-pinned-linasameer-production.mjs --check` for readiness validation (this
session: `captured: 1, ready: 1, pending: []`).
Run `node ops/verify-pinned-linasameer-ghl.mjs` to re-check the GHL export against the real
`cleanGhlHtml()` normalizer (this session: `scroll-area-1: OK`).
Run `node ops/verify-pinned-linasameer-interaction.mjs` to re-run the Playwright scroll-interaction
proof (this session: 0 console/page errors).

Publication emits atomic SQL with `--emit-sql scroll-area-1 <review.json>` after verifying a clean
release commit and deployed bytes on `higherbits.dev`. **Not run this session** — no production
database write, no deploy, no Google Sheet update, and no git commit were performed; this stage is
offline and reproducible only.
