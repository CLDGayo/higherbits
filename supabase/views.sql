-- Views required by apps/web (referenced via supabase-js .from()).
-- Column sets match apps/web/types/supabase.ts Views definitions.

-- =====================================================================
-- public_profiles  — Phase 1 grant/RLS repair (Steps B3c-i / C2).
--
-- WHY: `public.users` is own-row-only under RLS (`users_select_self`,
-- restore-authenticated-grants.sql:151-154). Every view below is
-- security_invoker=on, so an INNER JOIN straight to `public.users` is
-- filtered by the CALLER's own-row RLS — a cross-user row silently
-- disappears from the result (not a 42501, an empty result).
--
-- Fix per restore-authenticated-grants.sql:284-304 ("KNOWN LIMITATION"):
-- do NOT widen `users_select_self`. Instead expose a narrow-column view
-- with security_invoker = off and join THAT.
--
-- security_invoker = off is intentional and safe HERE precisely because
-- the column list excludes every sensitive column — email, paypal_email,
-- stripe_id, lemon_squeezy_customer_id, ref, is_admin.
--
-- `name` is included (Gap 10): info-section.tsx's author byline falls back
-- to `user.name` when `display_name` is unset.
--
-- NOTE: this view's security_invoker = off posture depends on nobody
-- re-running enable-rls.sql's blanket security-invoker sweep afterwards.
-- =====================================================================
CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT
  u.id,
  u.username,
  u.name,
  u.display_name,
  u.display_username,
  u.display_image_url,
  u.image_url,
  u.bio,
  u.github_url,
  u.twitter_url,
  u.website_url
FROM public.users u;

-- ---------------------------------------------------------------------
-- MANDATORY: lock public_profiles down to read-only.
--
-- WHY THIS IS NOT OPTIONAL: this database carries an
-- `ALTER DEFAULT PRIVILEGES ... GRANT ALL ... TO anon, authenticated,
-- service_role` rule for new relations in `public` (visible in
-- pg_default_acl, objtype 'r'). Any relation created here — including
-- this view — inherits ALL privileges for the ANONYMOUS role unless we
-- explicitly revoke them.
--
-- That default is exploitable for this view specifically, because:
--   1. it is a simple single-table column subset, so Postgres marks it
--      auto-updatable (is_updatable = YES) and writes pass THROUGH to
--      public.users;
--   2. it is security_invoker = off, so it executes as its owner
--      (postgres);
--   3. public.users has RLS enabled but NOT forced
--      (relforcerowsecurity = false), so the owner bypasses RLS entirely;
--   4. PostgREST exposes public-schema views to the public anon key.
--
-- Net effect without the two statements below: an unauthenticated caller
-- can PATCH/DELETE /rest/v1/public_profiles and rewrite or delete ANY
-- user row. This was live in production on 29-07-26 and was fixed by
-- exactly these two statements. Do not remove them, and do not reorder
-- them — the REVOKE must precede the GRANT, since a narrower GRANT does
-- not displace a broader pre-existing one.
--
-- The three views below join this one purely to READ cross-user profile
-- rows, so SELECT is the only privilege they need.
-- ---------------------------------------------------------------------
REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Used by: components/features/component-page/info-section.tsx
-- (resolves "username/slug" registry dependency strings to components)
-- Step B3c-ii: joins public_profiles (not public.users) so cross-user
-- registry dependencies resolve instead of silently returning 0 rows.
-- security_invoker stays ON for this view — only its joined relation changed.
CREATE OR REPLACE VIEW public.components_with_username
WITH (security_invoker = on) AS
SELECT
  c.code,
  c.component_names,
  c.component_slug,
  c.created_at,
  c.demo_code,
  c.demo_dependencies,
  c.demo_direct_registry_dependencies,
  c.dependencies,
  c.description,
  c.direct_registry_dependencies,
  c.downloads_count,
  c.fts,
  c.id,
  c.is_public,
  c.license,
  c.likes_count,
  c.name,
  c.preview_url,
  c.registry,
  c.updated_at,
  to_jsonb(u.*) AS "user",
  c.user_id,
  u.username,
  c.video_url
FROM public.components c
JOIN public.public_profiles u ON u.id = c.user_id;

-- Used by: lib/queries.server.ts (registry dependency tree resolution).
-- One row per (source component -> dependency component) closure edge,
-- carrying the DEPENDENCY component's columns.
-- Step B3e: su/du join public_profiles (not public.users) for the same
-- cross-user reason as components_with_username above. Its base FROM table
-- public.component_dependencies_closure also needs its own grant + policy
-- (see restore-authenticated-grants.sql) — a security_invoker=on view's
-- grant is only as good as its weakest-granted base relation.
CREATE OR REPLACE VIEW public.component_dependencies_graph_view_v3
WITH (security_invoker = on) AS
SELECT
  dep.code,
  cl.component_id,
  dep.component_names,
  dep.component_slug,
  dep.created_at,
  dep.demo_code,
  dep.demo_dependencies,
  dep.demo_direct_registry_dependencies,
  dep.dependencies,
  du.display_username AS dependency_author_display_username,
  du.username AS dependency_author_username,
  cl.dependency_component_id,
  cl.depth,
  dep.description,
  dep.direct_registry_dependencies,
  dep.downloads_count,
  dep.fts,
  dep.global_css_extension,
  dep.id,
  cl.is_demo_dependency,
  dep.is_public,
  dep.license,
  dep.likes_count,
  dep.name,
  dep.preview_url,
  dep.registry,
  su.display_username AS source_author_display_username,
  su.username AS source_author_username,
  src.component_slug AS source_component_slug,
  dep.tailwind_config_extension,
  dep.updated_at,
  dep.user_id
FROM public.component_dependencies_closure cl
JOIN public.components src ON src.id = cl.component_id
JOIN public.public_profiles su ON su.id = src.user_id
JOIN public.components dep ON dep.id = cl.dependency_component_id
JOIN public.public_profiles du ON du.id = dep.user_id;

-- Used by: lib/queries.ts getRoundSubmissions (admin leaderboard).
-- Per-demo per-round hunt standings. has_voted resolves against the
-- requesting user's JWT (requesting_user_id()); false for service-role calls.
-- Step B3b/B3c-ii (Gap 7 fold-in): cu/du join public_profiles (not
-- public.users) so a multi-contestant leaderboard is not filtered down to
-- the caller's own rows. component_user_data/user_data narrow accordingly.
CREATE OR REPLACE VIEW public.demo_hunt_leaderboard
WITH (security_invoker = on) AS
SELECT
  (
    SELECT count(*)
    FROM public.demo_bookmarks b
    WHERE b.demo_id = d.id
  ) AS bookmarks_count,
  NULL::jsonb AS bundle_url,
  to_jsonb(c.*) AS component_data,
  to_jsonb(cu.*) AS component_user_data,
  d.demo_slug,
  s.final_score,
  rank() OVER (PARTITION BY s.round_id ORDER BY s.final_score DESC) AS global_rank,
  EXISTS (
    SELECT 1
    FROM public.demo_hunt_votes v
    WHERE v.demo_id = d.id
      AND v.round_id = s.round_id
      AND v.user_id = public.requesting_user_id()
  ) AS has_voted,
  d.id,
  s.installs,
  d.name,
  d.preview_url,
  s.round_id,
  (
    SELECT coalesce(
      jsonb_agg(jsonb_build_object('id', t.id, 'name', t.name, 'slug', t.slug)),
      '[]'::jsonb
    )
    FROM public.demo_tags dt
    JOIN public.tags t ON t.id = dt.tag_id
    WHERE dt.demo_id = d.id
  ) AS tags,
  count(*) OVER (PARTITION BY s.round_id) AS total_count,
  d.updated_at,
  to_jsonb(du.*) AS user_data,
  d.video_url,
  s.views AS view_count,
  s.votes
FROM public.demo_hunt_scores s
JOIN public.demos d ON d.id = s.demo_id
JOIN public.components c ON c.id = d.component_id
JOIN public.public_profiles cu ON cu.id = c.user_id
JOIN public.public_profiles du ON du.id = d.user_id;
