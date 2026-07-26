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
