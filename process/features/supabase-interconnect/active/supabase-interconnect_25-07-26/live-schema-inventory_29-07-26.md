---
name: report:live-schema-inventory
description: "Live read-only introspection of the Supabase public schema — verified counts, phantom/live diff against apps/web/types/supabase.ts, and the check_rate_limit/increment_api_usage open question resolved"
date: 2026-07-29
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: "06"
---

# Live Schema Inventory — `supabase-interconnect` Phase 6

**Connection:** live read-only query against `ewktoowpuemgbaaxxbdq` ("CozyDownloads") via a scratch
Prisma client (`apps/web/prisma/client`) using `DIRECT_DATABASE_URL` from `apps/web/.env`. No writes,
no secrets printed. Project ref asserted before every query.

## TL;DR

- **The inherited "33 fns / 4 views / 41 tables" baseline is CORRECT — for its point in time.** All
  three numbers reconcile exactly once you account for two live applies made earlier today
  (Phase 06 E2/E2b's `public_profiles` view + the 4 embedding functions from Phase 2): baseline
  33 + 4 new embedding fns = **37 functions now**; baseline 4 + 1 new view = **5 views now**;
  tables unchanged at **41** (42 raw `pg_class` rows, minus `_prisma_migrations` which is Prisma's
  own internal bookkeeping table, not an app table).
- **`check_rate_limit` and `increment_api_usage` DO exist live** — this was a genuinely open
  question carried across two phases; now settled. They are called from `apps/web/middleware.ts`
  and three API routes, but have **zero definition anywhere in tracked `supabase/*.sql`** — this is
  untracked live drift, not a missing/broken function. Rate limiting is not silently failing;
  its source-of-truth SQL is just absent from version control.
- **`apps/web/types/supabase.ts` diff: 2 table gaps, 8 view gaps (7 phantom + 1 missing), 39
  function gaps (35 phantom + 3 missing + 1 miscategorized CompositeType)** — full lists below.
  types.ts's function section is 69 entries, not ~70 — one entry (`component_with_user`) is a
  **CompositeType**, not a function; a naive key-scan over-counts it as a phantom function.
- The 4 embedding functions applied live today are confirmed present with the intended signatures.
  **One deviation found:** `insert_code_embedding`'s live 4-arg signature
  (`p_item_id, p_item_type, p_embedding, p_metadata`) has no `types.ts` counterpart at all (it's
  in the "missing from types" list, not "mismatch") — the previously-flagged "6-arg shape
  referencing a non-existent `code` column" claim refers to a *different*, still-phantom
  `search_demos_ai_oai_extended`-adjacent signature that was never live; nothing to reconcile
  there since types.ts has no `insert_code_embedding` entry to compare against.

## Verified Counts

| Object type | Live (raw) | Live (reconciled) | Expected baseline | Match? |
|---|---|---|---|---|
| Functions | 38 rows / 37 distinct names* | 37 | 33 (+4 embedding fns applied today) | ✅ exact |
| Views | 5 | 5 | 4 (+1 `public_profiles` applied today) | ✅ exact |
| Tables | 42 | 41 (excl. `_prisma_migrations`) | 41 | ✅ exact |

\* `record_mcp_component_usage` has 2 overloaded signatures live, counted once as a distinct name.

- **`_prisma_migrations` present live:** YES (Prisma's own migration-history table; not an app table,
  excluded from the "41" reconciliation above; also absent from `types.ts` by design — Supabase's
  type generator does not surface it).
- **`rate_limits` present live:** YES (a genuine app table, present in both live and `types.ts`).

## Full Sorted Lists

### Functions (public schema, live) — 37 distinct names, 38 signatures

```
check_rate_limit(p_user_id text, p_endpoint text, p_limit integer, p_window_seconds integer) -> boolean
components_dependencies_trigger() -> trigger
create_api_key(user_id text, plan api_plan, requests_limit integer) -> api_keys
demos_dependencies_trigger() -> trigger
get_admin_liked_demos_v1(p_user_id text, p_limit integer) -> TABLE(...)
get_collections_v1(p_offset integer, p_limit integer, p_include_private boolean) -> TABLE(...)
get_daily_user_earnings_v2(p_user_id text) -> TABLE(...)
get_demos_list_v2(p_sort_by text, p_offset integer, p_limit integer, p_tag_slug text, p_include_private boolean) -> TABLE(...)
get_demos_submissions(p_sort_by text, p_offset integer, p_limit integer, p_tag_slug text, p_include_private boolean) -> TABLE(...)
get_hunt_demos_list_v2(p_round_id integer) -> TABLE(...)
get_missing_usage_embedding_items() -> TABLE(item_id bigint, item_type text)
get_pro_publishers() -> TABLE(...)
get_template_tags() -> TABLE(tag_id integer, tag_name text, tag_slug text, templates_count bigint)
get_templates_v3(p_offset integer, p_limit integer, p_include_private boolean, p_tag_slug text) -> TABLE(...)
get_user_bookmarks_list(p_user_id text, p_include_private boolean) -> TABLE(...)
get_user_components_counts(p_user_id text) -> jsonb
get_user_profile_demo_list(p_user_id text, p_include_private boolean) -> TABLE(...)
get_user_profile_demo_list_v2(p_user_id text) -> TABLE(...)
get_user_state(user_id_param text) -> jsonb
hunt_toggle_demo_vote(p_round_id integer, p_demo_id integer) -> boolean
increment_api_usage(p_user_id text, p_limit integer) -> jsonb
insert_code_embedding(p_item_id bigint, p_item_type text, p_embedding vector, p_metadata jsonb) -> void
insert_embedding(p_item_id bigint, p_item_type text, p_embedding vector, p_usage_description text, p_metadata jsonb) -> void
is_trigger_operation() -> boolean
match_embeddings(query_embedding vector, match_threshold double precision, match_count integer, filter text, table_name text) -> TABLE(...)
match_embeddings_with_details(query_embedding vector, match_threshold double precision, match_count integer) -> TABLE(...)
purchase_component(p_user_id text, p_component_id integer) -> jsonb
record_mcp_component_usage(p_user_id text, p_api_key text, p_search_query text, p_component_ids integer[], p_author_ids text[]) -> jsonb   [overload 1]
record_mcp_component_usage(p_user_id text, p_api_key text, p_search_query text, p_component_ids integer[], p_component_names text[], p_author_ids text[]) -> jsonb   [overload 2]
requesting_user_id() -> text
search_demos_ai_oai_extended(search_query text, query_embedding vector, match_threshold double precision) -> TABLE(...)
search_demos_ai_oai_v2(search_query text, query_embedding vector, match_threshold double precision) -> TABLE(...)
update_component_dependencies_closure(p_component_id bigint, p_demo_slug text) -> void
update_component_with_tags(p_component_id integer, p_name text, p_description text, p_license text, p_preview_url text, p_website_url text, p_tags jsonb) -> void
update_demo_info_as_admin(p_component_id integer, p_demo_name text, p_demo_slug text) -> json
update_demo_tags(p_demo_id integer, p_tags jsonb) -> void
update_submission_as_admin(p_component_id integer, p_status text, p_feedback text) -> json
vec_dim(v vector) -> integer
```

### Views (public schema, live) — 5

```
mv_component_analytics            [materialized view]
component_dependencies_graph_view_v3   [view]
components_with_username          [view]
demo_hunt_leaderboard              [view]
public_profiles                    [view]   -- created live earlier today (Phase 06 E2/E2b)
```

### Tables (public schema, live, base tables only) — 42 raw / 41 reconciled

```
_prisma_migrations        <- Prisma internal, excluded from the "41" app-table count
api_keys
author_payouts
backup_code_embeddings
backup_usage_embeddings
bundle_items
bundle_plans
bundle_purchases
bundles
code_embeddings
collections
component_analytics
component_dependencies_closure
component_hunt_rounds
component_likes
component_tags
components
components_purchases
components_to_collections
demo_bookmarks
demo_hunt_scores
demo_hunt_votes
demo_hunt_winners
demo_tags
demos
feedback
mcp_component_usage
mcp_generation_requests
payout_rates
plans
prompt_rules
rate_limits
referral_payments
sandboxes
submissions
tags
templates
templates_tags
usage_embeddings
usages
users
users_to_plans
```

## Diff Against `apps/web/types/supabase.ts`

Extraction method: parsed the leading `Tables: { ... }`, `Views: { ... }`, and `Functions: { ... }`
object literals in `apps/web/types/supabase.ts` (lines 11, 2417, 3040) and pulled each top-level key
name, then set-diffed against the live introspection above.

### Tables — 40 declared in types.ts vs 42 live (41 reconciled)

- **Phantom (declared, absent live):** none. 0/40 mismatch.
- **Present live, missing from types.ts:** `rate_limits` (real gap — an actual app table with no
  generated types), `_prisma_migrations` (expected omission — Prisma's own bookkeeping table,
  Supabase's type generator does not surface internal migration-history tables).

**Verdict: tables are otherwise in perfect sync.** The only real gap is `rate_limits` — a live,
actively-used table with no TypeScript types. Confirm this is worth flagging as its own follow-up
(any code reading/writing `rate_limits` via the typed client is currently untyped / `any`-shaped).

### Views — 11 declared in types.ts vs 5 live

- **Phantom (declared, absent live) — 7, exactly matching the suspected list in the probe request:**
  - `component_dependencies_graph_view` (superseded by `_v3`, which IS live)
  - `component_dependencies_graph_view_v2` (superseded by `_v3`)
  - `component_hunt_current_round`
  - `component_stats`
  - `monthly_referral_analytics`
  - `mv_detailed_component_analytics`
  - `referral_analytics`
- **Present live, missing from types.ts — 1:** `public_profiles` (created live earlier today by this
  same phase program — not yet regenerated into types.ts, exactly as expected since regen is
  blocked; this is the expected/tracked gap, not new drift).

### Functions — 69 declared in types.ts (not ~70 — see correction below) vs 37 distinct live names

**Correction to the probe's assumed count:** a naive top-level key scan of the `Functions: { ... }`
block returns 70 entries, but the 70th, `component_with_user`, is not actually inside `Functions` —
it is the sole entry of the adjacent `CompositeTypes: { ... }` block (line 3875), which a
brace-matching scan without section-end bounds walks straight into. The real function count in
types.ts is **69**. This matters for anyone re-running a similar diff: bound the scan to end at
`Enums: {` (line 3861), not end-of-file.

- **Phantom (declared, absent live) — 35:**
  - `analyze_author_payouts`, `analyze_component_usage`, `check_api_key`, `check_api_key_v2`,
    `delete_component`, `find_pg_column_dependencies`, `get_active_authors`,
    `get_active_authors_with_top_components`, `get_all_author_payouts`,
    `get_all_author_payouts_count`, `get_author_payout_stats`, `get_collection_components_v1`,
    `get_daily_user_earnings` (non-v2), `get_demos_list` (non-v2), `get_hunt_demos_list`
    (non-v2/v3), `get_hunt_demos_list_v3`, `get_liked_components`, `get_prompt`,
    `get_section_previews`, `get_top_components_for_email`, `hunt_component_tag_slugs`,
    `hunt_marketing_slugs`, `hunt_ui_slugs`, `increment`, `increment_api_requests`,
    `like_component_by_demo`, `process_next_round`, `process_single_round`,
    `search_components_preview`, `search_demos_ai`, `search_demos_ai_oai`,
    `update_all_hunt_scores`, `update_hunt_demos_metrics`, `update_single_demo_score`,
    `update_template_tags`
  - This **confirms the 5 originally-suspected hunt-scoring phantoms** (`update_all_hunt_scores`,
    `process_next_round`, `process_single_round`, `update_single_demo_score`,
    `update_hunt_demos_metrics`) — all 5 are genuinely absent live, exactly as suspected.
- **Present live, missing from types.ts — 3:**
  - `components_dependencies_trigger` (trigger function backing `components` table)
  - `demos_dependencies_trigger` (trigger function backing `demos` table)
  - `search_demos_ai_oai_extended` (a real, live, undeclared search variant alongside the declared
    `search_demos_ai_oai_v2`)
- **Also phantom, but a CompositeType not a function:** `component_with_user` (see correction above)
  — its shape (id, component_names, description, code, demo_code, created_at, updated_at, user_id,
  dependencies, is_public, downloads_count, likes_count, component_slug, name, ...) looks like the
  return shape of one of the now-phantom `search_demos_ai*`/`get_demos_list` functions above; it is
  orphaned regardless of which function it originally belonged to.

### The 4 embedding functions — confirmed REAL, signatures match intent

All 4 functions applied live earlier today by this program are present with their intended shape:

```
vec_dim(v vector) -> integer
get_missing_usage_embedding_items() -> TABLE(item_id bigint, item_type text)
insert_embedding(p_item_id bigint, p_item_type text, p_embedding vector, p_usage_description text, p_metadata jsonb) -> void
insert_code_embedding(p_item_id bigint, p_item_type text, p_embedding vector, p_metadata jsonb) -> void
```

None of these 4 have a `types.ts` counterpart at all — they fall under "present live, missing from
types.ts" above (not a signature *mismatch*, since there is nothing declared to mismatch against).
`code_embeddings` table columns confirmed live: `id (uuid)`, `item_id (integer)`, `item_type (text)`,
`embedding (USER-DEFINED/vector)`, `metadata (jsonb)`, `created_at (timestamptz)` — **no `code`
column exists**, consistent with the program's prior finding that a since-abandoned 6-arg
`insert_code_embedding` shape referencing a `code` column was never the live design.

## Open Question — Settled

**Do `check_rate_limit` and `increment_api_usage` exist live? YES, both confirmed live:**

```
check_rate_limit(p_user_id text, p_endpoint text, p_limit integer, p_window_seconds integer) -> boolean
increment_api_usage(p_user_id text, p_limit integer) -> jsonb
```

Both signatures match their `types.ts` declarations exactly (types.ts is correct for these two).

**Call sites (live, in `apps/web/`):** `middleware.ts`, `app/api/magic/use/route.ts`,
`app/api/lemonsqueezy/create-checkout/route.ts`, `app/api/sandbox/new/route.ts`.

**Tracked SQL definition:** NONE. `grep -rl "check_rate_limit\|increment_api_usage" supabase/`
returns zero files. Both functions exist and work live, but their `CREATE FUNCTION` DDL is not
captured anywhere in this repo's `supabase/*.sql` or `supabase/migrations/`.

**Conclusion:** rate limiting is **not silently failing** — the functions are real and callable.
The actual finding is **untracked live drift**: someone created these directly against the database
outside of this repo's migration history. This is a genuine gap (no way to reproduce/rebuild this
schema from tracked SQL alone) but a different gap than "broken rate limiting," which the program
had left ambiguous across two prior phases.

## Unresolved Questions

- Should `rate_limits` (real, live, untyped) get a dedicated types.ts entry noted as a follow-up
  once regeneration unblocks, or is it acceptable to leave until the full regen?
- Should the untracked `check_rate_limit`/`increment_api_usage` DDL be reverse-engineered into a
  migration file now (to close the "can't rebuild from tracked SQL" gap), or deferred to whenever
  `SUPABASE_ACCESS_TOKEN` is provisioned and a full `pg_dump`-based baseline can be taken instead?
- `backup_code_embeddings` / `backup_usage_embeddings` tables exist live and in types.ts (not
  flagged as a gap since both sides agree), but their origin/purpose was not investigated in this
  probe — worth a note if anyone questions why backup tables are live application tables.

**Status:** DONE
**Summary:** Live counts verified (37 functions / 5 views / 41 tables, reconciling exactly with the inherited 33/4/41 baseline plus today's 2 applies); full phantom/missing diff produced against `apps/web/types/supabase.ts` (2 table gaps, 8 view gaps, 39 function-section gaps including 1 miscategorized CompositeType); `check_rate_limit`/`increment_api_usage` confirmed to exist live but as untracked drift with no SQL definition in the repo.
**Concerns/Blockers:** None blocking — all read-only. Two follow-up questions listed above (untyped `rate_limits`, and whether to reverse-engineer DDL for the 2 untracked rate-limit functions) are left for the orchestrator/user to prioritize.
