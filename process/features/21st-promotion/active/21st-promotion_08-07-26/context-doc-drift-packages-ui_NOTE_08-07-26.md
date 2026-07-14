---
name: note:context-doc-drift-packages-ui
description: "process/context/all-context.md claims root packages/ui = 5 curated components only; it now also contains shadcn/mantine primitives + a cozy/ 21st.dev-replica dir"
date: 08-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: 21st-promotion
  phase: phase-00
---

# Backlog Note — Context Doc Drift: `packages/ui` Contents

**Filed during:** 21st-promotion Phase 0 (Pre-migration Audit & Scaffold), VALIDATE dimension findings.
**Priority:** Medium — relevant scoping input for Phase 2 (Frontend & UI Migration), not urgent standalone.

## Problem

`process/context/all-context.md` states that root `packages/ui/src/` contains ONLY the 5 curated Cozy baseline components (`soft-button`, `pill-button`, `lofi-card`, `polaroid-card`, `calm-stack`) across 3 categories (`cozy-buttons`, `lofi-cards`, `minimalist-layouts`), per the Phase 2 (monetization-catalog program) purge documented there.

Phase 0's execute-agent observed (safety-checkpoint scan, git-tracked file count) that root `packages/ui/src/` currently ALSO contains: `buttons/`, `cards/`, `dialogs/`, `heroes/`, `inputs/`, `navbars/`, `pricing/`, `tables/`, `tabs/`, and a `cozy/` directory ("21st.dev Replica Primitives") — 38 git-tracked files total, well beyond the 5-component claim.

## Root cause

Between the `all-context.md` last-updated timestamp (2026-07-06, cozy-21st-mirror Phase 3) and now (2026-07-08), other in-flight programs (`cozy_promotion`, `cozy-21st-mirror` later phases, or `port-ingested-components`) appear to have added shadcn/mantine primitives and a 21st.dev-replica primitives directory into `packages/ui` without a corresponding `all-context.md` refresh.

## Fix options

1. **Immediate context refresh** — run `vc-generate-context` (delta mode) scoped to `packages/ui` to re-scan and update the "Established surfaces" section of `all-context.md` with the accurate current component inventory.
2. **Defer to Phase 2 of this program** — 21st-promotion Phase 2 (Frontend & UI Migration) will directly interact with `packages/ui` contents; let that phase's own RESEARCH step do a fresh, accurate inventory as part of its scoping work, and have that phase's UPDATE PROCESS refresh `all-context.md`.

**Recommendation:** Option 2 — defer to Phase 2's RESEARCH, since Phase 2 needs an accurate inventory anyway and a standalone refresh now risks going stale again before Phase 2 starts.

## Verification of fix

- `process/context/all-context.md` "Established surfaces" / `packages/ui` section accurately lists all current top-level directories under `packages/ui/src/`.
- No other program folder's context claims contradict this after the refresh.
