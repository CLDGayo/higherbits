-- Match the public get_demos_list_v2 tag predicate without exposing hidden demos.
CREATE OR REPLACE FUNCTION public.get_public_demo_tag_counts()
RETURNS TABLE (slug text, demo_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, pg_temp
AS $$
  SELECT t.slug, COUNT(DISTINCT d.id)::bigint AS demo_count
  FROM public.demo_tags dt
  JOIN public.tags t ON t.id = dt.tag_id
  JOIN public.demos d ON d.id = dt.demo_id
  JOIN public.components c ON c.id = d.component_id
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
  WHERE c.is_public = true
    AND (c.registry IS DISTINCT FROM 'auto-index'
      OR public.auto_index_component_has_current_approval(c.id))
  GROUP BY t.slug;
$$;

REVOKE ALL ON FUNCTION public.get_public_demo_tag_counts() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_public_demo_tag_counts() TO service_role;
