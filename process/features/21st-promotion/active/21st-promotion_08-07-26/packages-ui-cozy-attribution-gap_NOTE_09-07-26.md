---
name: note:packages-ui-cozy-attribution-gap
description: "packages/ui/src/cozy/* (4 files, '21st.dev Replica Primitives') lack Author/Source_Repo/License_SPDX attribution required by this repo's registry schema"
date: 09-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: 21st-promotion
  phase: phase-02
---

# Backlog Note — `packages/ui/src/cozy/*` Attribution Gap

**Filed during:** 21st-promotion Phase 2 (Frontend & UI Migration), Implementation Checklist item A4 (governance note, add-only, no file action).
**Priority:** Medium — governance/compliance gap in a protected curated package, not a functional defect.

## Problem

`packages/ui/src/cozy/*` (4 files: `button.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `input.tsx`) is labeled "21st.dev Replica Primitives" but carries no attribution metadata. This repo's identity is a strict MIT-attribution component aggregator — the registry frontmatter schema documented in `process/context/all-context.md` requires `Author`, `Source_Repo`, and `License_SPDX` fields for every curated component (see the "Registry YAML frontmatter schema" section). These 4 files, despite their name implying they are derived from 21st.dev, carry none of those fields and were not ingested through `ops/github-ingest.mjs` (the tool that normally enforces this metadata at ingest time).

This gap was first observed during 21st-promotion Phase 0's audit (see `context-doc-drift-packages-ui_NOTE_08-07-26.md`, which documented the broader discovery that `packages/ui/src/` now contains more than the original 5-component curated baseline). Phase 2's own A2 reconciliation pass (cross-referencing `21st-dev/apps/web/components/ui/` against `packages/ui/src/cozy/*`) directly touched these 4 files as read-only reference material and re-confirmed the attribution gap still exists.

## Root cause

The `cozy/` directory was added to `packages/ui/src/` by a prior in-flight program (likely `cozy_promotion` or `cozy-21st-mirror`, per the same investigation that produced the Phase 0 context-drift note) as a direct hand-authored or hand-ported replica of 21st.dev-style primitives, outside the normal `ops/github-ingest.mjs` ingestion path that enforces attribution metadata. Because these files sit in the *curated* `packages/ui` package (not the Qdrant-backed registry that ingested components flow through), they were never subject to `scripts/validate-registry.mjs`'s attribution checks either — that validator only checks `docs/evidence-manifest/registry/*.md` frontmatter, not `packages/ui` source files directly.

## Fix options

1. **Retroactive attribution** — if these 4 files were genuinely derived from 21st.dev source (as their directory name and "Replica Primitives" label suggest), add attribution comments or a co-located `ATTRIBUTION.md` documenting `Author`, `Source_Repo` (presumably `https://github.com/serafimcloud/21st` or similar), and `License_SPDX: MIT`, consistent with the registry schema even though this package sits outside the registry ingestion pipeline.
2. **Confirm original authorship** — if these files were actually originally authored by the Cozy Downloads team (i.e. "21st.dev Replica" describes visual/behavioral inspiration only, not code copying), document that explicitly and drop the "Replica Primitives" naming, which currently implies external sourcing that may not be accurate.
3. **No action within this program** — modifying `packages/ui` requires explicit user approval per the 21st-promotion program's hard safety constraint ("Never delete or mutate the original curated 5 Cozy components in packages/ui without explicit user approval"). While these 4 `cozy/*` files are not among the original 5 curated components, they now live in the same protected package, so this program treats any `packages/ui` write as out of scope regardless.

**Recommendation:** A future, separate task (not part of 21st-promotion) should investigate provenance first (fix option 2), then apply fix option 1 if external sourcing is confirmed. This note exists purely to carry the flag forward — no file was modified in `packages/ui` during 21st-promotion Phase 2, and `git status packages/ui --short` was confirmed empty at both EXECUTE and independent EVL re-run.

## Verification of fix

- `packages/ui/src/cozy/*` files either carry attribution metadata consistent with the registry schema, or an explicit statement confirming original authorship exists.
- `packages/ui/src/cozy/README` naming/description accurately reflects whether the primitives are derived or original.
