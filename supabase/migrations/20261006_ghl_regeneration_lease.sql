-- Service-role-only lease for an approved regeneration run. The ordinary
-- review lease still reuses a matching saved export; this one deliberately
-- claims the same fenced row even when an older export has that fingerprint.
CREATE FUNCTION public.claim_sandbox_ghl_regeneration_lease(
  p_user_id text, p_demo_id bigint, p_input_fingerprint text,
  p_owner_token uuid, p_lease_seconds integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE acquired_generation bigint; current_lease public.sandbox_ghl_review_leases;
BEGIN
  IF p_user_id IS NULL OR p_demo_id IS NULL OR p_input_fingerprint !~ '^[a-f0-9]{64}$' OR
     p_owner_token IS NULL OR p_lease_seconds NOT BETWEEN 10 AND 180 THEN
    RAISE EXCEPTION 'invalid sandbox GHL regeneration lease request';
  END IF;
  PERFORM 1 FROM public.demos demo JOIN public.components component ON component.id=demo.component_id
    WHERE demo.id=p_demo_id AND demo.user_id=p_user_id AND component.user_id=p_user_id
    FOR KEY SHARE OF demo,component;
  IF NOT FOUND THEN RETURN jsonb_build_object('status','forbidden'); END IF;

  INSERT INTO public.sandbox_ghl_review_leases(user_id,demo_id,fencing_generation)
    VALUES(p_user_id,p_demo_id,0) ON CONFLICT(user_id,demo_id) DO NOTHING;
  SELECT lease.* INTO STRICT current_lease FROM public.sandbox_ghl_review_leases lease
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id FOR UPDATE;
  IF current_lease.owner_token IS NOT NULL AND current_lease.lease_expires_at>clock_timestamp() THEN
    IF current_lease.input_fingerprint=p_input_fingerprint THEN
      RETURN jsonb_build_object('status','pending','fencing_generation',current_lease.fencing_generation,
        'retry_after_seconds',LEAST(5,GREATEST(1,ceil(extract(epoch FROM
          (current_lease.lease_expires_at-clock_timestamp())))::integer)));
    END IF;
    RETURN jsonb_build_object('status','conflict','fencing_generation',current_lease.fencing_generation);
  END IF;
  UPDATE public.sandbox_ghl_review_leases lease SET input_fingerprint=p_input_fingerprint,
    owner_token=p_owner_token,fencing_generation=lease.fencing_generation+1,
    lease_expires_at=clock_timestamp()+make_interval(secs=>p_lease_seconds),updated_at=clock_timestamp()
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id
    RETURNING lease.fencing_generation INTO acquired_generation;
  RETURN jsonb_build_object('status','acquired','fencing_generation',acquired_generation);
END $$;

REVOKE ALL ON FUNCTION public.claim_sandbox_ghl_regeneration_lease(text,bigint,text,uuid,integer)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_sandbox_ghl_regeneration_lease(text,bigint,text,uuid,integer)
  TO service_role;

-- Save only against the exact rows inspected during staging. The predicates
-- are evaluated by UPDATE while holding the row locks, closing the gap
-- between the operator's final read and its write.
CREATE FUNCTION public.persist_sandbox_ghl_regeneration_output(
  p_user_id text,p_demo_id bigint,p_component_id bigint,p_input_fingerprint text,p_owner_token uuid,
  p_fencing_generation bigint,p_html text,p_component_updated_at timestamptz,
  p_demo_updated_at timestamptz,p_component_code text,p_demo_code text,
  p_component_slug text,p_component_registry text,p_registry_url text,
  p_original_html text,p_original_fingerprint text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE current_lease public.sandbox_ghl_review_leases; updated_count integer;
BEGIN
  IF p_html IS NULL OR octet_length(p_html)=0 OR octet_length(p_html)>2097152 THEN
    RAISE EXCEPTION 'invalid sandbox GHL output';
  END IF;
  SELECT lease.* INTO current_lease FROM public.sandbox_ghl_review_leases lease
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id FOR UPDATE;
  IF NOT FOUND OR current_lease.input_fingerprint IS DISTINCT FROM p_input_fingerprint OR
     current_lease.owner_token IS DISTINCT FROM p_owner_token OR
     current_lease.fencing_generation IS DISTINCT FROM p_fencing_generation OR
     current_lease.lease_expires_at<=clock_timestamp() THEN
    RETURN false;
  END IF;
  PERFORM 1 FROM public.components component JOIN public.demos demo ON demo.component_id=component.id
    WHERE demo.id=p_demo_id AND demo.component_id=p_component_id AND component.id=p_component_id AND
      demo.user_id=p_user_id AND component.user_id=p_user_id AND
      component.is_public AND component.updated_at=p_component_updated_at AND
      component.code IS NOT DISTINCT FROM p_component_code AND
      component.registry_url IS NOT DISTINCT FROM p_registry_url AND
      component.component_slug=p_component_slug AND component.registry=p_component_registry
    FOR SHARE OF component;
  IF NOT FOUND THEN RETURN false; END IF;
  UPDATE public.demos demo SET ghl_html_content=p_html,ghl_source_fingerprint=p_input_fingerprint
    WHERE demo.id=p_demo_id AND demo.component_id=p_component_id AND
      demo.user_id=p_user_id AND demo.updated_at=p_demo_updated_at AND
      demo.demo_code IS NOT DISTINCT FROM p_demo_code AND
      demo.ghl_html_content IS NOT DISTINCT FROM p_original_html AND
      demo.ghl_source_fingerprint IS NOT DISTINCT FROM p_original_fingerprint;
  GET DIAGNOSTICS updated_count=ROW_COUNT;
  IF updated_count<>1 THEN RETURN false; END IF;
  UPDATE public.sandbox_ghl_review_leases lease SET input_fingerprint=NULL,owner_token=NULL,
    lease_expires_at=NULL,updated_at=clock_timestamp()
    WHERE lease.user_id=p_user_id AND lease.demo_id=p_demo_id AND
      lease.input_fingerprint=p_input_fingerprint AND lease.owner_token=p_owner_token AND
      lease.fencing_generation=p_fencing_generation;
  GET DIAGNOSTICS updated_count=ROW_COUNT;
  IF updated_count<>1 THEN RAISE EXCEPTION 'sandbox GHL lease changed during output persistence'; END IF;
  RETURN true;
END $$;

REVOKE ALL ON FUNCTION public.persist_sandbox_ghl_regeneration_output(text,bigint,bigint,text,uuid,bigint,text,timestamptz,timestamptz,text,text,text,text,text,text,text)
  FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.persist_sandbox_ghl_regeneration_output(text,bigint,bigint,text,uuid,bigint,text,timestamptz,timestamptz,text,text,text,text,text,text,text)
  TO service_role;
