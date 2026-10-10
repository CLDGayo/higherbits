# Contentbit `pros-cons` dependency and license review

- 21st Creators source row: 184 (`contentbit`, `auto-index=true`); listed item: `pros-cons`.
- Source: [`agonist/contentbit`](https://github.com/agonist/contentbit), pinned commit `71b5face90bd9dd5a4ef401879dfc810ff832ad1`, file `registry/src/blocks/pros-cons.tsx`.
- Root and package license files in the captured commit are MIT. The exact source item imports `@contentbit/react`, `@contentbit/blocks`, and `lucide-react`; the registry package pins `lucide-react` at `^0.475.0`, resolved as `0.475.0` in the captured lockfile.
- `@contentbit/react`, `@contentbit/blocks`, and `@contentbit/core` package manifests declare MIT. The React adapter also has a React 19 peer dependency; the blocks package uses `@contentbit/core` and `zod`.
- The HigherBits demo wrapper and GHL preview are authored for this import and do not load packages or remote assets. They preserve the two-column Pros/Cons structure and use local text marks, so no Lucide SVG or runtime package is bundled into the GHL export.
- No network images, fonts, scripts, or other third-party assets are loaded by the standalone preview.

## Limit

This evidence is for the single `pros-cons` item. It does not establish source mappings or readiness for the other Batch 5 creators.
