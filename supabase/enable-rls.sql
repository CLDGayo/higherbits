-- enable-rls.sql
-- Resolves the two CRITICAL Supabase Security Advisor findings on project
-- CozyDownloads (ewktoowpuemgbaaxxbdq):
--   * rls_disabled_in_public   — public table with Row-Level Security off
--   * sensitive_columns_exposed — table with sensitive columns (api_keys.key,
--     users.email/paypal_email/stripe_id, mcp_generation_requests.api_key)
--     reachable through the anon API with no access restriction.
--
-- WHY THIS IS SAFE (verified 2026-07-22):
--   * The app talks to Supabase ONLY via the service_role key
--     (apps/web/lib/supabase.ts `supabaseWithAdminAccess`). service_role has
--     BYPASSRLS, so RLS never applies to app traffic.
--   * There is NO browser/anon Supabase client anywhere in apps/web
--     (no createBrowserClient / auth-helpers usage; @supabase/auth-helpers-nextjs
--     is an unused leftover dep). Auth is Clerk, not Supabase Auth — so no
--     `anon` or `authenticated` sessions ever read these tables.
--   * Therefore: RLS-on with no policy = deny-all to the public API, allow-all
--     to the app. Nothing breaks; the vulnerability closes.
--
-- Run in the Supabase Dashboard → SQL Editor (executes as table owner).
-- Idempotent: only touches tables where RLS is currently disabled.

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'            -- ordinary tables only (skip views/matviews/partitions)
      AND c.relrowsecurity = false   -- RLS currently OFF
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', r.relname);
    RAISE NOTICE 'RLS enabled on public.%', r.relname;
  END LOOP;
END $$;

-- Verification — should return ZERO rows after the block runs:
SELECT c.relname AS table_still_unprotected
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relrowsecurity = false
ORDER BY 1;

-- ponytail: deny-all is correct because every read is server-side via service_role.
-- IF you later add a client-side anon read (browser Supabase client) for a table
-- that must be public, add a scoped policy for just that table, e.g.:
--   CREATE POLICY "public read" ON public.components FOR SELECT TO anon USING (true);
