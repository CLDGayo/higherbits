---
name: note:broken-rpc-call-sites
description: "3 RPCs called from 6 live call sites do not exist in the live database — genuinely broken at runtime today, surfaced only after types.ts stopped lying about their existence"
date: 30-07-26
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: phase-06
---

# 3 phantom RPCs are actually called by live application code (6 call sites, 6 files)

**TL;DR:** The Phase 06 types.ts reconciliation (`29ad825`) deleted 35 phantom function
declarations. Deleting them surfaced that **3 of those "phantom" names are not just stale
type-file fiction — they are actively invoked by production code**, and those calls cannot
succeed against the live database. This is the single most actionable finding of the whole
`supabase-interconnect` program. Not fixed in the reconciliation pass — application-code work,
out of scope for a types-file fix.

## The three broken RPCs and their 6 call sites

| RPC (does not exist live) | Call site | Kind |
|---|---|---|
| `get_active_authors_with_top_components` | `apps/web/app/actions/authors.ts:7` | type reference |
| `get_active_authors_with_top_components` | `apps/web/components/features/design-engineers/design-engineers-list.tsx:14, :34` | `.rpc()` call |
| `get_active_authors_with_top_components` | `apps/web/components/features/design-engineers/design-engineer-card.tsx:10` | type reference |
| `get_section_previews` | `apps/web/components/ui/command-menu.tsx:245` | `.rpc()` call |
| `get_section_previews` | `apps/web/components/features/categories/category-list.tsx:34` | `.rpc()` call |
| `get_collection_components_v1` | `apps/web/components/ui/items-list.tsx:477` | `.rpc()` call |

## Why this stayed hidden

`types.ts` declared all three functions as if they existed, so every one of these call sites
typechecked cleanly. The moment the phantom declarations were deleted (because they don't exist
live), tsc correctly started rejecting all 6 call sites (`TS2345` on the `.rpc()` name, cascading
to `TS2339`/`TS7006`/`TS7053` on the now-`{}`-typed result). The stale types file wasn't just
inaccurate — it was actively suppressing the type errors that would have caught this months ago.

**One of the six already has a runtime fallback**, which means at least this failure has already
been observed in production and silently absorbed: `design-engineers-list.tsx:49` catches the
failed RPC and falls back to a server action. The other 5 call sites have no such guard — they are
unguarded broken calls today.

## What needs to happen (not done here)

Pick one per RPC:
1. Author the missing `CREATE FUNCTION` and add it to `supabase/migrations/`, matching whatever
   shape the call sites actually expect, then apply it live; or
2. Rewrite the call sites to use an existing, real replacement (a server action, a different RPC,
   or a client-side query); or
3. If the feature is dead, remove the call sites and their UI entirely.

This is application-code work outside the reconciliation pass's writable surface
(`apps/web/types/supabase.ts` only). Recommend a dedicated small plan/quick-fix per RPC once
triaged — likely 3 independent small fixes given the 3 distinct RPCs touch unrelated features
(author payouts/design-engineers page, command palette section previews, collection component
listing).

## Related

- `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/types-reconciliation_REPORT_29-07-26.md`
  §tsc set-difference
- `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-06-schema-truth_REPORT_29-07-26.md`
