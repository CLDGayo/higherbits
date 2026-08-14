-- 0002_studio_artifacts.sql
--
-- Phase 09 (creator-studio-rebuild): the shared substrate for the four
-- ground-up creative types - themes, ascii art, gradients, shaders. One table,
-- discriminated by `kind`, because they are the same object with different
-- payload shapes and preview renderers.
--
-- NOT YET APPLIED. Written against the live baseline captured 2026-08-14
-- (pg_class / pg_policies / role_table_grants on project ewktoowpuemgbaaxxbdq).
--
-- Identity model, confirmed from that baseline rather than assumed: auth is
-- Clerk, not Supabase Auth, and every existing policy in this database keys on
-- `auth.jwt() ->> 'sub'` under the `authenticated` role. `sub` carries the Clerk
-- user id, which is why `users.id` is text. The policies below follow the exact
-- shape already used by components, demos, templates and sandboxes.
--
-- Note `relforcerowsecurity` is false on every table here, and the server talks
-- to Postgres as service_role. RLS therefore constrains the browser client only;
-- server-side code bypasses it entirely. Ownership must ALSO be enforced in the
-- API layer - see assertOwned() in lib/api/server/collections.ts. RLS is the
-- second line of defence, not the only one.

create table if not exists public.studio_artifacts (
  id           uuid primary key default gen_random_uuid(),
  user_id      text not null references public.users (id) on delete cascade,
  kind         text not null,
  name         text not null,
  slug         text not null,
  payload      jsonb not null default '{}'::jsonb,
  preview_url  text,
  is_public    boolean not null default false,
  status       text not null default 'draft',
  created_at   timestamptz not null default timezone('utc'::text, now()),
  updated_at   timestamptz not null default timezone('utc'::text, now()),

  constraint studio_artifacts_kind_check
    check (kind in ('theme', 'ascii', 'gradient', 'shader')),
  constraint studio_artifacts_status_check
    check (status in ('draft', 'published')),
  constraint studio_artifacts_user_kind_slug_key
    unique (user_id, kind, slug)
);

create index if not exists studio_artifacts_user_kind_idx
  on public.studio_artifacts (user_id, kind);

-- Serves the public browse path: published, public artifacts of one kind.
create index if not exists studio_artifacts_kind_public_idx
  on public.studio_artifacts (kind, is_public)
  where status = 'published';

-- `components.updated_at` in this database is default-only, with no trigger, so
-- rows carry a stale timestamp forever unless a writer sets it explicitly. That
-- cost a forensic investigation on 2026-08-13. This table gets the trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists studio_artifacts_set_updated_at on public.studio_artifacts;
create trigger studio_artifacts_set_updated_at
  before update on public.studio_artifacts
  for each row execute function public.set_updated_at();

alter table public.studio_artifacts enable row level security;

-- Read: your own rows always; other people's only once they are both public and
-- published. The plan is explicit that `is_public` alone is not enough - a
-- public draft must stay invisible.
drop policy if exists studio_artifacts_select on public.studio_artifacts;
create policy studio_artifacts_select
  on public.studio_artifacts
  for select
  to authenticated
  using (
    user_id = (auth.jwt() ->> 'sub'::text)
    or (is_public = true and status = 'published')
  );

-- Write: own rows only. WITH CHECK on insert and update both, so a row cannot be
-- created as, or reassigned to, another user.
drop policy if exists studio_artifacts_insert_own on public.studio_artifacts;
create policy studio_artifacts_insert_own
  on public.studio_artifacts
  for insert
  to authenticated
  with check (user_id = (auth.jwt() ->> 'sub'::text));

drop policy if exists studio_artifacts_update_own on public.studio_artifacts;
create policy studio_artifacts_update_own
  on public.studio_artifacts
  for update
  to authenticated
  using (user_id = (auth.jwt() ->> 'sub'::text))
  with check (user_id = (auth.jwt() ->> 'sub'::text));

drop policy if exists studio_artifacts_delete_own on public.studio_artifacts;
create policy studio_artifacts_delete_own
  on public.studio_artifacts
  for delete
  to authenticated
  using (user_id = (auth.jwt() ->> 'sub'::text));

-- Grants matching the baseline's shape for authoring tables. `anon` is
-- deliberately omitted: Phase 09 is authoring-only, and public browse of
-- artifacts is Phase 10 scope. Adding anon SELECT later is a one-line change
-- and the select policy above already expresses the right condition.
grant select, insert, update, delete on public.studio_artifacts to authenticated;

-- ---------------------------------------------------------------------------
-- ROLLBACK
-- ---------------------------------------------------------------------------
-- drop trigger if exists studio_artifacts_set_updated_at on public.studio_artifacts;
-- drop table if exists public.studio_artifacts;
-- -- set_updated_at() is intentionally left in place; it is generic and other
-- -- tables may adopt it. Drop it only if nothing else references it:
-- -- drop function if exists public.set_updated_at();
