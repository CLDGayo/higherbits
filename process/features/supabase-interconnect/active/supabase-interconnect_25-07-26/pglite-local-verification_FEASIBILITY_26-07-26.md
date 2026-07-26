---
slug: pglite-local-verification
date: 2026-07-26
verdict: VIABLE
originating-phase: innovate
---

# Feasibility Probe: pglite as local Postgres for Phase 2 embedding-function verification

## Hypothesis

`@electric-sql/pglite` (with the `vector` extension) can serve as a real local Postgres for
empirically verifying Phase 2's embedding-function migration DDL — specifically the exact
mechanisms `supabase-interconnect` Phase 2 needs: `vector(1536)` columns, `plpgsql` functions,
`RETURNS TABLE` + `UNION`, `vector_dims()`, unique-index `ON CONFLICT` upserts, and
`REVOKE`/`GRANT ... service_role` privilege statements.

## Mechanism Under Test

pglite is real Postgres compiled to WASM (not an emulation layer), bundled by
`@electric-sql/pglite` (core, v0.5.4) plus the separate `@electric-sql/pglite-pgvector`
package (v0.0.5) for the `vector` extension. Question: does this WASM build support the
specific DDL/DML surface Phase 2's 4 embedding functions require, run entirely locally with
no container and no network.

## Probe Family

1 — Local process / Node script (pure library behavior in isolation, no container/network).

## Probe Cost Class

`cheap-local`. Gate met — ran freely, no live provider, no container, no billed API.

## Probe Method

All work done in a throwaway npm project under the scratchpad directory (not the repo):

```
npm init (private, type: module)
npm install @electric-sql/pglite@0.5.4
npm install @electric-sql/pglite-pgvector@0.0.5
node probe.mjs
```

`probe.mjs` created a single in-memory `PGlite` instance with `extensions: { vector }` and ran
7 sequential checks, each in its own try/catch, logging PASS/FAIL + raw query output:

1. `CREATE EXTENSION IF NOT EXISTS vector;` then `CREATE TABLE ... embedding vector(1536);`
2. `CREATE OR REPLACE FUNCTION probe_add(...) LANGUAGE plpgsql` + call it
3/4. `RETURNS TABLE (...)` function whose body does `RETURN QUERY SELECT ... UNION SELECT ...`
   across two source tables (`components`, `demos`) — mirrors Phase 2's
   `get_missing_usage_embedding_items()` shape
5. A `vec_dim(v vector)` plpgsql wrapper around pgvector's built-in `vector_dims()`
6. `CREATE UNIQUE INDEX ... ON (item_id, item_type)` + two sequential
   `INSERT ... ON CONFLICT (item_id, item_type) DO UPDATE ...` calls, asserting the second
   call updates (not duplicates) the row
7. `REVOKE EXECUTE ... FROM PUBLIC`, then `GRANT EXECUTE ... TO service_role` — first attempted
   with no role created, then (on failure) with `CREATE ROLE service_role;` run first

Note: package name is `@electric-sql/pglite-pgvector` (NOT `@electric-sql/pglite-vector`,
which does not exist on npm) and its named export is `vector` (NOT `pg_vector`) — both
required a one-shot exports inspection before the probe script would import correctly. This
is a minor naming-surface gotcha for whoever implements Phase 2, not a feasibility blocker.

## Evidence Captured

```
=== 1_vector_extension: PASS ===
[{"column_name":"id","udt_name":"int4"},{"column_name":"embedding","udt_name":"vector"}]

=== 2_plpgsql_create_function: PASS ===
[{"sum":5}]

=== 3_4_returns_table_union: PASS ===
[{"item_id":"c1","item_type":"component","name":"comp1"},
 {"item_id":"c2","item_type":"component","name":"comp2"},
 {"item_id":"d1","item_type":"demo","name":"demo1"}]

=== 5_vector_dims: PASS ===
[{"dims":1536}]

=== 6_unique_index_on_conflict: PASS ===
[{"item_id":"c1","item_type":"component","status":"done","updated_count":2}]
(second ON CONFLICT insert updated status "pending"→"done" and incremented updated_count
 to 2, on the SAME row — confirms upsert-not-duplicate semantics)

=== 7_revoke_grant_service_role: PASS ===
REVOKE FROM PUBLIC: OK
GRANT TO service_role (no role created): FAILED - role "service_role" does not exist
CREATE ROLE service_role: OK
GRANT TO service_role (after CREATE ROLE): OK
Summary: grantWithoutRoleOk=false, grantWithRoleOk=true

=== FINAL SUMMARY ===
1_vector_extension: PASS
2_plpgsql_create_function: PASS
3_4_returns_table_union: PASS
5_vector_dims: PASS
6_unique_index_on_conflict: PASS
7_revoke_grant_service_role: PASS
```

All 7 checks pass. Full script and node_modules were kept in the scratchpad only, never
touched the repo's `package.json`/`pnpm-lock.yaml`, and never connected to the live Supabase
database.

## Verdict

**VIABLE** — all 7 mechanisms Phase 2 depends on work in pglite, with one documented caveat
on #7 (see below). This is the "6-of-7-plus-workaround" outcome flagged as a live
possibility in the probe brief, except here it's 7-of-7 once the one-line workaround is
applied.

## Resulting Design Constraint

- **What this licenses:** Phase 2 may design its local-verification harness around a real
  `@electric-sql/pglite` (`^0.5.4`) + `@electric-sql/pglite-pgvector` (`^0.0.5`) instance and
  rely on ALL of: `vector(1536)` columns via `CREATE EXTENSION vector`, `LANGUAGE plpgsql`
  functions, `RETURNS TABLE` signatures, `UNION` inside a `RETURN QUERY` body (validated
  against a `components` ∪ `demos` two-table shape matching the real
  `get_missing_usage_embedding_items()` design), pgvector's built-in `vector_dims()` (usable
  directly or wrapped in a thin `vec_dim()` plpgsql function), unique-index-backed
  `INSERT ... ON CONFLICT (...) DO UPDATE` upserts, and `REVOKE`/`GRANT ... TO service_role`
  privilege statements — PROVIDED the harness runs `CREATE ROLE service_role;` before any
  `GRANT ... TO service_role` statement (pglite starts with no roles beyond the default
  connecting user; Supabase's `service_role`/`authenticated`/`anon` roles do not pre-exist and
  must be created by the test harness itself). Phase 2 can now honestly claim "verified
  locally" for its 4 embedding functions' DDL using this harness, closing the gap left by
  Docker being unusable in this environment.

- **What this forbids:** Phase 2 must NOT assume `service_role` (or `authenticated`/`anon`)
  exists in a fresh pglite instance without an explicit `CREATE ROLE` bootstrap step in the
  verification harness — a bare `GRANT ... TO service_role` will fail with `role
  "service_role" does not exist` otherwise. Phase 2 must NOT use
  `@electric-sql/pglite-vector` as the package name (it does not exist on npm — the correct
  package is `@electric-sql/pglite-pgvector`) or import `pg_vector` from it (the correct named
  export is `vector`). Phase 2 must NOT add `@electric-sql/pglite` /
  `@electric-sql/pglite-pgvector` to the repo's root or `apps/web` dependencies casually — this
  probe used a throwaway scratchpad project; if Phase 2 wants a persistent local-verification
  harness, that's a deliberate dependency-addition decision for EXECUTE to make explicitly
  (e.g. as a devDependency scoped to a test/verification script), not an incidental side effect
  of this probe.

- **What remains uncertain (known-gap):** (1) This probe did not test pglite against the
  actual live migration SQL files under `supabase/migrations/` — it tested an isomorphic
  hand-written mirror of the DDL shapes (same mechanisms: RETURNS TABLE, UNION, unique index,
  vector_dims, GRANT/REVOKE). Phase 2 EXECUTE should run the REAL migration files through
  pglite, not just re-validate the mechanism list. (2) Whether pglite's pgvector build matches
  the exact pgvector version/behavior running on the live Supabase Postgres instance was not
  checked — cosine-distance operator behavior, index types (`ivfflat`/`hnsw`), and any
  Supabase-specific pgvector patches are unverified; this probe only confirmed
  `vector(1536)` column creation and `vector_dims()`, not similarity-search operators. (3)
  Other Supabase-specific roles/extensions Phase 2's real migrations may reference
  (`authenticated`, `anon`, `pgsodium`, `pg_net`, RLS policy syntax, `auth.uid()`, etc.) were
  out of scope for this probe and are untested — if Phase 2's actual DDL touches any of these,
  additional bootstrap/compatibility work may be needed before "verified locally" is accurate
  for the full migration file, not just the 7 isolated mechanisms tested here.

## Unresolved Questions

- Does pglite's bundled pgvector support the same distance operators / index types
  (`<=>`, `ivfflat`, `hnsw`) the live schema actually uses for similarity search? Untested.
- Do the real `supabase/migrations/*.sql` files reference any Supabase-specific
  role/extension/RLS constructs beyond the 7 mechanisms probed here? Needs a direct read of
  those files against this constraint list before EXECUTE builds the harness.
