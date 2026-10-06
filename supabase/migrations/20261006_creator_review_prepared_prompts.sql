-- Save a complete prompt set in one transaction before moving a creator submission to review.
DROP FUNCTION IF EXISTS public.save_creator_review_copy_prompts(text,bigint,text,text,jsonb);
DROP FUNCTION IF EXISTS public.save_creator_review_copy_prompts(text,bigint,text,text,timestamptz,timestamptz,jsonb);
CREATE OR REPLACE FUNCTION public.save_creator_review_copy_prompts(
  p_user_id text, p_demo_id bigint, p_source_fingerprint text, p_ghl_fingerprint text,
  p_component_updated_at timestamptz, p_demo_updated_at timestamptz,
  p_component_snapshot jsonb, p_demo_snapshot jsonb, p_prompts jsonb
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  expected_types text[] := ARRAY['sitebrew','v0','lovable','bolt','extended','replit','magic_patterns','claude','codex','antigravity'];
  entry record;
BEGIN
  IF p_source_fingerprint IS NULL OR p_source_fingerprint !~ '^[a-f0-9]{64}$' OR
     (p_ghl_fingerprint IS NOT NULL AND p_ghl_fingerprint !~ '^[a-f0-9]{64}$') OR
     jsonb_typeof(p_component_snapshot) IS DISTINCT FROM 'object' OR
     jsonb_typeof(p_demo_snapshot) IS DISTINCT FROM 'object' OR
     p_component_snapshot = '{}'::jsonb OR p_demo_snapshot = '{}'::jsonb OR
     jsonb_typeof(p_prompts) IS DISTINCT FROM 'object' OR
     (SELECT count(*) FROM jsonb_object_keys(p_prompts)) <> array_length(expected_types, 1) OR
     EXISTS (SELECT 1 FROM jsonb_object_keys(p_prompts) key WHERE key <> ALL(expected_types)) THEN
    RETURN false;
  END IF;
  PERFORM 1 FROM public.demos d JOIN public.components c ON c.id = d.component_id
    WHERE d.id = p_demo_id AND d.user_id = p_user_id AND c.user_id = p_user_id
      AND c.registry IS DISTINCT FROM 'auto-index'
      AND (p_ghl_fingerprint IS NULL OR d.ghl_source_fingerprint = p_ghl_fingerprint)
      AND c.updated_at IS NOT DISTINCT FROM p_component_updated_at
      AND d.updated_at IS NOT DISTINCT FROM p_demo_updated_at
      AND to_jsonb(c) @> p_component_snapshot
      AND to_jsonb(d) @> p_demo_snapshot
    FOR UPDATE OF d, c;
  IF NOT FOUND THEN RETURN false; END IF;
  FOR entry IN SELECT key, value FROM jsonb_each(p_prompts) LOOP
    IF jsonb_typeof(entry.value) <> 'string' OR length(entry.value #>> '{}') = 0 OR
       octet_length(entry.value #>> '{}') > 2097152 THEN RETURN false; END IF;
  END LOOP;
  INSERT INTO public.auto_index_copy_prompts(demo_id,prompt_type,prompt,source_fingerprint)
    SELECT p_demo_id, key, value #>> '{}', p_source_fingerprint FROM jsonb_each(p_prompts)
    ON CONFLICT (demo_id,prompt_type) DO UPDATE SET
      prompt = excluded.prompt, source_fingerprint = excluded.source_fingerprint;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.save_creator_review_copy_prompts(text,bigint,text,text,timestamptz,timestamptz,jsonb,jsonb,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_creator_review_copy_prompts(text,bigint,text,text,timestamptz,timestamptz,jsonb,jsonb,jsonb) TO service_role;
