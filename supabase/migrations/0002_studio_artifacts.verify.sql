-- Verification for 0002_studio_artifacts.sql.
-- `prisma db execute` returns no rows, so each check raises on failure instead.
-- Success output ("Script executed successfully") therefore means every
-- assertion below held.
do $$
declare
  problems text := '';
  n int;
  pol record;
begin
  -- Table exists
  select count(*) into n
  from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
  where ns.nspname = 'public' and c.relname = 'studio_artifacts';
  if n <> 1 then problems := problems || 'table missing; '; end if;

  -- RLS enabled
  select count(*) into n
  from pg_class c join pg_namespace ns on ns.oid = c.relnamespace
  where ns.nspname = 'public' and c.relname = 'studio_artifacts'
    and c.relrowsecurity;
  if n <> 1 then problems := problems || 'RLS not enabled; '; end if;

  -- Exactly the four policies the migration declares
  select count(*) into n
  from pg_policies
  where schemaname = 'public' and tablename = 'studio_artifacts';
  if n <> 4 then
    problems := problems || format('expected 4 policies, found %s; ', n);
  end if;

  -- Every policy must be scoped to authenticated, never PUBLIC
  select count(*) into n
  from pg_policies
  where schemaname = 'public' and tablename = 'studio_artifacts'
    and roles::text <> '{authenticated}';
  if n <> 0 then
    problems := problems || format('%s policies not scoped to authenticated; ', n);
  end if;

  -- The select policy must require published, not merely public
  select count(*) into n
  from pg_policies
  where schemaname = 'public' and tablename = 'studio_artifacts'
    and policyname = 'studio_artifacts_select'
    and qual like '%published%';
  if n <> 1 then
    problems := problems || 'select policy does not mention published; ';
  end if;

  -- Insert and update must both carry WITH CHECK, or ownership can be reassigned
  select count(*) into n
  from pg_policies
  where schemaname = 'public' and tablename = 'studio_artifacts'
    and cmd in ('INSERT', 'UPDATE')
    and with_check is not null;
  if n <> 2 then
    problems := problems || format('expected 2 WITH CHECK policies, found %s; ', n);
  end if;

  -- updated_at trigger present
  select count(*) into n
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  where c.relname = 'studio_artifacts' and not t.tgisinternal;
  if n <> 1 then
    problems := problems || format('expected 1 trigger, found %s; ', n);
  end if;

  -- authenticated holds exactly the four DML grants
  select count(*) into n
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'studio_artifacts'
    and grantee = 'authenticated';
  if n <> 4 then
    problems := problems || format('authenticated should hold exactly 4 grants, holds %s; ', n);
  end if;

  select count(*) into n
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'studio_artifacts'
    and grantee = 'authenticated' and privilege_type = 'TRUNCATE';
  if n <> 0 then problems := problems || 'authenticated holds TRUNCATE; '; end if;

  -- anon must hold none: Phase 09 is authoring-only
  select count(*) into n
  from information_schema.role_table_grants
  where table_schema = 'public' and table_name = 'studio_artifacts'
    and grantee = 'anon';
  if n <> 0 then
    problems := problems || format('anon should hold 0 grants, holds %s; ', n);
  end if;

  -- Both CHECK constraints present
  select count(*) into n
  from pg_constraint con join pg_class c on c.oid = con.conrelid
  where c.relname = 'studio_artifacts' and con.contype = 'c'
    and con.conname in
      ('studio_artifacts_kind_check', 'studio_artifacts_status_check');
  if n <> 2 then
    problems := problems || format('expected 2 check constraints, found %s; ', n);
  end if;

  if problems <> '' then
    raise exception 'VERIFY FAILED: %', problems;
  end if;
end $$;
