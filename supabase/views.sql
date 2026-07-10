-- Views required by apps/web (referenced via supabase-js .from()).
-- Column sets match apps/web/types/supabase.ts Views definitions.

-- Used by: components/features/component-page/info-section.tsx
-- (resolves "username/slug" registry dependency strings to components)
CREATE OR REPLACE VIEW public.components_with_username AS
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
JOIN public.users u ON u.id = c.user_id;

-- Used by: lib/queries.server.ts (registry dependency tree resolution).
-- One row per (source component -> dependency component) closure edge,
-- carrying the DEPENDENCY component's columns.
CREATE OR REPLACE VIEW public.component_dependencies_graph_view_v3 AS
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
JOIN public.users su ON su.id = src.user_id
JOIN public.components dep ON dep.id = cl.dependency_component_id
JOIN public.users du ON du.id = dep.user_id;

-- Used by: lib/queries.ts getRoundSubmissions (admin leaderboard).
-- Per-demo per-round hunt standings. has_voted resolves against the
-- requesting user's JWT (requesting_user_id()); false for service-role calls.
CREATE OR REPLACE VIEW public.demo_hunt_leaderboard AS
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
JOIN public.users cu ON cu.id = c.user_id
JOIN public.users du ON du.id = d.user_id;
