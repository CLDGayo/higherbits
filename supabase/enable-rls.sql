-- enable-rls.sql  →  full "public schema is NOT a public API" lockdown.
-- Resolves the Supabase Security Advisor findings on project CozyDownloads
-- (ewktoowpuemgbaaxxbdq): rls_disabled_in_public, sensitive_columns_exposed,
-- security_definer_view, materialized_view_in_api.
--
-- Live audit (2026-07-22) found the actual exposure was NOT the base tables
-- (all 42 already had RLS enabled with zero policies = deny-all to anon), but:
--   * 3 SECURITY DEFINER views (components_with_username,
--     component_dependencies_graph_view_v3, demo_hunt_leaderboard) that run as
--     owner and BYPASS the underlying tables' RLS, granted SELECT to anon.
--   * mv_component_analytics (materialized view — can't hold RLS), granted to anon.
--   * anon/authenticated still held table GRANTs across public (grant-based lint).
--
-- WHY SAFE: app talks to Supabase ONLY via the service_role key (BYPASSRLS,
-- separate grants). No browser/anon Supabase client exists; auth is Clerk, not
-- Supabase Auth. So nothing the app does relies on anon/authenticated access.
--
-- Run in Supabase Dashboard → SQL Editor (as owner). Idempotent + reversible.

-- 1) RLS on every ordinary public table (idempotent; only touches rls=off).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND c.relrowsecurity=false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.relname);
  END LOOP;
END $$;

-- 2) Make every public view run as the CALLER, not the owner, so it respects
--    the caller's RLS instead of bypassing it (fixes security_definer_view).
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='v'
  LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = on);', r.relname);
  END LOOP;
END $$;

-- 3) Revoke anon + authenticated privileges on all public tables/views/matviews
--    (defense-in-depth; closes grant-based "publicly accessible" lints and the
--    matview that can't hold RLS). service_role/postgres are untouched.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind IN ('r','v','m')
  LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated;', r.relname);
  END LOOP;
END $$;

-- Verification — every row below should read anon=f, auth=f; tables rls=t:
SELECT c.relkind AS kind, c.relname AS name, c.relrowsecurity AS rls,
       has_table_privilege('anon','public.'||c.relname,'SELECT')          AS anon_sel,
       has_table_privilege('authenticated','public.'||c.relname,'SELECT') AS auth_sel
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE n.nspname='public' AND c.relkind IN ('r','v','m')
  AND (has_table_privilege('anon','public.'||c.relname,'SELECT')
    OR has_table_privilege('authenticated','public.'||c.relname,'SELECT'))
ORDER BY 1,2;

-- ponytail: no per-table SELECT policies added — every read is server-side via
-- service_role. If you later add a browser (anon) client, GRANT + a scoped
-- policy for just those tables, e.g.:
--   GRANT SELECT ON public.components TO anon;
--   CREATE POLICY "public read" ON public.components FOR SELECT TO anon USING (true);
