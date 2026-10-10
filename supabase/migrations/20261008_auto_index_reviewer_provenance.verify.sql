DO $$
DECLARE decision_guard text; stage_writer text; review_writer text; finalizer text; payload_guard text;
  normalized_payload_guard text; normalized_finalizer text;
  component_policy text; demo_policy text; public_select_helper text;
  component_public_policy text; demo_public_policy text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class
      WHERE oid='public.auto_index_review_provenance'::regclass AND relrowsecurity) OR
     NOT EXISTS (SELECT 1 FROM pg_class
      WHERE oid='public.auto_index_candidate_publication_metadata'::regclass AND relrowsecurity) THEN
    RAISE EXCEPTION 'review provenance and staged metadata tables must have RLS enabled';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_class
      WHERE oid='public.auto_index_publication_supersessions'::regclass AND relrowsecurity) OR
     NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.auto_index_publication_supersessions'::regclass AND contype='p') OR
     (SELECT count(*) FROM pg_constraint
      WHERE conrelid='public.auto_index_publication_supersessions'::regclass AND contype='f'
        AND confrelid='public.auto_index_publications'::regclass)<2 OR
     NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.auto_index_publication_supersessions'::regclass AND contype='u'
        AND conkey=ARRAY[(SELECT attnum FROM pg_attribute
          WHERE attrelid='public.auto_index_publication_supersessions'::regclass
            AND attname='adoption_provenance_id')]::smallint[]) OR
     NOT EXISTS (SELECT 1 FROM pg_trigger
      WHERE tgrelid='public.auto_index_publication_supersessions'::regclass
        AND tgname='auto_index_publication_supersession_guard' AND NOT tgisinternal) THEN
    RAISE EXCEPTION 'append-only publication supersession relation contract is missing';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.auto_index_review_provenance'::regclass AND contype='p'
        AND conkey=ARRAY[(SELECT attnum FROM pg_attribute
          WHERE attrelid='public.auto_index_review_provenance'::regclass AND attname='id')]::smallint[]) OR
     NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.auto_index_review_provenance'::regclass AND contype='u'
        AND conkey=ARRAY[(SELECT attnum FROM pg_attribute
          WHERE attrelid='public.auto_index_review_provenance'::regclass AND attname='candidate_id')]::smallint[]) OR
     NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.auto_index_review_provenance'::regclass AND contype='u'
        AND conkey=ARRAY[(SELECT attnum FROM pg_attribute
          WHERE attrelid='public.auto_index_review_provenance'::regclass AND attname='idempotency_key')]::smallint[]) OR
     NOT EXISTS (SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name='auto_index_review_provenance'
        AND column_name='candidate_fingerprint' AND udt_name='bytea') OR
     NOT EXISTS (SELECT 1 FROM pg_constraint
      WHERE conrelid='public.auto_index_decisions'::regclass AND contype='f'
        AND conkey=ARRAY[(SELECT attnum FROM pg_attribute
          WHERE attrelid='public.auto_index_decisions'::regclass AND attname='review_provenance_id')]::smallint[]
        AND confrelid='public.auto_index_review_provenance'::regclass) THEN
    RAISE EXCEPTION 'review provenance key/fingerprint/decision linkage contract is missing';
  END IF;
  IF has_table_privilege('anon','public.auto_index_review_provenance','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('authenticated','public.auto_index_review_provenance','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.auto_index_review_provenance','INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.auto_index_candidate_publication_metadata','INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.auto_index_publication_supersessions','INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.auto_index_decisions','INSERT,UPDATE,DELETE') OR
     has_table_privilege('auto_index_stage','public.auto_index_decisions','INSERT,UPDATE,DELETE') OR
     has_table_privilege('auto_index_reviewer','public.auto_index_decisions','INSERT,UPDATE,DELETE') OR
     has_table_privilege('auto_index_stage','public.auto_index_publication_supersessions','INSERT,UPDATE,DELETE') OR
     has_table_privilege('auto_index_reviewer','public.auto_index_publication_supersessions','INSERT,UPDATE,DELETE') OR
     NOT has_table_privilege('service_role','public.auto_index_publication_supersessions','SELECT') OR
     has_sequence_privilege('authenticated','public.auto_index_review_provenance_id_seq','USAGE,SELECT,UPDATE') OR
     has_sequence_privilege('authenticated','public.auto_index_decisions_id_seq','USAGE,SELECT,UPDATE') OR
     has_function_privilege('anon','public.auto_index_component_has_current_approval(bigint)','EXECUTE') OR
     has_function_privilege('authenticated','public.auto_index_component_has_current_approval(bigint)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.auto_index_component_has_current_approval(bigint)','EXECUTE') OR
     has_function_privilege('anon','public.auto_index_component_public_select_allowed(bigint)','EXECUTE') OR
     NOT has_function_privilege('authenticated','public.auto_index_component_public_select_allowed(bigint)','EXECUTE') OR
     has_function_privilege('service_role','public.auto_index_component_public_select_allowed(bigint)','EXECUTE') OR
     has_function_privilege('anon','public.auto_index_components_with_current_approval(bigint[])','EXECUTE') OR
     has_function_privilege('authenticated','public.auto_index_components_with_current_approval(bigint[])','EXECUTE') OR
     NOT has_function_privilege('service_role','public.auto_index_components_with_current_approval(bigint[])','EXECUTE') THEN
    RAISE EXCEPTION 'direct approval/provenance/staging writes remain available';
  END IF;
  IF has_function_privilege('service_role','public.publish_auto_index_candidate(bigint,text,text,text,text)','EXECUTE') OR
     has_function_privilege('service_role','public.auto_index_record_human_review(bigint,text,text,text,jsonb,text)','EXECUTE') OR
     has_function_privilege('auto_index_stage','public.auto_index_record_human_review(bigint,text,text,text,jsonb,text)','EXECUTE') OR
     has_function_privilege('auto_index_stage','public.finalize_auto_index_candidate(bigint)','EXECUTE') OR
     NOT has_function_privilege('auto_index_stage','public.stage_auto_index_candidate_publication_metadata(bigint,text,text,text,text,jsonb,text,text,text,text)','EXECUTE') OR
     NOT has_function_privilege('auto_index_reviewer','public.auto_index_record_human_review(bigint,text,text,text,jsonb,text)','EXECUTE') OR
     NOT has_function_privilege('auto_index_reviewer','public.finalize_auto_index_candidate(bigint)','EXECUTE') THEN
    RAISE EXCEPTION 'stage/reviewer function capability separation is invalid';
  END IF;
  IF (SELECT count(*) FROM pg_roles WHERE rolname IN ('auto_index_stage','auto_index_reviewer'))<>2 OR
     EXISTS (SELECT 1 FROM pg_roles WHERE rolname IN ('auto_index_stage','auto_index_reviewer') AND
       (NOT rolcanlogin OR rolsuper OR rolinherit OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls)) THEN
    RAISE EXCEPTION 'stage/reviewer logins do not have the exact least-privilege role attributes';
  END IF;
  IF has_schema_privilege('auto_index_stage','public','CREATE') OR
     has_schema_privilege('auto_index_reviewer','public','CREATE') THEN
    RAISE EXCEPTION 'stage/reviewer must not have CREATE on public';
  END IF;
  IF EXISTS (
    WITH RECURSIVE roots AS (
      SELECT oid,rolname FROM pg_roles WHERE rolname IN ('auto_index_stage','auto_index_reviewer')
    ), membership_closure(root_oid,role_oid) AS (
      SELECT oid,oid FROM roots
      UNION
      SELECT closure.root_oid,membership.roleid
      FROM membership_closure closure
      JOIN pg_auth_members membership ON membership.member=closure.role_oid
    )
    SELECT 1 FROM roots
    LEFT JOIN membership_closure closure ON closure.root_oid=roots.oid
    GROUP BY roots.oid
    HAVING count(closure.role_oid)<>1
  ) OR EXISTS (
    WITH RECURSIVE membership_closure(login_oid,role_oid) AS (
      SELECT oid,oid FROM pg_roles WHERE rolname IN ('auto_index_stage','auto_index_reviewer')
      UNION
      SELECT closure.login_oid,membership.roleid
      FROM membership_closure closure
      JOIN pg_auth_members membership ON membership.member=closure.role_oid
    )
    SELECT 1 FROM membership_closure closure
    JOIN pg_roles inherited ON inherited.oid=closure.role_oid
    WHERE inherited.rolname IN ('postgres','supabase_admin','authenticator','service_role',
      'auto_index_stage','auto_index_reviewer')
      AND inherited.oid<>closure.login_oid
  ) THEN
    RAISE EXCEPTION 'stage/reviewer has a direct or transitive role membership';
  END IF;
  IF EXISTS (
    WITH RECURSIVE granted_to_closure(root_oid,member_oid) AS (
      SELECT oid,oid FROM pg_roles WHERE rolname IN ('auto_index_stage','auto_index_reviewer')
      UNION
      SELECT closure.root_oid,membership.member
      FROM granted_to_closure closure
      JOIN pg_auth_members membership ON membership.roleid=closure.member_oid
    )
    SELECT 1 FROM granted_to_closure closure
    WHERE closure.member_oid<>closure.root_oid
  ) THEN
    RAISE EXCEPTION 'stage/reviewer is granted to another direct or transitive role member';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_roles restricted_role
    JOIN pg_class protected ON protected.relowner=restricted_role.oid
    WHERE restricted_role.rolname IN ('auto_index_stage','auto_index_reviewer')
      AND protected.oid IN (
        'public.components'::regclass,'public.demos'::regclass,
        'public.auto_index_sources'::regclass,'public.auto_index_refresh_state'::regclass,
        'public.auto_index_refresh_runs'::regclass,'public.auto_index_candidates'::regclass,
        'public.auto_index_candidate_files'::regclass,'public.auto_index_candidate_demos'::regclass,
        'public.auto_index_candidate_assets'::regclass,'public.auto_index_decisions'::regclass,
        'public.auto_index_publications'::regclass,'public.auto_index_publication_supersessions'::regclass,
        'public.auto_index_copy_prompts'::regclass,'public.auto_index_review_provenance'::regclass,
        'public.auto_index_candidate_publication_metadata'::regclass)
  ) OR EXISTS (
    SELECT 1 FROM pg_roles restricted_role
    JOIN pg_proc protected ON protected.proowner=restricted_role.oid
    WHERE restricted_role.rolname IN ('auto_index_stage','auto_index_reviewer')
      AND protected.pronamespace='public'::regnamespace
      AND protected.proname IN ('auto_index_decision_guard','auto_index_review_provenance_immutable',
        'auto_index_publication_supersession_guard','auto_index_candidate_review_fingerprint',
        'auto_index_component_has_current_approval','auto_index_components_with_current_approval',
        'auto_index_component_public_select_allowed','stage_auto_index_candidate_publication_metadata',
        'auto_index_admin_review_queue','auto_index_admin_review_candidate',
        'auto_index_record_human_review','finalize_auto_index_candidate','publish_auto_index_candidate',
        'auto_index_publication_guard','auto_index_publication_visibility',
        'auto_index_component_visibility_guard','auto_index_history_immutable','auto_index_claim_owner_guard',
        'auto_index_reviewed_payload_guard')
  ) OR EXISTS (
    SELECT 1 FROM pg_namespace schema
    JOIN pg_roles restricted_role ON schema.nspowner=restricted_role.oid
    WHERE schema.nspname='public' AND restricted_role.rolname IN ('auto_index_stage','auto_index_reviewer')
  ) THEN
    RAISE EXCEPTION 'stage/reviewer owns a protected table, function, or schema';
  END IF;
  SELECT pg_get_expr(policy.polqual,policy.polrelid) INTO component_policy
    FROM pg_policy policy WHERE policy.polrelid='public.components'::regclass
      AND policy.polname='auto_index_public_provenance_guard' AND NOT policy.polpermissive;
  SELECT pg_get_expr(policy.polqual,policy.polrelid) INTO component_public_policy
    FROM pg_policy policy WHERE policy.polrelid='public.components'::regclass
      AND policy.polname='components_select' AND policy.polpermissive;
  SELECT pg_get_expr(policy.polqual,policy.polrelid) INTO demo_policy
    FROM pg_policy policy WHERE policy.polrelid='public.demos'::regclass
      AND policy.polname='auto_index_public_provenance_guard' AND NOT policy.polpermissive;
  SELECT pg_get_expr(policy.polqual,policy.polrelid) INTO demo_public_policy
    FROM pg_policy policy WHERE policy.polrelid='public.demos'::regclass
      AND policy.polname='demos_select' AND policy.polpermissive;
  SELECT pg_get_functiondef('public.auto_index_component_public_select_allowed(bigint)'::regprocedure)
    INTO public_select_helper;
  IF has_table_privilege('anon','public.components','SELECT') OR
     has_table_privilege('anon','public.demos','SELECT') OR
     component_policy IS NULL OR demo_policy IS NULL OR component_public_policy IS NULL OR demo_public_policy IS NULL OR
     position('auto_index_component_public_select_allowed' IN component_policy)=0 OR
     position('user_id' IN component_policy)=0 OR
     position('auto_index_component_public_select_allowed' IN demo_policy)=0 OR
     position('user_id' IN demo_policy)=0 OR
     position('is_public' IN component_public_policy)=0 OR position('user_id' IN component_public_policy)=0 OR
     position('user_id' IN demo_public_policy)=0 OR position('component_id' IN demo_public_policy)=0 OR
     position('registry IS DISTINCT FROM ''auto-index''' IN public_select_helper)=0 OR
     position('auto_index_component_has_current_approval' IN public_select_helper)=0 OR
     NOT EXISTS (SELECT 1 FROM pg_proc helper
       WHERE helper.oid='public.auto_index_component_public_select_allowed(bigint)'::regprocedure
         AND helper.prosecdef
         AND 'row_security=off'=ANY(coalesce(helper.proconfig,ARRAY[]::text[]))
         AND 'search_path=pg_catalog, public'=ANY(coalesce(helper.proconfig,ARRAY[]::text[]))) THEN
    RAISE EXCEPTION 'component/demo direct-table SELECT policies do not preserve owner access and require current provenance';
  END IF;
  SELECT pg_get_functiondef('public.auto_index_reviewed_payload_guard()'::regprocedure)
    INTO payload_guard;
  IF payload_guard IS NULL OR position('SECURITY DEFINER' IN payload_guard)=0 OR
     position('auto_index_publications' IN payload_guard)=0 OR
     position('reviewed auto-index component payload is immutable' IN payload_guard)=0 OR
     position('reviewed auto-index demo payload is immutable' IN payload_guard)=0 OR
     position('unreviewed demo cannot be added to a reviewed auto-index component' IN payload_guard)=0 OR
     position('downloads_count' IN payload_guard)=0 OR position('bookmarks_count' IN payload_guard)=0 OR
     position('NEW.component_id' IN payload_guard)=0 OR position('OLD.component_id' IN payload_guard)=0 OR
     NOT EXISTS (SELECT 1 FROM pg_proc function
       WHERE function.oid='public.auto_index_reviewed_payload_guard()'::regprocedure
         AND function.prosecdef
         AND EXISTS (SELECT 1 FROM unnest(function.proconfig) AS setting(value)
           WHERE replace(setting.value,' ','')='search_path=pg_catalog,public')) OR
     NOT EXISTS (SELECT 1 FROM pg_trigger trigger
       WHERE trigger.tgrelid='public.components'::regclass
         AND trigger.tgname='auto_index_reviewed_component_payload_guard' AND NOT trigger.tgisinternal
         AND (trigger.tgtype & 3)=3 AND (trigger.tgtype & 24)=24
         AND trigger.tgfoid='public.auto_index_reviewed_payload_guard()'::regprocedure) OR
     NOT EXISTS (SELECT 1 FROM pg_trigger trigger
       WHERE trigger.tgrelid='public.demos'::regclass
         AND trigger.tgname='auto_index_reviewed_demo_payload_guard' AND NOT trigger.tgisinternal
         AND (trigger.tgtype & 3)=3 AND (trigger.tgtype & 24)=24
         AND (trigger.tgtype & 4)=4
         AND trigger.tgfoid='public.auto_index_reviewed_payload_guard()'::regprocedure) THEN
    RAISE EXCEPTION 'reviewed component/demo payload freeze contract is missing';
  END IF;
  normalized_payload_guard:=lower(regexp_replace(payload_guard,'[[:space:]]+','','g'));
  IF position('publication.component_idin(old.component_id,new.component_id)' IN normalized_payload_guard)=0 THEN
    RAISE EXCEPTION 'demo reattachment to a reviewed component is not rejected';
  END IF;
  SELECT pg_get_functiondef('public.auto_index_decision_guard()'::regprocedure) INTO decision_guard;
  SELECT pg_get_functiondef('public.stage_auto_index_candidate_publication_metadata(bigint,text,text,text,text,jsonb,text,text,text,text)'::regprocedure) INTO stage_writer;
  SELECT pg_get_functiondef('public.auto_index_record_human_review(bigint,text,text,text,jsonb,text)'::regprocedure) INTO review_writer;
  SELECT pg_get_functiondef('public.finalize_auto_index_candidate(bigint)'::regprocedure) INTO finalizer;
  normalized_finalizer:=lower(regexp_replace(finalizer,'[[:space:]]+','','g'));
  IF position('approved decision requires valid reviewer provenance' IN decision_guard)=0 OR
     position('session_user' IN stage_writer)=0 OR position('auto_index_stage' IN stage_writer)=0 OR
     position('source identity' IN stage_writer)=0 OR position('jsonb' IN stage_writer)=0 OR
     position('session_user' IN review_writer)=0 OR position('auto_index_reviewer' IN review_writer)=0 OR
     position('session_user' IN finalizer)=0 OR position('auto_index_reviewer' IN finalizer)=0 OR
     position('candidate_fingerprint' IN finalizer)=0 OR position('auto_index_candidate_review_fingerprint' IN finalizer)=0 OR
     position('bundle_html_url' IN finalizer)=0 OR position('compiled_css' IN finalizer)=0 OR
     position('auto_index_publication_supersessions' IN finalizer)=0 OR
     position('UPDATE public.auto_index_publications' IN finalizer)>0 OR
     position('UPDATE public.demos' IN finalizer)>0 OR
     position('lower(c.license_spdx),false)' IN normalized_finalizer)=0 OR
     position('insertintopublic.auto_index_publications' IN normalized_finalizer)=0 OR
     position('updatepublic.componentssetis_public=true' IN normalized_finalizer)=0 OR
     position('updatepublic.componentssetis_public=true' IN normalized_finalizer)<=
       position('insertintopublic.auto_index_publications' IN normalized_finalizer) THEN
    RAISE EXCEPTION 'approval, stage, review, or finalization guard is incomplete';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc function
      WHERE function.pronamespace='public'::regnamespace
        AND function.prosecdef
        AND function.proname IN ('auto_index_candidate_review_fingerprint','auto_index_component_has_current_approval','auto_index_components_with_current_approval','auto_index_component_public_select_allowed','auto_index_publication_supersession_guard','auto_index_reviewed_payload_guard','stage_auto_index_candidate_publication_metadata',
          'auto_index_admin_review_queue','auto_index_admin_review_candidate','auto_index_record_human_review',
          'finalize_auto_index_candidate')
        AND NOT ('search_path=pg_catalog, public' = ANY(coalesce(function.proconfig,ARRAY[]::text[])))) THEN
    RAISE EXCEPTION 'a reviewer-provenance security definer function has an unsafe search path';
  END IF;
END $$;
