DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['auto_index_sources','auto_index_refresh_state','auto_index_refresh_runs','auto_index_candidates','auto_index_candidate_files','auto_index_candidate_demos','auto_index_candidate_assets','auto_index_decisions','auto_index_publications','sandbox_ghl_review_leases'] LOOP
    IF has_table_privilege('anon','public.'||t,'SELECT,INSERT,UPDATE,DELETE') OR
       has_table_privilege('authenticated','public.'||t,'SELECT,INSERT,UPDATE,DELETE') THEN
      RAISE EXCEPTION 'client privilege on %', t;
    END IF;
  END LOOP;
  IF has_table_privilege('service_role','public.auto_index_refresh_state','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.auto_index_refresh_runs','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.sandbox_ghl_review_leases','SELECT,INSERT,UPDATE,DELETE') OR
     has_function_privilege('authenticated','public.begin_auto_index_refresh(bigint,text,text)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.begin_auto_index_refresh(bigint,text,text)','EXECUTE') OR
     has_function_privilege('authenticated','public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer)','EXECUTE') OR
     has_function_privilege('authenticated','public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint)','EXECUTE') OR
     has_function_privilege('authenticated','public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.claim_sandbox_ghl_review_lease(text,bigint,text,uuid,integer)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.release_sandbox_ghl_review_lease(text,bigint,text,uuid,bigint)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.persist_sandbox_ghl_review_output(text,bigint,text,uuid,bigint,text)','EXECUTE') THEN
    RAISE EXCEPTION 'refresh generation and GHL lease state must be server-only';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='auto_index_publications' AND column_name='superseded_at') OR
     NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname='public' AND tablename='auto_index_publications'
       AND indexname='auto_index_one_active_publication') OR
     has_table_privilege('service_role','public.auto_index_publications','INSERT,UPDATE,DELETE') THEN
    RAISE EXCEPTION 'publication revision history must remain private and RPC-managed';
  END IF;
END $$;
