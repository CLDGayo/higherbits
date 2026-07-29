---
name: note:types-regen-residual-divergence
description: "Even after the 29-07-26 hand-reconciliation, a true CLI regeneration of types.ts would still differ in 3 known, harmless ways — dangling referencedRelation labels, an orphaned CompositeType, and out-of-order function entries"
date: 30-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-06
---

# `types.ts` regen would still diverge in 3 known ways (none are correctness gaps)

**TL;DR:** The 29-07-26 hand-reconciliation (`29ad825`) made `apps/web/types/supabase.ts`'s
declared inventory exactly match the live database (41 tables / 5 views / 37 functions, 0
phantom, 0 missing). It did **not** make the file byte-identical to what a real
`supabase gen types` run would produce. Three known divergences remain — tracked here so nobody
re-discovers them from scratch, and so a future real regeneration isn't treated as unexpectedly
"broken" when it changes these three things.

## 1. 81 dangling `referencedRelation` string literals (largest remaining item)

7 phantom views were deleted from the file, but 81 `Relationships` tuple entries elsewhere in the
file still list those view names as `referencedRelation` string literals:

- `referral_analytics` — 22 occurrences
- `mv_detailed_component_analytics` — 21 occurrences
- `component_dependencies_graph_view` — 17 occurrences
- `component_dependencies_graph_view_v2` — 17 occurrences
- `component_hunt_current_round` — 4 occurrences

These are inert string literals inside relationship-metadata tuples — they produce **zero** tsc
errors and have no runtime effect (nothing resolves a `referencedRelation` string against an
actual schema at compile time). They were left in deliberately during the hand-reconciliation
pass: pruning all 81 would have meant deleting ~81 further blocks scattered across the file,
well outside the pass's authorized change list, and would have made the diff unreviewable.

**Recommended follow-up:** a dedicated small pass (or the next real CLI regeneration) that
removes these 81 dangling entries. Low urgency — cosmetic/dead-weight only.

## 2. Orphaned `component_with_user` CompositeType

The file's `CompositeTypes` section still declares `component_with_user`, but live introspection
confirms **zero composite types exist in the `public` schema** today. Left untouched per explicit
instruction during the reconciliation pass. Its fate (delete vs. leave as documentation of a
future intended shape) is an open decision, not a bug.

## 3. `check_rate_limit` / `increment_api_usage` out of alphabetical order

These two function entries sit pinned at the top of the `Functions` section instead of in their
alphabetical position. This predates the reconciliation pass (present in the pre-edit file) — not
introduced by it. A real regeneration would sort them into place. See the separate
`untracked-rate-limit-rpcs_NOTE_29-07-26.md` for the more important open question about these two
functions (they have no tracked `CREATE FUNCTION` SQL anywhere in the repo, despite being called
live on the middleware hot path).

## Why this matters

If/when someone regenerates `types.ts` via an authenticated Supabase CLI (see
`types-regen-blocked-on-cli-auth_NOTE_29-07-26.md` — now largely superseded since the
hand-reconciliation already closed the accuracy gap, but the CLI path remains the way to get a
byte-true file), expect the diff to touch these 3 areas even though the file is already
functionally correct. Don't mistake that diff for a regression.

## Related

- `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/types-reconciliation_REPORT_29-07-26.md`
  §Would a regen match?
- `process/features/supabase-interconnect/backlog/untracked-rate-limit-rpcs_NOTE_29-07-26.md`
