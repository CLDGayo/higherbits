-- Reconstructed RPC functions for 21st.dev fork.
-- Originals live only in upstream production DB; these are rebuilt from
-- types/supabase.ts signatures + app calling code. Signatures must not drift
-- from types/supabase.ts (PostgREST matches args by name).

-- ============ helper ============

CREATE OR REPLACE FUNCTION public.requesting_user_id()
RETURNS text
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::text;
$$;

-- ============ user profile / studio ============

CREATE OR REPLACE FUNCTION public.get_user_profile_demo_list(
  p_user_id text,
  p_include_private boolean DEFAULT false
)
RETURNS TABLE (
  id integer,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.demo_slug,
    to_jsonb(c.*)  AS component_data,
    to_jsonb(du.*) AS user_data,
    to_jsonb(cu.*) AS component_user_data
  FROM public.demos d
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users du ON du.id = d.user_id
  JOIN public.users cu ON cu.id = c.user_id
  WHERE (d.user_id = p_user_id OR c.user_id = p_user_id)
    AND (COALESCE(p_include_private, false) OR c.is_public = true)
  ORDER BY d.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_profile_demo_list_v2(p_user_id text)
RETURNS TABLE (
  id integer,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  created_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb,
  total_count bigint,
  view_count bigint,
  bookmarks_count bigint,
  bundle_url jsonb,
  is_private boolean,
  submission_status text,
  moderators_feedback text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.created_at,
    d.demo_slug,
    to_jsonb(c.*)  AS component_data,
    to_jsonb(du.*) AS user_data,
    to_jsonb(cu.*) AS component_user_data,
    count(*) OVER () AS total_count,
    COALESCE(v.views, 0)::bigint AS view_count,
    COALESCE(d.bookmarks_count, 0)::bigint AS bookmarks_count,
    CASE WHEN d.bundle_html_url IS NOT NULL
         THEN jsonb_build_object('html', d.bundle_html_url)
         ELSE NULL END AS bundle_url,
    NOT c.is_public AS is_private,
    s.status::text AS submission_status,
    s.moderators_feedback
  FROM public.demos d
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users du ON du.id = d.user_id
  JOIN public.users cu ON cu.id = c.user_id
  LEFT JOIN public.submissions s ON s.component_id = c.id
  LEFT JOIN LATERAL (
    SELECT count(*) AS views
    FROM public.component_analytics ca
    WHERE ca.component_id = c.id
      AND ca.activity_type = 'component_view'
  ) v ON true
  WHERE d.user_id = p_user_id OR c.user_id = p_user_id
  ORDER BY d.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_components_counts(p_user_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
AS $$
  SELECT jsonb_build_object(
    'published_count', (
      SELECT count(*)
      FROM public.demos d
      JOIN public.components c ON c.id = d.component_id
      WHERE c.user_id = p_user_id
        AND c.is_public = true
    ),
    'demos_count', (
      SELECT count(*)
      FROM public.demos d
      JOIN public.components c ON c.id = d.component_id
      WHERE d.user_id = p_user_id
        AND c.user_id <> p_user_id
        AND c.is_public = true
    ),
    'liked_count', (
      SELECT count(*)
      FROM public.demo_bookmarks db
      JOIN public.demos d ON d.id = db.demo_id
      JOIN public.components c ON c.id = d.component_id
      WHERE db.user_id = p_user_id
        AND c.is_public = true
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_state(user_id_param text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  profile_json jsonb;
  usage_json jsonb;
BEGIN
  SELECT to_jsonb(u.*)
         || jsonb_build_object(
              'total_components', COALESCE(stats.total_components, 0),
              'total_downloads', COALESCE(stats.total_downloads, 0),
              'stripe_customer_id', utp.meta ->> 'stripe_customer_id',
              'stripe_subscription_id', utp.meta ->> 'stripe_subscription_id'
            )
    INTO profile_json
  FROM public.users u
  LEFT JOIN LATERAL (
    SELECT count(*)::bigint AS total_components,
           COALESCE(sum(c.downloads_count), 0)::bigint AS total_downloads
    FROM public.components c
    WHERE c.user_id = u.id
  ) stats ON true
  LEFT JOIN public.users_to_plans utp ON utp.user_id = u.id
  WHERE u.id = user_id_param;

  IF profile_json IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
           'limit',   COALESCE(us."limit", 0),
           'usage',   COALESCE(us.usage, 0),
           'balance', COALESCE(us."limit", 0) - COALESCE(us.usage, 0)
         )
    INTO usage_json
  FROM public.usages us
  WHERE us.user_id = user_id_param;

  IF usage_json IS NULL THEN
    usage_json := jsonb_build_object('limit', 0, 'usage', 0, 'balance', 0);
  END IF;

  RETURN jsonb_build_object(
    'profile', profile_json,
    'usage', usage_json
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_bookmarks_list(
  p_user_id text,
  p_include_private boolean DEFAULT false
)
RETURNS TABLE (
  id integer,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.demo_slug,
    to_jsonb(c.*)  AS component_data,
    to_jsonb(du.*) AS user_data,
    to_jsonb(cu.*) AS component_user_data
  FROM public.demo_bookmarks db
  JOIN public.demos d      ON d.id = db.demo_id
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users du     ON du.id = d.user_id
  JOIN public.users cu     ON cu.id = c.user_id
  WHERE db.user_id = p_user_id
    AND (p_include_private OR c.is_public = true)
  ORDER BY db.bookmarked_at DESC NULLS LAST, d.id DESC;
$$;

-- ============ earnings / analytics ============

CREATE OR REPLACE FUNCTION public.get_daily_user_earnings_v2(p_user_id text)
RETURNS TABLE (
  date date,
  views bigint,
  code_copies bigint,
  prompt_copies bigint,
  cli_downloads bigint,
  mcp_usages bigint
)
LANGUAGE sql
STABLE
AS $$
WITH analytics AS (
  SELECT
    (ca.created_at AT TIME ZONE 'UTC')::date AS day,
    count(*) FILTER (WHERE ca.activity_type = 'component_view')         AS views,
    count(*) FILTER (WHERE ca.activity_type = 'component_code_copy')    AS code_copies,
    count(*) FILTER (WHERE ca.activity_type = 'component_prompt_copy')  AS prompt_copies,
    count(*) FILTER (WHERE ca.activity_type = 'component_cli_download') AS cli_downloads
  FROM public.component_analytics ca
  JOIN public.components c ON c.id = ca.component_id
  WHERE c.user_id = p_user_id
  GROUP BY 1
),
mcp AS (
  SELECT
    (mcu.created_at AT TIME ZONE 'UTC')::date AS day,
    count(*) AS mcp_usages
  FROM public.mcp_component_usage mcu
  WHERE mcu.author_id = p_user_id
    AND mcu.created_at IS NOT NULL
  GROUP BY 1
),
bounds AS (
  SELECT least(
    (SELECT min(day) FROM analytics),
    (SELECT min(day) FROM mcp)
  ) AS min_day
),
days AS (
  SELECT generate_series(
    b.min_day,
    (now() AT TIME ZONE 'UTC')::date,
    interval '1 day'
  )::date AS day
  FROM bounds b
  WHERE b.min_day IS NOT NULL
)
SELECT
  d.day                                AS date,
  COALESCE(a.views, 0)::bigint         AS views,
  COALESCE(a.code_copies, 0)::bigint   AS code_copies,
  COALESCE(a.prompt_copies, 0)::bigint AS prompt_copies,
  COALESCE(a.cli_downloads, 0)::bigint AS cli_downloads,
  COALESCE(m.mcp_usages, 0)::bigint    AS mcp_usages
FROM days d
LEFT JOIN analytics a ON a.day = d.day
LEFT JOIN mcp m ON m.day = d.day
ORDER BY d.day;
$$;

-- ============ marketplace lists ============

CREATE OR REPLACE FUNCTION public.get_demos_list_v2(
  p_sort_by text,
  p_offset integer,
  p_limit integer,
  p_tag_slug text DEFAULT NULL,
  p_include_private boolean DEFAULT false
)
RETURNS TABLE (
  id integer,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb,
  total_count bigint,
  view_count bigint,
  bookmarks_count bigint,
  bundle_url jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.demo_slug,
    to_jsonb(c.*)  AS component_data,
    to_jsonb(du.*) AS user_data,
    to_jsonb(cu.*) AS component_user_data,
    count(*) OVER () AS total_count,
    COALESCE(v.views, 0)::bigint AS view_count,
    COALESCE(d.bookmarks_count, 0)::bigint AS bookmarks_count,
    CASE WHEN d.bundle_html_url IS NOT NULL
         THEN jsonb_build_object('html', d.bundle_html_url)
         ELSE NULL END AS bundle_url
  FROM public.demos d
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users du ON du.id = d.user_id
  JOIN public.users cu ON cu.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT count(*) AS views
    FROM public.component_analytics ca
    WHERE ca.component_id = c.id
      AND ca.activity_type = 'component_view'
  ) v ON true
  WHERE (COALESCE(p_include_private, false) OR c.is_public = true)
    AND (
      p_tag_slug IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.demo_tags dt
        JOIN public.tags t ON t.id = dt.tag_id
        WHERE dt.demo_id = d.id AND t.slug = p_tag_slug
      )
    )
  ORDER BY
    CASE WHEN p_sort_by = 'downloads' THEN c.downloads_count END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'likes'     THEN c.likes_count END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'bookmarks' THEN d.bookmarks_count END DESC NULLS LAST,
    d.created_at DESC,
    d.id DESC
  OFFSET COALESCE(p_offset, 0)
  LIMIT COALESCE(p_limit, 40);
$$;

CREATE OR REPLACE FUNCTION public.get_demos_submissions(
  p_sort_by text,
  p_offset integer,
  p_limit integer,
  p_tag_slug text DEFAULT NULL,
  p_include_private boolean DEFAULT false
)
RETURNS TABLE (
  id integer,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb,
  total_count bigint,
  view_count bigint,
  bookmarks_count bigint,
  bundle_url jsonb,
  submission_status text,
  moderators_feedback text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.demo_slug,
    to_jsonb(c.*)  AS component_data,
    to_jsonb(du.*) AS user_data,
    to_jsonb(cu.*) AS component_user_data,
    count(*) OVER () AS total_count,
    COALESCE(v.views, 0)::bigint AS view_count,
    COALESCE(d.bookmarks_count, 0)::bigint AS bookmarks_count,
    CASE WHEN d.bundle_html_url IS NOT NULL
         THEN jsonb_build_object('html', d.bundle_html_url)
         ELSE NULL END AS bundle_url,
    s.status::text AS submission_status,
    s.moderators_feedback
  FROM public.demos d
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users du ON du.id = d.user_id
  JOIN public.users cu ON cu.id = c.user_id
  JOIN public.submissions s ON s.component_id = c.id
  LEFT JOIN LATERAL (
    SELECT count(*) AS views
    FROM public.component_analytics ca
    WHERE ca.component_id = c.id
      AND ca.activity_type = 'component_view'
  ) v ON true
  WHERE (
      p_tag_slug IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.demo_tags dt
        JOIN public.tags t ON t.id = dt.tag_id
        WHERE dt.demo_id = d.id AND t.slug = p_tag_slug
      )
    )
  ORDER BY
    CASE WHEN p_sort_by = 'downloads' THEN c.downloads_count END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'likes'     THEN c.likes_count END DESC NULLS LAST,
    d.created_at DESC,
    d.id DESC
  OFFSET COALESCE(p_offset, 0)
  LIMIT COALESCE(p_limit, 40);
$$;

CREATE OR REPLACE FUNCTION public.get_admin_liked_demos_v1(
  p_user_id text,
  p_limit integer DEFAULT 50
)
RETURNS TABLE (
  id integer,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb,
  total_count bigint,
  view_count bigint,
  bookmarks_count bigint,
  bundle_url jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.demo_slug,
    to_jsonb(c.*)  AS component_data,
    to_jsonb(du.*) AS user_data,
    to_jsonb(cu.*) AS component_user_data,
    count(*) OVER () AS total_count,
    0::bigint AS view_count,
    COALESCE(d.bookmarks_count, 0)::bigint AS bookmarks_count,
    CASE WHEN d.bundle_html_url IS NOT NULL
         THEN jsonb_build_object('html', d.bundle_html_url)
         ELSE NULL END AS bundle_url
  FROM public.component_likes cl
  JOIN public.components c ON c.id = cl.component_id
  JOIN public.demos d ON d.component_id = c.id
  JOIN public.users du ON du.id = d.user_id
  JOIN public.users cu ON cu.id = c.user_id
  WHERE cl.user_id = p_user_id
  ORDER BY cl.liked_at DESC NULLS LAST, d.id DESC
  LIMIT COALESCE(p_limit, 50);
$$;

CREATE OR REPLACE FUNCTION public.get_collections_v1(
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 50,
  p_include_private boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  name text,
  description text,
  cover_url text,
  user_id text,
  created_at timestamptz,
  updated_at timestamptz,
  is_public boolean,
  slug text,
  components_count bigint,
  user_data jsonb
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    c.cover_url,
    c.user_id,
    c.created_at,
    c.updated_at,
    c.is_public,
    c.slug,
    COALESCE(cc.cnt, 0)::bigint AS components_count,
    to_jsonb(u.*) AS user_data
  FROM public.collections c
  JOIN public.users u ON u.id = c.user_id
  LEFT JOIN (
    SELECT ctc.collection_id, count(*) AS cnt
    FROM public.components_to_collections ctc
    GROUP BY ctc.collection_id
  ) cc ON cc.collection_id = c.id
  WHERE c.is_public = true
     OR (p_include_private AND c.user_id = public.requesting_user_id())
  ORDER BY c.created_at DESC, c.id
  OFFSET COALESCE(p_offset, 0)
  LIMIT COALESCE(p_limit, 50);
$$;

-- ============ templates ============

CREATE OR REPLACE FUNCTION public.get_templates_v3(
  p_offset integer DEFAULT 0,
  p_limit integer DEFAULT 50,
  p_include_private boolean DEFAULT false,
  p_tag_slug text DEFAULT NULL
)
RETURNS TABLE (
  id integer,
  name text,
  description text,
  preview_url text,
  video_url text,
  website_preview_url text,
  price numeric,
  payment_url text,
  created_at timestamptz,
  updated_at timestamptz,
  user_data jsonb,
  downloads_count integer,
  likes_count integer
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    t.id,
    t.name,
    t.description,
    t.preview_url,
    t.video_url,
    t.website_preview_url,
    t.price,
    t.payment_url,
    t.created_at,
    t.updated_at,
    to_jsonb(u.*) AS user_data,
    COALESCE(t.downloads_count, 0) AS downloads_count,
    COALESCE(t.likes_count, 0) AS likes_count
  FROM public.templates t
  JOIN public.users u ON u.id = t.user_id
  WHERE (COALESCE(p_include_private, false) OR t.is_public = true)
    AND (
      p_tag_slug IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.templates_tags tt
        JOIN public.tags tg ON tg.id = tt.tag_id
        WHERE tt.template_id = t.id AND tg.slug = p_tag_slug
      )
    )
  ORDER BY t.created_at DESC, t.id DESC
  OFFSET COALESCE(p_offset, 0)
  LIMIT COALESCE(p_limit, 50);
$$;

CREATE OR REPLACE FUNCTION public.get_template_tags()
RETURNS TABLE (
  tag_id integer,
  tag_name text,
  tag_slug text,
  templates_count bigint
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    t.id AS tag_id,
    t.name AS tag_name,
    t.slug AS tag_slug,
    count(tt.template_id) AS templates_count
  FROM public.tags t
  JOIN public.templates_tags tt ON tt.tag_id = t.id
  JOIN public.templates tp ON tp.id = tt.template_id AND tp.is_public = true
  GROUP BY t.id, t.name, t.slug
  ORDER BY templates_count DESC, t.name;
$$;

-- ============ publishers ============

CREATE OR REPLACE FUNCTION public.get_pro_publishers()
RETURNS TABLE (
  id text,
  created_at timestamptz,
  updated_at timestamptz,
  image_url text,
  username text,
  name text,
  email text,
  manually_added boolean,
  is_admin boolean,
  twitter_url text,
  bio text,
  github_url text,
  pro_referral_url text,
  website_url text,
  pro_banner_url text,
  display_name text,
  display_username text,
  display_image_url text,
  ref text
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    u.id,
    u.created_at,
    u.updated_at,
    u.image_url,
    u.username,
    u.name,
    u.email,
    u.manually_added,
    u.is_admin,
    u.twitter_url,
    u.bio,
    u.github_url,
    u.pro_referral_url,
    u.website_url,
    u.pro_banner_url,
    u.display_name,
    u.display_username,
    u.display_image_url,
    u.ref
  FROM public.users u
  WHERE u.is_partner = true
     OR u.pro_referral_url IS NOT NULL
     OR EXISTS (
       SELECT 1 FROM public.templates t
       WHERE t.user_id = u.id AND t.is_public = true
     )
  ORDER BY u.created_at;
$$;

-- ============ component hunt ============

CREATE OR REPLACE FUNCTION public.get_hunt_demos_list_v2(p_round_id integer)
RETURNS TABLE (
  id integer,
  name text,
  preview_url text,
  video_url text,
  updated_at timestamptz,
  demo_slug text,
  component_data jsonb,
  user_data jsonb,
  component_user_data jsonb,
  total_count bigint,
  view_count bigint,
  bookmarks_count bigint,
  bundle_url jsonb,
  votes integer,
  installs integer,
  final_score numeric,
  global_rank bigint,
  tags jsonb,
  has_voted boolean
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    d.id,
    d.name,
    d.preview_url,
    d.video_url,
    d.updated_at,
    d.demo_slug,
    to_jsonb(c.*)  AS component_data,
    to_jsonb(du.*) AS user_data,
    to_jsonb(cu.*) AS component_user_data,
    count(*) OVER () AS total_count,
    COALESCE(s.views, 0)::bigint AS view_count,
    COALESCE(d.bookmarks_count, 0)::bigint AS bookmarks_count,
    CASE WHEN d.bundle_html_url IS NOT NULL
         THEN jsonb_build_object('html', d.bundle_html_url)
         ELSE NULL END AS bundle_url,
    COALESCE(s.votes, 0) AS votes,
    COALESCE(s.installs, 0) AS installs,
    COALESCE(s.final_score, 0)::numeric AS final_score,
    rank() OVER (ORDER BY COALESCE(s.final_score, 0) DESC) AS global_rank,
    COALESCE(tg.tags, '[]'::jsonb) AS tags,
    EXISTS (
      SELECT 1 FROM public.demo_hunt_votes v
      WHERE v.round_id = p_round_id
        AND v.demo_id = d.id
        AND v.user_id = public.requesting_user_id()
    ) AS has_voted
  FROM public.demo_hunt_scores s
  JOIN public.demos d ON d.id = s.demo_id
  JOIN public.components c ON c.id = d.component_id
  JOIN public.users du ON du.id = d.user_id
  JOIN public.users cu ON cu.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)) AS tags
    FROM public.demo_tags dt
    JOIN public.tags t ON t.id = dt.tag_id
    WHERE dt.demo_id = d.id
  ) tg ON true
  WHERE s.round_id = p_round_id
  ORDER BY COALESCE(s.final_score, 0) DESC, d.id;
$$;

CREATE OR REPLACE FUNCTION public.hunt_toggle_demo_vote(
  p_round_id integer,
  p_demo_id integer
)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_id text;
  v_deleted boolean;
BEGIN
  v_user_id := public.requesting_user_id();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  DELETE FROM public.demo_hunt_votes
  WHERE round_id = p_round_id AND demo_id = p_demo_id AND user_id = v_user_id;
  v_deleted := FOUND;

  IF v_deleted THEN
    RETURN false;
  END IF;

  INSERT INTO public.demo_hunt_votes (round_id, demo_id, user_id)
  VALUES (p_round_id, p_demo_id, v_user_id);
  RETURN true;
END;
$$;

-- ============ api keys / purchases / mcp usage ============

CREATE OR REPLACE FUNCTION public.create_api_key(
  user_id text,
  plan public.api_plan DEFAULT 'free',
  requests_limit integer DEFAULT 1000
)
RETURNS public.api_keys
LANGUAGE plpgsql
AS $$
DECLARE
  v_key text;
  v_row public.api_keys;
BEGIN
  v_key := 'sk_' || replace(gen_random_uuid()::text, '-', '')
                 || replace(gen_random_uuid()::text, '-', '');

  INSERT INTO public.api_keys (key, user_id, plan, requests_limit)
  VALUES (v_key, create_api_key.user_id, create_api_key.plan, create_api_key.requests_limit)
  RETURNING * INTO v_row;

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.purchase_component(
  p_user_id text,
  p_component_id integer
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.components c WHERE c.id = p_component_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Component not found');
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.components_purchases cp
    WHERE cp.user_id = p_user_id AND cp.component_id = p_component_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN jsonb_build_object('success', true, 'already_purchased', true);
  END IF;

  INSERT INTO public.components_purchases (user_id, component_id, price_paid)
  VALUES (p_user_id, p_component_id, 0);

  RETURN jsonb_build_object('success', true, 'already_purchased', false);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_mcp_component_usage(
  p_user_id text,
  p_api_key text,
  p_search_query text,
  p_component_ids integer[],
  p_component_names text[],
  p_author_ids text[]
)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
  v_request_id integer;
  v_count integer := 0;
  i integer;
BEGIN
  INSERT INTO public.mcp_generation_requests
    (user_id, api_key, search_query, subscription_plan, generation_cost)
  VALUES (p_user_id, p_api_key, p_search_query, 'free', 0)
  RETURNING id INTO v_request_id;

  IF p_component_ids IS NOT NULL THEN
    FOR i IN 1 .. COALESCE(array_length(p_component_ids, 1), 0) LOOP
      -- skip entries whose component/author no longer exists
      IF EXISTS (SELECT 1 FROM public.components c WHERE c.id = p_component_ids[i])
         AND p_author_ids[i] IS NOT NULL
         AND EXISTS (SELECT 1 FROM public.users u WHERE u.id = p_author_ids[i]) THEN
        INSERT INTO public.mcp_component_usage
          (generation_request_id, component_id, author_id, author_share)
        VALUES (v_request_id, p_component_ids[i], p_author_ids[i], 0);
        v_count := v_count + 1;
      END IF;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'recorded_usages', v_count
  );
END;
$$;

-- 5-arg overload (no component names) delegates to the 6-arg version
CREATE OR REPLACE FUNCTION public.record_mcp_component_usage(
  p_user_id text,
  p_api_key text,
  p_search_query text,
  p_component_ids integer[],
  p_author_ids text[]
)
RETURNS jsonb
LANGUAGE sql
AS $$
  SELECT public.record_mcp_component_usage(
    p_user_id, p_api_key, p_search_query, p_component_ids, NULL::text[], p_author_ids
  );
$$;

-- ============ tag editing ============

CREATE OR REPLACE FUNCTION public.update_demo_tags(
  p_demo_id integer,
  p_tags jsonb
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tag_rec jsonb;
  v_tag_id integer;
BEGIN
  DELETE FROM public.demo_tags WHERE demo_id = p_demo_id;

  IF p_tags IS NULL OR jsonb_typeof(p_tags) <> 'array' THEN
    RETURN;
  END IF;

  FOR tag_rec IN SELECT * FROM jsonb_array_elements(p_tags) LOOP
    IF (tag_rec ->> 'id') IS NOT NULL THEN
      v_tag_id := (tag_rec ->> 'id')::integer;
    ELSE
      INSERT INTO public.tags (name, slug)
      VALUES (tag_rec ->> 'name', tag_rec ->> 'slug')
      ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
      RETURNING id INTO v_tag_id;
    END IF;

    INSERT INTO public.demo_tags (demo_id, tag_id)
    VALUES (p_demo_id, v_tag_id)
    ON CONFLICT (demo_id, tag_id) DO NOTHING;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_component_with_tags(
  p_component_id integer,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_license text DEFAULT NULL,
  p_preview_url text DEFAULT NULL,
  p_website_url text DEFAULT NULL,
  p_tags jsonb DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  tag_rec jsonb;
  v_tag_id integer;
BEGIN
  UPDATE public.components SET
    name        = COALESCE(p_name, name),
    description = COALESCE(p_description, description),
    license     = COALESCE(p_license, license),
    preview_url = COALESCE(p_preview_url, preview_url),
    website_url = COALESCE(p_website_url, website_url),
    updated_at  = now()
  WHERE id = p_component_id;

  IF p_tags IS NOT NULL AND jsonb_typeof(p_tags) = 'array' THEN
    DELETE FROM public.component_tags WHERE component_id = p_component_id;

    FOR tag_rec IN SELECT * FROM jsonb_array_elements(p_tags) LOOP
      IF (tag_rec ->> 'id') IS NOT NULL THEN
        v_tag_id := (tag_rec ->> 'id')::integer;
      ELSE
        INSERT INTO public.tags (name, slug)
        VALUES (tag_rec ->> 'name', tag_rec ->> 'slug')
        ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
        RETURNING id INTO v_tag_id;
      END IF;

      INSERT INTO public.component_tags (component_id, tag_id)
      VALUES (p_component_id, v_tag_id)
      ON CONFLICT (component_id, tag_id) DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

-- ============ reload PostgREST schema cache ============
NOTIFY pgrst, 'reload schema';
