BEGIN;

CREATE INDEX auto_index_publications_active_component
  ON public.auto_index_publications(component_id)
  WHERE delisted_at IS NULL AND superseded_at IS NULL;

CREATE TABLE public.auto_index_creator_claims (
  component_id integer PRIMARY KEY REFERENCES public.components(id),
  source_id bigint NOT NULL,
  item_key text NOT NULL,
  approved_decision_id bigint NOT NULL,
  previous_owner_id text NOT NULL REFERENCES public.users(id),
  target_user_id text NOT NULL REFERENCES public.users(id),
  admin_user_id text NOT NULL REFERENCES public.users(id),
  verification_note text NOT NULL CHECK (length(btrim(verification_note)) BETWEEN 1 AND 2000),
  claimed_at timestamptz NOT NULL DEFAULT now(),
  FOREIGN KEY (source_id,item_key,approved_decision_id)
    REFERENCES public.auto_index_publications(source_id,item_key,approved_decision_id),
  CHECK (previous_owner_id<>target_user_id)
);
ALTER TABLE public.auto_index_creator_claims ENABLE ROW LEVEL SECURITY;
CREATE INDEX auto_index_creator_claims_publication_fk
  ON public.auto_index_creator_claims(source_id,item_key,approved_decision_id);
REVOKE ALL ON public.auto_index_creator_claims FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.auto_index_creator_claims TO service_role;
CREATE TRIGGER auto_index_creator_claims_immutable BEFORE UPDATE OR DELETE ON public.auto_index_creator_claims
FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();

CREATE FUNCTION public.auto_index_claim_owner_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF OLD.user_id IS DISTINCT FROM NEW.user_id AND EXISTS (
    SELECT 1 FROM public.auto_index_publications p WHERE p.component_id=OLD.id
      AND p.delisted_at IS NULL AND p.superseded_at IS NULL
  ) AND NOT EXISTS (
    SELECT 1 FROM public.auto_index_creator_claims claim
      WHERE claim.component_id=OLD.id AND claim.previous_owner_id=OLD.user_id
        AND claim.target_user_id=NEW.user_id
  ) THEN
    RAISE EXCEPTION 'active auto-index ownership requires a claim';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_claim_owner_guard BEFORE UPDATE OF user_id ON public.components
FOR EACH ROW EXECUTE FUNCTION public.auto_index_claim_owner_guard();
REVOKE ALL ON FUNCTION public.auto_index_claim_owner_guard() FROM PUBLIC,anon,authenticated;

-- A claimed row may be revoked for a rejected license, but never superseded by a refresh.
CREATE OR REPLACE FUNCTION public.auto_index_publication_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates; d public.auto_index_decisions; revoked public.auto_index_decisions; revoked_candidate public.auto_index_candidates;
BEGIN
  SELECT * INTO d FROM public.auto_index_decisions WHERE id=NEW.approved_decision_id;
  SELECT * INTO c FROM public.auto_index_candidates WHERE id=d.candidate_id;
  IF d.outcome IS DISTINCT FROM 'approved' OR c.source_id IS DISTINCT FROM NEW.source_id
     OR c.item_key IS DISTINCT FROM NEW.item_key
     OR NOT public.auto_index_candidate_provenance_complete(c.id)
     OR EXISTS (SELECT 1 FROM public.auto_index_sources s WHERE s.id=NEW.source_id AND s.opted_out)
     OR NOT EXISTS (SELECT 1 FROM public.components x JOIN public.users u ON u.id=x.user_id
                    JOIN public.auto_index_sources s ON s.id=NEW.source_id
                    WHERE x.id=NEW.component_id
                    AND ( (u.id=s.vendor_user_id AND u.manually_added)
                       OR EXISTS (SELECT 1 FROM public.auto_index_creator_claims claim
                         WHERE claim.component_id=x.id AND claim.target_user_id=u.id
                         AND claim.source_id=NEW.source_id AND claim.item_key=NEW.item_key
                         AND claim.approved_decision_id=NEW.approved_decision_id))
                    AND ((TG_OP='INSERT' AND NOT x.is_public) OR (TG_OP='UPDATE' AND x.is_public))
                    AND x.registry='auto-index' AND x.code<>'N/A') THEN
    RAISE EXCEPTION 'invalid auto-index publication';
  END IF;
  IF TG_OP='UPDATE' THEN
    IF OLD.delisted_at IS NOT NULL OR OLD.superseded_at IS NOT NULL
       OR (NEW.source_id,NEW.item_key,NEW.component_id,NEW.approved_decision_id,NEW.published_at)
          IS DISTINCT FROM (OLD.source_id,OLD.item_key,OLD.component_id,OLD.approved_decision_id,OLD.published_at)
       OR NOT ((NEW.delisted_decision_id IS NOT NULL AND NEW.delisted_at IS NOT NULL AND NEW.superseded_at IS NULL)
            OR (NEW.delisted_decision_id IS NULL AND NEW.delisted_at IS NULL AND NEW.superseded_at IS NOT NULL)) THEN
      RAISE EXCEPTION 'publication history permits one terminal transition only';
    END IF;
    IF NEW.superseded_at IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.auto_index_creator_claims claim WHERE claim.component_id=NEW.component_id
    ) THEN
      RAISE EXCEPTION 'claimed publication cannot be superseded';
    END IF;
  ELSIF NEW.delisted_decision_id IS NOT NULL OR NEW.delisted_at IS NOT NULL OR NEW.superseded_at IS NOT NULL THEN
    RAISE EXCEPTION 'new publication must start active';
  END IF;
  IF NEW.delisted_decision_id IS NOT NULL THEN
    SELECT * INTO revoked FROM public.auto_index_decisions WHERE id=NEW.delisted_decision_id;
    SELECT * INTO revoked_candidate FROM public.auto_index_candidates WHERE id=revoked.candidate_id;
    IF revoked.outcome IS DISTINCT FROM 'disqualified' OR revoked.reason_code IS DISTINCT FROM 'license_rejected'
       OR revoked_candidate.source_id IS DISTINCT FROM NEW.source_id
       OR revoked_candidate.item_key IS DISTINCT FROM NEW.item_key THEN
      RAISE EXCEPTION 'invalid delist decision';
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION public.claim_auto_index_creator(
  p_component_id integer,p_target_user_id text,p_admin_user_id text,p_verification_note text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE publication public.auto_index_publications; source public.auto_index_sources;
  component public.components; demo_count integer; updated_count integer;
BEGIN
  IF p_component_id IS NULL OR p_target_user_id !~ '^user_[A-Za-z0-9]+$'
     OR p_admin_user_id !~ '^user_[A-Za-z0-9]+$'
     OR length(btrim(p_verification_note)) NOT BETWEEN 1 AND 2000 THEN
    RAISE EXCEPTION 'invalid claim request';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=p_admin_user_id AND is_admin) THEN
    RAISE EXCEPTION 'claim actor is not an admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id=p_target_user_id AND NOT manually_added) THEN
    RAISE EXCEPTION 'claim target is not a signed-in user';
  END IF;
  SELECT s.* INTO source FROM public.auto_index_publications p
    JOIN public.auto_index_sources s ON s.id=p.source_id
    WHERE p.component_id=p_component_id AND p.delisted_at IS NULL AND p.superseded_at IS NULL
    FOR UPDATE OF s;
  IF NOT FOUND THEN RAISE EXCEPTION 'active publication not found'; END IF;
  SELECT * INTO publication FROM public.auto_index_publications p
    WHERE p.component_id=p_component_id AND p.source_id=source.id
      AND p.delisted_at IS NULL AND p.superseded_at IS NULL FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'active publication changed'; END IF;
  SELECT * INTO component FROM public.components WHERE id=p_component_id FOR UPDATE;
  IF component.user_id IS DISTINCT FROM source.vendor_user_id OR component.registry<>'auto-index'
     OR NOT component.is_public OR EXISTS (
       SELECT 1 FROM public.auto_index_creator_claims WHERE component_id=p_component_id
     ) OR EXISTS (
       SELECT 1 FROM public.components other WHERE other.user_id=p_target_user_id
         AND lower(other.component_slug)=lower(component.component_slug)
     ) THEN RAISE EXCEPTION 'component cannot be claimed'; END IF;
  PERFORM pg_catalog.pg_advisory_xact_lock(20261005,pg_catalog.hashtext(p_target_user_id||':'||lower(component.component_slug)));
  IF EXISTS (SELECT 1 FROM public.components other WHERE other.user_id=p_target_user_id
    AND lower(other.component_slug)=lower(component.component_slug)) THEN
    RAISE EXCEPTION 'claim target already owns this slug';
  END IF;
  SELECT count(*) INTO demo_count FROM public.demos WHERE component_id=p_component_id;
  IF demo_count<1 OR EXISTS (
    SELECT 1 FROM public.demos WHERE component_id=p_component_id AND user_id<>source.vendor_user_id
  ) THEN RAISE EXCEPTION 'publication demos changed'; END IF;
  INSERT INTO public.auto_index_creator_claims(component_id,source_id,item_key,approved_decision_id,
    previous_owner_id,target_user_id,admin_user_id,verification_note)
  VALUES(p_component_id,publication.source_id,publication.item_key,publication.approved_decision_id,
    source.vendor_user_id,p_target_user_id,p_admin_user_id,btrim(p_verification_note));
  UPDATE public.components SET user_id=p_target_user_id WHERE id=p_component_id AND user_id=source.vendor_user_id;
  GET DIAGNOSTICS updated_count=ROW_COUNT;
  IF updated_count<>1 THEN RAISE EXCEPTION 'component owner changed'; END IF;
  UPDATE public.demos SET user_id=p_target_user_id WHERE component_id=p_component_id AND user_id=source.vendor_user_id;
  GET DIAGNOSTICS updated_count=ROW_COUNT;
  IF updated_count<>demo_count THEN RAISE EXCEPTION 'publication demos changed'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.claim_auto_index_creator(integer,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_auto_index_creator(integer,text,text,text) TO service_role;

CREATE FUNCTION public.list_auto_index_claims(p_limit integer,p_offset integer)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
WITH active AS (
  SELECT p.component_id,p.published_at,c.name,c.component_slug,c.preview_url,c.user_id,
    d.id AS demo_id,s.id AS source_id,s.owner_label,s.canonical_url,
    u.username,u.display_name,claim.claimed_at
  FROM public.auto_index_publications p
  JOIN public.components c ON c.id=p.component_id AND c.is_public AND c.registry='auto-index'
  JOIN LATERAL (SELECT id FROM public.demos
    WHERE component_id=c.id AND demo_slug='default' ORDER BY id LIMIT 1) d ON true
  JOIN public.auto_index_sources s ON s.id=p.source_id
  JOIN public.users u ON u.id=c.user_id
  LEFT JOIN public.auto_index_creator_claims claim ON claim.component_id=c.id
  WHERE p.delisted_at IS NULL AND p.superseded_at IS NULL
), page AS (
  SELECT * FROM active ORDER BY published_at DESC,component_id DESC LIMIT p_limit OFFSET p_offset
)
SELECT jsonb_build_object('total',(SELECT count(*) FROM active),
  'items',coalesce((SELECT jsonb_agg(jsonb_build_object(
    'componentId',component_id,'demoId',demo_id,'componentName',name,'componentSlug',component_slug,
    'previewUrl',preview_url,'sourceLabel',owner_label,'sourceUrl',canonical_url,'sourceId',source_id,
    'ownerId',user_id,'ownerUsername',username,'ownerDisplayName',display_name,
    'publishedAt',published_at,'claimedAt',claimed_at) ORDER BY published_at DESC,component_id DESC)
    FROM page),'[]'::jsonb))
$$;
REVOKE ALL ON FUNCTION public.list_auto_index_claims(integer,integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.list_auto_index_claims(integer,integer) TO service_role;

COMMIT;
