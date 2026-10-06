# Edil-ozi capture

`manifest.json` pins 3 of the 8 components listed for row 24 of the 21st creators sheet
(`accordion`, `drawer`, `pricing-card`) from `Edil-ozi/edil-ozi`. Source files and the root MIT
license (`LICENCE.md`, Copyright Edil Ozi) are copied from Git commit
`a2263dc28ff897bfd5688a5e7999bce31036f350`.

Each staged item is a single self-contained `.tsx` file with no runtime npm dependencies beyond
React/react-dom; `accordion.tsx` additionally resolves `@/lib/utils` to the host app's own
pre-existing `cn()` helper (not a pinned upstream file — see `DEPENDENCY_LICENSE_REVIEW.md`).

The local stage includes a HigherBits-authored demo wrapper per item (`demos/*.tsx`), a
Antigravity-guidance review note per item (`guidance/*.txt`), and is intended to produce the same
artifact set as the BelkacemYerfa/Urvish captures:
- Browser-checked standalone preview bundle + PNG under `apps/web/public/auto-index/`
- Self-contained, interactive GoHighLevel export per item: `ghl/*.html`
- Ten saved copy prompts per item: `copy-prompts.json`

Run `node ops/emit-pinned-edilozi-production.mjs --check` for readiness validation.
Publication emits atomic SQL with `--emit-sql <slug[,slug]|all> <review.json>` after verifying a
clean release commit and deployed bytes on `higherbits.dev`.

## Held items (not staged this pass)

Of the 8 slugs listed in the sheet for this author, 5 were held — see
`ops/phase-e-pinned/checkpoints/Edil-ozi-review.json` for the precise reasons:
- `custom-checkbox`, `toggle` — the upstream GitHub source (`checkboxes.tsx`, `toggle-inputs.tsx`)
  is a multi-variant showcase gallery, not a single reusable component matching the 21st.dev slug;
  no 1:1 source file could be isolated without inventing content not authored by Edil-ozi.
- `infinite-scroll` — hardcodes hotlinked `images.unsplash.com` URLs; third-party photo rights are
  unverified.
- `horizontal-scroll-carousel` — depends on `next/image` (framework-coupled, cannot render inside a
  self-contained GHL export) and takes an `images: string[]` prop with no bundled images of its own
  to rights-clear.
- `scroll-velocity` — clean source, but requires adding a net-new `framer-motion` npm dependency
  (not currently installed anywhere in this repo) and is driven by whole-page scroll, which is a
  poor fit for an isolated single-component static preview; deferred rather than rushed.
