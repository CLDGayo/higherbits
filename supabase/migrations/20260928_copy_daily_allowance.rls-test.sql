DO $$
DECLARE role_name text; fn text; tab text;
BEGIN
  FOREACH role_name IN ARRAY ARRAY['anon','authenticated'] LOOP
    FOREACH tab IN ARRAY ARRAY['copy_daily_usage','copy_release_grants'] LOOP
      IF has_table_privilege(role_name,'public.'||tab,'SELECT,INSERT,UPDATE,DELETE') THEN RAISE EXCEPTION 'copy table accessible to client'; END IF;
      IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid=('public.'||tab)::regclass) THEN RAISE EXCEPTION 'RLS disabled'; END IF;
    END LOOP;
    FOREACH fn IN ARRAY ARRAY['copy_admission_clock()','issue_copy_grant(text,uuid,text,text,jsonb,bytea)','admit_copy_release(text,uuid,text,text,jsonb,bytea,boolean,bytea)','prune_copy_state()'] LOOP
      IF has_function_privilege(role_name,'public.'||fn,'EXECUTE') THEN RAISE EXCEPTION 'copy function accessible to client'; END IF;
      IF NOT has_function_privilege('service_role','public.'||fn,'EXECUTE') THEN RAISE EXCEPTION 'service access missing'; END IF;
    END LOOP;
  END LOOP;
END $$;
