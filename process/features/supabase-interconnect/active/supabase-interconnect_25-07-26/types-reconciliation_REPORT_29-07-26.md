---
name: report:types-reconciliation
description: "Phase 06 hand-reconciliation of apps/web/types/supabase.ts against the live Supabase schema — 42 phantom deletions, 5 additions, 2 signature corrections; surfaced 6 live call sites invoking non-existent RPCs"
date: 2026-07-29
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: "06"
---

# Types Reconciliation — `supabase-interconnect` Phase 06

**Status: COMPLETE.** `apps/web/types/supabase.ts` now declares exactly the live inventory:
**41 tables / 5 views / 37 functions — 0 phantom, 0 missing.** Independently re-verified by live
read-only introspection after editing.

## TL;DR

- Deleted **35 phantom functions** and **7 phantom views**. Added **3 real functions**,
  **`public_profiles`** (view) and **`rate_limits`** (table). Corrected **2 stale signatures**.
- **This is a hand-reconciliation, not a CLI regeneration.** The Supabase CLI cannot run here
  (unauthenticated, and `--db-url` introspection needs Docker). Live introspection via Prisma works
  and was used as the specification and the verification.
- **The tsc fallout found real bugs:** 6 live call sites across 6 files invoke **3 RPCs that do not
  exist in the live database**. These calls are broken at runtime today. Reported, **not fixed** —
  out of scope for this pass.
- Test suite unchanged at **113/114** (sole failure the pre-existing `lib/registry.test.ts`).
- A future `pnpm --filter web types` run would **still differ** in 3 documented ways (see
  §Would a regen match?). None are correctness gaps in the declared inventory.

## Method

Read-only live introspection against project `ewktoowpuemgbaaxxbdq` ("CozyDownloads") via a scratch
Prisma client using `DIRECT_DATABASE_URL`. Project ref asserted before every query. **No live
writes of any kind. No secrets printed.**

Independently re-derived the full live inventory rather than trusting the prior summary, then
set-diffed it against the declared keys in `types.ts` (section scan bounded to `Enums: {`, so
`component_with_user` is correctly bucketed as a CompositeType, not over-counted as a function).

Live re-verification matched the inherited inventory exactly: **38 function signatures / 37 distinct
names, 5 views, 42 raw tables / 41 excluding `_prisma_migrations`.**

Edits were applied by a script that **validated every anchor line before mutating anything** and
applied edits in descending line order. Only the 21 intended regions changed; no reformatting or
reordering of unrelated code.

## What changed

Diff: **21 hunks, 699 lines removed, 75 added.** Sole writable file touched:
`apps/web/types/supabase.ts`.

### Deleted — 7 phantom views

`component_dependencies_graph_view`, `component_dependencies_graph_view_v2`,
`component_hunt_current_round`, `component_stats`, `monthly_referral_analytics`,
`mv_detailed_component_analytics`, `referral_analytics`

### Deleted — 35 phantom functions

`analyze_author_payouts`, `analyze_component_usage`, `check_api_key`, `check_api_key_v2`,
`delete_component`, `find_pg_column_dependencies`, `get_active_authors`,
`get_active_authors_with_top_components`, `get_all_author_payouts`,
`get_all_author_payouts_count`, `get_author_payout_stats`, `get_collection_components_v1`,
`get_daily_user_earnings`, `get_demos_list`, `get_hunt_demos_list`, `get_hunt_demos_list_v3`,
`get_liked_components`, `get_prompt`, `get_section_previews`, `get_top_components_for_email`,
`hunt_component_tag_slugs`, `hunt_marketing_slugs`, `hunt_ui_slugs`, `increment`,
`increment_api_requests`, `like_component_by_demo`, `process_next_round`, `process_single_round`,
`search_components_preview`, `search_demos_ai`, `search_demos_ai_oai`, `update_all_hunt_scores`,
`update_hunt_demos_metrics`, `update_single_demo_score`, `update_template_tags`

Includes all 5 originally-suspected hunt-scoring phantoms.

### Added — 3 real functions

| Function | Live signature | Emitted as |
|---|---|---|
| `components_dependencies_trigger` | `() -> trigger` | `Args: Record<PropertyKey, never>`, `Returns: unknown` |
| `demos_dependencies_trigger` | `() -> trigger` | `Args: Record<PropertyKey, never>`, `Returns: unknown` |
| `search_demos_ai_oai_extended` | `(search_query text, query_embedding vector, match_threshold double precision) -> TABLE(...)` | 10-column `Returns[]` |

`search_demos_ai_oai_extended`'s return set is `search_demos_ai_oai_v2`'s plus `created_at
timestamptz`, inserted at its live ordinal position (after `user_id`). Modelled on the neighbouring
`search_demos_ai_oai_v2` entry so formatting matches exactly.

### Added — `public_profiles` (view) and `rate_limits` (table)

Both derived from live `information_schema.columns`, columns alphabetised to match the file's
convention.

- `public_profiles` — 11 nullable text columns (`bio`, `display_image_url`, `display_name`,
  `display_username`, `github_url`, `id`, `image_url`, `name`, `twitter_url`, `username`,
  `website_url`), `Relationships: []` (view over `users`; no FK columns exposed). Emitted **with**
  `Insert`/`Update` — see §Judgment calls.
- `rate_limits` — `endpoint text NOT NULL`, `last_request timestamptz NULL default now()`,
  `request_count integer NULL default 1`, `user_id text NOT NULL`. PK `(user_id, endpoint)`, no FKs
  → `Relationships: []`. `Insert` requires `endpoint` + `user_id`; the two defaulted columns are
  optional.

### Corrected — 2 stale signatures

The prior inventory's prose claimed the 4 embedding functions had "no `types.ts` counterpart at
all." **That was wrong** — all 4 were already declared (its own diff lists were correct; only the
prose was not). Two were declared with shapes that never existed live:

| Function | Was declared | Live (corrected to) |
|---|---|---|
| `insert_code_embedding` | 6 args incl. `p_id` and **`p_code`** | `p_item_id, p_item_type, p_embedding, p_metadata` |
| `insert_embedding` | union of a 6-arg (`p_id`) overload and a 5-arg one | single 5-arg `p_item_id, p_item_type, p_embedding, p_usage_description, p_metadata` |

This closes the program's long-standing `insert_code_embedding` finding: the declared `p_code` arg
referenced a `code` column that does not exist on `code_embeddings`. That phantom arg is now gone.

`vec_dim` and `get_missing_usage_embedding_items` were already correct and were left untouched.
No `PENDING MIGRATION` marker was added — all 4 functions are live as of today, so none is pending.

### Deliberately not touched

`component_with_user` — a `CompositeTypes` entry, not a function, per instruction. For the record,
live introspection confirms **zero composite types exist in `public`**, so it is genuinely orphaned;
removing it is a separate decision.

## Live reconciliation — before vs after

| Object | Live | types.ts before | types.ts after | Match? |
|---|---|---|---|---|
| Tables | 41 | 40 (1 missing) | **41** | yes |
| Views | 5 | 11 (7 phantom, 1 missing) | **5** | yes |
| Functions | 37 | 69 (35 phantom, 3 missing) | **37** | yes |

Total gaps: **39 → 0.** Tables and Views are fully alphabetical. Functions is alphabetical except
for `check_rate_limit`/`increment_api_usage` pinned at the top — **pre-existing**, present in the
pre-edit file, not introduced here.

User's concurrent `bundle_hash` / `bundle_html_url` additions from precompiled-registry work:
**preserved, 6 occurrences each before and after.** Nothing staged, committed, stashed, or reverted.

## tsc set-difference — the real findings

Captured `corepack pnpm --filter web exec tsc --noEmit` before and after, keyed by
`(file, error-code)`.

- Raw errors: **1165 → 1182 (+17)**. Unique `(file, code)` keys: **132 → 145 (+13)**. **0 resolved.**
- All 13 new keys trace to deleted phantom symbols. **No error suppression, no `any` casts, no
  `@ts-ignore` was added.**

**3 phantom RPCs are actually called by live application code across 6 call sites.** These calls
cannot succeed against the live database:

| Deleted symbol | Call site | New errors |
|---|---|---|
| `get_active_authors_with_top_components` | `app/actions/authors.ts:7` (type ref) | TS2339; TS7006 ×2 at :101 (downstream) |
| `get_active_authors_with_top_components` | `components/features/design-engineers/design-engineers-list.tsx:14, :34` (`.rpc()`) | TS2339, TS2345, TS2339 ×2 at :41/:44, TS7053 at :44 |
| `get_active_authors_with_top_components` | `components/features/design-engineers/design-engineer-card.tsx:10` (type ref) | TS2339 |
| `get_section_previews` | `components/ui/command-menu.tsx:245` (`.rpc()`) | TS2345; TS7053 at :252 |
| `get_section_previews` | `components/features/categories/category-list.tsx:34` (`.rpc()`) | TS2345; TS2339 at :46; TS7006 at :47 |
| `get_collection_components_v1` | `components/ui/items-list.tsx:477` (`.rpc()`) | TS2345; TS2339 at :492, :500 |

Pattern: the phantom-typed RPC name is now rejected (TS2345), and its result collapses to `{}`,
producing the downstream TS2339 / TS7006 / TS7053 errors on `.find`/`.map`/`.length`/index access.

Note `design-engineers-list.tsx:49` already contains a
`"get_active_authors_with_top_components RPC failed, falling back to server action"` handler — so at
least one of these failures was already being observed at runtime and papered over with a fallback.
The other 5 sites have no such guard.

**These are latent production bugs, not type-file defects.** Per this pass's scope they were
**not fixed** and no phantom was restored to silence them. They need a dedicated backlog item.

The `command-menu.tsx` TS2786 / TS2322 / TS2344 errors visible alongside are **pre-existing**
(duplicate React types from the user's uncommitted lockfile state) and unrelated to this work.

## Test gate

`corepack pnpm --filter web test` — **113 passed / 1 failed (114 total), 23/24 files.**

Identical to the recorded baseline. The sole failure is the pre-existing `lib/registry.test.ts:48`
`invalid-slug-format` assertion, carried since Phase 01 and untouched by this pass.

## Judgment calls (2)

1. **`public_profiles` emitted with `Insert` + `Update`.** No existing view entry in the file has
   them — but live introspection shows `public_profiles` is the **only auto-updatable view**
   (`is_updatable = YES`); the other 4 are all `NO`. So the file's "views have no Insert/Update"
   pattern is uninformative, not a rule. The Supabase generator emits Insert/Update for
   auto-updatable views, so they were included. This is additive and cannot break existing code —
   nothing references these types today. If a real regen omits them, they are a harmless superset.
   Worth noting: the earlier phase deliberately restricted `public_profiles` to SELECT-only for
   `anon`/`authenticated`, so nothing *should* insert through it; types describe Postgres shape, not
   grants.
2. **Trigger functions emitted as `Returns: unknown`.** The file contains no prior trigger-returning
   function to copy (`void` maps to `Returns: undefined`, used 12× already). `unknown` is the
   generator's mapping for a `trigger` return type.

## Would a regen match?

**No — a future `corepack pnpm --filter web types` would still differ, in 3 ways.** None affects the
declared inventory, which is now exact.

1. **81 dangling `referencedRelation` entries** still point at the 7 deleted phantom views
   (`referral_analytics` ×22, `mv_detailed_component_analytics` ×21,
   `component_dependencies_graph_view` ×17, `_v2` ×17, `component_hunt_current_round` ×4). A real
   regen would omit these relationship blocks entirely. They are inert string literals in
   `Relationships` tuples and produced **zero** tsc errors, so they were left in deliberately:
   pruning them is ~81 further block deletions, well outside the authorised change list, and would
   have made the diff unreviewable. **This is the single largest remaining divergence and the
   recommended immediate follow-up.**
2. **`component_with_user` CompositeType** remains, though no composite type exists live. Left per
   instruction.
3. **Function ordering** — `check_rate_limit` and `increment_api_usage` sit out of alphabetical
   order at the top of `Functions`. Pre-existing hand-edit; a regen would sort them in.

Also worth carrying forward: the generator is now correctly pointed at
`ewktoowpuemgbaaxxbdq` (fixed earlier in Phase 06), so a regen — once
`SUPABASE_ACCESS_TOKEN` or `supabase login` is provisioned — will produce truth rather than the old
wrong-project fiction. Regeneration remains blocked in this environment for the reasons above.

## Follow-ups for backlog (not done here)

1. **3 broken RPC call sites (6 files)** — `get_active_authors_with_top_components`,
   `get_section_previews`, `get_collection_components_v1` are called but do not exist live. Either
   create the functions or rewrite the call sites. **Highest-value finding of this pass.**
2. **Prune the 81 dangling `referencedRelation` refs** to deleted views.
3. **Decide `component_with_user`'s fate** — orphaned CompositeType, no live counterpart.
4. Untracked live drift for `check_rate_limit` / `increment_api_usage` (real and working, but no
   `CREATE FUNCTION` DDL anywhere in `supabase/`) — carried from the inventory, still open.

## Constraints honoured

- Writable surface: `apps/web/types/supabase.ts` + this report + scratchpad scripts only.
- Zero live database writes; all introspection read-only, project ref asserted per connection.
- No secrets printed.
- User's concurrent `bundle_hash`/`bundle_html_url` additions preserved.
- Nothing staged, committed, stashed, or `git checkout --`'d. No commit made.

**Status:** DONE_WITH_CONCERNS
**Summary:** `apps/web/types/supabase.ts` hand-reconciled to the live schema — 41 tables / 5 views / 37 functions, 0 phantom / 0 missing, independently re-verified live after editing; 42 phantom blocks deleted, 5 entries added, 2 stale signatures corrected.
**Concerns:** The reconciliation surfaced 3 phantom RPCs called from 6 live call sites — genuine runtime-broken code, reported for backlog and deliberately not fixed. 81 dangling `referencedRelation` refs to deleted views remain, so a true CLI regen would still differ.
