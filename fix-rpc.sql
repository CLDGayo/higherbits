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
SECURITY DEFINER
SET search_path = public
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
