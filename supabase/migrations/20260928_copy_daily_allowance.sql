BEGIN;
CREATE TABLE public.copy_daily_usage (
  user_id text NOT NULL REFERENCES public.users(id),
  utc_day date NOT NULL,
  consumed smallint NOT NULL CHECK (consumed BETWEEN 0 AND 2),
  PRIMARY KEY (user_id, utc_day)
);
CREATE TABLE public.copy_release_grants (
  user_id text NOT NULL REFERENCES public.users(id),
  request_id uuid NOT NULL,
  token_hash bytea UNIQUE CHECK (token_hash IS NULL OR octet_length(token_hash)=32),
  action text NOT NULL CHECK (action IN ('prompt','code','mcp','cli')),
  target_key text NOT NULL CHECK (length(target_key) BETWEEN 1 AND 256),
  closure jsonb NOT NULL CHECK (jsonb_typeof(closure)='array' AND jsonb_array_length(closure) BETWEEN 1 AND 32 AND octet_length(closure::text)<=16384),
  response_hash bytea CHECK (response_hash IS NULL OR octet_length(response_hash)=32),
  issued_at timestamptz NOT NULL,
  expires_at timestamptz NOT NULL,
  admitted_at timestamptz,
  admitted_day date,
  charged boolean NOT NULL DEFAULT false,
  release_count smallint NOT NULL DEFAULT 0 CHECK (release_count BETWEEN 0 AND 4),
  PRIMARY KEY(user_id,request_id),
  CHECK (expires_at>issued_at AND expires_at<=issued_at + CASE WHEN action='cli' THEN interval '300 seconds' ELSE interval '120 seconds' END),
  CHECK (action='cli' OR release_count<=3),
  CHECK ((admitted_at IS NULL AND admitted_day IS NULL AND response_hash IS NULL AND release_count=0 AND NOT charged) OR
         (admitted_at IS NOT NULL AND admitted_day IS NOT NULL AND response_hash IS NOT NULL AND release_count>0)),
  CHECK ((action='cli') = (token_hash IS NOT NULL))
);
CREATE INDEX copy_release_grants_user_issue ON public.copy_release_grants(user_id,issued_at);
CREATE INDEX copy_release_grants_expiry ON public.copy_release_grants(expires_at);
CREATE INDEX copy_daily_usage_day ON public.copy_daily_usage(utc_day);
ALTER TABLE public.copy_daily_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copy_release_grants ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.copy_daily_usage,public.copy_release_grants FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.copy_daily_usage,public.copy_release_grants TO service_role;

-- Production clock. Tests replace this function ONLY inside a disposable database.
CREATE FUNCTION public.copy_admission_clock() RETURNS timestamptz LANGUAGE sql VOLATILE
SET search_path=pg_catalog,public AS $$ SELECT clock_timestamp() $$;

CREATE FUNCTION public.issue_copy_grant(p_user_id text,p_request_id uuid,p_action text,p_target_key text,p_closure jsonb,p_token_hash bytea DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE t timestamptz; expiry timestamptz;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id,0));
  t:=public.copy_admission_clock();
  IF EXISTS(SELECT 1 FROM public.copy_release_grants WHERE user_id=p_user_id AND request_id=p_request_id) THEN
    RETURN jsonb_build_object('error','request_conflict','status',409);
  END IF;
  IF (SELECT count(*) FROM public.copy_release_grants WHERE user_id=p_user_id AND expires_at>t)>=8 OR
     (SELECT count(*) FROM public.copy_release_grants WHERE user_id=p_user_id AND issued_at>t-interval '60 seconds')>=10 THEN
    RETURN jsonb_build_object('error','grant_rate_limited','status',429,'retryAfter',60);
  END IF;
  expiry:=t+CASE WHEN p_action='cli' THEN interval '300 seconds' ELSE interval '120 seconds' END;
  INSERT INTO public.copy_release_grants(user_id,request_id,action,target_key,closure,token_hash,issued_at,expires_at)
    VALUES(p_user_id,p_request_id,p_action,p_target_key,p_closure,p_token_hash,t,expiry);
  RETURN jsonb_build_object('ok',true,'expiresAt',expiry);
END $$;

CREATE FUNCTION public.admit_copy_release(p_user_id text,p_request_id uuid,p_action text,p_target_key text,p_closure jsonb,p_response_hash bytea,p_is_pro boolean,p_token_hash bytea DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE t timestamptz; day_key date; g public.copy_release_grants; created jsonb; used smallint; reset_at timestamptz;
BEGIN
  IF p_response_hash IS NULL OR octet_length(p_response_hash)<>32 OR p_is_pro IS NULL THEN
    RETURN jsonb_build_object('error','invalid_admission','status',400);
  END IF;
  PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id,0));
  t:=public.copy_admission_clock();
  day_key:=(t AT TIME ZONE 'UTC')::date;
  reset_at:=((day_key+1)::timestamp AT TIME ZONE 'UTC');
  SELECT * INTO g FROM public.copy_release_grants WHERE user_id=p_user_id AND request_id=p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    IF p_action='cli' THEN RETURN jsonb_build_object('error','invalid_capability','status',401); END IF;
    IF NOT p_is_pro AND EXISTS(SELECT 1 FROM public.copy_daily_usage WHERE user_id=p_user_id AND utc_day=day_key AND consumed=2) THEN
      RETURN jsonb_build_object('error','copy_limit_reached','status',429,'remaining',0,'resetAt',reset_at,'upgradeUrl','/pricing');
    END IF;
    created:=public.issue_copy_grant(p_user_id,p_request_id,p_action,p_target_key,p_closure,NULL);
    IF created ? 'error' THEN RETURN created; END IF;
    SELECT * INTO g FROM public.copy_release_grants WHERE user_id=p_user_id AND request_id=p_request_id FOR UPDATE;
  END IF;
  IF g.expires_at<=t THEN RETURN jsonb_build_object('error','grant_expired','status',410); END IF;
  IF g.action IS DISTINCT FROM p_action OR g.target_key IS DISTINCT FROM p_target_key OR g.closure IS DISTINCT FROM p_closure OR
     g.token_hash IS DISTINCT FROM p_token_hash OR (g.response_hash IS NOT NULL AND g.response_hash IS DISTINCT FROM p_response_hash) THEN
    RETURN jsonb_build_object('error','request_conflict','status',409);
  END IF;
  IF g.release_count >= (CASE WHEN p_action='cli' THEN 4 ELSE 3 END) THEN RETURN jsonb_build_object('error','replay_limit_reached','status',429); END IF;
  IF g.admitted_at IS NULL AND NOT p_is_pro THEN
    INSERT INTO public.copy_daily_usage(user_id,utc_day,consumed) VALUES(p_user_id,day_key,1)
    ON CONFLICT(user_id,utc_day) DO UPDATE SET consumed=public.copy_daily_usage.consumed+1
      WHERE public.copy_daily_usage.consumed<2 RETURNING consumed INTO used;
    IF used IS NULL THEN RETURN jsonb_build_object('error','copy_limit_reached','status',429,'remaining',0,'resetAt',reset_at,'upgradeUrl','/pricing'); END IF;
  END IF;
  -- A late expiry throws, rolling back both debit and grant mutation.
  IF g.expires_at<=public.copy_admission_clock() THEN RAISE EXCEPTION USING ERRCODE='P0001',MESSAGE='grant_expired'; END IF;
  UPDATE public.copy_release_grants SET
    admitted_at=coalesce(admitted_at,t),admitted_day=coalesce(admitted_day,day_key),
    charged=CASE WHEN admitted_at IS NULL THEN NOT p_is_pro ELSE charged END,
    response_hash=p_response_hash,release_count=release_count+1
    WHERE user_id=p_user_id AND request_id=p_request_id;
  SELECT consumed INTO used FROM public.copy_daily_usage WHERE user_id=p_user_id AND utc_day=day_key;
  RETURN jsonb_build_object('ok',true,'remaining',CASE WHEN p_is_pro THEN NULL ELSE 2-coalesce(used,0) END,'resetAt',reset_at);
END $$;

CREATE FUNCTION public.prune_copy_state() RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path=pg_catalog,public AS $$
DECLARE n integer; m integer;
BEGIN
  DELETE FROM public.copy_release_grants WHERE (user_id,request_id) IN
    (SELECT user_id,request_id FROM public.copy_release_grants WHERE expires_at<clock_timestamp()-interval '24 hours' ORDER BY expires_at LIMIT 1000 FOR UPDATE SKIP LOCKED);
  GET DIAGNOSTICS n=ROW_COUNT;
  DELETE FROM public.copy_daily_usage WHERE (user_id,utc_day) IN
    (SELECT user_id,utc_day FROM public.copy_daily_usage WHERE utc_day<(clock_timestamp() AT TIME ZONE 'UTC')::date-35 ORDER BY utc_day LIMIT 1000 FOR UPDATE SKIP LOCKED);
  GET DIAGNOSTICS m=ROW_COUNT;
  RETURN n+m;
END $$;
REVOKE ALL ON FUNCTION public.copy_admission_clock(),public.issue_copy_grant(text,uuid,text,text,jsonb,bytea),public.admit_copy_release(text,uuid,text,text,jsonb,bytea,boolean,bytea),public.prune_copy_state() FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.copy_admission_clock(),public.issue_copy_grant(text,uuid,text,text,jsonb,bytea),public.admit_copy_release(text,uuid,text,text,jsonb,bytea,boolean,bytea),public.prune_copy_state() TO service_role;
COMMIT;
