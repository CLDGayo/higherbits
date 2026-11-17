BEGIN;
CREATE OR REPLACE FUNCTION public.copy_admission_clock() RETURNS timestamptz LANGUAGE sql VOLATILE SET search_path=pg_catalog,public AS $$ SELECT '2026-10-19 12:00:00+00'::timestamptz $$;
INSERT INTO public.users(id) VALUES ('ac6-replay'),('ac6-daily'),('ac6-pro'),('ac6-grants') ON CONFLICT DO NOTHING;
DO $test$
DECLARE response jsonb; response_hash bytea:=decode(repeat('ab',32),'hex'); changed_hash bytea:=decode(repeat('cd',32),'hex'); closure jsonb:='[{"kind":"source","id":"fixture"}]'; usage_count smallint; grant_index integer;
BEGIN
  response:=public.admit_copy_release('ac6-replay','00000000-0000-4000-8000-000000000001','mcp','component:fixture',closure,response_hash,false);
  IF response->>'ok' IS DISTINCT FROM 'true' OR response->>'remaining' IS DISTINCT FROM '1' THEN RAISE EXCEPTION 'first admission failed: %',response; END IF;
  FOR grant_index IN 1..2 LOOP
    response:=public.admit_copy_release('ac6-replay','00000000-0000-4000-8000-000000000001','mcp','component:fixture',closure,response_hash,false);
    IF response->>'ok' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'identical replay % failed: %',grant_index,response; END IF;
  END LOOP;
  response:=public.admit_copy_release('ac6-replay','00000000-0000-4000-8000-000000000001','mcp','component:fixture',closure,response_hash,false);
  IF response->>'error' IS DISTINCT FROM 'replay_limit_reached' OR response->>'status' IS DISTINCT FROM '429' THEN RAISE EXCEPTION 'replay cap mismatch: %',response; END IF;
  response:=public.admit_copy_release('ac6-replay','00000000-0000-4000-8000-000000000001','mcp','component:fixture',closure,changed_hash,false);
  IF response->>'error' IS DISTINCT FROM 'request_conflict' OR response->>'status' IS DISTINCT FROM '409' THEN RAISE EXCEPTION 'response conflict mismatch: %',response; END IF;
  SELECT daily.consumed INTO usage_count FROM public.copy_daily_usage AS daily WHERE daily.user_id='ac6-replay' AND daily.utc_day='2026-10-19';
  IF usage_count IS DISTINCT FROM 1 THEN RAISE EXCEPTION 'replay charged more than once: %',usage_count; END IF;

  response:=public.admit_copy_release('ac6-daily','00000000-0000-4000-8000-000000000011','code','component:one',closure,response_hash,false);
  IF response->>'ok' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'first daily admission failed: %',response; END IF;
  response:=public.admit_copy_release('ac6-daily','00000000-0000-4000-8000-000000000012','code','component:two',closure,response_hash,false);
  IF response->>'ok' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'second daily admission failed: %',response; END IF;
  response:=public.admit_copy_release('ac6-daily','00000000-0000-4000-8000-000000000013','code','component:three',closure,response_hash,false);
  IF response->>'error' IS DISTINCT FROM 'copy_limit_reached' OR response->>'status' IS DISTINCT FROM '429' OR response->>'resetAt' IS DISTINCT FROM '2026-10-20T00:00:00+00:00' THEN RAISE EXCEPTION 'daily denial/reset mismatch: %',response; END IF;
  SELECT daily.consumed INTO usage_count FROM public.copy_daily_usage AS daily WHERE daily.user_id='ac6-daily' AND daily.utc_day='2026-10-19';
  IF usage_count IS DISTINCT FROM 2 THEN RAISE EXCEPTION 'daily count mismatch: %',usage_count; END IF;

  response:=public.admit_copy_release('ac6-pro','00000000-0000-4000-8000-000000000021','code','component:pro',closure,response_hash,true);
  IF response->>'ok' IS DISTINCT FROM 'true' OR EXISTS(SELECT 1 FROM public.copy_daily_usage AS daily WHERE daily.user_id='ac6-pro') THEN RAISE EXCEPTION 'pro admission charged free allowance: %',response; END IF;

  FOR grant_index IN 1..8 LOOP
    response:=public.issue_copy_grant('ac6-grants',('00000000-0000-4000-8000-'||lpad(grant_index::text,12,'0'))::uuid,'mcp','component:grant-'||grant_index,closure);
    IF response->>'ok' IS DISTINCT FROM 'true' THEN RAISE EXCEPTION 'grant % failed: %',grant_index,response; END IF;
  END LOOP;
  response:=public.issue_copy_grant('ac6-grants','00000000-0000-4000-8000-000000000099','mcp','component:grant-over',closure);
  IF response->>'error' IS DISTINCT FROM 'grant_rate_limited' OR response->>'status' IS DISTINCT FROM '429' OR response->>'retryAfter' IS DISTINCT FROM '60' THEN RAISE EXCEPTION 'grant rate limit mismatch: %',response; END IF;
  response:=public.issue_copy_grant('ac6-grants','00000000-0000-4000-8000-000000000001','mcp','component:duplicate',closure);
  IF response->>'error' IS DISTINCT FROM 'request_conflict' OR response->>'status' IS DISTINCT FROM '409' THEN RAISE EXCEPTION 'duplicate grant mismatch: %',response; END IF;
END $test$;
ROLLBACK;
