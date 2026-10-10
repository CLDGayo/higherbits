DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE oid='public.auto_index_admin_state'::regclass) THEN
    RAISE EXCEPTION 'auto-index admin state must have RLS enabled';
  END IF;
  IF has_table_privilege('anon','public.auto_index_admin_state','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('authenticated','public.auto_index_admin_state','SELECT,INSERT,UPDATE,DELETE') OR
     has_table_privilege('service_role','public.auto_index_admin_state','DELETE') OR
     NOT has_table_privilege('service_role','public.auto_index_admin_state','SELECT,INSERT,UPDATE') THEN
    RAISE EXCEPTION 'incorrect auto-index admin state table privileges';
  END IF;
  IF has_function_privilege('anon','public.list_auto_index_admin_items(integer,integer,text)','EXECUTE') OR
     has_function_privilege('authenticated','public.list_auto_index_admin_items(integer,integer,text)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.list_auto_index_admin_items(integer,integer,text)','EXECUTE') OR
     has_function_privilege('anon','public.admin_update_auto_index_state(integer,text,text,boolean,boolean)','EXECUTE') OR
     has_function_privilege('authenticated','public.admin_update_auto_index_state(integer,text,text,boolean,boolean)','EXECUTE') OR
     NOT has_function_privilege('service_role','public.admin_update_auto_index_state(integer,text,text,boolean,boolean)','EXECUTE') THEN
    RAISE EXCEPTION 'incorrect auto-index admin RPC privileges';
  END IF;
  IF NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.list_auto_index_admin_items(integer,integer,text)'::regprocedure) OR
     NOT (SELECT prosecdef FROM pg_proc WHERE oid='public.admin_update_auto_index_state(integer,text,text,boolean,boolean)'::regprocedure) THEN
    RAISE EXCEPTION 'auto-index admin RPCs must be security definer';
  END IF;
  IF pg_get_functiondef('public.list_auto_index_admin_items(integer,integer,text)'::regprocedure) !~* 'coalesce\([[:space:]]*d\.bundle_html_url[[:space:]]*,[[:space:]]*c\.bundle_html_url[[:space:]]*\)' THEN
    RAISE EXCEPTION 'auto-index preview must fall back to the component bundle';
  END IF;
END $$;
