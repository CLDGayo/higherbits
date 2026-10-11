# Codehagen (Prism UI) Dependency & License Review

## Repository & Upstream Identification

- **Creator**: Codehagen (`Prism UI`)
- **21st Profile**: https://21st.dev/@Codehagen
- **Official Website**: https://www.prismui.tech/
- **Upstream Repository**: https://github.com/Codehagen/Prismui
- **Pinned Immutable Commit**: `40854d9e9bfed7822a730fc5e0932f257725cbd6`
- **Verification Timestamp**: 2026-10-11T02:37:00Z

## Applicable License Audit

### Root Repository License

The repository contains a single root license file at `LICENSE.md`:
- **SPDX Identifier**: `AGPL-3.0` (GNU Affero General Public License Version 3, 19 November 2007)
- **File Length**: 34,273 bytes
- **SHA-256**: `db52e3daad9260a1cc638efaf3f6b7a6bdead236365586a60078a9a287613037`
- **Scope**: Entire repository (`Codehagen/Prismui`).

### Per-Component License Verification

An exhaustive review of all 16 items was conducted across the source tree at commit `40854d9e9bfed7822a730fc5e0932f257725cbd6`:
1. `registry/default/ui/action-button.tsx` (1,546 bytes): No per-file license grant. Governed by root AGPL-3.0.
2. `registry/default/ui/button-group.tsx` (1,446 bytes): No per-file license grant. Governed by root AGPL-3.0.
3. `src/registry/example/button-group-demo.tsx` (4,660 bytes): No per-file license grant. Governed by root AGPL-3.0.
4. `registry/default/ui/display-cards.tsx` (3,475 bytes): No per-file license grant. Governed by root AGPL-3.0.
5. `registry/default/ui/expandable-card.tsx` (7,654 bytes): No per-file license grant. Governed by root AGPL-3.0.
6. `registry/default/ui/floating-action-panel.tsx` (8,667 bytes): No per-file license grant. Governed by root AGPL-3.0.
7. `registry/default/ui/hero.tsx` (4,362 bytes): No per-file license grant. Governed by root AGPL-3.0.
8. `registry/default/ui/hero-badge.tsx` (2,267 bytes): No per-file license grant. Governed by root AGPL-3.0.
9. `src/components/icons.tsx` (13,921 bytes): No per-file license grant. Governed by root AGPL-3.0.
10. `registry/default/ui/logo-carousel.tsx` (3,804 bytes): No per-file license grant. Governed by root AGPL-3.0.
11. `registry/default/ui/open-source.tsx` (10,934 bytes): No per-file license grant. Governed by root AGPL-3.0.
12. `registry/default/ui/popover.tsx` (9,660 bytes): No per-file license grant. Governed by root AGPL-3.0.
13. `src/registry/example/button-group-basic.tsx` (1,258 bytes): No per-file license grant. Governed by root AGPL-3.0.
14. `src/components/prismui/pricing.tsx` (4,736 bytes): No per-file license grant. Governed by root AGPL-3.0.
15. `registry/default/ui/timeline.tsx` (9,057 bytes): No per-file license grant. Governed by root AGPL-3.0.
16. `src/hooks/use-expandable.ts` (465 bytes): No per-file license grant. Governed by root AGPL-3.0.

`package.json` specifies `"private": true` without an overriding permissive `"license"` field. No alternative license or dual-licensing grant exists.

### Safeguard Evaluation

Under HigherBits Ingestion SOP §1 and repository governance policies:
- Items must satisfy permissive licensing (MIT, Apache-2.0, BSD-3-Clause, or equivalent permissive terms).
- GNU Affero General Public License Version 3 (AGPL-3.0) is a strong copyleft license with network interaction triggers (Section 13).
- Per user instructions: "verify exact applicable item license; if AGPL applies, mark the affected items held with exact evidence, do not relabel it MIT."
- AGPL-3.0 applies strictly to all items.

## Verdict

- **Total Items**: 16
- **Ready for Ingestion**: 0
- **Held Items**: 16
- **Held Reason**: `license_incompatible_copyleft`
- **Disposition**: All 16 items remain strictly held with exact evidence preserved. They must never be published or relabeled MIT.
