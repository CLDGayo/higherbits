-- G9.3 — RLS verified by test, not by inspection.
--
-- Runs as the `authenticated` role with a forged `request.jwt.claims`, which is
-- exactly what PostgREST sets and what `auth.jwt() ->> 'sub'` reads. That makes
-- a second Clerk account unnecessary: user B is a claim, not a signup.
--
-- Every assertion raises on failure, and the whole thing rolls back, so a clean
-- run leaves no rows behind. `prisma db execute` reports success only if every
-- check held.
do $$
declare
  owner_id text;
  other_id text := 'user_rls_probe_not_a_real_account';
  draft_id uuid;
  published_id uuid;
  n int;
  problems text := '';
begin
  -- Borrow a real user id; the FK requires one to exist.
  select id into owner_id from public.users limit 1;
  if owner_id is null then
    raise exception 'no users to test with';
  end if;

  -- Two rows as the owner, bypassing RLS (this block runs as the table owner).
  insert into public.studio_artifacts (user_id, kind, name, slug, payload, is_public, status)
  values (owner_id, 'theme', 'RLS probe draft', 'rls-probe-draft', '{"light":{},"dark":{}}', false, 'draft')
  returning id into draft_id;

  insert into public.studio_artifacts (user_id, kind, name, slug, payload, is_public, status)
  values (owner_id, 'theme', 'RLS probe published', 'rls-probe-published', '{"light":{},"dark":{}}', true, 'published')
  returning id into published_id;

  -- A public row that is still a draft: is_public alone must not be enough.
  insert into public.studio_artifacts (user_id, kind, name, slug, payload, is_public, status)
  values (owner_id, 'theme', 'RLS probe public draft', 'rls-probe-public-draft', '{"light":{},"dark":{}}', true, 'draft');

  ------------------------------------------------------------------
  -- As a DIFFERENT authenticated user
  ------------------------------------------------------------------
  set local role authenticated;
  perform set_config('request.jwt.claims', json_build_object('sub', other_id)::text, true);

  -- Cannot see another user's draft
  select count(*) into n from public.studio_artifacts where id = draft_id;
  if n <> 0 then
    problems := problems || format('user B can read another user''s draft (%s rows); ', n);
  end if;

  -- Cannot see a public row that is not published
  select count(*) into n from public.studio_artifacts where slug = 'rls-probe-public-draft';
  if n <> 0 then
    problems := problems || 'user B can read a public DRAFT; ';
  end if;

  -- CAN see a published public row
  select count(*) into n from public.studio_artifacts where id = published_id;
  if n <> 1 then
    problems := problems || format('user B cannot read a published public row (%s rows); ', n);
  end if;

  -- Cannot update another user's row (RLS makes it match zero rows)
  update public.studio_artifacts set name = 'hijacked' where id = draft_id;
  get diagnostics n = row_count;
  if n <> 0 then
    problems := problems || format('user B updated %s of another user''s rows; ', n);
  end if;

  -- Cannot delete another user's row
  delete from public.studio_artifacts where id = draft_id;
  get diagnostics n = row_count;
  if n <> 0 then
    problems := problems || format('user B deleted %s of another user''s rows; ', n);
  end if;

  -- Cannot insert a row owned by somebody else (WITH CHECK)
  begin
    insert into public.studio_artifacts (user_id, kind, name, slug, payload)
    values (owner_id, 'theme', 'forged', 'rls-probe-forged', '{"light":{},"dark":{}}');
    problems := problems || 'user B inserted a row owned by user A; ';
  exception when insufficient_privilege then
    null; -- expected
  end;

  reset role;

  ------------------------------------------------------------------
  -- As anon
  ------------------------------------------------------------------
  set local role anon;
  perform set_config('request.jwt.claims', null, true);

  begin
    select count(*) into n from public.studio_artifacts;
    -- anon holds no grants at all, so reaching here means the revoke did not stick
    problems := problems || format('anon read %s rows; ', n);
  exception when insufficient_privilege then
    null; -- expected: no grant
  end;

  reset role;

  if problems <> '' then
    raise exception 'G9.3 FAILED: %', problems;
  end if;

  -- Leave nothing behind.
  raise exception 'G9.3_PASSED_ROLLING_BACK';
end $$;
