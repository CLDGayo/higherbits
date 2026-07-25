---
name: plan:hunt-scoring-engine-note
description: "Backlog note — hunt/contest scoring engine descoped from supabase-interconnect; future program starting point"
date: 25-07-26
feature: supabase-interconnect
---

# Hunt/Contest Scoring Engine — Backlog Note

**Descoped from:** `supabase-interconnect` program (session-locked 25-07-26; see umbrella plan
`## Out-of-Scope Corrections`). SPEC's AC8 (leaderboard renders rankings) is not satisfied by this
program.

## Why descoped

SPEC AC5 originally named 9 functions as missing and required. Fork B investigation (INNOVATE,
25-07-26) proved the upstream `manfromexistence/ui` repo — the presumed source for these
functions — contains only 2 migration files:

- `20240104_add_get_filtered_components.sql`
- `20241025104254_remote_schema.sql`

Neither file contains any of the 5 hunt-scoring functions. A web search found no other public
source. Porting is therefore impossible; the only remaining path is authoring the functions from
scratch, which requires inventing ranking math and a round lifecycle for a feature that has never
had a single round, vote, or score recorded. The user classified this as new product work, not a
repair, and dropped it from scope this session.

## The 5 functions never authored by this program

- `update_all_hunt_scores`
- `process_next_round`
- `process_single_round`
- `update_single_demo_score`
- `update_hunt_demos_metrics`

These remain absent from the live database. `supabase-interconnect` Phase 6 deletes their phantom
entries from `apps/web/types/supabase.ts` (they don't exist live) rather than implementing them.

## Current state (as of live-DB audit, 25-07-26)

Zero rows in all of: `component_hunt_rounds`, `demo_hunt_votes`, `demo_hunt_scores`,
`demo_hunt_winners`. No contest round has ever been created.

## What already exists and is wired (starting point for a future program)

- Live pages: `/contest`, `/contest/leaderboard`, `/admin/leaderboard` (all render, but show empty
  state against zero-row tables).
- Live RPCs: `hunt_toggle_demo_vote`, `get_hunt_demos_list_v2` (both confirmed live and callable).
- `component_hunt_rounds` is already a granted, RLS-covered table (one of the 14-relation baseline).

A future program reviving contest/hunt scoring starts from a **wired UI needing only the scoring
engine** — round-creation UX/admin tooling, the 5 scoring functions, and a scheduler hook (which
this program's Phase 3 scheduler infrastructure could likely be extended to call once the
functions exist).
