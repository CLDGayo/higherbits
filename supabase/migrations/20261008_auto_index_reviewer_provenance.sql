BEGIN;

-- This schema establishes the immutable provenance contract, but approval remains
-- intentionally disabled until the reviewer-only RPC and direct DB identity are
-- deployed and verified. In particular, legacy service-role code must not be
-- able to turn this table into an approval bypass.
CREATE TABLE public.auto_index_candidate_publication_metadata (
  candidate_id bigint PRIMARY KEY REFERENCES public.auto_index_candidates(id),
  emitter text NOT NULL CHECK (emitter ~ '^[a-z0-9][a-z0-9-]{0,37}$'),
  component_slug text NOT NULL CHECK (component_slug ~ '^[a-z0-9][a-z0-9-]{0,79}$'),
  preview_asset_slug text NOT NULL CHECK (preview_asset_slug ~ '^[a-z0-9][a-z0-9-]{0,119}$'),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 160),
  description text NOT NULL CHECK (length(description)<=1000),
  dependencies jsonb NOT NULL CHECK (jsonb_typeof(dependencies)='object' AND octet_length(dependencies::text)<=65536),
  component_preview_url text NOT NULL CHECK (component_preview_url ~ '^https://higherbits[.]dev/auto-index/[A-Za-z0-9_-]+[.](svg|png)$'),
  demo_preview_url text NOT NULL CHECK (demo_preview_url ~ '^https://higherbits[.]dev/auto-index/[A-Za-z0-9_-]+[.]html$'),
  bundle_html_url text NOT NULL CHECK (bundle_html_url ~ '^https://higherbits[.]dev/auto-index/[A-Za-z0-9_-]+[.]html$'),
  compiled_css text CHECK (compiled_css IS NULL OR octet_length(compiled_css)<=1048576),
  asset_references jsonb NOT NULL CHECK (jsonb_typeof(asset_references)='array' AND octet_length(asset_references::text)<=65536),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.auto_index_review_provenance (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  candidate_id bigint NOT NULL UNIQUE REFERENCES public.auto_index_candidates(id),
  candidate_fingerprint bytea NOT NULL CHECK (octet_length(candidate_fingerprint)=32),
  reviewer_user_id text NOT NULL REFERENCES public.users(id),
  reviewed_at timestamptz NOT NULL,
  checklist_version text NOT NULL CHECK (checklist_version='component-review-v2'),
  checklist_answers jsonb NOT NULL CHECK (
    jsonb_typeof(checklist_answers)='object' AND
    checklist_answers ?& ARRAY[
      'source_identity_verified',
      'source_bytes_verified',
      'license_and_notice_verified',
      'dependencies_verified',
      'demo_and_assets_verified',
      'saved_prompts_verified',
      'publication_metadata_verified'
    ] AND
    checklist_answers-ARRAY[
      'source_identity_verified',
      'source_bytes_verified',
      'license_and_notice_verified',
      'dependencies_verified',
      'demo_and_assets_verified',
      'saved_prompts_verified',
      'publication_metadata_verified'
    ]='{}'::jsonb AND
    checklist_answers->'source_identity_verified'='true'::jsonb AND
    checklist_answers->'source_bytes_verified'='true'::jsonb AND
    checklist_answers->'license_and_notice_verified'='true'::jsonb AND
    checklist_answers->'dependencies_verified'='true'::jsonb AND
    checklist_answers->'demo_and_assets_verified'='true'::jsonb AND
    checklist_answers->'saved_prompts_verified'='true'::jsonb AND
    checklist_answers->'publication_metadata_verified'='true'::jsonb
  ),
  idempotency_key text NOT NULL UNIQUE CHECK (length(idempotency_key) BETWEEN 1 AND 128),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (length(btrim(reviewer_user_id))>0)
);

ALTER TABLE public.auto_index_decisions
  ADD COLUMN review_provenance_id bigint UNIQUE
    REFERENCES public.auto_index_review_provenance(id);

-- A reviewed successor adopts the same upstream item without rewriting its
-- prior public payload. The predecessor publication remains immutable; this
-- append-only relation identifies which publication is currently authoritative.
CREATE TABLE public.auto_index_publication_supersessions (
  legacy_source_id bigint NOT NULL,
  legacy_item_key text NOT NULL,
  legacy_approved_decision_id bigint NOT NULL,
  successor_source_id bigint NOT NULL,
  successor_item_key text NOT NULL,
  successor_approved_decision_id bigint NOT NULL,
  adoption_provenance_id bigint NOT NULL UNIQUE
    REFERENCES public.auto_index_review_provenance(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (legacy_source_id,legacy_item_key,legacy_approved_decision_id),
  UNIQUE (successor_source_id,successor_item_key,successor_approved_decision_id),
  FOREIGN KEY (legacy_source_id,legacy_item_key,legacy_approved_decision_id)
    REFERENCES public.auto_index_publications(source_id,item_key,approved_decision_id),
  FOREIGN KEY (successor_source_id,successor_item_key,successor_approved_decision_id)
    REFERENCES public.auto_index_publications(source_id,item_key,approved_decision_id),
  CHECK (legacy_source_id=successor_source_id AND legacy_item_key=successor_item_key),
  CHECK ((legacy_source_id,legacy_item_key,legacy_approved_decision_id)<>
    (successor_source_id,successor_item_key,successor_approved_decision_id))
);
ALTER TABLE public.auto_index_publication_supersessions ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auto_index_publication_supersessions FROM PUBLIC,anon,authenticated,service_role,auto_index_stage,auto_index_reviewer;
GRANT SELECT ON public.auto_index_publication_supersessions TO service_role;

CREATE FUNCTION public.auto_index_publication_supersession_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE legacy public.auto_index_publications; successor public.auto_index_publications;
  decision public.auto_index_decisions; candidate public.auto_index_candidates;
  proof public.auto_index_review_provenance;
BEGIN
  IF TG_OP<>'INSERT' THEN RAISE EXCEPTION 'publication supersessions are append-only'; END IF;
  IF session_user<>'auto_index_reviewer' THEN RAISE EXCEPTION 'reviewer identity required'; END IF;
  SELECT * INTO STRICT legacy FROM public.auto_index_publications p
    WHERE p.source_id=NEW.legacy_source_id AND p.item_key=NEW.legacy_item_key
      AND p.approved_decision_id=NEW.legacy_approved_decision_id;
  SELECT * INTO STRICT successor FROM public.auto_index_publications p
    WHERE p.source_id=NEW.successor_source_id AND p.item_key=NEW.successor_item_key
      AND p.approved_decision_id=NEW.successor_approved_decision_id;
  SELECT * INTO STRICT decision FROM public.auto_index_decisions d
    WHERE d.id=successor.approved_decision_id AND d.outcome='approved';
  SELECT * INTO STRICT candidate FROM public.auto_index_candidates c WHERE c.id=decision.candidate_id;
  SELECT * INTO STRICT proof FROM public.auto_index_review_provenance p
    WHERE p.id=NEW.adoption_provenance_id AND p.id=decision.review_provenance_id
      AND p.candidate_id=decision.candidate_id;
  IF legacy.source_id<>successor.source_id OR legacy.item_key<>successor.item_key OR
     legacy.approved_decision_id=successor.approved_decision_id OR
     legacy.delisted_at IS NOT NULL OR legacy.superseded_at IS NULL OR
     successor.delisted_at IS NOT NULL OR successor.superseded_at IS NOT NULL OR
     legacy.component_id=successor.component_id OR
     candidate.source_id<>successor.source_id OR candidate.item_key<>successor.item_key OR
     proof.checklist_version IS DISTINCT FROM 'component-review-v2' OR
     length(btrim(proof.reviewer_user_id))=0 THEN
    RAISE EXCEPTION 'invalid publication adoption';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_publication_supersession_guard
  BEFORE INSERT OR UPDATE OR DELETE ON public.auto_index_publication_supersessions
  FOR EACH ROW EXECUTE FUNCTION public.auto_index_publication_supersession_guard();

-- Freeze the exact legacy auto-index publication set that was already public
-- when this migration began. This is a compatibility allowlist, not reviewer
-- provenance; current publication/source/component state can only shrink it.
CREATE TABLE public.auto_index_legacy_publication_bridge (
  source_id bigint NOT NULL,
  item_key text NOT NULL,
  approved_decision_id bigint NOT NULL,
  component_id integer NOT NULL REFERENCES public.components(id),
  PRIMARY KEY (source_id,item_key,approved_decision_id),
  FOREIGN KEY (source_id,item_key,approved_decision_id)
    REFERENCES public.auto_index_publications(source_id,item_key,approved_decision_id)
);
INSERT INTO public.auto_index_legacy_publication_bridge(source_id,item_key,approved_decision_id,component_id)
SELECT publication.source_id,publication.item_key,publication.approved_decision_id,publication.component_id
FROM public.auto_index_publications publication
JOIN public.components component ON component.id=publication.component_id
JOIN public.auto_index_sources source ON source.id=publication.source_id
JOIN public.auto_index_decisions decision ON decision.id=publication.approved_decision_id
JOIN public.auto_index_candidates candidate ON candidate.id=decision.candidate_id
WHERE publication.delisted_at IS NULL AND publication.superseded_at IS NULL
  AND component.is_public IS TRUE AND component.registry='auto-index'
  AND source.opted_out IS FALSE AND decision.outcome='approved'
  AND decision.review_provenance_id IS NULL
  AND candidate.source_id=publication.source_id AND candidate.item_key=publication.item_key
  AND NOT EXISTS (SELECT 1 FROM public.auto_index_publication_supersessions supersession
    WHERE supersession.legacy_source_id=publication.source_id
      AND supersession.legacy_item_key=publication.item_key
      AND supersession.legacy_approved_decision_id=publication.approved_decision_id);
ALTER TABLE public.auto_index_legacy_publication_bridge ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auto_index_legacy_publication_bridge
  FROM PUBLIC,anon,authenticated,service_role,auto_index_stage,auto_index_reviewer;
CREATE TRIGGER auto_index_legacy_publication_bridge_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.auto_index_legacy_publication_bridge
  FOR EACH ROW EXECUTE FUNCTION public.auto_index_history_immutable();

-- Public readers serve the current component/demo rows. Keep those rows equal
-- to the payload that was reviewed; refreshed versions use new rows linked by
-- auto_index_publication_supersessions.
CREATE FUNCTION public.auto_index_reviewed_payload_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE old_payload jsonb; new_payload jsonb;
BEGIN
  IF TG_TABLE_NAME='components' THEN
    IF TG_OP='DELETE' THEN
      IF EXISTS (SELECT 1 FROM public.auto_index_publications publication
          WHERE publication.component_id=OLD.id) THEN
        RAISE EXCEPTION 'reviewed auto-index component payload cannot be deleted';
      END IF;
      RETURN OLD;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.auto_index_publications publication
        WHERE publication.component_id=OLD.id) THEN
      RETURN NEW;
    END IF;
    old_payload:=to_jsonb(OLD)-ARRAY['user_id','updated_at','fts',
      'downloads_count','likes_count','is_public']::text[];
    new_payload:=to_jsonb(NEW)-ARRAY['user_id','updated_at','fts',
      'downloads_count','likes_count','is_public']::text[];
    IF old_payload IS DISTINCT FROM new_payload THEN
      RAISE EXCEPTION 'reviewed auto-index component payload is immutable';
    END IF;
  ELSIF TG_TABLE_NAME='demos' THEN
    IF TG_OP='INSERT' THEN
      IF NEW.component_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.auto_index_publications publication
          WHERE publication.component_id=NEW.component_id) THEN
        RAISE EXCEPTION 'unreviewed demo cannot be added to a reviewed auto-index component';
      END IF;
      RETURN NEW;
    END IF;
    IF TG_OP='DELETE' THEN
      IF OLD.component_id IS NOT NULL AND EXISTS (SELECT 1 FROM public.auto_index_publications publication
          WHERE publication.component_id=OLD.component_id) THEN
        RAISE EXCEPTION 'reviewed auto-index demo payload cannot be deleted';
      END IF;
      RETURN OLD;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.auto_index_publications publication
        WHERE publication.component_id IN (OLD.component_id,NEW.component_id)) THEN
      RETURN NEW;
    END IF;
    old_payload:=to_jsonb(OLD)-ARRAY['user_id','updated_at','fts',
      'embedding','embedding_oai','bookmarks_count']::text[];
    new_payload:=to_jsonb(NEW)-ARRAY['user_id','updated_at','fts',
      'embedding','embedding_oai','bookmarks_count']::text[];
    IF old_payload IS DISTINCT FROM new_payload THEN
      RAISE EXCEPTION 'reviewed auto-index demo payload is immutable';
    END IF;
  ELSE
    RAISE EXCEPTION 'unsupported table for reviewed payload guard';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_reviewed_component_payload_guard
  BEFORE UPDATE OF id,created_at,component_names,code,compiled_css,bundle_hash,bundle_html_url,component_slug,demo_code,
    demo_dependencies,demo_direct_registry_dependencies,dependencies,description,direct_registry_dependencies,
    global_css_extension,hunter_username,index_css_url,license,name,payment_url,preview_url,
    pro_preview_image_url,registry,registry_url,sandbox_id,tailwind_config_extension,video_url,website_url
    OR DELETE ON public.components
  FOR EACH ROW EXECUTE FUNCTION public.auto_index_reviewed_payload_guard();
CREATE TRIGGER auto_index_reviewed_demo_payload_guard
  BEFORE INSERT OR UPDATE OF id,created_at,component_id,bundle_hash,bundle_html_url,demo_code,demo_dependencies,
    demo_direct_registry_dependencies,demo_slug,name,preview_url,pro_preview_image_url,video_url,
    compiled_css,ghl_html_content,ghl_source_fingerprint OR DELETE ON public.demos
  FOR EACH ROW EXECUTE FUNCTION public.auto_index_reviewed_payload_guard();

-- Keep the original partial unique index. A successor transition terminally
-- marks its predecessor before inserting the replacement, within one transaction.

ALTER TABLE public.auto_index_review_provenance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_index_candidate_publication_metadata ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.auto_index_review_provenance FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.auto_index_review_provenance TO service_role;
REVOKE ALL ON public.auto_index_candidate_publication_metadata FROM PUBLIC,anon,authenticated,service_role;
GRANT SELECT ON public.auto_index_candidate_publication_metadata TO service_role;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.auto_index_decisions FROM service_role;
GRANT SELECT ON public.auto_index_decisions TO service_role;
REVOKE ALL ON SEQUENCE public.auto_index_review_provenance_id_seq FROM PUBLIC,anon,authenticated,service_role;
REVOKE USAGE ON SEQUENCE public.auto_index_decisions_id_seq FROM service_role;

CREATE FUNCTION public.auto_index_review_provenance_immutable() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
BEGIN
  RAISE EXCEPTION 'auto-index review provenance is append-only';
END $$;
CREATE TRIGGER auto_index_review_provenance_immutable
  BEFORE UPDATE OR DELETE ON public.auto_index_review_provenance
  FOR EACH ROW EXECUTE FUNCTION public.auto_index_review_provenance_immutable();
CREATE TRIGGER auto_index_publication_metadata_immutable
  BEFORE UPDATE OR DELETE ON public.auto_index_candidate_publication_metadata
  FOR EACH ROW EXECUTE FUNCTION public.auto_index_review_provenance_immutable();

CREATE FUNCTION public.auto_index_candidate_review_fingerprint(p_candidate_id bigint) RETURNS bytea
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
  SELECT extensions.digest(convert_to(jsonb_build_object(
    'source',to_jsonb(s),'candidate',to_jsonb(c),
    'files',coalesce((SELECT jsonb_agg(to_jsonb(f) ORDER BY f.path COLLATE "C")
      FROM public.auto_index_candidate_files f WHERE f.candidate_id=c.id),'[]'::jsonb),
    'demo',to_jsonb(d),
    'assets',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.asset_key COLLATE "C")
      FROM public.auto_index_candidate_assets a WHERE a.candidate_id=c.id),'[]'::jsonb),
    'publicationMetadata',to_jsonb(m)
  )::text,'UTF8'),'sha256')
  FROM public.auto_index_candidates c
  JOIN public.auto_index_sources s ON s.id=c.source_id
  JOIN public.auto_index_candidate_demos d ON d.candidate_id=c.id
  JOIN public.auto_index_candidate_publication_metadata m ON m.candidate_id=c.id
  WHERE c.id=p_candidate_id
$$;

-- Read-only provenance gate for existing server-side consumers. A frozen
-- migration-time allowlist preserves the pre-existing public legacy set; all
-- later publications must carry valid reviewer provenance.
CREATE FUNCTION public.auto_index_component_has_current_approval(p_component_id bigint) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE publication public.auto_index_publications; source public.auto_index_sources;
  candidate public.auto_index_candidates; decision public.auto_index_decisions;
  proof public.auto_index_review_provenance;
BEGIN
  SELECT * INTO publication FROM public.auto_index_publications p
    WHERE p.component_id=p_component_id AND p.delisted_at IS NULL AND p.superseded_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_publication_supersessions supersession
        WHERE supersession.legacy_source_id=p.source_id AND supersession.legacy_item_key=p.item_key
          AND supersession.legacy_approved_decision_id=p.approved_decision_id);
  IF NOT FOUND THEN RETURN false; END IF;
  SELECT * INTO source FROM public.auto_index_sources s WHERE s.id=publication.source_id;
  IF source.id IS NULL OR source.opted_out THEN RETURN false; END IF;
  SELECT * INTO decision FROM public.auto_index_decisions d WHERE d.id=publication.approved_decision_id;
  IF NOT FOUND OR decision.outcome IS DISTINCT FROM 'approved' THEN RETURN false; END IF;
  SELECT * INTO candidate FROM public.auto_index_candidates c WHERE c.id=decision.candidate_id;
  IF NOT FOUND OR candidate.source_id IS DISTINCT FROM publication.source_id OR
     candidate.item_key IS DISTINCT FROM publication.item_key THEN RETURN false; END IF;
  IF decision.review_provenance_id IS NULL THEN
    RETURN EXISTS (
      SELECT 1 FROM public.auto_index_legacy_publication_bridge legacy
      JOIN public.components component ON component.id=legacy.component_id
      WHERE legacy.source_id=publication.source_id AND legacy.item_key=publication.item_key
        AND legacy.approved_decision_id=publication.approved_decision_id
        AND legacy.component_id=publication.component_id AND component.id=p_component_id
        AND component.is_public IS TRUE AND component.registry='auto-index'
    );
  END IF;
  SELECT * INTO proof FROM public.auto_index_review_provenance p
    WHERE p.id=decision.review_provenance_id AND p.candidate_id=candidate.id;
  IF NOT FOUND OR proof.reviewer_user_id IS NULL OR length(btrim(proof.reviewer_user_id))=0 OR
     proof.checklist_version IS DISTINCT FROM 'component-review-v2' OR
     proof.checklist_answers IS DISTINCT FROM jsonb_build_object(
       'source_identity_verified',true,'source_bytes_verified',true,'license_and_notice_verified',true,
       'dependencies_verified',true,'demo_and_assets_verified',true,'saved_prompts_verified',true,
       'publication_metadata_verified',true) OR
     proof.candidate_fingerprint IS DISTINCT FROM public.auto_index_candidate_review_fingerprint(candidate.id) THEN
    RETURN false;
  END IF;
  RETURN true;
END $$;

-- Bounded batch wrapper keeps server-side catalogue/profile readers from
-- making one network round trip per indexed component. The single-item RPC
-- above remains the canonical admission predicate.
CREATE FUNCTION public.auto_index_components_with_current_approval(p_component_ids bigint[]) RETURNS bigint[]
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE approved_ids bigint[];
BEGIN
  IF coalesce(cardinality(p_component_ids),0)>1000 THEN RAISE EXCEPTION 'too many component IDs'; END IF;
  SELECT coalesce(array_agg(allowed.component_id ORDER BY allowed.component_id),'{}'::bigint[])
    INTO approved_ids
  FROM (
    SELECT DISTINCT requested.component_id
    FROM unnest(coalesce(p_component_ids,'{}'::bigint[])) AS requested(component_id)
    WHERE requested.component_id IS NOT NULL
      AND public.auto_index_component_has_current_approval(requested.component_id)
  ) allowed;
  RETURN approved_ids;
END $$;

-- Restrictive policies make every existing/future permissive SELECT policy
-- pass the provenance gate. Owner reads remain available for private studio
-- work; ordinary public components remain visible as before.
CREATE FUNCTION public.auto_index_component_public_select_allowed(p_component_id bigint) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public SET row_security=off AS $$
DECLARE component public.components;
BEGIN
  SELECT * INTO component FROM public.components WHERE id=p_component_id;
  IF NOT FOUND OR component.is_public IS DISTINCT FROM true THEN RETURN false; END IF;
  IF component.registry IS DISTINCT FROM 'auto-index' THEN RETURN true; END IF;
  RETURN public.auto_index_component_has_current_approval(component.id);
END $$;
REVOKE ALL ON FUNCTION public.auto_index_component_public_select_allowed(bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.auto_index_component_public_select_allowed(bigint) TO authenticated;

ALTER TABLE public.components ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.demos ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.components,public.demos FROM PUBLIC,anon;
DROP POLICY IF EXISTS "components_select" ON public.components;
CREATE POLICY "components_select" ON public.components AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (is_public=true OR user_id=auth.jwt()->>'sub');
DROP POLICY IF EXISTS components_anon_public_select ON public.components;
CREATE POLICY components_anon_public_select ON public.components AS PERMISSIVE
  FOR SELECT TO anon USING (is_public=true);
DROP POLICY IF EXISTS components_anon_public_provenance_guard ON public.components;
CREATE POLICY components_anon_public_provenance_guard ON public.components AS RESTRICTIVE
  FOR SELECT TO anon USING (public.auto_index_component_public_select_allowed(id));
DROP POLICY IF EXISTS "demos_select" ON public.demos;
CREATE POLICY "demos_select" ON public.demos AS PERMISSIVE
  FOR SELECT TO authenticated
  USING (user_id=auth.jwt()->>'sub' OR component_id IN (
    SELECT id FROM public.components WHERE is_public=true
  ));
DROP POLICY IF EXISTS auto_index_public_provenance_guard ON public.components;
CREATE POLICY auto_index_public_provenance_guard ON public.components AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (user_id=auth.jwt()->>'sub' OR public.auto_index_component_public_select_allowed(id));
DROP POLICY IF EXISTS auto_index_public_provenance_guard ON public.demos;
CREATE POLICY auto_index_public_provenance_guard ON public.demos AS RESTRICTIVE
  FOR SELECT TO authenticated
  USING (user_id=auth.jwt()->>'sub' OR public.auto_index_component_public_select_allowed(component_id));

CREATE FUNCTION public.stage_auto_index_candidate_publication_metadata(
  p_candidate_id bigint,p_component_slug text,p_preview_asset_slug text,p_title text,
  p_description text,p_component_dependencies jsonb,p_component_preview_url text,
  p_demo_preview_url text,p_bundle_html_url text,p_compiled_css text
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates; s public.auto_index_sources; existing public.auto_index_candidate_publication_metadata;
  v_emitter text; v_component_preview text; v_demo_preview text;
  v_bundle text; v_dependencies jsonb; v_assets jsonb; v_normalized_owner text;
  expected_component text; expected_html text;
BEGIN
  IF session_user<>'auto_index_stage' THEN RAISE EXCEPTION 'stage identity required'; END IF;
  IF p_component_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR
     p_preview_asset_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' OR
     p_title IS NULL OR length(btrim(p_title)) NOT BETWEEN 1 AND 160 OR
     p_description IS NULL OR length(p_description)>1000 OR
     (p_compiled_css IS NOT NULL AND octet_length(p_compiled_css)>1000000) THEN
    RAISE EXCEPTION 'invalid publication metadata';
  END IF;
  IF jsonb_typeof(p_component_dependencies) IS DISTINCT FROM 'object' OR
     (SELECT count(*) FROM jsonb_each(p_component_dependencies))>128 OR
     EXISTS (SELECT 1 FROM jsonb_each(p_component_dependencies) dep
       WHERE dep.key !~ '^[a-zA-Z0-9@/_.-]{1,214}$' OR jsonb_typeof(dep.value)<>'string' OR
         length(dep.value#>>'{}') NOT BETWEEN 1 AND 100) THEN
    RAISE EXCEPTION 'invalid component dependencies';
  END IF;
  SELECT * INTO STRICT c FROM public.auto_index_candidates WHERE id=p_candidate_id;
  SELECT * INTO STRICT s FROM public.auto_index_sources WHERE id=c.source_id;
  v_emitter:=CASE
    WHEN s.kind='custom_manifest' AND lower(s.owner_label)='vgpu' THEN 'vgpu'
    WHEN lower(s.owner_label)='8starlabs ui' THEN '8starlabs'
    WHEN lower(s.owner_label)='elsecase' THEN 'elsecase'
    WHEN lower(s.owner_label)='mvpblocks' THEN 'mvpblocks'
    WHEN lower(s.owner_label)='belkacemyerfa' THEN 'belkacemyerfa'
    WHEN lower(s.owner_label)='0xurvish' THEN 'urvish'
    WHEN lower(s.owner_label)='edil-ozi' THEN 'edilozi'
    WHEN lower(s.owner_label)='lina.sameer' THEN 'linasameer'
    ELSE NULL END;
  IF v_emitter IS NULL AND s.kind='official_registry' THEN
    v_normalized_owner:=lower(regexp_replace(btrim(s.owner_label),'[^a-zA-Z0-9]+','-','g'));
    v_emitter:=regexp_replace(v_normalized_owner,'(^-|-$)','','g');
    IF v_emitter !~ '^[a-z0-9][a-z0-9-]{0,37}$' THEN v_emitter:=NULL; END IF;
  END IF;
  IF v_emitter IS NULL THEN RAISE EXCEPTION 'source identity has no staging mapping'; END IF;
  v_component_preview:=p_component_preview_url; v_demo_preview:=p_demo_preview_url;
  v_bundle:=p_bundle_html_url; v_dependencies:=p_component_dependencies;
  SELECT coalesce(jsonb_agg(to_jsonb(a) ORDER BY a.asset_key COLLATE "C"),'[]'::jsonb)
    INTO v_assets FROM public.auto_index_candidate_assets a WHERE a.candidate_id=p_candidate_id;
  IF s.opted_out OR NOT c.dependencies_approved OR NOT public.auto_index_candidate_provenance_complete(c.id) OR
     EXISTS (SELECT 1 FROM public.auto_index_review_provenance p WHERE p.candidate_id=c.id) OR
     jsonb_typeof(v_dependencies) IS DISTINCT FROM 'object' THEN
    RAISE EXCEPTION 'candidate cannot be staged';
  END IF;
  IF v_emitter='8starlabs' THEN
    IF p_preview_asset_slug IS DISTINCT FROM p_component_slug THEN RAISE EXCEPTION 'emitter slug mapping rejected'; END IF;
    expected_component:='/auto-index/'||p_component_slug||'.svg';
    expected_html:='/auto-index/'||p_component_slug||'.html';
  ELSIF v_emitter='elsecase' AND p_component_slug='async-state' AND p_preview_asset_slug='elsecase-async-state' THEN
    expected_component:='/auto-index/elsecase-async-state.svg'; expected_html:='/auto-index/elsecase-async-state.html';
  ELSIF v_emitter='mvpblocks' AND p_component_slug='pulsating-loader' AND p_preview_asset_slug='mvpblocks-pulsating-loader' THEN
    expected_component:='/auto-index/mvpblocks-pulsating-loader.svg'; expected_html:='/auto-index/mvpblocks-pulsating-loader.html';
  ELSIF v_emitter='vgpu' AND p_preview_asset_slug='vgpu-'||p_component_slug THEN
    expected_component:='/auto-index/vgpu-'||p_component_slug||'.png'; expected_html:='/auto-index/vgpu-'||p_component_slug||'.html';
  ELSIF v_emitter IN ('belkacemyerfa','urvish','edilozi','linasameer') AND
      p_preview_asset_slug=v_emitter||'-'||p_component_slug THEN
    expected_component:='/auto-index/'||p_preview_asset_slug||'.png'; expected_html:='/auto-index/'||p_preview_asset_slug||'.html';
  ELSIF s.kind='official_registry' AND p_preview_asset_slug=v_emitter||'-'||p_component_slug THEN
    expected_component:='/auto-index/'||p_preview_asset_slug||'.png'; expected_html:='/auto-index/'||p_preview_asset_slug||'.html';
  ELSE
    RAISE EXCEPTION 'emitter slug mapping rejected';
  END IF;
  IF v_component_preview IS DISTINCT FROM 'https://higherbits.dev'||expected_component OR
     v_demo_preview IS DISTINCT FROM 'https://higherbits.dev'||expected_html OR
     v_bundle IS DISTINCT FROM 'https://higherbits.dev'||expected_html OR
     v_component_preview !~ '^https://higherbits[.]dev/auto-index/[a-z0-9-]+[.](svg|png)$' OR
     v_demo_preview !~ '^https://higherbits[.]dev/auto-index/[a-z0-9-]+[.]html$' OR
     v_bundle !~ '^https://higherbits[.]dev/auto-index/[a-z0-9-]+[.]html$' THEN
    RAISE EXCEPTION 'publication URL or metadata rejected';
  END IF;

  INSERT INTO public.auto_index_candidate_publication_metadata(candidate_id,emitter,component_slug,
    preview_asset_slug,title,description,dependencies,component_preview_url,demo_preview_url,
    bundle_html_url,compiled_css,asset_references)
  VALUES(p_candidate_id,v_emitter,p_component_slug,p_preview_asset_slug,p_title,p_description,v_dependencies,
    v_component_preview,v_demo_preview,v_bundle,p_compiled_css,v_assets)
  ON CONFLICT(candidate_id) DO NOTHING;
  SELECT * INTO STRICT existing FROM public.auto_index_candidate_publication_metadata WHERE candidate_id=p_candidate_id;
  IF existing.emitter IS DISTINCT FROM v_emitter OR existing.component_slug IS DISTINCT FROM p_component_slug OR
     existing.preview_asset_slug IS DISTINCT FROM p_preview_asset_slug OR existing.title IS DISTINCT FROM p_title OR
     existing.description IS DISTINCT FROM p_description OR existing.dependencies IS DISTINCT FROM v_dependencies OR
     existing.component_preview_url IS DISTINCT FROM v_component_preview OR existing.demo_preview_url IS DISTINCT FROM v_demo_preview OR
     existing.bundle_html_url IS DISTINCT FROM v_bundle OR existing.compiled_css IS DISTINCT FROM p_compiled_css OR
     existing.asset_references IS DISTINCT FROM v_assets THEN RAISE EXCEPTION 'publication metadata retry conflict'; END IF;
END $$;

CREATE FUNCTION public.auto_index_admin_review_queue(p_after_candidate_id bigint,p_limit integer) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb;
BEGIN
  IF session_user<>'auto_index_reviewer' THEN RAISE EXCEPTION 'reviewer identity required'; END IF;
  IF p_limit NOT BETWEEN 1 AND 100 OR p_after_candidate_id<0 THEN RAISE EXCEPTION 'invalid queue page'; END IF;
  SELECT jsonb_build_object('items',coalesce(jsonb_agg(jsonb_build_object(
    'candidateId',c.id::text,'itemKey',c.item_key,'revision',c.revision,'sourceLabel',s.owner_label,
    'fingerprint',CASE WHEN ready.ready THEN encode(public.auto_index_candidate_review_fingerprint(c.id),'hex') ELSE NULL END,
    'ready',ready.ready,'holdReason',ready.hold_reason) ORDER BY c.id),'[]'::jsonb),
    'limit',p_limit,'nextAfterId',coalesce(max(c.id),p_after_candidate_id)::text)
    INTO result
  FROM (SELECT candidate.id FROM public.auto_index_candidates candidate
    WHERE candidate.id>p_after_candidate_id
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_review_provenance p WHERE p.candidate_id=candidate.id)
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_decisions d WHERE d.candidate_id=candidate.id AND d.outcome='approved')
    ORDER BY candidate.id LIMIT p_limit) page
  JOIN public.auto_index_candidates c ON c.id=page.id JOIN public.auto_index_sources s ON s.id=c.source_id
  CROSS JOIN LATERAL (SELECT CASE
    WHEN s.opted_out THEN false WHEN NOT c.dependencies_approved THEN false
    WHEN NOT public.auto_index_candidate_provenance_complete(c.id) THEN false
    WHEN NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_publication_metadata m WHERE m.candidate_id=c.id) THEN false
    WHEN NOT EXISTS (SELECT 1 FROM public.auto_index_decisions d WHERE d.candidate_id=c.id AND d.outcome='qualified') THEN false
    WHEN NOT EXISTS (SELECT 1 FROM public.auto_index_refresh_state state WHERE state.source_id=c.source_id AND state.item_key=c.item_key
      AND state.current_generation=c.refresh_generation AND state.latest_revision=c.revision) THEN false
    ELSE true END AS ready,
    CASE WHEN s.opted_out THEN 'source_opted_out'
      WHEN NOT c.dependencies_approved THEN 'dependencies_not_approved'
      WHEN NOT public.auto_index_candidate_provenance_complete(c.id) THEN 'source_or_license_evidence_incomplete'
      WHEN NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_publication_metadata m WHERE m.candidate_id=c.id) THEN 'publication_metadata_missing'
      WHEN NOT EXISTS (SELECT 1 FROM public.auto_index_decisions d WHERE d.candidate_id=c.id AND d.outcome='qualified') THEN 'qualification_missing'
      WHEN NOT EXISTS (SELECT 1 FROM public.auto_index_refresh_state state WHERE state.source_id=c.source_id AND state.item_key=c.item_key
        AND state.current_generation=c.refresh_generation AND state.latest_revision=c.revision) THEN 'candidate_stale'
      ELSE NULL END AS hold_reason) ready;
  RETURN result;
END $$;

CREATE FUNCTION public.auto_index_admin_review_candidate(p_candidate_id bigint) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE result jsonb; c public.auto_index_candidates; s public.auto_index_sources;
  candidate_ready boolean; hold_reason text;
BEGIN
  IF session_user<>'auto_index_reviewer' THEN RAISE EXCEPTION 'reviewer identity required'; END IF;
  SELECT candidate.* INTO c FROM public.auto_index_candidates candidate
    WHERE candidate.id=p_candidate_id
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_review_provenance p WHERE p.candidate_id=candidate.id)
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_decisions d WHERE d.candidate_id=candidate.id AND d.outcome='approved');
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT * INTO STRICT s FROM public.auto_index_sources WHERE id=c.source_id;
  candidate_ready:=true;
  IF s.opted_out THEN candidate_ready:=false; hold_reason:='source_opted_out';
  ELSIF NOT c.dependencies_approved THEN candidate_ready:=false; hold_reason:='dependencies_not_approved';
  ELSIF NOT public.auto_index_candidate_provenance_complete(c.id) THEN candidate_ready:=false; hold_reason:='source_or_license_evidence_incomplete';
  ELSIF NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_publication_metadata m WHERE m.candidate_id=c.id) THEN
    candidate_ready:=false; hold_reason:='publication_metadata_missing';
  ELSIF NOT EXISTS (SELECT 1 FROM public.auto_index_decisions d WHERE d.candidate_id=c.id AND d.outcome='qualified') THEN
    candidate_ready:=false; hold_reason:='qualification_missing';
  ELSIF NOT EXISTS (SELECT 1 FROM public.auto_index_refresh_state state WHERE state.source_id=c.source_id AND state.item_key=c.item_key
      AND state.current_generation=c.refresh_generation AND state.latest_revision=c.revision) THEN
    candidate_ready:=false; hold_reason:='candidate_stale';
  END IF;
  SELECT jsonb_build_object(
    'candidate',to_jsonb(c),'source',to_jsonb(s),
    'files',coalesce((SELECT jsonb_agg(to_jsonb(f) ORDER BY f.path COLLATE "C") FROM public.auto_index_candidate_files f WHERE f.candidate_id=c.id),'[]'::jsonb),
    'demo',(SELECT to_jsonb(d) FROM public.auto_index_candidate_demos d WHERE d.candidate_id=c.id),
    'assets',coalesce((SELECT jsonb_agg(to_jsonb(a) ORDER BY a.asset_key COLLATE "C") FROM public.auto_index_candidate_assets a WHERE a.candidate_id=c.id),'[]'::jsonb),
    'publicationMetadata',(SELECT to_jsonb(m) FROM public.auto_index_candidate_publication_metadata m WHERE m.candidate_id=c.id),
    'ready',candidate_ready,'holdReason',hold_reason,
    'fingerprint',CASE WHEN candidate_ready THEN encode(public.auto_index_candidate_review_fingerprint(c.id),'hex') ELSE NULL END) INTO result;
  RETURN result;
END $$;

-- Reviewer identity comes only from the trusted Node route's Clerk session.
-- The database principal is separately authenticated and never shared with emitters.
CREATE FUNCTION public.auto_index_record_human_review(
  p_candidate_id bigint,p_fingerprint text,p_reviewer_user_id text,p_checklist_version text,
  p_checklist_answers jsonb,p_idempotency_key text
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates; s public.auto_index_sources; old_provenance public.auto_index_review_provenance;
  provenance_id bigint; decision_id bigint; expected_fingerprint text; stored_answers jsonb;
BEGIN
  IF session_user<>'auto_index_reviewer' THEN RAISE EXCEPTION 'reviewer identity required'; END IF;
  IF p_candidate_id IS NULL OR p_fingerprint !~ '^[a-f0-9]{64}$' OR
     p_reviewer_user_id IS NULL OR length(btrim(p_reviewer_user_id))=0 OR
     p_checklist_version IS DISTINCT FROM 'component-review-v2' OR p_idempotency_key !~ '^[A-Za-z0-9:_-]{1,128}$' OR
     jsonb_typeof(p_checklist_answers) IS DISTINCT FROM 'object' OR
     p_checklist_answers ?& ARRAY['source_identity_verified','source_bytes_verified','license_and_notice_verified',
       'dependencies_verified','demo_and_assets_verified','saved_prompts_verified','publication_metadata_verified'] IS NOT TRUE OR
     p_checklist_answers-ARRAY['source_identity_verified','source_bytes_verified','license_and_notice_verified',
       'dependencies_verified','demo_and_assets_verified','saved_prompts_verified','publication_metadata_verified']<>'{}'::jsonb OR
     p_checklist_answers->'source_identity_verified'<>'true'::jsonb OR
     p_checklist_answers->'source_bytes_verified'<>'true'::jsonb OR
     p_checklist_answers->'license_and_notice_verified'<>'true'::jsonb OR
     p_checklist_answers->'dependencies_verified'<>'true'::jsonb OR
     p_checklist_answers->'demo_and_assets_verified'<>'true'::jsonb OR
     p_checklist_answers->'saved_prompts_verified'<>'true'::jsonb OR
     p_checklist_answers->'publication_metadata_verified'<>'true'::jsonb THEN
    RAISE EXCEPTION 'invalid reviewer checklist';
  END IF;
  -- Acquire source/state/run/candidate/evidence/metadata locks in the declared order.
  SELECT * INTO STRICT c FROM public.auto_index_candidates WHERE id=p_candidate_id;
  PERFORM 1 FROM public.auto_index_sources WHERE id=c.source_id FOR UPDATE;
  SELECT * INTO STRICT s FROM public.auto_index_sources WHERE id=c.source_id;
  PERFORM 1 FROM public.auto_index_refresh_state WHERE source_id=c.source_id AND item_key=c.item_key FOR UPDATE;
  IF c.refresh_generation IS NOT NULL THEN
    PERFORM 1 FROM public.auto_index_refresh_runs WHERE source_id=c.source_id AND item_key=c.item_key
      AND generation=c.refresh_generation AND revision=c.revision FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'refresh run changed'; END IF;
  END IF;
  SELECT * INTO STRICT c FROM public.auto_index_candidates WHERE id=p_candidate_id FOR UPDATE;
  PERFORM 1 FROM public.auto_index_candidate_files WHERE candidate_id=c.id ORDER BY path COLLATE "C" FOR UPDATE;
  PERFORM 1 FROM public.auto_index_candidate_demos WHERE candidate_id=c.id FOR UPDATE;
  PERFORM 1 FROM public.auto_index_candidate_assets WHERE candidate_id=c.id ORDER BY asset_key COLLATE "C" FOR UPDATE;
  PERFORM 1 FROM public.auto_index_candidate_publication_metadata WHERE candidate_id=c.id FOR UPDATE;
  PERFORM 1 FROM public.auto_index_decisions decision WHERE decision.candidate_id=c.id ORDER BY decision.id FOR UPDATE;

  -- Recheck idempotency only after taking the candidate lock. Concurrent retries
  -- for this candidate now serialize and return the first decision.
  SELECT * INTO old_provenance FROM public.auto_index_review_provenance WHERE idempotency_key=p_idempotency_key;
  IF FOUND THEN
    IF old_provenance.candidate_id<>p_candidate_id OR old_provenance.reviewer_user_id<>p_reviewer_user_id OR
       encode(old_provenance.candidate_fingerprint,'hex')<>p_fingerprint OR
       old_provenance.checklist_version<>p_checklist_version OR old_provenance.checklist_answers<>p_checklist_answers THEN
      RAISE EXCEPTION 'review idempotency conflict';
    END IF;
    SELECT d.id INTO STRICT decision_id FROM public.auto_index_decisions d WHERE d.review_provenance_id=old_provenance.id;
    RETURN jsonb_build_object('candidateId',p_candidate_id,'provenanceId',old_provenance.id,'decisionId',decision_id,'status','approved-private');
  END IF;

  IF s.opted_out OR NOT c.dependencies_approved OR NOT public.auto_index_candidate_provenance_complete(c.id) OR
     NOT EXISTS (SELECT 1 FROM public.auto_index_refresh_state state WHERE state.source_id=c.source_id AND state.item_key=c.item_key
       AND state.current_generation=c.refresh_generation AND state.latest_revision=c.revision) OR
     NOT EXISTS (SELECT 1 FROM public.auto_index_decisions d WHERE d.candidate_id=c.id AND d.outcome='qualified') THEN
    RAISE EXCEPTION 'candidate is not reviewable';
  END IF;
  expected_fingerprint:=encode(public.auto_index_candidate_review_fingerprint(c.id),'hex');
  IF expected_fingerprint IS DISTINCT FROM p_fingerprint THEN RAISE EXCEPTION 'review evidence changed'; END IF;
  INSERT INTO public.auto_index_review_provenance(candidate_id,candidate_fingerprint,reviewer_user_id,reviewed_at,
    checklist_version,checklist_answers,idempotency_key)
  VALUES(c.id,decode(expected_fingerprint,'hex'),p_reviewer_user_id,clock_timestamp(),p_checklist_version,p_checklist_answers,p_idempotency_key)
  RETURNING id INTO provenance_id;
  INSERT INTO public.auto_index_decisions(candidate_id,outcome,reason_code,evidence,detector,review_provenance_id)
  VALUES(c.id,'approved','human_review_'||provenance_id::text,
    jsonb_build_object('reviewProvenanceId',provenance_id,'candidateFingerprint',expected_fingerprint),
    'clerk-admin-review',provenance_id)
  RETURNING id INTO decision_id;
  RETURN jsonb_build_object('candidateId',c.id,'provenanceId',provenance_id,'decisionId',decision_id,'status','approved-private');
END $$;

-- The only publication entry point accepts one reviewed decision ID. All output
-- fields are read from the immutable candidate evidence and staged payload.
CREATE FUNCTION public.finalize_auto_index_candidate(p_approved_decision_id bigint)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE v_candidate_id bigint; v_source_id bigint; v_item_key text; v_generation bigint; v_revision text;
  c public.auto_index_candidates; s public.auto_index_sources; d public.auto_index_decisions;
  proof public.auto_index_review_provenance; meta public.auto_index_candidate_publication_metadata;
  demo_artifact public.auto_index_candidate_demos; refresh_state public.auto_index_refresh_state;
  active_component_id integer; active_generation bigint; component_id integer; active_demo_id integer;
  source_code text; registry_files jsonb; license_target text; notice_target text; expected_fingerprint text;
  existing_publication public.auto_index_publications; publication_component_slug text; superseded_count integer;
BEGIN
  IF session_user<>'auto_index_reviewer' THEN RAISE EXCEPTION 'reviewer identity required'; END IF;
  IF p_approved_decision_id IS NULL OR p_approved_decision_id<=0 THEN RAISE EXCEPTION 'invalid decision ID'; END IF;

  -- Discover lock keys without locks, then acquire each complete lock class in
  -- the globally declared source → state → run → candidate → evidence order.
  SELECT decision.candidate_id INTO STRICT v_candidate_id
    FROM public.auto_index_decisions decision WHERE decision.id=p_approved_decision_id;
  SELECT candidate.source_id,candidate.item_key,candidate.refresh_generation,candidate.revision
    INTO STRICT v_source_id,v_item_key,v_generation,v_revision
    FROM public.auto_index_candidates candidate WHERE candidate.id=v_candidate_id;
  PERFORM 1 FROM public.auto_index_sources source WHERE source.id=v_source_id FOR UPDATE;
  PERFORM 1 FROM public.auto_index_refresh_state state
    WHERE state.source_id=v_source_id AND state.item_key=v_item_key FOR UPDATE;
  IF v_generation IS NOT NULL THEN
    PERFORM 1 FROM public.auto_index_refresh_runs run
      WHERE run.source_id=v_source_id AND run.item_key=v_item_key
        AND run.generation=v_generation AND run.revision=v_revision FOR KEY SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'refresh run changed'; END IF;
  END IF;
  SELECT * INTO STRICT c FROM public.auto_index_candidates candidate WHERE candidate.id=v_candidate_id FOR UPDATE;
  PERFORM 1 FROM public.auto_index_candidate_files file WHERE file.candidate_id=c.id ORDER BY file.path COLLATE "C" FOR UPDATE;
  PERFORM 1 FROM public.auto_index_candidate_demos demo WHERE demo.candidate_id=c.id FOR UPDATE;
  PERFORM 1 FROM public.auto_index_candidate_assets asset WHERE asset.candidate_id=c.id ORDER BY asset.asset_key COLLATE "C" FOR UPDATE;
  SELECT * INTO STRICT meta FROM public.auto_index_candidate_publication_metadata metadata
    WHERE metadata.candidate_id=c.id FOR UPDATE;
  SELECT * INTO STRICT d FROM public.auto_index_decisions decision
    WHERE decision.id=p_approved_decision_id AND decision.candidate_id=c.id FOR UPDATE;
  SELECT * INTO STRICT proof FROM public.auto_index_review_provenance provenance
    WHERE provenance.id=d.review_provenance_id AND provenance.candidate_id=c.id FOR UPDATE;
  SELECT * INTO STRICT s FROM public.auto_index_sources source WHERE source.id=c.source_id;

  IF d.outcome IS DISTINCT FROM 'approved' OR d.review_provenance_id IS NULL OR s.opted_out OR
     NOT c.dependencies_approved OR NOT public.auto_index_candidate_provenance_complete(c.id) OR
     proof.checklist_version IS DISTINCT FROM 'component-review-v2' OR
     proof.reviewer_user_id IS NULL OR length(btrim(proof.reviewer_user_id))=0 OR
     proof.checklist_answers IS DISTINCT FROM jsonb_build_object(
       'source_identity_verified',true,'source_bytes_verified',true,'license_and_notice_verified',true,
       'dependencies_verified',true,'demo_and_assets_verified',true,'saved_prompts_verified',true,
       'publication_metadata_verified',true) OR
     NOT EXISTS (SELECT 1 FROM public.auto_index_refresh_state state WHERE state.source_id=c.source_id AND state.item_key=c.item_key
       AND state.current_generation=c.refresh_generation AND state.latest_revision=c.revision) THEN
    RAISE EXCEPTION 'reviewed candidate is no longer publishable';
  END IF;
  expected_fingerprint:=encode(public.auto_index_candidate_review_fingerprint(c.id),'hex');
  IF encode(proof.candidate_fingerprint,'hex') IS DISTINCT FROM expected_fingerprint THEN
    RAISE EXCEPTION 'reviewed evidence changed';
  END IF;
  SELECT * INTO existing_publication FROM public.auto_index_publications publication
    WHERE publication.source_id=c.source_id AND publication.item_key=c.item_key
      AND publication.delisted_at IS NULL AND publication.superseded_at IS NULL
      AND NOT EXISTS (SELECT 1 FROM public.auto_index_publication_supersessions supersession
        WHERE supersession.legacy_source_id=publication.source_id
          AND supersession.legacy_item_key=publication.item_key
          AND supersession.legacy_approved_decision_id=publication.approved_decision_id)
    FOR UPDATE;
  IF FOUND THEN
    IF existing_publication.approved_decision_id=d.id THEN RETURN existing_publication.component_id; END IF;
    SELECT candidate.refresh_generation INTO active_generation
      FROM public.auto_index_decisions active_decision
      JOIN public.auto_index_candidates candidate ON candidate.id=active_decision.candidate_id
      WHERE active_decision.id=existing_publication.approved_decision_id;
    IF active_generation IS NOT NULL AND c.refresh_generation<=active_generation THEN
      RAISE EXCEPTION 'stale auto-index candidate';
    END IF;
    active_component_id:=existing_publication.component_id;
  ELSIF EXISTS (SELECT 1 FROM public.auto_index_publications publication
      WHERE publication.source_id=c.source_id AND publication.item_key=c.item_key
        AND publication.approved_decision_id=d.id) THEN
    RAISE EXCEPTION 'reviewed decision is no longer the active publication';
  END IF;

  IF EXISTS (SELECT 1 FROM public.auto_index_publications publication
      WHERE publication.source_id=c.source_id AND publication.item_key=c.item_key AND publication.delisted_at IS NOT NULL) THEN
    RAISE EXCEPTION 'publication was delisted';
  END IF;
  IF active_component_id IS NOT NULL THEN
    PERFORM 1 FROM public.components component WHERE component.id=active_component_id FOR UPDATE;
    SELECT demo.id INTO STRICT active_demo_id FROM public.demos demo
      WHERE demo.component_id=active_component_id AND demo.user_id=s.vendor_user_id AND demo.demo_slug='default'
      ORDER BY demo.id FOR UPDATE;
    IF (SELECT count(*) FROM public.demos demo WHERE demo.component_id=active_component_id AND demo.demo_slug='default')<>1 THEN
      RAISE EXCEPTION 'auto-index component requires one default demo';
    END IF;
  END IF;
  SELECT * INTO STRICT demo_artifact FROM public.auto_index_candidate_demos demo WHERE demo.candidate_id=c.id;
  SELECT convert_from(file.bytes,'UTF8') INTO STRICT source_code FROM public.auto_index_candidate_files file
    WHERE file.candidate_id=c.id AND file.path=coalesce(c.component_source_path,c.item_key);
  SELECT jsonb_agg(jsonb_build_object('path',file.path,'type',file.registry_type,'content',convert_from(file.bytes,'UTF8'))
      || CASE WHEN file.target IS NULL THEN '{}'::jsonb ELSE jsonb_build_object('target',file.target) END ORDER BY file.path COLLATE "C")
    INTO STRICT registry_files FROM public.auto_index_candidate_files file WHERE file.candidate_id=c.id;
  license_target:='higherbits/licenses/'||meta.component_slug||'-'||encode(c.license_sha256,'hex')||'.LICENSE';
  registry_files:=registry_files||jsonb_build_array(jsonb_build_object('path',license_target,'target',license_target,
    'type','registry:file','content',c.license_text));
  IF c.notice_text IS NOT NULL THEN
    notice_target:='higherbits/licenses/'||meta.component_slug||'-'||encode(extensions.digest(convert_to(c.notice_text,'UTF8'),'sha256'),'hex')||'.NOTICE';
    registry_files:=registry_files||jsonb_build_array(jsonb_build_object('path',notice_target,'target',notice_target,
      'type','registry:file','content',c.notice_text));
  END IF;

  -- Preserve the previously published payload and create a new component/demo
  -- version. A collision means this upstream item has a prior immutable version;
  -- append the reviewed decision ID to the route slug for the successor.
  publication_component_slug:=meta.component_slug;
  IF EXISTS (SELECT 1 FROM public.components component WHERE component.user_id=s.vendor_user_id
      AND component.component_slug=publication_component_slug) THEN
    publication_component_slug:=left(meta.component_slug,58)||'-r'||d.id::text;
  END IF;
  IF EXISTS (SELECT 1 FROM public.components component WHERE component.user_id=s.vendor_user_id
      AND component.component_slug=publication_component_slug) THEN
    RAISE EXCEPTION 'versioned auto-index component slug already exists';
  END IF;
  INSERT INTO public.components(component_names,user_id,component_slug,name,description,preview_url,bundle_html_url,
    dependencies,registry,code,registry_url,license,is_public)
  VALUES(jsonb_build_array(meta.title),s.vendor_user_id,publication_component_slug,meta.title,meta.description,
    meta.component_preview_url,meta.bundle_html_url,meta.dependencies,'auto-index',source_code,
    jsonb_build_object('name',publication_component_slug,'type','registry:ui','files',registry_files)::text,
    lower(c.license_spdx),false) RETURNING id INTO component_id;
  INSERT INTO public.demos(component_id,user_id,demo_code,name,demo_slug,preview_url,bundle_html_url,compiled_css,
    ghl_html_content,ghl_source_fingerprint)
  VALUES(component_id,s.vendor_user_id,demo_artifact.demo_code,meta.title,'default',meta.demo_preview_url,
    meta.bundle_html_url,meta.compiled_css,demo_artifact.ghl_html_content,demo_artifact.ghl_source_fingerprint)
  RETURNING id INTO active_demo_id;

  -- Each successor gets its own immutable prompt set.
  INSERT INTO public.auto_index_copy_prompts(demo_id,prompt_type,prompt,source_fingerprint)
    SELECT active_demo_id,prompt.key,prompt.value,demo_artifact.ghl_source_fingerprint
      FROM jsonb_each_text(demo_artifact.copy_prompts) prompt;
  IF (SELECT count(*) FROM public.auto_index_copy_prompts prompt WHERE prompt.demo_id=active_demo_id)<>10 THEN
    RAISE EXCEPTION 'incomplete auto-index copy prompts';
  END IF;
  IF active_component_id IS NOT NULL THEN
    UPDATE public.auto_index_publications publication SET superseded_at=clock_timestamp()
      WHERE publication.source_id=existing_publication.source_id
        AND publication.item_key=existing_publication.item_key
        AND publication.approved_decision_id=existing_publication.approved_decision_id
        AND publication.component_id=active_component_id
        AND publication.delisted_at IS NULL AND publication.superseded_at IS NULL;
    GET DIAGNOSTICS superseded_count=ROW_COUNT;
    IF superseded_count<>1 THEN RAISE EXCEPTION 'active publication changed during revision switch'; END IF;
  END IF;
  INSERT INTO public.auto_index_publications(source_id,item_key,component_id,approved_decision_id)
    VALUES(c.source_id,c.item_key,component_id,d.id);
  -- Keep the component private on INSERT; the publication guard validates the
  -- review while it is private, then the visibility guard allows public state
  -- only after the publication row exists.
  UPDATE public.components SET is_public=true WHERE id=component_id AND NOT is_public;
  IF NOT FOUND THEN RAISE EXCEPTION 'reviewed component could not be made public'; END IF;
  IF active_component_id IS NOT NULL THEN
    INSERT INTO public.auto_index_publication_supersessions(
      legacy_source_id,legacy_item_key,legacy_approved_decision_id,
      successor_source_id,successor_item_key,successor_approved_decision_id,adoption_provenance_id)
    VALUES(c.source_id,c.item_key,existing_publication.approved_decision_id,
      c.source_id,c.item_key,d.id,proof.id);
  END IF;
  RETURN component_id;
END $$;

-- Neither an emitter nor a legacy service-role writer can create approvals.
CREATE OR REPLACE FUNCTION public.auto_index_decision_guard() RETURNS trigger
LANGUAGE plpgsql SET search_path=pg_catalog,public AS $$
DECLARE c public.auto_index_candidates;
BEGIN
  IF NEW.outcome='approved' THEN
    IF NEW.review_provenance_id IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.auto_index_review_provenance p WHERE p.id=NEW.review_provenance_id
        AND p.candidate_id=NEW.candidate_id AND length(btrim(p.reviewer_user_id))>0
        AND p.checklist_version='component-review-v2'
        AND p.checklist_answers ?& ARRAY['source_identity_verified','source_bytes_verified','license_and_notice_verified',
          'dependencies_verified','demo_and_assets_verified','saved_prompts_verified','publication_metadata_verified']
        AND p.checklist_answers-ARRAY['source_identity_verified','source_bytes_verified','license_and_notice_verified',
          'dependencies_verified','demo_and_assets_verified','saved_prompts_verified','publication_metadata_verified']='{}'::jsonb
        AND p.checklist_answers->'source_identity_verified'='true'::jsonb
        AND p.checklist_answers->'source_bytes_verified'='true'::jsonb
        AND p.checklist_answers->'license_and_notice_verified'='true'::jsonb
        AND p.checklist_answers->'dependencies_verified'='true'::jsonb
        AND p.checklist_answers->'demo_and_assets_verified'='true'::jsonb
        AND p.checklist_answers->'saved_prompts_verified'='true'::jsonb
        AND p.checklist_answers->'publication_metadata_verified'='true'::jsonb
    ) THEN RAISE EXCEPTION 'approved decision requires valid reviewer provenance'; END IF;
  ELSIF NEW.review_provenance_id IS NOT NULL THEN
    RAISE EXCEPTION 'review provenance is only valid for approval';
  END IF;
  SELECT * INTO c FROM public.auto_index_candidates WHERE id=NEW.candidate_id FOR UPDATE;
  IF NEW.outcome='qualified' AND
     (c.repository_url IS NULL OR c.license_spdx IS NULL OR c.license_text IS NULL OR
      NOT c.dependencies_approved OR
      NOT EXISTS (SELECT 1 FROM public.auto_index_candidate_files WHERE candidate_id=NEW.candidate_id)) THEN
    RAISE EXCEPTION 'qualified candidate lacks source or license evidence';
  END IF;
  RETURN NEW;
END $$;

-- New publication rows must reference immutable reviewer provenance. Legacy
-- predecessors may still take their one terminal supersession transition.
CREATE FUNCTION public.auto_index_publication_review_provenance_guard() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
BEGIN
  IF TG_OP='INSERT' AND NOT EXISTS (
    SELECT 1 FROM public.auto_index_decisions decision
    JOIN public.auto_index_review_provenance proof
      ON proof.id=decision.review_provenance_id AND proof.candidate_id=decision.candidate_id
    WHERE decision.id=NEW.approved_decision_id AND decision.outcome='approved'
      AND decision.review_provenance_id IS NOT NULL
      AND length(btrim(proof.reviewer_user_id))>0
      AND proof.checklist_version='component-review-v2'
  ) THEN
    RAISE EXCEPTION 'new publication requires reviewer provenance';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER auto_index_publication_review_provenance_guard
  BEFORE INSERT ON public.auto_index_publications
  FOR EACH ROW EXECUTE FUNCTION public.auto_index_publication_review_provenance_guard();

-- Reviewed rows and the frozen pre-migration public set are the only indexed
-- rows visible through these RPCs.
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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
  WHERE (d.user_id = p_user_id OR c.user_id = p_user_id)
    AND (c.is_public = true OR (
      COALESCE(p_include_private, false)
      AND p_user_id = public.requesting_user_id()
      AND c.user_id = p_user_id
    ))
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
    COALESCE(CASE WHEN c.user_id = public.requesting_user_id() THEN s.moderators_feedback END, '')
  FROM public.demos d
  JOIN public.components c ON c.id = d.component_id
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
  LEFT JOIN public.submissions s ON s.component_id = c.id
  LEFT JOIN LATERAL (
    SELECT count(*) AS views
    FROM public.component_analytics ca
    WHERE ca.component_id = c.id
      AND ca.activity_type = 'component_view'
  ) v ON true
  WHERE (d.user_id = p_user_id OR c.user_id = p_user_id)
    AND (
      c.is_public = true
      OR (c.user_id = p_user_id AND p_user_id = public.requesting_user_id())
    )
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
  ORDER BY d.updated_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.get_user_components_counts(p_user_id text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT jsonb_build_object(
    'published_count', (
      SELECT count(*)
      FROM public.components c
      WHERE c.user_id = p_user_id
        AND c.is_public = true
        AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
    ),
    'demos_count', (
      SELECT count(*)
      FROM public.demos d
      JOIN public.components c ON c.id = d.component_id
      WHERE d.user_id = p_user_id
        AND c.user_id <> p_user_id
        AND c.is_public = true
        AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
    ),
    'liked_count', (
      SELECT count(*)
      FROM public.demo_bookmarks db
      JOIN public.demos d ON d.id = db.demo_id
      JOIN public.components c ON c.id = d.component_id
      WHERE db.user_id = p_user_id
        AND c.is_public = true
        AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_state(user_id_param text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
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
      AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
  ) stats ON true
  LEFT JOIN public.users_to_plans utp ON utp.user_id = u.id
  WHERE u.id = user_id_param
    AND u.id = public.requesting_user_id();

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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
  JOIN public.public_profiles du     ON du.id = d.user_id
  JOIN public.public_profiles cu     ON cu.id = c.user_id
  WHERE db.user_id = p_user_id
    AND (c.is_public = true OR (
      p_include_private
      AND p_user_id = public.requesting_user_id()
      AND c.user_id = p_user_id
    ))
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
  ORDER BY db.bookmarked_at DESC NULLS LAST, d.id DESC;
$$;

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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
    AND (
      p_user_id = public.requesting_user_id()
      OR EXISTS (
        SELECT 1 FROM public.users requester
        WHERE requester.id = public.requesting_user_id()
          AND requester.is_admin = true
      )
    )
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
  GROUP BY 1
),
mcp AS (
  SELECT
    (mcu.created_at AT TIME ZONE 'UTC')::date AS day,
    count(*) AS mcp_usages
  FROM public.mcp_component_usage mcu
  WHERE mcu.author_id = p_user_id
    AND (
      p_user_id = public.requesting_user_id()
      OR EXISTS (
        SELECT 1 FROM public.users requester
        WHERE requester.id = public.requesting_user_id()
          AND requester.is_admin = true
      )
    )
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
SET search_path = pg_catalog, public
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
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT count(*) AS views
    FROM public.component_analytics ca
    WHERE ca.component_id = c.id
      AND ca.activity_type = 'component_view'
  ) v ON true
  WHERE (
      c.is_public = true
      OR (COALESCE(p_include_private, false) AND c.user_id = public.requesting_user_id())
    )
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
    ''::text AS moderators_feedback
  FROM public.demos d
  JOIN public.components c ON c.id = d.component_id
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
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
    AND c.is_public = true
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
  ORDER BY
    CASE WHEN p_sort_by = 'downloads' THEN c.downloads_count END DESC NULLS LAST,
    CASE WHEN p_sort_by = 'likes'     THEN c.likes_count END DESC NULLS LAST,
    d.created_at DESC,
    d.id DESC
  OFFSET COALESCE(p_offset, 0)
  LIMIT COALESCE(p_limit, 40);
$$;

CREATE OR REPLACE FUNCTION public.get_admin_demos_submissions(
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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
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
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
  WHERE cl.user_id = p_user_id
    AND (
      p_user_id = public.requesting_user_id()
      OR EXISTS (
        SELECT 1 FROM public.users requester
        WHERE requester.id = public.requesting_user_id()
          AND requester.is_admin = true
      )
    )
    AND c.is_public = true
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
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
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT
    c.id,
    c.name,
    c.description,
    COALESCE(
      c.cover_url,
      (
        SELECT comp.preview_url
        FROM public.components_to_collections ctc2
        JOIN public.components comp ON comp.id = ctc2.component_id
        WHERE ctc2.collection_id = c.id
          AND comp.preview_url IS NOT NULL
          AND (comp.is_public = true OR (
            NOT c.is_public AND p_include_private
            AND c.user_id = public.requesting_user_id()
            AND comp.user_id = c.user_id
          ))
          AND (comp.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(comp.id))
        ORDER BY ctc2.created_at ASC
        LIMIT 1
      )
    ) AS cover_url,
    c.user_id,
    c.created_at,
    c.updated_at,
    c.is_public,
    c.slug,
    COALESCE(cc.cnt, 0)::bigint AS components_count,
    to_jsonb(u.*) AS user_data
  FROM public.collections c
  JOIN public.public_profiles u ON u.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT count(*) AS cnt
    FROM public.components_to_collections ctc
    JOIN public.components comp ON comp.id = ctc.component_id
    WHERE ctc.collection_id = c.id
      AND (
        comp.is_public = true
        OR (
          COALESCE(p_include_private, false)
          AND c.user_id = public.requesting_user_id()
          AND comp.user_id = c.user_id
        )
      )
      AND (comp.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(comp.id))
  ) cc ON true
  WHERE c.is_public = true
     OR (p_include_private AND c.user_id = public.requesting_user_id())
  ORDER BY c.created_at DESC, c.id
  OFFSET COALESCE(p_offset, 0)
  LIMIT COALESCE(p_limit, 50);
$$;

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
SECURITY DEFINER
SET search_path = pg_catalog, public
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
  JOIN public.public_profiles du ON du.id = d.user_id
  JOIN public.public_profiles cu ON cu.id = c.user_id
  LEFT JOIN LATERAL (
    SELECT jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)) AS tags
    FROM public.demo_tags dt
    JOIN public.tags t ON t.id = dt.tag_id
    WHERE dt.demo_id = d.id
  ) tg ON true
  WHERE s.round_id = p_round_id
    AND c.is_public = true
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
  ORDER BY COALESCE(s.final_score, 0) DESC, d.id;
$$;


-- Provenance-gated public views and vector-search RPCs; kept in this additive
-- migration so the checked-in release source and migrated definitions agree.
CREATE OR REPLACE VIEW public.auto_index_public_component_ids
WITH (security_invoker = off) AS
SELECT c.id
FROM public.components c
WHERE c.is_public = true
  AND c.registry = 'auto-index'
  AND public.auto_index_component_has_current_approval(c.id);
REVOKE ALL ON public.auto_index_public_component_ids FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.auto_index_public_component_ids TO anon, authenticated, service_role;

CREATE OR REPLACE VIEW public.components_with_username
WITH (security_invoker = on) AS
SELECT
  c.code,
  c.component_names,
  c.component_slug,
  c.created_at,
  c.demo_code,
  c.demo_dependencies,
  c.demo_direct_registry_dependencies,
  c.dependencies,
  c.description,
  c.direct_registry_dependencies,
  c.downloads_count,
  c.fts,
  c.id,
  c.is_public,
  c.license,
  c.likes_count,
  c.name,
  c.preview_url,
  c.registry,
  c.updated_at,
  to_jsonb(u.*) AS "user",
  c.user_id,
  u.username,
  c.video_url
FROM public.components c
JOIN public.public_profiles u ON u.id = c.user_id
WHERE c.is_public = true
  AND (c.registry IS DISTINCT FROM 'auto-index' OR c.id IN
    (SELECT approved.id FROM public.auto_index_public_component_ids approved));
REVOKE SELECT ON public.components_with_username FROM PUBLIC,anon;
GRANT SELECT ON public.components_with_username TO anon,authenticated,service_role;
GRANT SELECT (
  code,component_names,component_slug,created_at,demo_code,demo_dependencies,
  demo_direct_registry_dependencies,dependencies,description,direct_registry_dependencies,
  downloads_count,fts,id,is_public,license,likes_count,name,preview_url,registry,updated_at,
  user_id,video_url
) ON public.components TO anon;

-- Used by: lib/queries.server.ts (registry dependency tree resolution).
-- One row per (source component -> dependency component) closure edge,
-- carrying the DEPENDENCY component's columns.
-- Step B3e: su/du join public_profiles (not public.users) for the same
-- cross-user reason as components_with_username above. Its base FROM table
-- public.component_dependencies_closure also needs its own grant + policy
-- (see restore-authenticated-grants.sql) — a security_invoker=on view's
-- grant is only as good as its weakest-granted base relation.
CREATE OR REPLACE VIEW public.component_dependencies_graph_view_v3
WITH (security_invoker = on) AS
SELECT
  dep.code,
  cl.component_id,
  dep.component_names,
  dep.component_slug,
  dep.created_at,
  dep.demo_code,
  dep.demo_dependencies,
  dep.demo_direct_registry_dependencies,
  dep.dependencies,
  du.display_username AS dependency_author_display_username,
  du.username AS dependency_author_username,
  cl.dependency_component_id,
  cl.depth,
  dep.description,
  dep.direct_registry_dependencies,
  dep.downloads_count,
  dep.fts,
  dep.global_css_extension,
  dep.id,
  cl.is_demo_dependency,
  dep.is_public,
  dep.license,
  dep.likes_count,
  dep.name,
  dep.preview_url,
  dep.registry,
  su.display_username AS source_author_display_username,
  su.username AS source_author_username,
  src.component_slug AS source_component_slug,
  dep.tailwind_config_extension,
  dep.updated_at,
  dep.user_id
FROM public.component_dependencies_closure cl
JOIN public.components src ON src.id = cl.component_id
JOIN public.public_profiles su ON su.id = src.user_id
JOIN public.components dep ON dep.id = cl.dependency_component_id
JOIN public.public_profiles du ON du.id = dep.user_id
WHERE src.is_public = true
  AND dep.is_public = true
  AND (src.registry IS DISTINCT FROM 'auto-index' OR src.id IN
    (SELECT approved.id FROM public.auto_index_public_component_ids approved))
  AND (dep.registry IS DISTINCT FROM 'auto-index' OR dep.id IN
    (SELECT approved.id FROM public.auto_index_public_component_ids approved));

-- Used by: lib/queries.ts getRoundSubmissions (admin leaderboard).
-- Per-demo per-round hunt standings. has_voted resolves against the
-- requesting user's JWT (requesting_user_id()); false for service-role calls.
-- Step B3b/B3c-ii (Gap 7 fold-in): cu/du join public_profiles (not
-- public.users) so a multi-contestant leaderboard is not filtered down to
-- the caller's own rows. component_user_data/user_data narrow accordingly.
CREATE OR REPLACE VIEW public.demo_hunt_leaderboard
WITH (security_invoker = on) AS
SELECT
  (
    SELECT count(*)
    FROM public.demo_bookmarks b
    WHERE b.demo_id = d.id
  ) AS bookmarks_count,
  NULL::jsonb AS bundle_url,
  to_jsonb(c.*) AS component_data,
  to_jsonb(cu.*) AS component_user_data,
  d.demo_slug,
  s.final_score,
  rank() OVER (PARTITION BY s.round_id ORDER BY s.final_score DESC) AS global_rank,
  EXISTS (
    SELECT 1
    FROM public.demo_hunt_votes v
    WHERE v.demo_id = d.id
      AND v.round_id = s.round_id
      AND v.user_id = public.requesting_user_id()
  ) AS has_voted,
  d.id,
  s.installs,
  d.name,
  d.preview_url,
  s.round_id,
  (
    SELECT coalesce(
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)),
      '[]'::jsonb
    )
    FROM public.demo_tags dt
    JOIN public.tags t ON t.id = dt.tag_id
    WHERE dt.demo_id = d.id
  ) AS tags,
  count(*) OVER (PARTITION BY s.round_id) AS total_count,
  d.updated_at,
  to_jsonb(du.*) AS user_data,
  d.video_url,
  s.views AS view_count,
  s.votes
FROM public.demo_hunt_scores s
JOIN public.demos d ON d.id = s.demo_id
JOIN public.components c ON c.id = d.component_id
JOIN public.public_profiles cu ON cu.id = c.user_id
JOIN public.public_profiles du ON du.id = d.user_id
WHERE c.is_public = true
  AND (c.registry IS DISTINCT FROM 'auto-index' OR c.id IN
    (SELECT approved.id FROM public.auto_index_public_component_ids approved));

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
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
    AS $$
  SELECT
    d.id::bigint,
    d.name,
    d.preview_url,
    d.video_url,
    d.demo_slug,
    d.user_id,
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'code', c.code,
      'registry', c.registry,
      'direct_registry_dependencies', c.direct_registry_dependencies,
      'component_slug', c.component_slug,
      'user_id', c.user_id
    ) AS component_data,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'name', u.name,
      'display_name', u.display_name,
      'display_username', u.display_username,
      'display_image_url', u.display_image_url,
      'image_url', u.image_url
    ) AS user_data,
    jsonb_build_object(
      'usage_description', ue.usage_description,
      'metadata', ue.metadata,
      'similarity', 1 - (ue.embedding OPERATOR(extensions.<=>) query_embedding)
    ) AS usage_data
  FROM public.usage_embeddings ue
  JOIN public.demos d ON d.id = ue.item_id AND ue.item_type = 'demo'
  JOIN public.components c ON c.id = d.component_id
  JOIN public.public_profiles u ON u.id = d.user_id
  WHERE c.is_public = TRUE
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
    AND 1 - (ue.embedding OPERATOR(extensions.<=>) query_embedding) >
      LEAST(GREATEST(coalesce(match_threshold,0.33),0.33),0.95)
  ORDER BY ue.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT LEAST(GREATEST(coalesce(match_count,0),0),20);
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
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
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
    LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog, public
    AS $$
  SELECT
    d.id::bigint,
    d.name,
    d.preview_url,
    d.video_url,
    d.demo_slug,
    d.user_id,
    d.created_at,
    jsonb_build_object(
      'id', c.id,
      'name', c.name,
      'description', c.description,
      'code', c.code,
      'registry', c.registry,
      'direct_registry_dependencies', c.direct_registry_dependencies,
      'component_slug', c.component_slug,
      'user_id', c.user_id
    ) AS component_data,
    jsonb_build_object(
      'id', u.id,
      'username', u.username,
      'name', u.name,
      'display_name', u.display_name,
      'display_username', u.display_username,
      'display_image_url', u.display_image_url,
      'image_url', u.image_url
    ) AS user_data,
    jsonb_build_object(
      'usage_description', ue.usage_description,
      'metadata', ue.metadata,
      'similarity', 1 - (ue.embedding OPERATOR(extensions.<=>) query_embedding)
    ) AS usage_data
  FROM public.usage_embeddings ue
  JOIN public.demos d ON d.id = ue.item_id AND ue.item_type = 'demo'
  JOIN public.components c ON c.id = d.component_id
  JOIN public.public_profiles u ON u.id = d.user_id
  WHERE c.is_public = TRUE
    AND (c.registry IS DISTINCT FROM 'auto-index' OR public.auto_index_component_has_current_approval(c.id))
    AND 1 - (ue.embedding OPERATOR(extensions.<=>) query_embedding) >
      LEAST(GREATEST(coalesce(match_threshold,0.33),0.33),0.95)
  ORDER BY ue.embedding OPERATOR(extensions.<=>) query_embedding
  LIMIT 20;
$$;



-- Checked-in public search RPCs return only public-profile fields and public,
-- current-review component rows. Raw embedding candidates stay disabled; the
-- only checked-in caller is presently unreachable and accepts SQL fragments.
REVOKE ALL ON FUNCTION public.match_embeddings(vector,double precision,integer,text,text)
  FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.match_embeddings_with_details(vector,double precision,integer),
  public.search_demos_ai_oai_v2(text,vector,double precision),
  public.search_demos_ai_oai_extended(text,vector,double precision)
  FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.match_embeddings_with_details(vector,double precision,integer),
  public.search_demos_ai_oai_v2(text,vector,double precision),
  public.search_demos_ai_oai_extended(text,vector,double precision)
  TO anon,authenticated,service_role;

REVOKE ALL ON FUNCTION public.auto_index_review_provenance_immutable() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_publication_supersession_guard() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_publication_review_provenance_guard() FROM PUBLIC,anon,authenticated,service_role,auto_index_stage,auto_index_reviewer;
REVOKE ALL ON FUNCTION public.auto_index_reviewed_payload_guard() FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_candidate_review_fingerprint(bigint) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_component_has_current_approval(bigint) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_components_with_current_approval(bigint[]) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_component_public_select_allowed(bigint) FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.auto_index_component_public_select_allowed(bigint) TO anon,authenticated;
REVOKE ALL ON FUNCTION public.auto_index_admin_review_queue(bigint,integer) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_admin_review_candidate(bigint) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.auto_index_record_human_review(bigint,text,text,text,jsonb,text) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.finalize_auto_index_candidate(bigint) FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.publish_auto_index_candidate(bigint,text,text,text,text)
  FROM PUBLIC,anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.register_auto_index_source(text,text,text),
  public.begin_auto_index_refresh(bigint,text,text),
  public.record_auto_index_candidate(bigint,text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb),
  public.record_auto_index_candidate_demo(bigint,text,text,text,text,text,text,text,jsonb,text,text,jsonb),
  public.record_auto_index_candidate_asset(bigint,text,text,text,text,text,text,text,text,text,text,text,text,jsonb),
  public.auto_index_candidate_provenance_complete(bigint),
  public.auto_index_ghl_fingerprint(text,text),
  public.stage_auto_index_candidate_publication_metadata(bigint,text,text,text,text,jsonb,text,text,text,text),
  public.delist_auto_index_rejected_license(bigint)
  FROM PUBLIC,anon,authenticated,service_role;

-- These logins must be provisioned independently and have no membership path
-- between them. A missing principal makes this migration fail closed.
GRANT USAGE ON SCHEMA public TO auto_index_stage,auto_index_reviewer;
-- Public-schema CREATE would let these logins plant objects visible to the
-- security-definer search paths used by reviewer and staging RPCs.
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM auto_index_stage,auto_index_reviewer;
REVOKE ALL ON public.auto_index_sources,public.auto_index_refresh_state,public.auto_index_refresh_runs,
  public.auto_index_candidates,public.auto_index_candidate_files,public.auto_index_candidate_demos,
  public.auto_index_candidate_assets,public.auto_index_decisions,public.auto_index_publications,
  public.auto_index_publication_supersessions,public.auto_index_legacy_publication_bridge,
  public.auto_index_candidate_publication_metadata,public.auto_index_review_provenance,
  public.auto_index_copy_prompts FROM auto_index_stage,auto_index_reviewer,service_role;
GRANT SELECT ON public.auto_index_sources,public.auto_index_refresh_state,public.auto_index_refresh_runs,
  public.auto_index_candidates,public.auto_index_candidate_files,public.auto_index_candidate_demos,
  public.auto_index_candidate_assets,public.auto_index_decisions,public.auto_index_publications,
  public.auto_index_publication_supersessions,
  public.auto_index_candidate_publication_metadata,public.auto_index_review_provenance,
  public.auto_index_copy_prompts TO service_role;
GRANT SELECT ON public.auto_index_sources,public.auto_index_refresh_state,public.auto_index_refresh_runs,
  public.auto_index_candidates,public.auto_index_candidate_files,public.auto_index_candidate_demos,
  public.auto_index_candidate_assets,public.auto_index_decisions TO auto_index_stage;
CREATE POLICY auto_index_stage_source_read ON public.auto_index_sources FOR SELECT TO auto_index_stage USING (true);
CREATE POLICY auto_index_stage_refresh_state_read ON public.auto_index_refresh_state FOR SELECT TO auto_index_stage USING (true);
CREATE POLICY auto_index_stage_refresh_run_read ON public.auto_index_refresh_runs FOR SELECT TO auto_index_stage USING (true);
CREATE POLICY auto_index_stage_candidate_read ON public.auto_index_candidates FOR SELECT TO auto_index_stage USING (true);
CREATE POLICY auto_index_stage_candidate_file_read ON public.auto_index_candidate_files FOR SELECT TO auto_index_stage USING (true);
CREATE POLICY auto_index_stage_candidate_demo_read ON public.auto_index_candidate_demos FOR SELECT TO auto_index_stage USING (true);
CREATE POLICY auto_index_stage_candidate_asset_read ON public.auto_index_candidate_assets FOR SELECT TO auto_index_stage USING (true);
CREATE POLICY auto_index_stage_decision_read ON public.auto_index_decisions FOR SELECT TO auto_index_stage USING (true);
GRANT EXECUTE ON FUNCTION public.register_auto_index_source(text,text,text),
  public.begin_auto_index_refresh(bigint,text,text),
  public.record_auto_index_candidate(bigint,text,text,text,text,text,text,jsonb,jsonb,text,text,jsonb),
  public.record_auto_index_candidate_demo(bigint,text,text,text,text,text,text,text,jsonb,text,text,jsonb),
  public.record_auto_index_candidate_asset(bigint,text,text,text,text,text,text,text,text,text,text,text,text,jsonb),
  public.auto_index_candidate_provenance_complete(bigint),public.auto_index_ghl_fingerprint(text,text),
  public.stage_auto_index_candidate_publication_metadata(bigint,text,text,text,text,jsonb,text,text,text,text),
  public.delist_auto_index_rejected_license(bigint) TO auto_index_stage;
GRANT EXECUTE ON FUNCTION public.auto_index_admin_review_queue(bigint,integer),
  public.auto_index_admin_review_candidate(bigint),
  public.auto_index_record_human_review(bigint,text,text,text,jsonb,text),
  public.finalize_auto_index_candidate(bigint) TO auto_index_reviewer;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE ON public.auto_index_decisions FROM service_role,auto_index_stage,auto_index_reviewer;
REVOKE ALL ON public.auto_index_candidate_publication_metadata,public.auto_index_review_provenance FROM service_role,auto_index_stage,auto_index_reviewer;
GRANT SELECT ON public.auto_index_candidate_publication_metadata,public.auto_index_review_provenance TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_index_component_has_current_approval(bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.auto_index_components_with_current_approval(bigint[]) TO service_role;
REVOKE ALL ON SEQUENCE public.auto_index_review_provenance_id_seq FROM PUBLIC,anon,authenticated,service_role,auto_index_stage,auto_index_reviewer;
REVOKE ALL ON SEQUENCE public.auto_index_decisions_id_seq FROM PUBLIC,anon,authenticated,service_role,auto_index_stage,auto_index_reviewer;
GRANT USAGE ON SEQUENCE public.auto_index_review_provenance_id_seq,public.auto_index_decisions_id_seq TO auto_index_reviewer;

-- Explicit execute surface for every modified application-facing reader.
REVOKE ALL ON FUNCTION public.get_admin_demos_submissions(text,integer,integer,text,boolean)
  FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_admin_demos_submissions(text,integer,integer,text,boolean)
  TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_profile_demo_list(text,boolean),
  public.get_user_profile_demo_list_v2(text),
  public.get_user_components_counts(text),
  public.get_user_bookmarks_list(text,boolean),
  public.get_demos_list_v2(text,integer,integer,text,boolean),
  public.get_demos_submissions(text,integer,integer,text,boolean),
  public.get_admin_liked_demos_v1(text,integer),
  public.get_collections_v1(integer,integer,boolean),
  public.get_hunt_demos_list_v2(integer),
  public.match_embeddings_with_details(vector,double precision,integer),
  public.search_demos_ai_oai_v2(text,vector,double precision),
  public.search_demos_ai_oai_extended(text,vector,double precision)
  TO anon,authenticated,service_role;
REVOKE ALL ON FUNCTION public.get_user_state(text),
  public.get_daily_user_earnings_v2(text)
  FROM PUBLIC,anon,authenticated,service_role;
GRANT EXECUTE ON FUNCTION public.get_user_state(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_user_earnings_v2(text) TO authenticated;

-- These historical RPC definitions are not checked in. Revoke every overload
-- by catalog signature if present; do not guess a signature or preserve a
-- public EXECUTE grant for an undocumented full-row reader.
DO $$
DECLARE
  legacy_rpc record;
BEGIN
  FOR legacy_rpc IN
    SELECT p.oid::regprocedure AS signature
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = ANY (ARRAY[
        'get_active_authors_with_top_components',
        'get_section_previews',
        'get_collection_components_v1',
        'search_demos_ai'
      ])
  LOOP
    EXECUTE format(
      'REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated, service_role',
      legacy_rpc.signature
    );
  END LOOP;
END;
$$;

COMMIT;
