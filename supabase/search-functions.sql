-- Vector search RPC functions required by the edge functions in supabase/functions/.
-- Authored for this DB (originals were never exported by upstream):
--   match_embeddings              <- search-embeddings edge fn (raw candidates for MMR)
--   match_embeddings_with_details <- search-embeddings edge fn (hydrated results)
--   search_demos_ai_oai_v2        <- search_demos_ai_oai_extended edge fn
--   search_demos_ai_oai_extended  <- ai-search-oai edge fn
-- Embeddings are stored in usage_embeddings / code_embeddings by the
-- generate-embeddings edge fn. Query + stored vectors must come from the same
-- model (gemini-embedding-001 @ 1536 dims — see supabase/functions/*/ai-config.ts).
-- Similarity metric: cosine (1 - <=> distance), scale-invariant so unnormalized
-- Matryoshka-truncated vectors are fine.

-- Schema prep -----------------------------------------------------------------
-- The imported schema had default btree indexes on vector columns; btree caps
-- index rows at 2704 bytes so ANY real embedding insert fails
-- ("index row size 6160 exceeds btree version 4 maximum 2704").
DROP INDEX IF EXISTS public.usage_embeddings_embedding_idx;
DROP INDEX IF EXISTS public.code_embeddings_embedding_idx;
DROP INDEX IF EXISTS public.demos_embedding_idx;
DROP INDEX IF EXISTS public.demos_embedding_oai_idx;

-- Lock the live embedding tables to 1536 dims (gemini-embedding-001 output);
-- a wrong-dimension insert now fails loudly instead of poisoning search.
-- Tables are empty at migration time so these rewrites are free.
ALTER TABLE public.usage_embeddings ALTER COLUMN embedding TYPE vector(1536);
ALTER TABLE public.code_embeddings ALTER COLUMN embedding TYPE vector(1536);

-- Proper ANN indexes (cosine, matching the <=> usage below).
CREATE INDEX IF NOT EXISTS usage_embeddings_embedding_hnsw_idx
  ON public.usage_embeddings USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS code_embeddings_embedding_hnsw_idx
  ON public.code_embeddings USING hnsw (embedding vector_cosine_ops);
-- demos.embedding / demos.embedding_oai are a legacy path (embed/embed-oai fns
-- are not invoked by the app); broken indexes dropped, columns left as-is.

-- Functions ---------------------------------------------------------------------

-- Raw candidate match over usage_embeddings or code_embeddings.
-- filter is a trusted SQL condition fragment supplied by the edge function
-- (service-role only); table_name is whitelisted here.
CREATE OR REPLACE FUNCTION public.match_embeddings(
  query_embedding vector,
  match_threshold double precision,
  match_count integer,
  filter text DEFAULT '',
  table_name text DEFAULT 'usage_embeddings'
) RETURNS TABLE (
  id text,
  item_id bigint,
  item_type text,
  embedding vector,
  similarity double precision
)
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF table_name NOT IN ('usage_embeddings', 'code_embeddings') THEN
    RAISE EXCEPTION 'invalid table_name: %', table_name;
  END IF;

  RETURN QUERY EXECUTE format(
    'SELECT e.id::text, e.item_id::bigint, e.item_type, e.embedding,
            (1 - (e.embedding <=> $1))::double precision AS similarity
     FROM public.%I e
     WHERE 1 - (e.embedding <=> $1) > $2 %s
     ORDER BY e.embedding <=> $1
     LIMIT $3',
    table_name,
    CASE WHEN filter <> '' THEN 'AND ' || filter ELSE '' END
  ) USING query_embedding, match_threshold, match_count;
END;$$;

-- Demo-hydrated match over usage_embeddings (item_type = 'demo').
-- Return shape matches apps/web/types/supabase.ts Functions definition.
CREATE OR REPLACE FUNCTION public.match_embeddings_with_details(
  query_embedding vector,
  match_threshold double precision,
  match_count integer
) RETURNS TABLE (
  id bigint,
  name text,
  preview_url text,
  video_url text,
  demo_slug text,
  user_id text,
  component_data jsonb,
  user_data jsonb,
  usage_data jsonb
)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    d.id::bigint,
    d.name,
    d.preview_url,
    d.video_url,
    d.demo_slug,
    d.user_id,
    to_jsonb(c.*) AS component_data,
    to_jsonb(u.*) AS user_data,
    jsonb_build_object(
      'usage_description', ue.usage_description,
      'metadata', ue.metadata,
      'similarity', 1 - (ue.embedding <=> query_embedding)
    ) AS usage_data
  FROM public.usage_embeddings ue
  JOIN public.demos d ON d.id = ue.item_id AND ue.item_type = 'demo'
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users u ON u.id = d.user_id
  WHERE c.is_public = TRUE
    AND 1 - (ue.embedding <=> query_embedding) > match_threshold
  ORDER BY ue.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Demo search used by the search_demos_ai_oai_extended edge fn.
-- search_query is accepted for signature parity; ranking is vector-only.
CREATE OR REPLACE FUNCTION public.search_demos_ai_oai_v2(
  search_query text,
  query_embedding vector,
  match_threshold double precision
) RETURNS TABLE (
  id bigint,
  name text,
  preview_url text,
  video_url text,
  demo_slug text,
  user_id text,
  component_data jsonb,
  user_data jsonb,
  usage_data jsonb
)
    LANGUAGE sql STABLE
    AS $$
  SELECT * FROM public.match_embeddings_with_details(query_embedding, match_threshold, 20);
$$;

-- Demo search used by the ai-search-oai edge fn. Same as v2 plus created_at
-- (apps/web/components/ui/items-list.tsx reads result.created_at).
CREATE OR REPLACE FUNCTION public.search_demos_ai_oai_extended(
  search_query text,
  query_embedding vector,
  match_threshold double precision
) RETURNS TABLE (
  id bigint,
  name text,
  preview_url text,
  video_url text,
  demo_slug text,
  user_id text,
  created_at timestamptz,
  component_data jsonb,
  user_data jsonb,
  usage_data jsonb
)
    LANGUAGE sql STABLE
    AS $$
  SELECT
    d.id::bigint,
    d.name,
    d.preview_url,
    d.video_url,
    d.demo_slug,
    d.user_id,
    d.created_at,
    to_jsonb(c.*) AS component_data,
    to_jsonb(u.*) AS user_data,
    jsonb_build_object(
      'usage_description', ue.usage_description,
      'metadata', ue.metadata,
      'similarity', 1 - (ue.embedding <=> query_embedding)
    ) AS usage_data
  FROM public.usage_embeddings ue
  JOIN public.demos d ON d.id = ue.item_id AND ue.item_type = 'demo'
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users u ON u.id = d.user_id
  WHERE c.is_public = TRUE
    AND 1 - (ue.embedding <=> query_embedding) > match_threshold
  ORDER BY ue.embedding <=> query_embedding
  LIMIT 20;
$$;
