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
GRANT SELECT ON public.users TO authenticated;

-- SECURITY FIX (Phase 1, Step B0). This was previously a table-level
-- `GRANT SELECT, UPDATE ON public.users TO authenticated` with no column list.
--
-- WHY column scoping is required: the `users_update_self` policy below
-- restricts WHICH ROW may be updated, but RLS has no column-level primitive —
-- it cannot restrict WHICH COLUMNS. `users.is_admin` therefore was writable by
-- any authenticated user on their own row:
--   UPDATE users SET is_admin = true WHERE id = auth.jwt()->>'sub'
-- i.e. a live privilege-escalation hole. Column-scoped GRANT is the only
-- mechanism Postgres offers to close it.
--
-- Granted (13) = every user-editable profile column.
-- Excluded (11) = id, created_at, updated_at, manually_added, is_admin, email,
--   ref, paypal_email, is_partner, bundles_fee, stripe_id
--   (privileged, billing, moderation, or system-managed).
-- 13 + 11 = all 24 scalar columns on `users`. Re-verify this partition
-- mechanically whenever either list changes.
--
-- `role` IS granted on purpose: it is a self-described professional-role enum
-- (designer | frontend_developer | ...), written today by the feedback dialog
-- (apps/web/components/features/magic/feedback-dialog.tsx:156-161, own-row).
-- Do NOT conflate it with `is_admin`, which is a privilege flag and stays excluded.
--
-- ORDER IS LOAD-BEARING: this REVOKE must run BEFORE the GRANT below. In Postgres a
-- column-scoped `GRANT UPDATE (cols)` does NOT supersede or remove a pre-existing
-- table-level `GRANT UPDATE` — the two coexist, and the broader table-level grant wins.
-- Without this REVOKE the file reads as fixed while `is_admin` stays self-settable by
-- any authenticated user, i.e. the privilege-escalation hole stays open. Revoking first
-- and re-granting the 13 columns also keeps the file idempotent on re-run.
REVOKE UPDATE ON public.users FROM authenticated;

GRANT UPDATE (
  username,
  name,
  bio,
  twitter_url,
  github_url,
  pro_referral_url,
  website_url,
  display_name,
  display_username,
  display_image_url,
  image_url,
  pro_banner_url,
  role
) ON public.users TO authenticated;

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

-- #####################################################################
-- PHASE 1 GRANT/RLS REPAIR (supabase-interconnect, Steps B1-B8)
-- Everything below this line was added by Phase 1 of the
-- supabase-interconnect program. Prerequisite: supabase/views.sql must be
-- applied FIRST — public.public_profiles must exist before it is granted.
-- #####################################################################

-- =====================================================================
-- demo_bookmarks (Step B1)  — owner: user_id. Confirmed broken live today:
--   the BookmarkButton path (lib/queries.ts:627 insert, :644 delete,
--   :702 select) has no grant at all.
-- Ownership policy pattern copied from components_insert_own/_delete_own above.
-- =====================================================================
GRANT SELECT, INSERT, DELETE ON public.demo_bookmarks TO authenticated;

DROP POLICY IF EXISTS "demo_bookmarks_select_own" ON public.demo_bookmarks;
CREATE POLICY "demo_bookmarks_select_own" ON public.demo_bookmarks
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "demo_bookmarks_insert_own" ON public.demo_bookmarks;
CREATE POLICY "demo_bookmarks_insert_own" ON public.demo_bookmarks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "demo_bookmarks_delete_own" ON public.demo_bookmarks;
CREATE POLICY "demo_bookmarks_delete_own" ON public.demo_bookmarks
  FOR DELETE TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- prompt_rules (Step B2)  — owner: user_id, confirmed per-user.
--
-- SECURITY-CRITICAL: updatePromptRule() (lib/queries.ts:816-853) and
-- deletePromptRule() (:855-865) filter ONLY on .eq("id", id) — they perform
-- ZERO app-level ownership check. These policies are therefore the SOLE
-- enforcement layer stopping one user from editing/deleting another user's
-- rule. Both USING and WITH CHECK are required on UPDATE; do not relax to
-- FOR ALL USING (true).
-- =====================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_rules TO authenticated;

DROP POLICY IF EXISTS "prompt_rules_select_own" ON public.prompt_rules;
CREATE POLICY "prompt_rules_select_own" ON public.prompt_rules
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "prompt_rules_insert_own" ON public.prompt_rules;
CREATE POLICY "prompt_rules_insert_own" ON public.prompt_rules
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "prompt_rules_update_own" ON public.prompt_rules;
CREATE POLICY "prompt_rules_update_own" ON public.prompt_rules
  FOR UPDATE TO authenticated
  USING (user_id = auth.jwt()->>'sub')
  WITH CHECK (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "prompt_rules_delete_own" ON public.prompt_rules;
CREATE POLICY "prompt_rules_delete_own" ON public.prompt_rules
  FOR DELETE TO authenticated
  USING (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- feedback (Step B7)  — write-once, own rows. No UPDATE/DELETE grant:
--   a user submits feedback and never edits it (moderation `status`/`response`
--   are server-side only).
--   Call site: components/features/magic/feedback-dialog.tsx:170 (insert).
-- =====================================================================
GRANT SELECT, INSERT ON public.feedback TO authenticated;

DROP POLICY IF EXISTS "feedback_select_own" ON public.feedback;
CREATE POLICY "feedback_select_own" ON public.feedback
  FOR SELECT TO authenticated
  USING (user_id = auth.jwt()->>'sub');

DROP POLICY IF EXISTS "feedback_insert_own" ON public.feedback;
CREATE POLICY "feedback_insert_own" ON public.feedback
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.jwt()->>'sub');

-- =====================================================================
-- demo_hunt_scores / demo_hunt_votes (Step B3b)  — READ-ONLY carve-out.
--
-- These are base-table dependencies of the demo_hunt_leaderboard view
-- (views.sql: FROM demo_hunt_scores, correlated EXISTS on demo_hunt_votes).
-- Because that view is security_invoker=on, granting SELECT on the view alone
-- is NOT enough — the caller must hold SELECT on every base relation the
-- view touches, or the query 42501s before the view's own grant is consulted.
--
-- Read-only ONLY. This does not reopen the out-of-scope hunt scoring/
-- scheduling WRITE surface (update_all_hunt_scores, process_next_round).
-- Permissive read policies mirror component_hunt_rounds_select_all above:
-- these are public leaderboard/vote-tally rows, not per-user-sensitive data.
-- =====================================================================
GRANT SELECT ON public.demo_hunt_scores TO authenticated;

DROP POLICY IF EXISTS "demo_hunt_scores_select_all" ON public.demo_hunt_scores;
CREATE POLICY "demo_hunt_scores_select_all" ON public.demo_hunt_scores
  FOR SELECT TO authenticated USING (true);

GRANT SELECT ON public.demo_hunt_votes TO authenticated;

DROP POLICY IF EXISTS "demo_hunt_votes_select_all" ON public.demo_hunt_votes;
CREATE POLICY "demo_hunt_votes_select_all" ON public.demo_hunt_votes
  FOR SELECT TO authenticated USING (true);

-- =====================================================================
-- component_dependencies_closure (Step B3e / Gap 12)  — base FROM table of
-- component_dependencies_graph_view_v3. Same security_invoker=on mechanism
-- as demo_hunt_scores above: without this grant the view stays 42501 for all
-- 3 of its real browser callers (publish/preview.tsx, ui/command-menu.tsx,
-- studio/editor/hooks/use-dependencies.ts) even after the view is granted.
--
-- Closure edges are structural component->component links, not per-user data.
-- Cross-user visibility of the components themselves stays governed by
-- components_select (is_public = true OR own), unaffected by this grant.
-- =====================================================================
GRANT SELECT ON public.component_dependencies_closure TO authenticated;

DROP POLICY IF EXISTS "component_dependencies_closure_select_all" ON public.component_dependencies_closure;
CREATE POLICY "component_dependencies_closure_select_all" ON public.component_dependencies_closure
  FOR SELECT TO authenticated
  USING (true);

-- =====================================================================
-- VIEWS (Steps B3 / B3c / B3e)  — read-only SELECT grants.
-- Views hold no RLS policies of their own; access is governed by the
-- invoker's privileges on the base relations granted above.
-- REQUIRES supabase/views.sql to have been applied first.
-- =====================================================================
GRANT SELECT ON public.public_profiles TO authenticated;              -- Step B3c-i / C2
GRANT SELECT ON public.components_with_username TO authenticated;      -- Step B3c
GRANT SELECT ON public.demo_hunt_leaderboard TO authenticated;         -- Step B3
GRANT SELECT ON public.component_dependencies_graph_view_v3 TO authenticated; -- Step B3e

-- =====================================================================
-- mv_component_analytics (Step B5)  — materialized view, read-only.
--
-- Step B5/E2 audit outcome: the live browser call sites do NOT read the base
-- `component_analytics` table. lib/queries.ts:363 and :498 embed the MATVIEW
-- via PostgREST fkey-embed syntax
-- (mv_component_analytics!component_analytics_component_id_fkey(...)), so the
-- matview is the actual grant target. Matviews cannot hold RLS — a straight
-- GRANT is the whole mechanism, hence `authenticated` only, never `anon`.
--
-- The base `component_analytics` table is deliberately NOT granted here: its
-- only browser path is the raw anon-key client in hooks/use-analytics.ts,
-- which is explicitly out of scope (Step B9).
-- =====================================================================
GRANT SELECT ON public.mv_component_analytics TO authenticated;

-- =====================================================================
-- templates (Step B8)  — defense-in-depth REVOKE of excess anon writes.
--
-- Not currently exploitable (no matching {anon} write RLS policy exists), but
-- anon must never hold write privileges. NOTE for Phase 6: this REVOKE is the
-- FIRST time any part of `templates`'s live grant state becomes
-- version-controlled — the rest of its live grants/policies still need to be
-- reverse-engineered from the live DB into tracked SQL.
-- =====================================================================
REVOKE INSERT, UPDATE, DELETE ON public.templates FROM anon;

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
-- RESOLVED by Phase 1 (Step C2 / B3c-i): the prescription below is no longer
-- hypothetical — it has been APPLIED. public.public_profiles is now defined in
-- supabase/views.sql (with `name` additionally included, per Gap 10) and its
-- SELECT grant is in the Phase 1 block above. `users_select_self` was NOT
-- widened. The original prescription is kept here for provenance:
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
-- PHASE 1 AUDIT — relations deliberately NOT granted (Steps B4/B6/B9)
-- =====================================================================
-- * public.plans (Step B4)      — no browser-client call site exists. The only
--     .from("plans") reads are server-side (Stripe webhook v1/v2). Not granted
--     preemptively; grant when a real consumer appears.
-- * public.collections (Step B6) — no browser-client call site. The only
--     .from("collections") read is a server component (app/c/[slug]/page.tsx).
--     Grant deferred until a consumer exists.
-- * public.component_analytics (Step B9) — its only browser path is the raw
--     anon-key client in hooks/use-analytics.ts, under the `anon` role. anon
--     carries no verifiable JWT claim, so any anon_id/user_id-scoped RLS is
--     unenforceable. Explicitly OUT OF SCOPE for Phase 1; needs its own scoped
--     security review. Today it fails silently (the hook try/catch-swallows all
--     errors and no-ops in dev) — known-degraded, not known-broken.
-- * public.author_payouts / payout_rates / bundles / bundle_plans /
--     bundle_purchases — zero browser-client call sites (server-side only).
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
