# Dependency & notice review — lina.sameer (`scroll-area-1`)

## Upstream license
- Repository: https://github.com/SameerJS6/lina
- License file: `LICENSE` at repo root — MIT, "Copyright (c) 2025 Sameer Singh".
- Pinned revision: `6c1934820003c6289dd603ea9bceb0de066c8489` (confirmed live HEAD of `main` at
  review time; not archived, not a fork).
- GitHub API repo-tree enumeration (108 entries, recursive) found exactly one license-like file
  (root `LICENSE`) and one `README.md`; no per-file SPDX headers or nested notices exist anywhere
  under `registry/radix-ui/` or `hooks/` — the root MIT license governs the whole repository,
  including both pinned paths.
- The repo's own `README.md` independently states `## License` → `MIT`, and its `## Credits`
  section attributes the underlying primitives to Radix UI and Base UI (dependency usage of
  already-MIT-licensed libraries, not copied code) — consistent with the LICENSE file.

## Per-item review
- **scroll-area.tsx** (`registry/radix-ui/scroll-area.tsx`) — imports `react`,
  `@radix-ui/react-scroll-area`, `@/lib/utils` (alias), and `@/hooks/use-has-primary-touch`
  (sibling pinned file). No remote URLs, embedded images, or fonts anywhere in the file (confirmed
  by manual read-through).
  - `@radix-ui/react-scroll-area` is NOT a net-new dependency: already installed in this repo's
    `apps/web/package.json` at `^1.2.9`, and already used elsewhere in the host app
    (`apps/web/components/ui/scroll-area.tsx`, an unrelated internal UI primitive — this capture
    does not read or modify that file). lina.sameer's own `package.json` pins the same package at
    `^1.2.9` — exact upstream minimum; the lockfile resolves a satisfying Radix version.
  - `@/lib/utils` is aliased to the host app's own pre-existing `apps/web/lib/utils.ts` rather than
    pinning a duplicate upstream copy. Confirmed byte-for-byte identical implementation (both are
    exactly `twMerge(clsx(inputs))` via `clsx`/`tailwind-merge`) by fetching lina.sameer's
    `lib/utils.ts` at the pinned revision and comparing source. This is HigherBits' own file, not
    substituted lina.sameer code — same approach already used for Edil-ozi's `accordion.tsx`.
- **use-has-primary-touch.tsx** (`hooks/use-has-primary-touch.tsx`) — zero imports beyond `react`.
  No alias imports, no npm dependencies, no remote URLs.

## Net-new npm dependencies introduced by this capture
None. See `dependency-license-evidence.json` (`packages: {}`) — `@radix-ui/react-scroll-area` is
already installed and already in use elsewhere in this repo.

## Items held out of this capture
None — row 429 lists exactly one component slug (`scroll-area-1`, `component_count: "1.0"`), and
it is staged in full.
