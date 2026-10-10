BEGIN;

CREATE TABLE public.auto_index_admin_state (
  component_id integer PRIMARY KEY REFERENCES public.components(id),
  status text CHECK (status IS NULL OR status IN ('on_review','posted','featured')),
  archived_at timestamptz,
  updated_by text NOT NULL REFERENCES public.users(id),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.auto_index_admin_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auto_index_admin_state FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT,INSERT,UPDATE ON public.auto_index_admin_state TO service_role;

-- Keep mutable admin metadata separate from the append-only publication evidence.
CREATE FUNCTION public.admin_update_auto_index_state(
  p_component_id integer,
  p_admin_user_id text,
  p_status text DEFAULT NULL,
  p_is_public boolean DEFAULT NULL,
  p_archive boolean DEFAULT false
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_state public.auto_index_admin_state;
BEGIN
  IF p_component_id IS NULL OR p_admin_user_id IS NULL OR
     (p_status IS NULL AND p_is_public IS NULL AND NOT p_archive) OR
     (p_archive AND (p_status IS NOT NULL OR p_is_public IS NOT NULL)) OR
     (p_status IS NOT NULL AND p_status NOT IN ('no_status','on_review','posted','featured')) THEN
    RAISE EXCEPTION 'invalid auto-index admin update';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=p_admin_user_id AND is_admin) THEN
    RAISE EXCEPTION 'auto-index admin actor is not authorized';
  END IF;
  PERFORM 1 FROM public.components
    WHERE id=p_component_id AND registry='auto-index' FOR UPDATE;
  IF NOT FOUND OR NOT EXISTS (
    SELECT 1 FROM public.auto_index_publications
    WHERE component_id=p_component_id AND delisted_at IS NULL AND superseded_at IS NULL
  ) THEN
    RAISE EXCEPTION 'active auto-index component not found';
  END IF;
  SELECT * INTO current_state FROM public.auto_index_admin_state
    WHERE component_id=p_component_id FOR UPDATE;
  IF current_state.archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'auto-index component is archived';
  END IF;

  IF p_archive THEN
    UPDATE public.components SET is_public=false WHERE id=p_component_id;
  ELSIF p_is_public IS NOT NULL THEN
    UPDATE public.components SET is_public=p_is_public WHERE id=p_component_id;
  END IF;

  INSERT INTO public.auto_index_admin_state(component_id,status,archived_at,updated_by)
  VALUES (p_component_id,NULLIF(p_status,'no_status'),CASE WHEN p_archive THEN now() END,p_admin_user_id)
  ON CONFLICT (component_id) DO UPDATE SET
    status=CASE WHEN p_status IS NULL THEN auto_index_admin_state.status ELSE NULLIF(p_status,'no_status') END,
    archived_at=CASE WHEN p_archive THEN COALESCE(auto_index_admin_state.archived_at,now()) ELSE auto_index_admin_state.archived_at END,
    updated_by=EXCLUDED.updated_by,
    updated_at=now();
END $$;
REVOKE ALL ON FUNCTION public.admin_update_auto_index_state(integer,text,text,boolean,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_auto_index_state(integer,text,text,boolean,boolean) TO service_role;

CREATE FUNCTION public.list_auto_index_admin_items(p_limit integer,p_offset integer,p_status text)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
WITH active AS (
  SELECT p.component_id,p.published_at,c.name,c.component_slug,c.preview_url,c.user_id,c.is_public,
    d.id AS demo_id,d.name AS demo_name,d.demo_slug,COALESCE(d.bundle_html_url,c.bundle_html_url) AS bundle_html_url,
    s.id AS source_id,s.owner_label,s.canonical_url,
    u.username,u.display_name,claim.claimed_at,state.status
  FROM public.auto_index_publications p
  JOIN public.components c ON c.id=p.component_id AND c.registry='auto-index'
  JOIN LATERAL (
    SELECT id,name,demo_slug,bundle_html_url FROM public.demos
    WHERE component_id=c.id
    ORDER BY CASE WHEN demo_slug='default' THEN 0 ELSE 1 END,id
    LIMIT 1
  ) d ON true
  JOIN public.auto_index_sources s ON s.id=p.source_id
  JOIN public.users u ON u.id=c.user_id
  LEFT JOIN public.auto_index_creator_claims claim ON claim.component_id=c.id
  LEFT JOIN public.auto_index_admin_state state ON state.component_id=c.id
  WHERE p.delisted_at IS NULL AND p.superseded_at IS NULL
    AND state.archived_at IS NULL
    AND (p_status='all' OR (p_status='null' AND state.status IS NULL) OR state.status=p_status)
), page AS (
  SELECT * FROM active ORDER BY published_at DESC,component_id DESC LIMIT p_limit OFFSET p_offset
)
SELECT jsonb_build_object('total',(SELECT count(*) FROM active),
  'items',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'componentId',component_id,'demoId',demo_id,'componentName',name,'componentSlug',component_slug,
    'previewUrl',preview_url,'bundleHtmlUrl',bundle_html_url,'demoName',demo_name,'demoSlug',demo_slug,
    'sourceLabel',owner_label,'sourceUrl',canonical_url,'sourceId',source_id,
    'ownerId',user_id,'ownerUsername',username,'ownerDisplayName',display_name,
    'publishedAt',published_at,'claimedAt',claimed_at,'submissionStatus',status,'isPublic',is_public)
    ORDER BY published_at DESC,component_id DESC) FROM page),'[]'::jsonb))
$$;
REVOKE ALL ON FUNCTION public.list_auto_index_admin_items(integer,integer,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_auto_index_admin_items(integer,integer,text) TO service_role;

COMMIT;
