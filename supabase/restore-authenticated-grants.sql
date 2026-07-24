-- restore-authenticated-grants.sql
--
-- WHY: enable-rls.sql (2026-07-22) revoked ALL privileges from `anon` AND
-- `authenticated` on every public relation, on the premise that "no browser/anon
-- Supabase client exists; the app is 100% service_role."
--
-- That premise was WRONG. `apps/web/lib/clerk.ts` (createSupabaseClerkClient /
-- useClerkSupabaseClient) is a BROWSER Supabase client that authenticates as the
-- `authenticated` role via a Clerk JWT (template "supabase"). The entire studio
-- surface reads AND writes through it:
--   apps/web/components/features/studio/publish/hooks/use-submit-component.ts
--   apps/web/components/features/studio/publish/hooks/use-is-check-slug-available.ts
--   apps/web/components/features/studio/{editor,sandbox,monetization}/...
--   apps/web/app/{studio,magic,admin,publish}/...
-- The REVOKE broke all of it -> every call 403s with 42501 "permission denied".
--
-- Additionally, enable-rls.sql left RLS ENABLED with ZERO POLICIES on all 42
-- tables. So a GRANT alone is not enough: with no policy, `authenticated` still
-- reads nothing and writes nothing. This file therefore does BOTH:
--   1) GRANT the specific privileges the client needs, and
--   2) CREATE scoped RLS policies keyed on the Clerk user id.
--
-- SECURITY POSTURE (deliberate):
--   * `anon` is NEVER granted anything here. The real leak the Security Advisor
--     flagged (3 SECURITY DEFINER views + a matview exposed to anon) stays closed.
--     enable-rls.sql's security_invoker=on on views is NOT reverted.
--   * Every policy is scoped to the caller: auth.jwt()->>'sub' = the Clerk user id
--     (Clerk ids are strings like 'user_3GAxh...', matching the text user_id columns).
--   * `users` is own-row ONLY. A logged-in user can read their own row (incl. their
--     own email/stripe_id — that is their data) and nobody else's. This deliberately
--     does NOT expose other users' profiles; see KNOWN LIMITATION below.
--   * Tables NOT listed here stay fully revoked. This is an allow-list.
--
-- PREREQUISITE (verify before trusting these policies): Supabase must be
-- validating the Clerk JWT (Dashboard -> Authentication -> Third-party auth ->
-- Clerk). If it were not, `role: authenticated` and `sub` would be attacker-
-- controlled and every policy below would be worthless. Current evidence says it
-- IS configured: requests reach the `authenticated` role and fail at the GRANT
-- layer (42501), not at auth (401). Confirm it in the dashboard anyway.
--
-- Run in Supabase Dashboard -> SQL Editor (as owner). Idempotent; re-runnable.

BEGIN;

-- 0) PostgREST needs schema usage + sequence usage, or INSERTs fail even with
--    table grants ("permission denied for sequence components_id_seq").
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================================
-- components  — owner: user_id (text, Clerk id); visibility flag: is_public
-- =====================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.components TO authenticated;

DROP POLICY IF EXISTS "components_select" ON public.components;
CREATE POLICY "components_select" ON public.components
  FOR SELECT TO authenticated
  USING (is_public = true OR user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "components_insert_own" ON public.components;
CREATE POLICY "components_insert_own" ON public.components
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "components_update_own" ON public.components;
CREATE POLICY "components_update_own" ON public.components
  FOR UPDATE TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "components_delete_own" ON public.components;
CREATE POLICY "components_delete_own" ON public.components
  FOR DELETE TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- demos  — owner: user_id; also linked to a component
-- =====================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.demos TO authenticated;

DROP POLICY IF EXISTS "demos_select" ON public.demos;
CREATE POLICY "demos_select" ON public.demos
  FOR SELECT TO authenticated
  USING (
    user_id = auth.jwt()->>'sub'
    OR component_id IN (SELECT id FROM public.components WHERE is_public = true)
  );

DROP POLICY IF EXISTS "demos_insert_own" ON public.demos;
CREATE POLICY "demos_insert_own" ON public.demos
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "demos_update_own" ON public.demos;
CREATE POLICY "demos_update_own" ON public.demos
  FOR UPDATE TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "demos_delete_own" ON public.demos;
CREATE POLICY "demos_delete_own" ON public.demos
  FOR DELETE TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- submissions  — NO user_id column; ownership derives from the component
-- =====================================================================
GRANT SELECT, INSERT, UPDATE ON public.submissions TO authenticated;

DROP POLICY IF EXISTS "submissions_select_own" ON public.submissions;
CREATE POLICY "submissions_select_own" ON public.submissions
  FOR SELECT TO authenticated
  USING (component_id IN (
    SELECT id FROM public.components WHERE user_id = auth.jwt()->>'sub'
  ));

DROP POLICY IF EXISTS "submissions_insert_own" ON public.submissions;
CREATE POLICY "submissions_insert_own" ON public.submissions
  FOR INSERT TO authenticated
  WITH CHECK (component_id IN (
    SELECT id FROM public.components WHERE user_id = auth.jwt()->>'sub'
  ));

DROP POLICY IF EXISTS "submissions_update_own" ON public.submissions;
CREATE POLICY "submissions_update_own" ON public.submissions
  FOR UPDATE TO authenticated
  USING (component_id IN (
    SELECT id FROM public.components WHERE user_id = auth.jwt()->>'sub'
  ))
  WITH CHECK (component_id IN (
    SELECT id FROM public.components WHERE user_id = auth.jwt()->>'sub'
  ));

-- =====================================================================
-- sandboxes  — owner: user_id
-- =====================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sandboxes TO authenticated;

DROP POLICY IF EXISTS "sandboxes_all_own" ON public.sandboxes;
CREATE POLICY "sandboxes_all_own" ON public.sandboxes
  FOR ALL TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- users  — OWN ROW ONLY. Reading your own email/stripe_id is fine; reading
--          anyone else's is not. See KNOWN LIMITATION at the bottom.
-- =====================================================================
GRANT SELECT, UPDATE ON public.users TO authenticated;

DROP POLICY IF EXISTS "users_select_self" ON public.users;
CREATE POLICY "users_select_self" ON public.users
  FOR SELECT TO authenticated
  USING (id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "users_update_self" ON public.users;
CREATE POLICY "users_update_self" ON public.users
  FOR UPDATE TO authenticated
  USING (id = auth.jwt()->>'sub')
  WITH CHECK (id = auth.jwt()->>'sub');

-- =====================================================================
-- tags / component_tags / demo_tags  — shared vocabulary + join rows.
--   Tag *associations* are not sensitive; tag *writes* are gated on owning
--   the parent component/demo.
-- =====================================================================
GRANT SELECT, INSERT ON public.tags TO authenticated;

DROP POLICY IF EXISTS "tags_select_all" ON public.tags;
CREATE POLICY "tags_select_all" ON public.tags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "tags_insert" ON public.tags;
CREATE POLICY "tags_insert" ON public.tags
  FOR INSERT TO authenticated WITH CHECK (true);

GRANT SELECT, INSERT, DELETE ON public.component_tags TO authenticated;

DROP POLICY IF EXISTS "component_tags_select_all" ON public.component_tags;
CREATE POLICY "component_tags_select_all" ON public.component_tags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "component_tags_write_own" ON public.component_tags;
CREATE POLICY "component_tags_write_own" ON public.component_tags
  FOR INSERT TO authenticated
  WITH CHECK (component_id IN (
    SELECT id FROM public.components WHERE user_id = auth.jwt()->>'sub'
  ));

DROP POLICY IF EXISTS "component_tags_delete_own" ON public.component_tags;
CREATE POLICY "component_tags_delete_own" ON public.component_tags
  FOR DELETE TO authenticated
  USING (component_id IN (
    SELECT id FROM public.components WHERE user_id = auth.jwt()->>'sub'
  ));

GRANT SELECT, INSERT, DELETE ON public.demo_tags TO authenticated;

DROP POLICY IF EXISTS "demo_tags_select_all" ON public.demo_tags;
CREATE POLICY "demo_tags_select_all" ON public.demo_tags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "demo_tags_write_own" ON public.demo_tags;
CREATE POLICY "demo_tags_write_own" ON public.demo_tags
  FOR INSERT TO authenticated
  WITH CHECK (demo_id IN (
    SELECT id FROM public.demos WHERE user_id = auth.jwt()->>'sub'
  ));

DROP POLICY IF EXISTS "demo_tags_delete_own" ON public.demo_tags;
CREATE POLICY "demo_tags_delete_own" ON public.demo_tags
  FOR DELETE TO authenticated
  USING (demo_id IN (
    SELECT id FROM public.demos WHERE user_id = auth.jwt()->>'sub'
  ));

-- =====================================================================
-- api_keys  — own rows only. Contains the secret `key` column, so the
--             own-row policy is the entire protection here.
-- =====================================================================
GRANT SELECT, INSERT, UPDATE ON public.api_keys TO authenticated;

DROP POLICY IF EXISTS "api_keys_own" ON public.api_keys;
CREATE POLICY "api_keys_own" ON public.api_keys
  FOR ALL TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- usages / users_to_plans  — read-only to the client; written server-side
--                            (service_role) by webhooks and magic routes.
-- =====================================================================
GRANT SELECT ON public.usages TO authenticated;

DROP POLICY IF EXISTS "usages_select_own" ON public.usages;
CREATE POLICY "usages_select_own" ON public.usages
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt()->>'sub');

GRANT SELECT ON public.users_to_plans TO authenticated;

DROP POLICY IF EXISTS "users_to_plans_select_own" ON public.users_to_plans;
CREATE POLICY "users_to_plans_select_own" ON public.users_to_plans
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- mcp_generation_requests  — own rows only (magic console).
-- =====================================================================
GRANT SELECT, INSERT ON public.mcp_generation_requests TO authenticated;

DROP POLICY IF EXISTS "mcp_generation_requests_own" ON public.mcp_generation_requests;
CREATE POLICY "mcp_generation_requests_own" ON public.mcp_generation_requests
  FOR ALL TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- component_hunt_rounds  — global contest calendar, read-only, no PII.
-- =====================================================================
GRANT SELECT ON public.component_hunt_rounds TO authenticated;

DROP POLICY IF EXISTS "component_hunt_rounds_select_all" ON public.component_hunt_rounds;
CREATE POLICY "component_hunt_rounds_select_all" ON public.component_hunt_rounds
  FOR SELECT TO authenticated USING (true);

COMMIT;

-- =====================================================================
-- VERIFY — anon must be false on every row; authenticated true only for
--          the tables above.
-- =====================================================================
-- SELECT c.relname,
--        has_table_privilege('anon','public.'||c.relname,'SELECT')          AS anon_sel,
--        has_table_privilege('authenticated','public.'||c.relname,'SELECT') AS auth_sel,
--        c.relrowsecurity AS rls,
--        (SELECT count(*) FROM pg_policies p
--          WHERE p.schemaname='public' AND p.tablename=c.relname)           AS policies
-- FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
-- WHERE n.nspname='public' AND c.relkind='r'
--   AND has_table_privilege('authenticated','public.'||c.relname,'SELECT')
-- ORDER BY 1;

-- =====================================================================
-- KNOWN LIMITATION (deliberate, fail-closed)
-- =====================================================================
-- `users` is own-row only, so any client-side read of ANOTHER user's profile
-- (e.g. an author byline on a public component page fetched from the browser)
-- returns empty rather than data. That is the safe direction: it degrades to
-- "missing author name", never to "leaked email/stripe_id".
--
-- If public author profiles are needed later, do NOT widen this policy. Instead
-- add a dedicated view exposing only safe columns and grant SELECT on the view:
--
--   CREATE VIEW public.public_profiles WITH (security_invoker = off) AS
--     SELECT id, username, display_name, display_username, display_image_url,
--            image_url, bio, github_url, twitter_url, website_url
--     FROM public.users;
--   GRANT SELECT ON public.public_profiles TO authenticated;
--
-- (security_invoker = off is intentional and safe HERE precisely because the
-- view's column list excludes every sensitive column — email, paypal_email,
-- stripe_id, lemon_squeezy_customer_id, ref, is_admin.)
--
-- =====================================================================
-- ROLLBACK (re-lock everything granted above)
-- =====================================================================
-- DO $$ DECLARE r RECORD; BEGIN
--   FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
--            WHERE n.nspname='public' AND c.relkind='r'
--   LOOP EXECUTE format('REVOKE ALL ON public.%I FROM authenticated;', r.relname); END LOOP;
-- END $$;
-- REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
