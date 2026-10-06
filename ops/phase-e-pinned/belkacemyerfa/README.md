# BelkacemYerfa capture

`manifest.json` pins the `datetime-picker` component from `BelkacemYerfa/shadcn-extension` (row 20 of 21st creators).
Source files and the root MIT license are copied from Git commit `d678d7f5493aa480615b4e0200c0255ba92ad8c9`.

The local stage includes a HigherBits-authored demo wrapper (`demos/datetime-picker.tsx`) and the exact source closure (`datetime-picker.tsx`, `input.tsx`, `utils.ts`).
The component dependency `timescape` is MIT licensed (`timescape@0.4.3`, Daniel Lehr), verified in `DEPENDENCY_LICENSE_REVIEW.md` and `dependency-license-evidence.json`.
The stage includes:
- Browser-checked standalone preview bundle: `apps/web/public/auto-index/belkacemyerfa-datetime-picker.html`
- Rendered PNG preview: `apps/web/public/auto-index/belkacemyerfa-datetime-picker.png`
- Self-contained, interactive GoHighLevel export: `ghl/datetime-picker.html`
- Ten saved copy prompts with Gemini 3.8 Flash High guidance: `copy-prompts.json`

Run `node ops/emit-pinned-belkacemyerfa-production.mjs --check` for readiness validation.
Publication emits atomic SQL with `--emit-sql datetime-picker <review.json>` after verifying clean release commit and deployed bytes.
