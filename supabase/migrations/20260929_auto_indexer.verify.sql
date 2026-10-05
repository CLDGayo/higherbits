DO $$
DECLARE t text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.components'::regclass AND tgname='auto_index_component_visibility_insert_guard' AND NOT tgisinternal) OR
     NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.components'::regclass AND tgname='auto_index_component_visibility_guard' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'component visibility guard must cover INSERT and registry/is_public UPDATE';
  END IF;
  FOREACH t IN ARRAY ARRAY['auto_index_sources','auto_index_refresh_state','auto_index_refresh_runs','auto_index_candidates','auto_index_candidate_files','auto_index_candidate_demos','auto_index_candidate_assets','auto_index_decisions','auto_index_publications','sandbox_ghl_review_leases'] LOOP
    IF to_regclass('public.'||t) IS NULL THEN RAISE EXCEPTION 'missing auto-index table %', t; END IF;
    IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=('public.'||t)::regclass) THEN RAISE EXCEPTION 'RLS disabled on %', t; END IF;
    IF has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE') OR
       has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE') THEN
      RAISE EXCEPTION 'client can access %', t;
    END IF;
    IF t NOT IN ('auto_index_refresh_state','auto_index_refresh_runs','sandbox_ghl_review_leases') AND
       NOT has_table_privilege('service_role','public.'||t,'SELECT') THEN RAISE EXCEPTION 'service cannot read %', t; END IF;
  END LOOP;
  IF has_table_privilege('service_role','public.auto_index_refresh_state','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.auto_index_refresh_runs','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.sandbox_ghl_review_leases','SELECT,INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'refresh sequencing and GHL lease tables must be accessible only through server-side RPCs';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='auto_index_candidates' AND indexdef LIKE '%(source_id, item_key, revision)%') THEN
    RAISE EXCEPTION 'missing candidate revision uniqueness';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auto_index_candidates' AND column_name='refresh_generation') OR
     NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgrelid='public.auto_index_refresh_runs'::regclass AND tgname='auto_index_refresh_runs_immutable' AND NOT tgisinternal) OR
     NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conrelid='public.auto_index_candidates'::regclass AND confrelid='public.auto_index_refresh_runs'::regclass AND contype='f') THEN
    RAISE EXCEPTION 'missing immutable refresh-generation history or candidate fence';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auto_index_publications' AND column_name='superseded_at') OR
     NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='auto_index_publications'
       AND indexname='auto_index_one_active_publication' AND indexdef ILIKE '%WHERE%delisted_at IS NULL%superseded_at IS NULL%') THEN
    RAISE EXCEPTION 'missing immutable revision history and active-publication uniqueness';
  END IF;
  IF has_function_privilege('authenticated','public.publish_auto_index_candidate(bigint,text,text,text,text)','EXECUTE') OR
     has_function_privilege('authenticated','public.begin_auto_index_refresh(bigint,text,text)','EXECUTE') OR
     has_function_privilege('authenticated','public.delist_auto_index_rejected_license(bigint)','EXECUTE') OR
     has_function_privilege('authenticated','public.record_auto_index_candidate_demo(bigint,text,text,text,text,text,text,text,jsonb,text,text)','EXECUTE') OR
     has_function_privilege('authenticated','public.record_auto_index_candidate_asset(bigint,text,text,text,text,text,text,text,text,text,text,text,text,jsonb)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.publish_auto_index_candidate(bigint,text,text,text,text)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.begin_auto_index_refresh(bigint,text,text)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.delist_auto_index_rejected_license(bigint)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.record_auto_index_candidate_demo(bigint,text,text,text,text,text,text,text,jsonb,text,text)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.record_auto_index_candidate_asset(bigint,text,text,text,text,text,text,text,text,text,text,text,text,jsonb)','EXECUTE') THEN
    RAISE EXCEPTION 'incorrect publication function privileges';
  END IF;
  IF has_function_privilege('anon','public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer)','EXECUTE') OR
     has_function_privilege('authenticated','public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer)','EXECUTE') OR
     has_function_privilege('anon','public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint)','EXECUTE') OR
     has_function_privilege('authenticated','public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint)','EXECUTE') OR
     has_function_privilege('anon','public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text)','EXECUTE') OR
     has_function_privilege('authenticated','public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text)','EXECUTE') OR
     NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer)'::regprocedure) OR
     NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint)'::regprocedure) OR
     NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text)'::regprocedure) THEN
    RAISE EXCEPTION 'GHL lease RPCs must be security-definer and service-role-only';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='sandbox_ghl_review_leases'
       AND indexname='sandbox_ghl_review_leases_demo_id_idx' AND indexdef LIKE '%(demo_id)%') THEN
    RAISE EXCEPTION 'missing demo cascade lookup index for GHL leases';
  END IF;
  IF has_table_privilege('service_role','public.auto_index_publications','INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'service role must mutate publication history only through finalizer RPCs';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint constraint_row
       WHERE constraint_row.conrelid='public.auto_index_publications'::regclass
         AND constraint_row.contype='u' AND constraint_row.conkey=ARRAY[(SELECT attnum FROM pg_attribute
           WHERE attrelid='public.auto_index_publications'::regclass AND attname='component_id')]::smallint[]) THEN
    RAISE EXCEPTION 'publication history must permit multiple revisions for a stable component';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auto_index_candidate_assets' AND column_name='source_asset_key') OR
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auto_index_candidate_assets' AND column_name='source_asset_sha256') OR
     NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auto_index_candidate_assets' AND column_name='transform_record') THEN
    RAISE EXCEPTION 'missing structured adapted-asset lineage fields';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='demos' AND column_name='ghl_source_fingerprint') THEN
    RAISE EXCEPTION 'missing persisted GHL source fingerprint';
  END IF;
END $$;
