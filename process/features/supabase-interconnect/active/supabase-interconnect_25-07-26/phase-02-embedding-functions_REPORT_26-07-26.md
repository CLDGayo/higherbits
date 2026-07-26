---
phase: phase-02-embedding-functions
date: 2026-07-26
status: COMPLETE
feature: supabase-interconnect
plan: process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_PLAN_25-07-26.md
---

# Phase 02 — Embedding Functions: EXECUTE Report

**TL;DR:** All 4 embedding functions authored in one migration file, privilege-locked to
`service_role`, and proven by running the **real** migration file end-to-end through pglite —
11/11 harness checks pass, exit 0. Both regression gates green with **zero** new errors/failures.
Nothing was applied to the live database. Two documented deviations, both from stale `types.ts`
phantoms (which the plan explicitly de-authorizes as ground truth), not from the plan.

---

## What Was Done

| Path | Change |
|---|---|
| `supabase/migrations/0001_embedding_functions.sql` | NEW — 2 unique indexes + 4 `CREATE FUNCTION` + 8 REVOKE/GRANT statements |
| `ops/pglite-verify-embedding-functions.mjs` | NEW — local pglite verification harness (11 checks) |
| `package.json` (root) | +2 devDependencies: `@electric-sql/pglite@0.5.4`, `@electric-sql/pglite-pgvector@0.0.5` |
| `pnpm-lock.yaml` | +21 lines, consequence of the install |

`git status` confirms **exactly** those four paths changed. `apps/` untouched. Nothing staged,
committed, stashed, or reverted.

### The migration (statement order per Step B0)

Full authored SQL:

```sql
-- 0001_embedding_functions.sql
--
-- supabase-interconnect Phase 02 — the 4 embedding-generation functions confirmed
-- ABSENT from the live database (see supabase-interconnect_SPEC_25-07-26.md live audit):
--   vec_dim, get_missing_usage_embedding_items, insert_embedding, insert_code_embedding
--
-- Authored fresh (Fork B1) — the upstream-port path was proven dead. Signatures are
-- derived from real call sites, NOT from apps/web/types/supabase.ts (whose entries for
-- these 4 functions are stale phantoms; Phase 6 regenerates types.ts FROM this file).
--
-- Statement order is load-bearing (Phase 02 plan Step B0):
--   1. unique index on usage_embeddings (item_id, item_type)
--   2. unique index on code_embeddings  (item_id, item_type)
--   3. vec_dim
--   4. get_missing_usage_embedding_items
--   5. insert_embedding
--   6. insert_code_embedding
--   7. REVOKE/GRANT EXECUTE pairs for all 4 functions
--
-- Sequential numbering (0001_, 0002_, ...), NOT the Supabase-CLI timestamp format.
-- Phase 6 will add 0000_baseline.sql and fold forward without renumbering.

-- ============ 1-2. unique indexes backing the ON CONFLICT upserts ============

-- (item_id, item_type) is the real logical key for both embedding tables — confirmed by
-- apps/web/scripts/generate-embeddings.ts:44-89, which checks existence on exactly that pair.
-- No such constraint exists in tracked SQL today, so the edge function's .upsert() calls
-- (supabase/functions/generate-embeddings/index.ts) fall back to the table PK and do NOT
-- deduplicate on this key. These indexes are what make the ON CONFLICT clauses below valid.
--
-- Fail-closed by design: if duplicate (item_id, item_type) rows already exist, index creation
-- fails loudly rather than silently masking data-quality debt. As of the 25-07-26 live audit
-- both tables have 0 rows, so this risk is currently empirically zero.

CREATE UNIQUE INDEX IF NOT EXISTS usage_embeddings_item_id_item_type_key
  ON public.usage_embeddings (item_id, item_type);

CREATE UNIQUE INDEX IF NOT EXISTS code_embeddings_item_id_item_type_key
  ON public.code_embeddings (item_id, item_type);

-- ============ 3. vec_dim ============

-- Thin wrapper over pgvector's built-in vector_dims(). Deliberately NOT a hand-rolled
-- dimension extraction. Matches the vector(1536) column type locked by
-- supabase/search-functions.sql:25-26 (gemini-embedding-001 @ 1536 dims).

CREATE FUNCTION public.vec_dim(v vector)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT vector_dims(v);
$$;

-- ============ 4. get_missing_usage_embedding_items ============

-- Zero-arg. Returns every (item_id, item_type) pair that has no usage_embeddings row yet.
--
-- MUST union BOTH source tables. A demos-only query silently misses every components-sourced
-- gap and fails without error (you would just get half-empty search results). The two-table
-- shape mirrors checkComponentEmbeddingsExist / checkDemoEmbeddingsExist in
-- apps/web/scripts/generate-embeddings.ts:44-89.
--
-- Signature is locked by its one confirmed live caller:
-- apps/web/app/api/cron/gen-usage-embeddings/route.ts:15-17,28-38 — calls
-- supabase.rpc("get_missing_usage_embedding_items") with NO arguments, then iterates
-- item.item_type / item.item_id over the result rows. Phase 3 reuses that exact route, so
-- this signature is load-bearing beyond this phase.

CREATE FUNCTION public.get_missing_usage_embedding_items()
RETURNS TABLE (
  item_id bigint,
  item_type text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id::bigint AS item_id, 'component'::text AS item_type
  FROM public.components c
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.usage_embeddings ue
    WHERE ue.item_id = c.id
      AND ue.item_type = 'component'
  )
  UNION
  SELECT d.id::bigint AS item_id, 'demo'::text AS item_type
  FROM public.demos d
  WHERE NOT EXISTS (
    SELECT 1
    FROM public.usage_embeddings ue
    WHERE ue.item_id = d.id
      AND ue.item_type = 'demo'
  );
$$;

-- ============ 5. insert_embedding ============

-- Upserts one usage embedding. Column set matches the live usage_embeddings table
-- (item_id, item_type, embedding, usage_description, metadata) and the shape the edge
-- function already writes at supabase/functions/generate-embeddings/index.ts:156-168,276-291.
-- The surrogate id column is left to its own default — an explicit id argument is meaningless
-- once (item_id, item_type) is the conflict target.

CREATE FUNCTION public.insert_embedding(
  p_item_id bigint,
  p_item_type text,
  p_embedding vector,
  p_usage_description text,
  p_metadata jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.usage_embeddings (item_id, item_type, embedding, usage_description, metadata)
  VALUES (p_item_id, p_item_type, p_embedding, p_usage_description, p_metadata)
  ON CONFLICT (item_id, item_type) DO UPDATE
    SET embedding         = EXCLUDED.embedding,
        usage_description = EXCLUDED.usage_description,
        metadata          = EXCLUDED.metadata;
$$;

-- ============ 6. insert_code_embedding ============

-- Same pattern against code_embeddings. That table has NO usage_description column and no
-- code column — its live columns are (id, item_id, item_type, embedding, metadata, created_at)
-- — so this function takes 4 arguments, not the 6 the stale types.ts entry claims.

CREATE FUNCTION public.insert_code_embedding(
  p_item_id bigint,
  p_item_type text,
  p_embedding vector,
  p_metadata jsonb
)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  INSERT INTO public.code_embeddings (item_id, item_type, embedding, metadata)
  VALUES (p_item_id, p_item_type, p_embedding, p_metadata)
  ON CONFLICT (item_id, item_type) DO UPDATE
    SET embedding = EXCLUDED.embedding,
        metadata  = EXCLUDED.metadata;
$$;

-- ============ 7. privilege lockdown ============

-- Postgres grants EXECUTE on new functions to PUBLIC by default. Left at that default,
-- insert_embedding / insert_code_embedding would be an embedding- and search-poisoning
-- vector callable by any authenticated (or anon) user. All 4 functions are locked down —
-- a function left at the PUBLIC default is real exposure, not a theoretical one.
--
-- service_role is the correct (not merely defensive) target: the one real caller,
-- apps/web/app/api/cron/gen-usage-embeddings/route.ts, uses supabaseWithAdminAccess
-- (apps/web/lib/supabase.ts:21) — the service-role client.

REVOKE EXECUTE ON FUNCTION public.vec_dim(vector) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.vec_dim(vector) TO service_role;

REVOKE EXECUTE ON FUNCTION public.get_missing_usage_embedding_items() FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.get_missing_usage_embedding_items() TO service_role;

REVOKE EXECUTE ON FUNCTION public.insert_embedding(bigint, text, vector, text, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.insert_embedding(bigint, text, vector, text, jsonb) TO service_role;

REVOKE EXECUTE ON FUNCTION public.insert_code_embedding(bigint, text, vector, jsonb) FROM PUBLIC;
GRANT  EXECUTE ON FUNCTION public.insert_code_embedding(bigint, text, vector, jsonb) TO service_role;
```

### Signature lock decisions (Step A / Execute-Agent Instructions E1, E4, E5)

| Function | Locked signature | Basis |
|---|---|---|
| `vec_dim` | `(v vector) RETURNS integer`, `LANGUAGE sql IMMUTABLE` | Plan A1 verbatim; thin `vector_dims()` wrapper, not reimplemented |
| `get_missing_usage_embedding_items` | zero-arg, `RETURNS TABLE (item_id bigint, item_type text)` | The live caller `route.ts:15-17` calls it with no args and reads `item.item_id`/`item.item_type` |
| `insert_embedding` | `(p_item_id bigint, p_item_type text, p_embedding vector, p_usage_description text, p_metadata jsonb) RETURNS void` | Real `usage_embeddings` columns + the edge function's write shape |
| `insert_code_embedding` | `(p_item_id bigint, p_item_type text, p_embedding vector, p_metadata jsonb) RETURNS void` | Real `code_embeddings` columns (no `usage_description`, no `code` column) |

`bigint` params with a `::bigint` cast on the returned ids: chosen so the functions are correct
whether the live `id`/`item_id` columns are `int4` or `int8`. `types.ts` only tells us `number`.

### Grant decision (Step B7 / E3)

All 4 functions get an explicit `REVOKE EXECUTE ... FROM PUBLIC` + `GRANT EXECUTE ... TO service_role`
pair — **all four, not a sample.** `service_role` is the correct target, not merely a defensively
narrow one: the one real caller (`gen-usage-embeddings/route.ts`) uses `supabaseWithAdminAccess`
(`apps/web/lib/supabase.ts:21`), which *is* the service-role client. Harness check 7 proves
`public_execute: false` and `service_role_execute: true` for every one of the 4.

The three table-touching functions are `SECURITY DEFINER SET search_path = public`, matching the
convention in `supabase/rpc-functions.sql` (plan Step B6). This adds no exposure, because EXECUTE
is revoked from PUBLIC and granted only to `service_role`, which already bypasses RLS.

---

## Compatibility confirmation: `gen-usage-embeddings/route.ts` (E5)

Confirmed against the actual file, not on paper:

- `route.ts:15-17` — `await supabase.rpc("get_missing_usage_embedding_items")`. **No second
  argument.** The authored function is zero-arg. Compatible.
- `route.ts:28` — `for (const item of missingItems)`, i.e. the result is iterated as an array of
  rows. The authored function is `RETURNS TABLE (...)`, which PostgREST surfaces as a row array.
  Compatible.
- `route.ts:34-35` — reads `item.item_type` and `item.item_id`. Those are exactly the two returned
  column names. Compatible.
- `route.ts:13` — client is `supabaseWithAdminAccess` (service role), which matches the grant target.

No signature drift. Phase 3's reuse of this route is unblocked.

---

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| AC5-a | `grep -c "CREATE FUNCTION" supabase/migrations/*.sql` | **4** — exactly as required |
| AC5-b + AC5-c + Security-1 | `node ops/pglite-verify-embedding-functions.mjs` | **exit 0, 11/11 PASS** |
| Regression | `corepack pnpm --filter web exec tsc --noEmit` | **exit 0, 0 errors** |
| Regression | `corepack pnpm --filter web test` | **exit 0, 62 passed (62), 17 files** |
| AC5-d (live) | live apply | **NOT RUN** — hard stop C5, correctly not executed |

### Harness output (verbatim)

```
=== 0_fixture_schema: PASS ===
["code_embeddings","components","demos","usage_embeddings"]

=== 0b_bootstrap_roles: PASS ===
bootstrapped roles referenced by the migration: ["service_role"]

=== 1_real_migration_file_applies: PASS ===
supabase/migrations/0001_embedding_functions.sql applied; functions: ["get_missing_usage_embedding_items","insert_code_embedding","insert_embedding","vec_dim"]

=== 1b_pgvector_surface_used_by_migration: PASS ===
migration uses no similarity operator (<=>) and no ANN index type (hnsw/ivfflat) — only vector columns + vector_dims(). embedding udt: vector

=== 2_get_missing_returns_both_tables: PASS ===
[{"item_id":101,"item_type":"component"},{"item_id":201,"item_type":"demo"}]  (both source tables represented — UNION fix proven)

=== 3_insert_embedding_upserts: PASS ===
1 row, updated in place: [{"usage_description":"second description","metadata":{"pass":2},"dims":1536,"holds_second_vector":true}]

=== 4_insert_code_embedding_upserts: PASS ===
1 row, updated in place: [{"metadata":{"pass":2},"dims":1536,"holds_second_vector":true}]

=== 5_get_missing_excludes_embedded_item: PASS ===
[{"item_id":201,"item_type":"demo"}]  (embedded component correctly excluded)

=== 6_vec_dim_returns_1536: PASS ===
[{"dims":1536}]

=== 7_no_public_execute_grant: PASS ===
[{"proname":"get_missing_usage_embedding_items","public_execute":false,"service_role_execute":true},{"proname":"insert_code_embedding","public_execute":false,"service_role_execute":true},{"proname":"insert_embedding","public_execute":false,"service_role_execute":true},{"proname":"vec_dim","public_execute":false,"service_role_execute":true}]

=== 8_unique_index_rejects_duplicates: PASS ===
duplicate (item_id, item_type) correctly rejected: duplicate key value violates unique constraint "usage_embeddings_item_id_item_type_key"

=== FINAL SUMMARY ===
0_fixture_schema: PASS
0b_bootstrap_roles: PASS
1_real_migration_file_applies: PASS
1b_pgvector_surface_used_by_migration: PASS
2_get_missing_returns_both_tables: PASS
3_insert_embedding_upserts: PASS
4_insert_code_embedding_upserts: PASS
5_get_missing_excludes_embedded_item: PASS
6_vec_dim_returns_1536: PASS
7_no_public_execute_grant: PASS
8_unique_index_rejects_duplicates: PASS

11/11 checks passed
```

### Step C0b — the three probe known-gaps, closed

- **(a) Real migration file, not a mirror.** Check `1_real_migration_file_applies` does
  `readFile("supabase/migrations/0001_embedding_functions.sql")` and `db.exec()`s that exact
  string, then asserts all 4 functions exist in `pg_proc`. Not a copy, not a paraphrase, not a
  parse check. This is what moves AC5-b from partially-proven to proven.
- **(b) pgvector operators / index types.** Check `1b` scans the migration for `<=>`/`<->`/`<#>`
  and `hnsw`/`ivfflat` and **fails the harness** if any appear (which would mean the harness no
  longer covers what the migration uses). None appear — Phase 2 uses only `vector` columns and
  `vector_dims()`. Both are exercised.
- **(c) Supabase roles.** Check `0b` does not hardcode `service_role`; it regex-scans the migration
  for every `GRANT ... TO <role>` target and bootstraps each with `CREATE ROLE`. It found and
  created exactly `["service_role"]`, and fails loudly if the migration grants to nobody.

### Upsert proof (not merely "it ran")

Checks 3 and 4 each insert the same `(item_id, item_type)` twice with a **different** embedding
vector, then assert three things: exactly **1** row exists, the scalar columns hold the **second**
call's values, and `embedding = <second vector>` is true. Check 8 additionally proves the unique
index rejects a raw duplicate insert. Check 5 proves `get_missing_usage_embedding_items` stops
returning an item once it gains an embedding — the "did it actually write" round-trip.

---

## Plan Deviations

Two, both narrow, both within the phase's blast radius. Neither is a deviation from the plan text —
both are deviations from `apps/web/types/supabase.ts`, which Execute-Agent Instruction E4 explicitly
declares is **not** ground truth ("Phase 6 regenerates `types.ts` FROM Phase 2's real functions").

1. **`insert_code_embedding` takes 4 args, not the stale entry's 6.** `types.ts:3602` claims
   `(p_id, p_item_id, p_item_type, p_embedding, p_code, p_metadata)`. The real `code_embeddings`
   table has no `code` column and no `usage_description` column (`types.ts:396-420` lists
   `created_at, embedding, id, item_id, item_type, metadata`). A `p_code` argument would have
   nowhere to go. Dropped it, and dropped `p_id` for the reason in (2).
   *Impact:* Phase 6's `types.ts` regeneration will emit the 4-arg shape. No live caller exists
   today (PVL grep confirmed zero call sites), so nothing breaks.

2. **Neither insert function takes `p_id`.** `types.ts` shows a `p_id` variant for both (and a
   second, `p_id`-less overload for `insert_embedding`). An explicit surrogate id is meaningless
   once `(item_id, item_type)` is the `ON CONFLICT` target — passing one would either be ignored on
   conflict or fight the unique index. The `id` column keeps its own default.
   *Impact:* same as (1) — no live caller, Phase 6 regenerates from the real function.

**Non-deviation worth recording:** the functions use plain `CREATE FUNCTION`, not the
`CREATE OR REPLACE` style seen in `supabase/rpc-functions.sql`. This is the plan-faithful choice —
plan Steps A1 and B2–B5 all specify `CREATE FUNCTION` literally, and the validate-contract's AC5-a
proving test is `grep -c "CREATE FUNCTION" == 4`, which `CREATE OR REPLACE FUNCTION` would not
match. It is also consistent with Step B0's fail-closed philosophy: a re-run should fail loudly
rather than silently redefine. I initially drafted `CREATE OR REPLACE` and corrected it before the
final harness run; the harness was re-run after the change and still reports 11/11.

---

## What Was Skipped or Deferred

- **Steps C5 / C6 — live application.** Not run, by design. The hard constraint is absolute: nothing
  connected to, queried, or mutated the live Supabase database this session. No `psql`, no
  `supabase db push`, no `prisma db push`. Per the plan's own Blockers section, the phase exit gate
  is met by scratch verification alone; live application is deferred and needs explicit user
  approval with the migration diff presented for review.
- **Step B1's "create `supabase/migrations/` if absent"** — the directory did not exist; creating
  `0001_embedding_functions.sql` created it. No competing structure with Phase 6.
- **Plan checklist tick-off and Phase Loop Progress step 5.** Not applied — the plan file is outside
  this session's four writable paths. Deferred to UPDATE PROCESS.
- **`vc-code-reviewer` / `vc-code-simplifier` / `vc-security` sub-agent review gates.** Not invoked:
  no Agent/Task spawn tool was available in this session (same limitation the PVL cycle recorded for
  its own Layer-1/Layer-2 fan-out). The security surface was reviewed inline instead — see the Grant
  decision section, and harness check 7 is the mechanical proof. Flagging so EVL can decide whether
  an independent review spawn is wanted.
- **Backlog note `scratch-pg-verification-env_NOTE_25-07-26.md`** — deliberately NOT created. Per
  Execute-Agent Instruction E2 it is conditional on pglite failing in EXECUTE's real environment.
  pglite installed and ran cleanly, so the condition never fired.

---

## Test Infra Gaps Found

1. **Documented regression baselines are stale — actual state is BETTER than recorded.** The
   handoff (and the plan's surrounding context) recorded `tsc` at exit 2 with 4 foreign errors in
   `apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx:168,389`, and
   vitest at 57 passing / 5 failing of 62. Measured on this session's tree **before** any change:
   `tsc --noEmit` exit **0**, **0** errors; `pnpm --filter web test` exit **0**, **62/62 passing**
   across 17 files. Someone fixed the foreign WIP between the plan's authoring and now. The "no NEW
   errors / no NEW failures" gate was therefore evaluated against 0 and 0, which is the stricter
   reading. Worth correcting in `process/context/tests/all-tests.md`, which still carries the
   62/17 with "57 passing / 5 failing" figure.

2. **The live schema is untracked, so the harness reconstructs its fixture tables from `types.ts`.**
   `usage_embeddings`, `code_embeddings`, `components`, and `demos` have no `CREATE TABLE` anywhere
   in tracked SQL (dashboard-created). `FIXTURE_SCHEMA` in the harness is a hand-built minimum
   surface derived from `apps/web/types/supabase.ts` column types. If the live column types differ
   from what `types.ts` claims, the harness proves the migration against a slightly wrong schema.
   This is exactly the gap Phase 6 (`schema source of truth`) exists to close; until then, live
   application (C5/C6) remains the only way to fully close it.

3. **The repo still has no general local-Postgres test harness.** This phase built a
   single-purpose one (`ops/pglite-verify-embedding-functions.mjs`). pglite is now a root
   devDependency, so Phase 6 — which will hit the identical constraint — can reuse the pattern
   rather than re-solving it. Consider generalizing the fixture-schema + role-bootstrap portion
   into a shared helper when Phase 6 needs it.

4. **`vec_dim` has no caller and no test outside this harness.** It is proven correct in isolation
   (returns 1536), but nothing in the codebase invokes it before an insert. That stays true until
   Phase 3 wires it, and is already recorded in the contract's "What This Coverage Does NOT Prove".

---

## Closeout Packet

- **Selected plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-02-embedding-functions_PLAN_25-07-26.md`
- **Finished:** Steps A1–A5, B0–B7, C0, C0b(a/b/c), C1–C4. All local verification green.
- **Verified:** AC5-a, AC5-b, AC5-c, Security-1, plus both regression gates — all with real command
  output above.
- **Still unverified:** AC5-d (live application) — deliberately deferred behind the C5 approval hard
  stop. Live schema conformance of the harness fixture tables (gap 2 above).
- **Cleanup remaining:** tick the plan's checklist + Phase Loop Progress step 5; correct the stale
  test baseline in `process/context/tests/all-tests.md`; commit (orchestrator-owned).
- **Follow-up plan stubs created:** none. No condition triggered one — E2's backlog note was
  conditional on pglite failing, and it did not.
- **CONTEXT_PARTIAL items:** none.
- **Best next state:** `Ready for UPDATE PROCESS archival` — after EVL confirms the gates
  independently. Note the phase remains in `active/` because C5/C6 (live apply) are outstanding by
  design and Phase 3 depends on them eventually landing.

---

## EVL Confirmation (26-07-26, UPDATE PROCESS inner-loop Step 7)

Orchestrator independently re-ran the exact validate-contract gate commands (not relying on
EXECUTE's own claim) before handing off to this UPDATE PROCESS pass. All green, zero cycles needed:

| Gate | Result |
|---|---|
| `corepack pnpm --filter web exec tsc --noEmit` | exit 0, 0 errors |
| `corepack pnpm --filter web test` | 62/62 passing, 17 files |
| `node ops/pglite-verify-embedding-functions.mjs` | exit 0, 11/11 PASS |
| `grep -c "CREATE FUNCTION" supabase/migrations/*.sql` | 4 |
| `node .claude/skills/vc-audit-vc/scripts/validate-agent-parity.mjs` | pass |
| `node .claude/skills/vc-audit-context/scripts/validate-context-discovery.mjs` | pass |
| `git diff --check` | clean |

`results.tsv` cycle `1 phase-02-evl tests 0 0 PASS HALTED_SUCCESS 2026-07-26` — zero gaps found on
the confirmation pass, loop closed immediately. Known gaps carried forward (not gate failures): the
pglite fixture schema is hand-reconstructed from stale `types.ts` pending Phase 6's live-schema
introspection, and live apply (C5/C6) remains deliberately deferred.

**Final closeout classification:** code-complete and locally verified for real (not vacuously —
the 11/11 pglite harness ran the actual committed migration file end-to-end, and EVL independently
re-confirmed every gate rather than trusting EXECUTE's self-report). Live database application is
intentionally deferred behind the Step C5 user-approval hard stop; the phase stays in `active/`
until that lands, since Phase 3's cron work depends on it.

---

## Forward Preview

**Test Infra Found**
- `ops/pglite-verify-embedding-functions.mjs` — reusable pattern for local Postgres+pgvector DDL
  verification with no container. Phase 6 should reuse it.
- Root devDeps now include `@electric-sql/pglite@0.5.4` + `@electric-sql/pglite-pgvector@0.0.5`.
  Ops-time-only, never imported by `apps/web`, never bundled — same precedent as root `sharp`.
- Regression baseline is now **tsc 0 errors / vitest 62 passing (17 files)**. Treat that, not the
  older 57/5 figure, as the number to hold.

**Blast Radius Changes**
- `supabase/migrations/` now exists, containing `0001_embedding_functions.sql`. Phase 6 must fold
  its `0000_baseline.sql` in front of this without renumbering, exactly as its plan already states.
- No `apps/web` source file was touched.

**Commands to Stay Green**
```bash
node ops/pglite-verify-embedding-functions.mjs          # expect exit 0, 11/11
grep -c "CREATE FUNCTION" supabase/migrations/*.sql     # expect 4
corepack pnpm --filter web exec tsc --noEmit            # expect exit 0, 0 errors
corepack pnpm --filter web test                         # expect exit 0, 62 passed
```

**Dependency Changes**
- +`@electric-sql/pglite@0.5.4` (root devDependency)
- +`@electric-sql/pglite-pgvector@0.0.5` (root devDependency)
- `pnpm-lock.yaml` +21 lines. No production dependency added.

**For Phase 3**
- `get_missing_usage_embedding_items()` is zero-arg returning `{item_id, item_type}[]`, and
  `apps/web/app/api/cron/gen-usage-embeddings/route.ts` already calls it correctly — verified
  against the real file. Reuse it as planned; no adapter needed.
- The functions are `service_role`-only. Phase 3's caller must use `supabaseWithAdminAccess`
  (which the existing route already does). Any other client will get a permission error — that is
  intentional.
- **Blocking dependency:** these functions exist only in a tracked migration file, not in the live
  database. Phase 3's cron cannot actually run until C5/C6 land with user approval.
