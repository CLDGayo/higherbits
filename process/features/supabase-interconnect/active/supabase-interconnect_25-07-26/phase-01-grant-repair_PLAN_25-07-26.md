---
name: plan:supabase-interconnect-phase-01-grant-repair
description: "Supabase Interconnect — Phase 01: Grant/RLS repair (confirmed live prod bug)"
date: 25-07-26
metadata:
  node_type: memory
  type: plan
  feature: supabase-interconnect
  phase: phase-01
---

# Phase 01 — Grant/RLS Repair

**Program:** supabase-interconnect
**Umbrella plan:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/supabase-interconnect-umbrella_PLAN_25-07-26.md
**Phase status:** ⏳ PLANNED
**Report destination:** process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_REPORT_{dd-mm-yy}.md (flat in the program task folder)

---

## Purpose

Fix the confirmed live production bug: the 2026-07-22 `enable-rls.sql` lockdown revoked all
`anon`/`authenticated` grants, and the 2026-07-24 restore script only brought back 14 of the
relations the app actually needs. Bookmarking is confirmed broken today. This phase extends the
grant-restoration script with a per-table decision (grant + scoped RLS, or a SECURITY DEFINER RPC
where RLS can't cleanly express the access pattern) for every relation the 41 browser-client files
reference, applies it to the live database with explicit user approval, and verifies the fix live —
never assumed from the SQL file's presence in the repo alone (Fork A3 from INNOVATE).

---

## Entry Gate

- Umbrella plan Phase 0 complete (this plan file created, SPEC/INNOVATE decisions locked)
- Live-DB audit baseline confirmed (13-relation grant list — corrected from the SPEC's stale
  "14-relation" figure by orchestrator scout, PVL supplement cycle 1, 26-07-26: the real list is
  `components, demos, submissions, sandboxes, users, tags, component_tags, demo_tags, api_keys,
  usages, users_to_plans, mcp_generation_requests, component_hunt_rounds` — `public_profiles` is
  NOT among them, it is only a commented-out prescription at
  `restore-authenticated-grants.sql:295-299` — and 27 RLS policies) — already established in the
  SPEC's Background/Research Findings section

---

## Blast Radius

- `supabase/restore-authenticated-grants.sql` (extended — GRANT + RLS policy statements for
  `demo_bookmarks`, `prompt_rules`, `demo_hunt_leaderboard` view; `templates` anon-write REVOKE)
- Possible new `supabase/migrations/000X_grant_repair_phase1.sql` if Phase 6's migration baseline
  approach (Fork C3) is already in flight when this phase executes — otherwise this stays a
  standalone SQL file per the existing repo pattern until Phase 6 folds it into the baseline
- Per-table decision for `plans`, `component_analytics`, `collections`, `feedback` — audited, not
  blanket-granted; may add a `SECURITY DEFINER` RPC for at most one of these if a cross-user
  aggregate is found (e.g. "N people bookmarked this")
- Read-only: browser-client files calling `useClerkSupabaseClient` (audited, not modified, unless
  a query path is found to reference a relation with no viable RLS-safe grant — in which case route
  to a follow-up plan, not silent scope expansion). **Count is self-deriving at execute time via
  `grep -rl "useClerkSupabaseClient" apps/web/{app,components,lib,hooks}` — do not hardcode a
  number; the SPEC's "41 files" figure is confirmed stale (live count 51 as of 26-07-26 research).**
- `supabase/views.sql` (redefine `components_with_username` and `demo_hunt_leaderboard` to source
  username/profile data from a new `public.public_profiles` view instead of joining `public.users`
  directly — resolves Gap 6/Gap 7; see Steps B3c-i/B3c-ii). **[RESOLVED PVL supplement cycle 1,
  26-07-26 — this file is now a confirmed Blast Radius entry, not pending.]** Note: this overlaps
  Phase 6's claimed `supabase/*.sql` surface (see the umbrella's `## Pre-PVL Conflict Resolution`
  and the phase blast-radius registry). No conflict: Phase 6 runs later and sequentially after
  Phase 1 completes, so there is no concurrent-write risk — Phase 6 will simply fold this phase's
  already-applied `views.sql` state into its schema-source-of-truth baseline.
  **[GAP 9 — FOUND by inner-PVL cycle 2, 26-07-26, BLOCKING]** A THIRD view shares the identical
  `security_invoker=on` + INNER-JOIN-to-`public.users` architecture:
  `public.component_dependencies_graph_view_v3` (confirmed named alongside `components_with_username`
  and `demo_hunt_leaderboard` as one of exactly 3 SECURITY DEFINER views converted to invoker-mode,
  `supabase/enable-rls.sql:6-11`; view body in `supabase/views.sql` JOINs `public.users su`/`du` twice,
  same pattern as Gap 6/7). It has **zero grant anywhere** in `restore-authenticated-grants.sql`
  (grep-confirmed) — currently 42501s live today. It is reached via `apps/web/lib/queries.server.ts`'s
  `resolveRegistryDependencyTree()`, called with the browser `useClerkSupabaseClient` instance from
  THREE real call sites: `apps/web/components/features/publish/components/preview.tsx:51,65`,
  `apps/web/components/ui/command-menu.tsx:141,295`, and
  `apps/web/components/features/studio/editor/hooks/use-dependencies.ts:26,157` (studio editor live
  dependency loading + registry preview + command palette). This relation was NOT added to Blast
  Radius by the prior supplement and is not covered by Steps B3c-i/B3c-ii. See Validate Contract Gap 9
  for the required fix (same `public_profiles` substitution pattern, applied to this view's `su`/`du`
  joins, plus its first-ever grant).
- **[NEW — PVL supplement cycle 2, 26-07-26, ORCHESTRATOR SECURITY FINDING, Decision 1]**
  `supabase/restore-authenticated-grants.sql:149` currently reads `GRANT SELECT, UPDATE ON
  public.users TO authenticated;` — a table-level UPDATE grant with no column list. The
  `users_update_self` row policy (`:156-160`) restricts WHICH ROW may be updated, not WHICH
  COLUMNS — RLS cannot express column-level restriction. `users.is_admin` exists
  (`apps/web/prisma/schema.prisma:625`, `Boolean @default(false)`) and is currently writable by any
  authenticated user on their own row — a live privilege-escalation vulnerability. This phase's
  existing Blast Radius entry for `restore-authenticated-grants.sql` now additionally covers
  replacing this grant with a column-scoped `GRANT UPDATE (col_a, col_b, ...)` statement — see new
  Step B0.
- **[NEW — PVL supplement cycle 2, 26-07-26, Decision 3]** `supabase/admin-functions.sql` — add the
  missing `GRANT EXECUTE ON FUNCTION ... TO authenticated` statements for
  `update_submission_as_admin` and `update_demo_info_as_admin` (both already `SECURITY DEFINER` and
  self-check `is_admin`; granting EXECUTE is safe by design — the functions themselves reject
  non-admins). This file was not previously in Blast Radius; it now is, for this narrow grant-only
  addition — no function body changes.
- **[NEW — PVL supplement cycle 2, 26-07-26, Decision 4]** `apps/web/hooks/use-analytics.ts`'s raw
  `anon`-key `component_analytics` read/write path is explicitly OUT OF SCOPE for this phase (see new
  Step B9) — named here so the exclusion is not silent.

---

## Implementation Checklist

### Step A — Audit all browser-client files against the confirmed 13-relation baseline
(count is self-deriving — see A1; SPEC's prior "41 files"/"14-relation" figures are both stale,
corrected 26-07-26)

- [x] A1. Re-derive the current browser-client file list at execute time via
      `grep -rl "useClerkSupabaseClient" apps/web/{app,components,lib,hooks}` (or the call sites of
      `useClerkSupabaseClient` defined at `apps/web/lib/clerk.ts:66`) — do NOT assume a fixed count.
      **INNER-LOOP RESEARCH finding (26-07-26): the live count as of this research pass is 51 files,
      not 41 — this checklist and all references below to "41 browser-client files" are a stale
      snapshot from the SPEC. Count and list re-derived fresh at execute time; the file count is
      expected to keep drifting and must never be hardcoded again.** Cross-reference the re-derived
      list against the known SPEC citation list.
- [x] A2. **[Step A2 checklist text rewritten, PVL supplement cycle 3, 26-07-26 — see Gap 14 below;
      this is the executable instruction, not just a finding note.]** For each file, perform ALL of
      the following, in order:
      1. Extract every direct `.from()`/`.rpc()` call site and the relation/function name it targets.
         **VALIDATE finding (see Gap 2 below): distinguish base tables from views/matviews reached
         via PostgREST foreign-key-embed syntax (e.g.
         `mv_component_analytics!component_analytics_component_id_fkey(...)`) — the embed target is
         what actually needs the grant, not necessarily the name in the fkey label.**
      2. Also grep each file's LOCAL imports (relative and `@/`-aliased — never npm packages) for
         shared query-helper modules, and recursively trace `.from()`/`.rpc()` call sites inside those
         helpers, following THEIR local imports in turn, until closure (track visited modules to
         terminate). `apps/web/lib/queries.server.ts` and `apps/web/lib/queries.ts` are known helper
         hubs — name them as starting points, but the full helper set must be DERIVED from each
         file's actual imports, not limited to just these two. This step exists because a per-file
         grep alone missed `component_dependencies_graph_view_v3` (Gap 9) and
         `public.component_dependencies_closure` (Gap 12) for four validate cycles running.
      3. For every call site found in steps 1-2, classify which Postgres role reaches it: a relation
         is browser-reachable (and therefore subject to the `authenticated` grant audit) ONLY if the
         Supabase client instance at that call site originates from `useClerkSupabaseClient` (role
         `authenticated`) or a raw anon-key client (role `anon`). Calls made through a service-role
         client (`supabaseAdmin`/`supabaseWithAdminAccess`) bypass RLS/grants entirely — they are OUT
         OF SCOPE for this audit and must be recorded as excluded, not silently dropped or conflated
         with the in-scope gap list. The live `/contest/leaderboard` page is a known service-role
         example — confirm and exclude it the same way.
      **[GAP 14 — RESOLVED, PVL supplement cycle 3, 26-07-26]** Supplement cycle 2's changelog
      previously claimed this methodology fix (recursive local-import tracing + browser/anon vs
      service-role client distinction, Gap 11) was already applied here. Grep-confirmed that claim
      was FALSE — the fix existed only in prose in the Touchpoints section and stale historical
      Validate Contract text, never in this executable Step A2 item, so execute-agent would never
      have actually performed it. The numbered sub-instructions above are now written directly into
      this checklist item's own text (not prose elsewhere) so this does not recur.
- [x] A3. Diff the full target-relation set against the confirmed 13-relation grant baseline
      (`components, demos, submissions, sandboxes, users, tags, component_tags, demo_tags,
      api_keys, usages, users_to_plans, mcp_generation_requests, component_hunt_rounds` —
      `public_profiles` is NOT in this baseline, it is created fresh by Step B3c-i);
      produce a definitive gap list (expected: `demo_bookmarks`, `prompt_rules`,
      `demo_hunt_leaderboard`, `plans`, `component_analytics`, `collections`, `feedback`,
      `author_payouts`, `payout_rates`, `bundles`, `demo_hunt_scores` per the SPEC's Background
      section — confirm no additional gaps exist). **VALIDATE finding: also add `demo_hunt_votes`
      to this gap list — it is a hard dependency of the in-scope `demo_hunt_leaderboard` view (see
      Gap 1 below) even though no browser-client file calls `.from("demo_hunt_votes")` directly.**
      **INNER-LOOP RESEARCH finding (26-07-26): also add `components_with_username` to this gap
      list — it is a `security_invoker=on` view (confirmed `supabase/enable-rls.sql:8-11,41`) with
      no grant of any kind on the view itself anywhere in `supabase/restore-authenticated-grants.sql`
      (grep-confirmed), and it is called live from a browser-client file
      (`apps/web/components/features/component-page/info-section.tsx:79-80`). See new Step B3c.**
- [x] A4. Note: `author_payouts`, `payout_rates`, `bundles`, `demo_hunt_scores` are out-of-scope
      surfaces per the SPEC (creator-payout write path, bundle purchases, hunt scoring) — confirm
      whether any browser-client file actually *reads* them (read-only grants may still be needed
      even though the write feature is out of scope) and record the finding. **VALIDATE finding:
      this out-of-scope classification of `demo_hunt_scores` directly conflicts with Step B3's
      in-scope grant of the `demo_hunt_leaderboard` view, which selects FROM `demo_hunt_scores` —
      see Gap 1. `demo_hunt_scores`/`demo_hunt_votes` need a narrow READ-ONLY grant carve-out from
      this out-of-scope classification; the write/scheduling capability stays correctly
      out-of-scope.** **INNER-LOOP RESEARCH finding (26-07-26) — this question is now ANSWERED:
      `author_payouts` and `payout_rates` have ZERO browser-client `.from()`/`.rpc()` call sites
      (grep-confirmed against the re-derived file list) — no read-only grant is needed for either.
      `bundles`, `bundle_plans`, `bundle_purchases` `.from()` call sites exist ONLY in server-side
      files (Stripe webhook v2, create-checkout-bundle, `apps/web/lib/user.ts`) — none use
      `useClerkSupabaseClient` — confirmed out of Phase 1 scope, no browser-client grant needed. The
      `demo_hunt_scores`/`demo_hunt_votes` carve-out from cycle 0 stands unchanged.**

### Step B — Per-table grant/RLS decision (Fork A3, per-table not blanket)

- [x] B0. **[NEW — SECURITY FIX, PVL supplement cycle 2, 26-07-26, Decision 1 — HIGH PRIORITY, do
      this before any other Step B item]** Replace the table-level
      `GRANT SELECT, UPDATE ON public.users TO authenticated;`
      (`restore-authenticated-grants.sql:149`) with a column-scoped UPDATE grant:
      `GRANT UPDATE (username, name, bio, twitter_url, github_url, pro_referral_url, website_url,
      display_name, display_username, display_image_url, image_url, pro_banner_url, role) ON
      public.users TO authenticated;` (keep `GRANT SELECT ON public.users TO authenticated;`
      unchanged). **[Column list corrected, PVL supplement cycle 3, 26-07-26 — `role` added; see Gap
      13 resolution below. Corrected again, PVL supplement cycle 4, 26-07-26 — `pro_banner_url`
      added; see Gap 15 resolution below.]**
      The column list is every user-editable profile column from
      `apps/web/prisma/schema.prisma:616-665` EXCLUDING: `id`, `created_at`, `updated_at`,
      `manually_added`, `is_admin`, `email`, `ref`, `paypal_email`, `is_partner`, `bundles_fee`,
      `stripe_id` (privileged, billing, moderation, or system-managed columns). Add a SQL comment
      directly above the new grant
      explaining WHY column scoping is required: the `users_update_self` row policy
      (`:156-160`) restricts WHICH ROW may be updated but cannot restrict WHICH COLUMNS — RLS has
      no column-level primitive — so without this fix any authenticated user could
      `UPDATE users SET is_admin = true WHERE id = auth.jwt()->>'sub'` on their own row. This is a
      security fix, not a routine grant — keep it as its own checklist item, reviewed explicitly at
      Step C3.
      **[GAP 13 — FOUND by inner-PVL cycle 3, 26-07-26, BLOCKING]** The column list above INCORRECTLY
      omits `role`. `role` is a `user_role` enum (`designer | frontend_developer | backend_developer |
      product_manager | entrepreneur` — `apps/web/prisma/schema.prisma:715-721`), a self-described
      professional-role field, NOT a privilege/moderation field (that is `is_admin`, already correctly
      excluded). It is confirmed WRITTEN today by a real live browser-client (`useClerkSupabaseClient`)
      call at `apps/web/components/features/magic/feedback-dialog.tsx:106,157-162`
      (`supabase.from("users").update({ role: ... }).eq("id", user.id)`, own-row-scoped). Once this
      grant lands as currently specified, that live write will start failing (column not in the granted
      UPDATE list — `42501`/PostgREST schema-cache rejection), breaking the feedback dialog's
      role-selection feature. `role` must be ADDED to the granted column list (and correspondingly
      removed from the "EXCLUDING" list's prose, which currently misclassifies it alongside genuinely
      privileged columns like `is_admin`/`is_partner`/`bundles_fee`). This is a completeness bug in the
      security fix, not a reason to reject the security fix itself — `is_admin` and the other
      privileged/billing columns stay correctly excluded.
      **[GAP 13 — RESOLVED, PVL supplement cycle 3, 26-07-26]** `role` is now added to the granted
      column list above (and removed from the "EXCLUDING" list). Confirmed write call site:
      `apps/web/components/features/magic/feedback-dialog.tsx:156-161`
      (`supabase.from("users").update({ role: ... }).eq("id", user.id)`, `useClerkSupabaseClient()` at
      `:106`, own-row-scoped via `.eq("id", user.id)`). **Distinguishing note for future readers:**
      `role` (`user_role` enum — a self-described professional-role field the user picks about
      themselves) is a normal profile column and belongs in the granted list; do NOT conflate it with
      `is_admin` (a privilege/moderation flag) by surface-level analogy ("it sounds like a permission
      word") — `is_admin` MUST stay excluded, `role` MUST stay included. The two are opposite cases of
      the same column-scoping fix, not the same case.
      **[GAP 15 — FOUND by inner-PVL cycle 4, 26-07-26, CONCERN]** A full reconciliation of this
      granted list (12 columns) plus the "EXCLUDING" list (11 columns) against the actual 24 scalar
      columns on `users` (`apps/web/prisma/schema.prisma:616-644`) found `pro_banner_url` in neither
      list — the granted+excluded lists only summed to 23, so the checklist's own claim of "every
      user-editable column EXCLUDING [...]" was not a true partition.
      **[GAP 15 — RESOLVED, PVL supplement cycle 4, 26-07-26]** `pro_banner_url` is now added to the
      granted UPDATE column list above. Rationale: it is a user-editable profile image field, directly
      analogous to the already-granted `image_url`/`display_image_url` self-service display columns,
      with no privilege or billing meaning — excluding it would set up a silent breakage the first time
      a Pro banner editor ships. No live browser-client write call site to `pro_banner_url` exists
      today (full-repo grep), so this resolution changes zero live behavior now; it only closes the
      accounting gap. **Partition-completeness rule for future readers:** the granted column list plus
      the "EXCLUDING" list together MUST account for all 24 scalar `users` columns — re-verify this
      count mechanically (13 granted + 11 excluded = 24, post this cycle's fix) whenever either list
      changes, rather than trusting the prose alone.

- [x] B1. `demo_bookmarks` — user-owned table (bookmark belongs to the authenticated user). Extend
      grants + write a scoped RLS policy (`user_id = auth.jwt()->>'sub'` pattern — **VALIDATE
      correction: the closest visible exemplar in `restore-authenticated-grants.sql` is
      `components_insert_own`/`_update_own`/`_delete_own`, NOT a `templates_insert_own`-style
      policy — `templates` has no grant/policy statements in any tracked `supabase/*.sql` file at
      all (grep-confirmed); its live policy names are known only from the SPEC's live-DB audit
      narrative, not from a file execute-agent can open and copy**).
- [x] B2. `prompt_rules` — confirm ownership model (per-user or per-org) from schema; write scoped
      RLS accordingly. **VALIDATE finding (Gap 3, security-relevant): confirmed per-user via
      `apps/web/lib/queries.ts` (insert/select filter on `user_id`). But `updatePromptRule()`
      (`queries.ts:816-853`) and `deletePromptRule()` (`queries.ts:855-865`) perform ZERO app-level
      ownership check — both filter only on `.eq("id", id)`, never `user_id`. RLS is therefore the
      SOLE enforcement layer preventing one user from editing or deleting another user's prompt
      rule. This step MUST produce explicit `FOR UPDATE ... USING (user_id = auth.jwt()->>'sub')
      WITH CHECK (user_id = auth.jwt()->>'sub')` and `FOR DELETE ... USING (user_id =
      auth.jwt()->>'sub')` policies (not a loose `FOR ALL USING (true)` or a policy that omits
      `WITH CHECK` on UPDATE), and Step D should add a cross-user negative test (session B attempts
      to update/delete session A's row, expect 0 rows affected).** **INNER-PVL re-confirmation
      (26-07-26): re-read `queries.ts:816-865` again this cycle — the gap is unchanged and stands as
      described.**
- [x] B3. `demo_hunt_leaderboard` (view) — read-only view; grant `SELECT` to `authenticated` only,
      no write RLS needed. Confirm the view's own security posture (`security_invoker`) is
      consistent with existing views (`mv_component_analytics`, `component_dependencies_graph_view_v3`,
      `components_with_username` — all confirmed `security_invoker=on` per SPEC F5/Gap5 findings).
      **VALIDATE finding (Gap 1, most severe — see below): granting SELECT on the view alone is
      NOT sufficient. `security_invoker=on` means authenticated must also hold table-level SELECT
      on every base relation the view's `FROM`/subquery clauses touch:
      `public.demo_hunt_scores` (main FROM, confirmed via `supabase/views.sql:118-122`) and
      `public.demo_hunt_votes` (correlated `EXISTS` subquery, `views.sql:94-100`) — both are
      currently ABSENT from the confirmed 13-relation grant baseline AND from this checklist's own
      grant list. Without a companion grant on those two relations, live queries against
      `demo_hunt_leaderboard` will still 42501 even after this step "completes," and Step D3's "no
      42501 errors" check will fail. See Step B3b (new) below and the Gap 1 fix in the validate
      contract.**
      **INNER-PVL finding (Gap 7, this cycle, 26-07-26): even after Step B3b's grant pair lands,
      this view's `FROM`/`JOIN` also reads `public.users cu`/`du` (`supabase/views.sql:118-122`,
      plain INNER JOIN) — and `public.users` has exactly one SELECT policy, `users_select_self`,
      restricted to the caller's own row (`restore-authenticated-grants.sql:151-154`). Under
      `security_invoker=on`, this means the view will return rows ONLY where the caller happens to
      be both the component owner and the demo owner of every ranked entry — i.e. an essentially
      empty result set for a real multi-contestant leaderboard. See Gap 7 in the Validate Contract
      for the full analysis (scored CONCERN, not FAIL, because the view's only browser-client
      consumer is currently dead code with zero live callers).**
- [x] B3b. **[NEW — added by VALIDATE, required before Step C1]** Grant narrow, read-only access to
      the two base relations `demo_hunt_leaderboard` depends on: `GRANT SELECT ON
      public.demo_hunt_scores, public.demo_hunt_votes TO authenticated;` plus a permissive
      global-read policy for each, mirroring the existing `component_hunt_rounds_select_all`
      precedent (`FOR SELECT TO authenticated USING (true)` — these are public leaderboard/vote-tally
      rows, not per-user-sensitive data). This does **not** reopen the out-of-scope hunt-scoring
      write/scheduling surface (`update_all_hunt_scores`, `process_next_round`, etc. stay
      unauthored/unscheduled per the umbrella's Out-of-Scope Corrections) — it only makes the
      already-in-scope leaderboard view queryable. **PVL cycle 2 re-confirmation (25-07-26): full
      view body re-read against `supabase/views.sql:75-122` — the view's other JOINs
      (`demos`, `components`, `users` ×2, `demo_tags`/`tags`) are all already covered by the
      existing 13-relation baseline, and its `demo_bookmarks` correlated subquery is covered by this
      same plan's Step B1. `demo_hunt_scores` + `demo_hunt_votes` are the ONLY missing base-table
      dependencies — this grant pair is complete, nothing further needed.** **CORRECTION
      (INNER-PVL, 26-07-26, see Gap 7): "nothing further needed" was INCOMPLETE — the `users cu`/
      `du` JOIN is already GRANTed (part of the 13-relation baseline) but its RLS
      (`users_select_self`, own-row-only) still filters the JOIN to near-empty for a real multi-user
      leaderboard. This grant pair fixes the 42501 on `demo_hunt_scores`/`demo_hunt_votes` but does
      NOT make the view return complete/correct leaderboard rows. Currently latent (no live
      caller) — see Gap 7.**

      **PLAN-SUPPLEMENT RESOLUTION (PVL supplement cycle 1, 26-07-26):** Folded into the same
      `public_profiles` substitution as Step B3c-ii — `demo_hunt_leaderboard`'s `cu`/`du` joins
      to `public.users` are replaced with joins to `public.public_profiles` in the same
      statement batch as B3c-ii. Rationale: `getRoundSubmissions()` (this view's only
      browser-client consumer) currently has zero live callers, so this is a latent-defect fix,
      not a live-bug fix — but it is fixed here rather than left as a residual, because the
      identical view-redefinition edit in the same file (`supabase/views.sql`) closes it at no
      extra cost. `component_user_data`/`user_data`'s `to_jsonb(cu.*)`/`to_jsonb(du.*)`
      projections narrow accordingly to the safe `public_profiles` column list.
- [x] B3c. **[NEW — added by INNER-LOOP RESEARCH+INNOVATE, 26-07-26]** `components_with_username`
      (view) — confirmed `security_invoker=on` via the dynamic `ALTER VIEW ... SET (security_invoker
      = on)` loop at `supabase/enable-rls.sql:8-11,41`, same RLS-invoker regime as
      `demo_hunt_leaderboard`. No grant exists anywhere for this view today (grep-confirmed against
      `supabase/restore-authenticated-grants.sql`, which only grants the base `components` table at
      line 53). Live browser-client consumer confirmed at
      `apps/web/components/features/component-page/info-section.tsx:79-80`. **INNOVATE decision
      (Fork 1 — FOLD IN):** `GRANT SELECT ON public.components_with_username TO authenticated;` —
      no RLS policy needed; it is a read-only reference view over the already-granted `components`
      base table, same public-data class as `demo_hunt_leaderboard`.
      **INNER-PVL FINDING (Gap 6, this cycle, 26-07-26) — THIS DECISION IS INCORRECT / INCOMPLETE,
      BLOCKING:** the view's FROM clause is `public.components c JOIN public.users u ON u.id =
      c.user_id` (`supabase/views.sql:32-33`) — an INNER JOIN, not just "a view over `components`."
      `public.users` has exactly one SELECT policy, `users_select_self`, `USING (id =
      auth.jwt()->>'sub')` — own row only. Under `security_invoker=on`, the caller's RLS on `users`
      applies to the JOIN, so for any component whose `user_id` is NOT the caller's own id, the `u`
      side of the JOIN produces zero rows and the entire row is excluded from the result — not a
      42501, a silent empty result. The live consumer
      (`info-section.tsx:79-90`, `supabase.from("components_with_username").select("*").or(username.eq...)`)
      resolves registry DEPENDENCY components, which are overwhelmingly authored by users OTHER than
      the viewer — the common case this fix needs to support. A plain grant (no RLS/view change)
      will stop the 42501 but will NOT make cross-user dependency resolution work: it will silently
      return 0 rows. `restore-authenticated-grants.sql:284-304`'s own "KNOWN LIMITATION (deliberate,
      fail-closed)" comment independently documents this exact mechanism and prescribes the fix: do
      NOT widen `users_select_self` (would leak email/stripe_id/etc. to any authenticated caller for
      any user who has ever published anything); instead add a narrow-column `public_profiles`-style
      view (`security_invoker = off`, safe columns only) and source cross-user username/profile data
      from THAT view. Step C2 (below) already has a checklist item to resolve the commented-out
      `public_profiles` block — it must now be treated as load-bearing for THIS step, not an
      independent, deferrable housekeeping item. See Validate Contract Gap 6/SUPPLEMENT REQUEST for
      the required resolution before this plan can reach EXECUTE.**

      **PLAN-SUPPLEMENT RESOLUTION (PVL supplement cycle 1, 26-07-26 — LOCKED, do not
      re-litigate):** Orchestrator decision: take the view-redefinition fix; do NOT descope
      cross-user correctness. Step B3c is no longer "grant only". It becomes: (a) create
      `public.public_profiles` (new Step B3c-i) with `security_invoker = off` and a safe
      column list only, plus a SELECT grant; (b) redefine `components_with_username` (new
      Step B3c-ii) to source username/profile data from `public_profiles` instead of joining
      `public.users` directly, replacing the `to_jsonb(u.*) AS "user"` projection with the
      narrow `public_profiles` equivalent — keep the view itself `security_invoker=on`; (c)
      then grant `SELECT` on the view. Failure mode being fixed: `components_with_username`'s
      INNER JOIN to `public.users` is filtered by the caller's own-row-only RLS
      (`users_select_self`), so a cross-user query returns a SILENT EMPTY RESULT — not a
      42501 — for any component authored by someone other than the caller. This is not a
      permission error to grant around; it is a data-shape problem the view definition itself
      must fix.

- [x] B3c-i. **[NEW]** Create `public.public_profiles`:
      `CREATE VIEW public.public_profiles WITH (security_invoker = off) AS SELECT id, username,
      name, display_name, display_username, display_image_url, image_url, bio, github_url,
      twitter_url, website_url FROM public.users;` plus
      `GRANT SELECT ON public.public_profiles TO authenticated;` — exact text prescribed at
      `restore-authenticated-grants.sql:295-299`. `security_invoker = off` is safe HERE
      precisely because the column list excludes every sensitive column (`email`,
      `paypal_email`, `stripe_id`, `lemon_squeezy_customer_id`, `ref`, `is_admin`) — the
      grants file states this explicitly at `:302-304`; cite it in the applied SQL's comment.
      **[PVL supplement cycle 2, 26-07-26, Decision 5 / Gap 10]** `name` is now included in the
      column list above — `info-section.tsx`'s author byline rendering already falls back to
      `user.name` publicly, so `name` belongs in the safe set alongside the other display columns.
- [x] B3c-ii. **[NEW]** Redefine `components_with_username` (`supabase/views.sql:5-33`) via
      `CREATE OR REPLACE VIEW`: change `JOIN public.users u ON u.id = c.user_id` to
      `JOIN public.public_profiles u ON u.id = c.user_id`, and replace the
      `to_jsonb(u.*) AS "user"` projection with the equivalent narrow-column shape sourced
      from `public_profiles` (same safe column list as B3c-i). Keep `components_with_username`
      itself `security_invoker=on` — only the base relation it joins changes, not its own
      invoker posture. Apply the identical substitution to `demo_hunt_leaderboard`'s two
      `public.users` joins (`cu`, `du` — `supabase/views.sql:118-122`) in the same statement
      batch, per the Gap 7 fold-in resolution at Step B3b below.

- [x] B3e. **[NEW — required by inner-PVL cycle 2, 26-07-26, Gap 9, BLOCKING]** Apply the identical
      `public_profiles` substitution to `public.component_dependencies_graph_view_v3`'s two
      `public.users` joins (`su`, `du`) in the same statement batch as B3c-ii, AND grant
      `SELECT ON public.component_dependencies_graph_view_v3 TO authenticated` (this view currently
      has NO grant at all — a live 42501 today for its 3 real browser-client callers, listed in the
      Blast Radius Gap 9 note above). Narrow the `su.*`/`du.*`-derived projected columns
      (`source_author_username`, `source_author_display_username`, `dependency_author_username`, and
      any other `su`/`du`-sourced column) to the same safe `public_profiles` column list — including
      `name` (see Gap 10: the live consumer at `info-section.tsx` falls back to `user.name` when
      `display_name` is unset, so `name` must be added to the `public_profiles` column list defined
      in B3c-i, not just the 10 columns originally prescribed).
      **[GAP 12 — FOUND by inner-PVL cycle 3, 26-07-26, BLOCKING]** The fix above is INCOMPLETE — it
      only addresses the view's `su`/`du` (`public.users`) joins and the view's own SELECT grant. The
      view's FROM clause is `FROM public.component_dependencies_closure cl JOIN public.components src
      ON src.id = cl.component_id JOIN public.users su ON su.id = src.user_id JOIN public.components dep
      ON dep.id = cl.dependency_component_id JOIN public.users du ON du.id = dep.user_id;`
      (`supabase/views.sql:70-75`). `public.component_dependencies_closure` — the view's base FROM
      table — has ZERO grant anywhere in `restore-authenticated-grants.sql` (grep-confirmed) and, per
      `enable-rls.sql`'s blanket RLS-enable loop, has RLS enabled with no policies (deny-all). Under
      `security_invoker=on`, the caller must hold privilege+RLS-satisfying access to EVERY table the
      view's FROM/JOIN touches, not just the view itself — this is the exact same mechanism Step B3b
      already had to solve for `demo_hunt_leaderboard`'s `demo_hunt_scores`/`demo_hunt_votes`
      dependencies (Gap 1). Even after this Step B3e's `su`/`du` substitution and view-level grant are
      fully applied, `component_dependencies_graph_view_v3` will STILL 42501 for all 3 real
      browser-client callers (`preview.tsx`, `command-menu.tsx`, `use-dependencies.ts`) because
      `component_dependencies_closure` itself is unreachable. Fix required (mirroring the Step B3b
      pattern exactly): add `GRANT SELECT ON public.component_dependencies_closure TO authenticated;`
      plus a permissive read-all policy (`FOR SELECT TO authenticated USING (true)` — dependency-closure
      edges are structural component-to-component links, not per-user-sensitive data, same public-data
      class as `component_hunt_rounds`/`demo_hunt_scores`/`demo_hunt_votes`; cross-user visibility of
      `src`/`dep` themselves stays correctly governed by `components_select`'s existing
      `is_public = true OR own` policy, unaffected by this closure-table grant).
      **[GAP 12 — RESOLVED, PVL supplement cycle 3, 26-07-26]** Add the following two statements to
      this Step B3e's SQL batch (same batch/file as the `su`/`du` substitution and the view's own
      SELECT grant above), matching the exact `GRANT` + named-policy convention Step B3b already uses
      for `demo_hunt_scores`/`demo_hunt_votes` (and the file's existing `tags_select_all`/
      `component_tags_select_all`-style named-policy precedent in
      `supabase/restore-authenticated-grants.sql`):
      ```sql
      GRANT SELECT ON public.component_dependencies_closure TO authenticated;

      DROP POLICY IF EXISTS "component_dependencies_closure_select_all" ON public.component_dependencies_closure;
      CREATE POLICY "component_dependencies_closure_select_all" ON public.component_dependencies_closure
        FOR SELECT TO authenticated
        USING (true);
      ```
      Why the view-level grant alone is insufficient: `component_dependencies_graph_view_v3` is
      `security_invoker=on` (confirmed via `enable-rls.sql`'s header comment), so under Postgres's
      invoker-security model the CALLER's own privileges are checked against every base relation the
      view's FROM/JOIN clause touches — not just the view object itself. Granting `SELECT` on the view
      satisfies the check for the view object, but the caller still has zero privilege on
      `public.component_dependencies_closure` (the view's base FROM table), so Postgres rejects the
      query with `42501` before the view's own grant is ever consulted. This is the identical failure
      mode Step B3b already fixed for `demo_hunt_leaderboard`'s `demo_hunt_scores`/`demo_hunt_votes`
      base-table dependencies (Gap 1) — a `security_invoker=on` view's grant is only as good as its
      weakest-granted base table.

- [x] B3f. **[NEW — PVL supplement cycle 2, 26-07-26, Decision 3]** Admin write paths via
      SECURITY DEFINER RPC:
      1. Add `GRANT EXECUTE ON FUNCTION public.update_submission_as_admin(INT, TEXT, TEXT) TO
         authenticated;` and `GRANT EXECUTE ON FUNCTION public.update_demo_info_as_admin(INT, TEXT,
         TEXT) TO authenticated;` to `supabase/admin-functions.sql`. **[Rationale corrected, PVL
         supplement cycle 4, 26-07-26 — see Gap 16 resolution below.]** These grants are
         **defensive and explicit, not corrective**: in Postgres, `EXECUTE` is granted to `PUBLIC` by
         default when a function is created, unless explicitly revoked, so these two RPCs are
         probably already callable without this statement. The grant is added anyway because it
         documents intent and survives any future `REVOKE ... FROM PUBLIC` hardening pass — being
         redundant costs nothing. Safe by design either way: both functions self-check `is_admin` and
         reject non-admins before any write.
      2. `update_demo_info_as_admin` is live-called from
         `apps/web/components/features/admin/hooks/useSubmissions.ts:440,494` via `.rpc(...)` — no
         plan change needed beyond the grant above.
      3. `update_submission_as_admin` has ZERO live call sites anywhere in `apps/web` (grep-confirmed
         — `useSubmissions.ts` has no `.rpc("update_submission_as_admin", ...)` call). This RPC is
         dormant. Grant it EXECUTE anyway (safe, no behavior change) but do not invent a caller for
         it in this phase.

      **[GAP 16 — FOUND by inner-PVL cycle 4, 26-07-26, INFORMATIONAL]** Item 1's original rationale
      ("today's file has NO `GRANT EXECUTE` statements at all, so even the two existing admin RPCs
      are likely uncallable") was checked against two evidence sources: (a) Postgres's documented
      default privilege semantics — `EXECUTE` is granted to `PUBLIC` by default on function creation
      unless explicitly revoked; (b) `supabase/rpc-functions.sql` defines ~25 other functions
      (many `SECURITY DEFINER`), live-called via `.rpc()` from ~20 browser-client files, with ZERO
      `GRANT EXECUTE` statements anywhere in tracked SQL, and the plan does not claim those are
      broken. Both sources contradict the "likely uncallable" premise.
      **[GAP 16 — RESOLVED, PVL supplement cycle 4, 26-07-26]** The rationale in item 1 above is
      corrected to describe the grant as defensive/explicit rather than corrective. **The
      `GRANT EXECUTE` statements themselves are unchanged and still land** — being redundant with
      Postgres's default costs nothing, and explicit grants are the right posture for a
      security-sensitive admin surface regardless of whether they change today's live behavior.
      Step D6's live test remains the actual source of truth for whether these RPCs are callable,
      independent of why.

      4. `useSubmissions.ts` performs several admin writes DIRECTLY against tables through the
         browser client (role `authenticated`), NOT through either existing RPC: `demo_hunt_scores`
         INSERT/UPDATE (`:147/:221/:276/:289` — contest-round assignment) and `components.is_public`
         UPDATE (`:557/:580` — public-status toggle). Neither existing RPC covers these flows, and no
         RLS policy in this phase's scope can safely permit an arbitrary authenticated user to
         perform them (they are genuine admin-only writes on rows the caller does not own). **This
         phase does NOT author a new RPC for these flows** (would expand Blast Radius into new
         `apps/web` client-side call changes, out of this phase's declared read-only browser-client
         scope). Recorded as an explicit follow-up: a new `update_hunt_score_as_admin` /
         `toggle_component_public_as_admin`-style SECURITY DEFINER RPC pair, to be authored in a
         follow-up phase/backlog item, with the `useSubmissions.ts` client-side call sites switched
         from direct `.from()` writes to `.rpc()` calls (that follow-on client-side change is outside
         this phase's Blast Radius). See the narrowed Exit Gate wording below — this phase does NOT
         claim these two admin write flows become functional; they remain broken (still ungranted for
         a non-owning admin) until the follow-up lands.
- [x] B9. **[NEW — PVL supplement cycle 2, 26-07-26, Decision 4]** `apps/web/hooks/use-analytics.ts`'s
      `useSupabaseAnalytics` hook uses a raw `anon`-key `createClient()` (NOT
      `useClerkSupabaseClient`) to SELECT (dedup check, `:90`) and INSERT (`:122`)
      `component_analytics` rows under the `anon` Postgres role — a structurally separate pathway
      from every other browser-client surface this phase audits (which all run under `authenticated`
      via `useClerkSupabaseClient`). Classification: **explicitly OUT OF SCOPE for this phase.**
      Rationale: (a) `anon` requests carry no verifiable JWT claim, so any RLS policy scoping by
      `anon_id`/`user_id` is unenforceable — client-supplied identifiers cannot be trusted as a
      security boundary; a permissive `anon` grant is a distinct security-design decision that
      deserves its own scoped review, not a fold-in to an already-large grant-repair phase; (b) the
      hook already `try/catch`-swallows all Supabase errors (`:107-109`, `:130-134`) and additionally
      no-ops entirely in development (`:66-68`), so today's live 42501 (no `anon` grant exists on
      `component_analytics`) fails silently with zero user-visible breakage — this is a
      known-degraded, not a known-broken, feature. Record a backlog note:
      `anon-analytics-grant-scope_NOTE_{dd-mm-yy}.md` recommending a dedicated follow-up SPEC/plan
      to decide the `anon` grant + RLS shape (and any anti-abuse hardening) for
      `component_analytics` before wiring it live.

- [x] B4. `plans` — read-only reference data (subscription plan catalog); likely safe for a broad
      `SELECT` grant to `authenticated` (or even `anon` if publicly listed pricing) — confirm no
      row-level sensitivity, grant accordingly.
- [x] B5. `component_analytics` — confirm read pattern: aggregate stat or per-user? If aggregate
      (e.g. "N views this component"), RLS may not cleanly express it — budget for a
      `SECURITY DEFINER` RPC returning only the safe aggregate instead of a blanket table grant.
      Document the decision either way. **VALIDATE finding (Gap 2, feasibility): the live
      browser-client call sites (`apps/web/lib/queries.ts:363,498`) do NOT call
      `.from("component_analytics")` directly — they embed the confirmed-live matview
      `mv_component_analytics` via PostgREST's foreign-key-embed syntax
      (`mv_component_analytics!component_analytics_component_id_fkey(...)`). Step A2/A3 must record
      which physical relation(s) actually need the grant — the base `component_analytics` table,
      the `mv_component_analytics` matview, or both — before this step's SECURITY-DEFINER-vs-grant
      judgement is finalized. Matviews use straight GRANTs (no RLS policies), which changes the
      shape of the fix if the matview turns out to be the actual target.** **INNER-PVL
      re-confirmation (26-07-26): both call sites (`:363-372`, `:498`) re-read this cycle — finding
      stands unchanged.**
- [x] B6. `collections` — 0 live rows; confirmed out-of-scope for membership UI, but read access
      may still be needed if any of the browser-client files renders collection metadata read-only. If no
      current read call site exists, do NOT grant preemptively — record as "no active call site,
      grant deferred until a consumer exists."
- [x] B7. `feedback` — likely write-once-no-update pattern (a user submits feedback, never edits
      it). Grant `INSERT` + narrow `SELECT` (own rows only) via RLS; no `UPDATE`/`DELETE` grant.
- [x] B8. Revoke `templates`'s excess `anon` `INSERT`/`UPDATE`/`DELETE` grants (F5 hygiene item) —
      low severity, not currently exploitable (no matching `{anon}` write RLS policy), but tighten
      as defense-in-depth per AC13. **VALIDATE note: since `templates` has no tracked grant
      statements anywhere in `supabase/*.sql` today, this REVOKE will be the FIRST time any part of
      `templates`'s live grant state becomes version-controlled — document this explicitly in the
      phase report so Phase 6 (schema source of truth) knows the rest of `templates`'s grants/policies
      still need to be reverse-engineered from the live DB and added to the tracked file, not just
      the revoke.**

### Step C — Extend and apply the fix

- [x] C1. Extend `supabase/restore-authenticated-grants.sql` with the Step B (B0, B3b, B9-out-of-scope-note)
      decisions as new `GRANT`/`CREATE POLICY` statements, following the existing file's structure
      and comment style. **[PVL supplement cycle 2, 26-07-26]** This batch now also includes Step
      B0's column-scoped `users` UPDATE grant replacement (security fix — apply this one FIRST in
      the diff for reviewer visibility) and Step B3f's two `GRANT EXECUTE` statements in
      `supabase/admin-functions.sql`.
- [x] C2. Resolve the commented-out `public_profiles` block (`restore-authenticated-grants.sql:295`)
      — either apply it (if a live consumer needs it) or leave it commented with an explicit
      documented reason (record the decision either way; do not silently leave ambiguous).
      **INNER-PVL FINDING (26-07-26): this is no longer an independent, optional item — see Gap 6.
      Step B3c's live consumer needs exactly this resolved (or an equivalent) to actually work for
      cross-user dependency resolution. This step and Step B3c must be resolved TOGETHER in the next
      PLAN-SUPPLEMENT cycle.**
      **PLAN-SUPPLEMENT RESOLUTION (PVL supplement cycle 1, 26-07-26 — LOCKED):** C2 is now
      MANDATORY, not optional — apply the `public_profiles` block per Step B3c-i verbatim (not
      left commented). C2 and Steps B3c-i/B3c-ii are ONE combined SQL change; they must land in
      the same Step C1 SQL batch (extending `restore-authenticated-grants.sql` plus the
      `supabase/views.sql` redefinitions) and be reviewed together at the Step C3 hard stop.
- [ ] C3. **HARD STOP — request explicit user approval before applying any grant/RLS statement to
      the live production database.** Present the exact SQL diff for review.
- [ ] C4. Upon approval, apply the extended SQL against the live database.
- [ ] C5. Re-run the same `information_schema.role_table_grants` + `pg_policies` introspection query
      used in the original audit to confirm the new grant/policy state matches the intended diff.
      **VALIDATE note: the file's existing commented-out ROLLBACK block (bottom of
      `restore-authenticated-grants.sql`) is a blunt "REVOKE ALL from authenticated on every table"
      — it is not scoped to just this phase's diff. Acceptable as an emergency full-rollback, but if
      C4 partially fails mid-application, prefer fixing forward (the file is idempotent /
      re-runnable) over invoking the blunt rollback, and document that choice in the phase report.**

### Step D — Live verification

- [ ] D1. Drive the `BookmarkButton` interaction on the component detail page
      (`apps/web/app/[username]/[component_slug]/page.client.tsx:940,950`) and confirm the
      bookmark persists across a page reload (SPEC AC2).
- [ ] D2. Repeat the same check via the preview dialog
      (`apps/web/components/features/component-page/preview-dialog.tsx:419,429`).
- [ ] D3. Exercise the `prompt_rules` and `demo_hunt_leaderboard` query paths and confirm no 42501
      errors. **Depends on Step B3b landing — without it this check fails deterministically (Gap
      1).** Also add the Gap 3 cross-user negative-test sub-check for `prompt_rules` UPDATE/DELETE.
      **INNER-PVL addition required (Gap 6/7): "no 42501 errors" is NOT a sufficient check for
      `components_with_username` or `demo_hunt_leaderboard` — both need an explicit assertion that a
      cross-user query returns a NON-EMPTY, correctly-populated result, not merely the absence of a
      permission error. See Validate Contract Execute-Agent Instruction E7.**
- [ ] D4. Re-run the Step A gap-list cross-reference one final time to confirm zero remaining
      ungranted tables/views referenced by the browser-client files (count self-deriving per Step A1;
  SPEC AC3).
- [ ] D5. **[NEW — PVL supplement cycle 2, 26-07-26, Decision 1]** Privilege-escalation regression
      test: as an authenticated non-admin test session, attempt
      `UPDATE users SET is_admin = true WHERE id = auth.jwt()->>'sub'` (or the equivalent
      PostgREST/Supabase-client call). MUST be REJECTED after Step B0 lands (column not in the
      granted UPDATE list — `42501` or a PostgREST "column does not exist in schema cache"-style
      rejection, either is acceptable proof of denial). An absence-of-error result is a FAIL, not a
      pass — this is a real-attempt test, not an absence-of-error check.
- [ ] D6. **[NEW — PVL supplement cycle 2, 26-07-26, Decision 3]** Confirm both admin RPCs are now
      callable by an authenticated admin session: `update_demo_info_as_admin` (live-used) and
      `update_submission_as_admin` (dormant, but grant it anyway) both succeed post-Step-B3f grant.
      Also confirm a NON-admin authenticated session calling either RPC still receives the
      function's own `is_admin` rejection response (defense-in-depth unchanged by the grant).

---

## Exit Gate

```bash
# Live grant/policy state confirmation (run via the same introspection query used in the baseline audit)
# Expected: demo_bookmarks, prompt_rules, demo_hunt_leaderboard (view) + its demo_hunt_scores/
# demo_hunt_votes base-table dependency, plus any other Step B-approved additions present in the
# authenticated grant list; templates anon write grants revoked; users UPDATE grant now
# column-scoped (is_admin and other privileged columns excluded); admin-functions.sql RPCs granted
# EXECUTE to authenticated
#
# NARROWED CLAIM (PVL supplement cycle 2, 26-07-26, Decision 3): this Exit Gate does NOT claim all
# admin write paths are functional. `useSubmissions.ts`'s direct `demo_hunt_scores`
# INSERT/UPDATE and `components.is_public` UPDATE flows remain BROKEN (still ungranted for a
# non-owning admin) after this phase completes — no RPC exists for them and none is authored here
# (see Step B3f item 4). Only the two EXISTING admin RPCs (`update_demo_info_as_admin`,
# `update_submission_as_admin`) are confirmed functional by this phase's Exit Gate. A follow-up
# phase/backlog item is required before the admin submissions-moderation and public-toggle flows
# work end-to-end.
#
# ADDITIONAL EXCLUSION (PVL supplement cycle 5, 26-07-26, Gap 17): the anon-role
# `component_analytics` read/write path used by `apps/web/hooks/use-analytics.ts` (raw
# anon-key `createClient()`, not `useClerkSupabaseClient`) is also explicitly OUT OF SCOPE
# and NOT covered by this phase's success claim — consistent with Blast Radius Decision 4,
# Step B9, and Public Contracts, which already document this exclusion.

corepack pnpm --filter web exec tsc --noEmit
# CORRECTED expectation (INNER-LOOP RESEARCH, 26-07-26): the prior 25-07-26 "clean, 0 errors"
# baseline is now stale. Live re-check today: exit 2, exactly 4 errors, ALL in
# apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx (lines 168, 389 —
# escaped-backtick template-literal syntax error in uncommitted dirty WIP, unrelated to this
# phase's grants/RLS scope and outside its Blast Radius). Exit Gate criterion: no NEW tsc errors
# beyond this CONFIRMED foreign baseline of 4 (all in add-registry-modal.tsx) — NOT a zero-errors
# expectation. This file is not touched or fixed by this phase (see Backlog artifacts below).
# INNER-PVL re-confirmation (26-07-26): re-ran live this cycle — identical result (exit 2, same 4
# errors, same 2 lines). Baseline stands.

corepack pnpm --filter web test
# CORRECTED expectation (was "all tests pass" — inaccurate given the current baseline; see the
# validate-contract's Test Coverage Plan and Gap 4): no NEW test failures beyond the CONFIRMED
# 25-07-26 baseline of 57/62 passing (17 files), 5 pre-existing failures across 4 files — all
# unrelated to this phase's grant/RLS scope:
#   - app/__tests__/font-cozy-sweep.test.tsx (1)
#   - app/__tests__/landing-smoke.test.tsx (1)
#   - components/ui/__tests__/header-smoke.test.tsx (1)
#   (all 3 above trip the SAME pre-existing null-safety bug in useClerkSupabaseClient's
#   session-cache guard, apps/web/lib/clerk.ts:70-71 — see Known Gaps in the validate contract)
#   - app/api/magic/__tests__/route.test.ts (2 — unrelated route/rate-limit issue, no Supabase
#     grant involvement)
# INNER-PVL re-confirmation (26-07-26): re-ran live this cycle — identical result (57 pass / 5 fail
# / 62 total, same 4 files). Baseline stands.
```

- All Step A-D checklist items checked (including new Step B3b)
- Live BookmarkButton interaction confirmed working on both surfaces (detail page + preview dialog)
- Zero remaining ungranted-but-referenced tables/views across the browser-client files (self-deriving count), INCLUDING
  `demo_hunt_leaderboard`'s base-table dependencies (`demo_hunt_scores`, `demo_hunt_votes`)
- `prompt_rules` UPDATE/DELETE cross-user negative test confirms denial (Gap 3)
- `components_with_username` (and, if in scope, `demo_hunt_leaderboard`) returns CORRECT, non-empty
  cross-user data, not merely "no permission error" (Gap 6/7 — resolved by PVL supplement cycle 1, 26-07-26; provable once Steps B3c-i/B3c-ii are executed and applied)
- Phase report written to report destination above, including the before/after grant diff as
  evidence

---

## Blockers That Would Justify BLOCKED Status

- User does not approve the live grant/RLS SQL diff (Step C3 hard stop) — phase pauses, cannot
  apply the fix; downstream Phase 2/4/5 that depend on Phase 1's exit gate cannot start.
- Step A audit discovers a relation whose access pattern genuinely cannot be expressed via RLS or a
  narrow SECURITY DEFINER RPC without becoming new product work — route to a follow-up plan/backlog
  note rather than block indefinitely.
- Live database is unreachable for the introspection/verification steps (env/credential issue).
- **Gap 6 (this cycle): Step B3c's chosen fix cannot deliver correct cross-user
  `components_with_username` resolution without either extending Blast Radius to
  `supabase/views.sql` or explicitly descoping the cross-user correctness claim. This currently
  BLOCKS the gate — see Validate Contract.**
- **Gap 9 (this cycle, inner-PVL cycle 2): a third view, `public.component_dependencies_graph_view_v3`,
  shares Gap 6's exact architecture (INNER JOIN to RLS own-row-only `public.users`) AND currently has
  no grant at all (live 42501 today for 3 real browser-client callers: `preview.tsx`,
  `command-menu.tsx`, `use-dependencies.ts`). This was not covered by the PVL supplement cycle 1 fix
  and BLOCKS the gate again — see Validate Contract Gap 9.**
- **[NEW — PVL supplement cycle 2, 26-07-26]** Confirmed NOT a blocker, but recorded for
  transparency: two `useSubmissions.ts` admin write flows (`demo_hunt_scores` INSERT/UPDATE,
  `components.is_public` toggle) have no covering RPC and are explicitly left broken by this phase
  (Step B3f item 4, narrowed Exit Gate). This does not block Phase 1's gate because it was already
  broken before this phase and this phase does not claim to fix it — it is a documented known-gap
  with a named follow-up, not a silent omission.
- **Gap 12 (this cycle, inner-PVL cycle 3): `public.component_dependencies_closure` — the base FROM
  table of `component_dependencies_graph_view_v3` — has zero grant/policy anywhere, so Step B3e's
  `su`/`du` substitution + view-level grant is INCOMPLETE. Even fully applied, the view stays 42501
  for its 3 real callers. This BLOCKS the gate — see Validate Contract Gap 12.**
- **Gap 13 (this cycle, inner-PVL cycle 3): Step B0's column-scoped `users` UPDATE grant list omits
  `role`, but a real live browser-client write to `users.role` exists
  (`feedback-dialog.tsx:157-162`, own-row-scoped, non-privileged professional-role enum). Applying
  the grant as currently specified breaks this live feature. This BLOCKS the gate — see Validate
  Contract Gap 13.**
- **Gap 14 (this cycle, inner-PVL cycle 3, methodology, CONCERN not itself blocking): supplement
  cycle 2's claim that Step A2 was corrected to trace shared query-helpers and distinguish
  browser/anon vs service-role clients (Gap 11) was never actually applied to the Step A2 checklist
  item — only to prose elsewhere. See Validate Contract Gap 14.**

---

## Phase Loop Progress

Orchestrator reads this before deciding which subagent to spawn next. The canonical 7-step inner loop
`R → I → P → PVL → E → EVL → UP` SKIPS SPEC (SPEC runs once in the outer program loop).

- [x] 1. RESEARCH — inner-loop research-agent (26-07-26): re-read prior outer-PVL contract (25-07-26 PASS); confirmed drift — `components_with_username` view has a `security_invoker=on` posture (`supabase/enable-rls.sql:8-11,41`) with no grant anywhere (grep-confirmed) and a live browser-client consumer (`apps/web/components/features/component-page/info-section.tsx:79-80`); live browser-client file count re-derived at 51 (not 41); `tsc --noEmit` re-run shows 4 foreign errors in `add-registry-modal.tsx` (unrelated dirty WIP); vitest re-run shows 57/62 passing, 5 failing (1 caused by the clerk.ts null-guard bug, not 3 as previously miscounted).
- [x] 2. INNOVATE — 4 forks resolved: Fork 1 (FOLD IN `components_with_username` grant into Phase 1 — done via Step B3c); Fork 2 (REJECT fixing `add-registry-modal.tsx` — out of Blast Radius, Exit Gate becomes a no-new-errors baseline diff instead); Fork 3 (REJECT fixing `clerk.ts` — Blast Radius declares it read-only, backlog note only with corrected 1-of-5 attribution); Fork 4 (self-deriving browser-client file count, not a hardcoded 51).
- [x] 3. PLAN-SUPPLEMENT — VALIDATE-driven supplement applied inline above (Step A2/A3/A4/B1/B2/B3/B5/B8 annotated, new Step B3b added, Exit Gate test-baseline corrected) — see SUPPLEMENT REQUEST in the validate contract below for the one item (B3b) that still needs execute-agent to actually author + apply the SQL
- [x] 3b. PLAN-SUPPLEMENT (PVL-supplement re-check, 25-07-26) — vc-plan-agent independently re-verified all 5 SUPPLEMENT REQUEST gaps against the plan text and live SQL sources (`supabase/views.sql:81-122` confirms `demo_hunt_leaderboard` FROMs `demo_hunt_scores` + correlated-EXISTS `demo_hunt_votes`; `supabase/restore-authenticated-grants.sql` confirms `components_insert_own`/`component_hunt_rounds_select_all` exist and `templates_insert_own` does not). All 5 gaps (B3b grant pair, B5 matview-vs-table ambiguity, B2/D3 prompt_rules ownership policies, Exit Gate baseline wording, B1 exemplar citation) were already applied inline by the prior VALIDATE pass — confirmed complete and internally consistent, no additional checklist edits required this cycle.
- [x] 3c. PLAN-SUPPLEMENT (inner-loop refresh, 26-07-26) — vc-plan-agent folded in the RESEARCH+INNOVATE findings above: added Step B3c (`components_with_username` grant), corrected Step A1/A3/A4/Touchpoints browser-client file-count wording to self-deriving (not hardcoded 41 or 51), reworded the Exit Gate tsc criterion to a no-new-errors-beyond-foreign-baseline standard, added the `add-registry-modal-tsc-syntax-error_NOTE_25-07-26.md` backlog row, corrected the Test Infra Improvement Notes clerk.ts attribution from "3 of 5" to "1 of 5" (naming the other two tests' real causes), added a Verification Evidence row for the `components_with_username` grant, and wrote this `## Inner Loop Refresh Note`. PVL must re-run from V1 per the Step 4b `generated-by: outer-pvl` + newer-Inner-Loop-Refresh-Note rule.
- [x] 4. PVL — vc-validate-agent: full V1-V7 re-run, cycle 3 / inner-PVL (26-07-26). **Gate: BLOCKED.**
      Re-derived every previously-"resolved" gap from source rather than trusting the prior
      contract (which is exactly how this cycle caught what cycles 0-2 missed). Cycle 2's 5 gaps
      (B3b grant pair, B5 matview/table distinction, B2/D3 prompt_rules policies, Exit Gate baseline
      wording, B1 exemplar citation) all RE-CONFIRM as resolved. tsc/vitest baselines RE-CONFIRMED
      live and unchanged. BUT this cycle traced Step B3c's `components_with_username` fix all the
      way through Postgres's `security_invoker`+RLS semantics against the view's actual FROM clause
      (`JOIN public.users u` — an INNER JOIN, own-row-only RLS) and found the planned grant-only fix
      will NOT deliver correct cross-user dependency resolution (Gap 6, NEW — 2 FAILs: Breaking
      changes, Security surface, plus the Implementation Checklist section). The identical mechanism
      also affects `demo_hunt_leaderboard` (Step B3b) but is scored a CONCERN only (Gap 7) since its
      one browser-client consumer, `getRoundSubmissions()`, has zero live callers anywhere in the
      app (the live `/contest/leaderboard` page uses the service-role client, bypassing RLS
      entirely). A lower-severity CONCERN also flags a stale "41" TDD-stub test name. **Next step:
      orchestrator must spawn vc-plan-agent in PLAN-SUPPLEMENT mode with the SUPPLEMENT REQUEST
      below, then re-run PVL from V1 once more before EXECUTE.** The Step C3 live-DDL hard stop
      remains a mandatory user-approval pause regardless of this gate's outcome.
- [x] 3d. PLAN-SUPPLEMENT (PVL supplement cycle 1, 26-07-26) — vc-plan-agent resolved Gaps 6/7/8
      per the orchestrator's locked decision (take the view-redefinition fix, do not descope
      cross-user correctness): rewrote Step B3c's resolution and added new Steps B3c-i (create
      `public.public_profiles`, `security_invoker=off`, safe columns only) and B3c-ii (redefine
      `components_with_username` to join `public_profiles` instead of `public.users`); folded the
      identical fix into `demo_hunt_leaderboard`'s `cu`/`du` joins (Gap 7); made Step C2 mandatory
      and cross-referenced to B3c-i; extended Blast Radius by exactly one file (`supabase/views.sql`)
      with an explicit Phase 6 sequential-overlap note; corrected the SPEC's stale "14-relation"
      baseline to the confirmed 13-relation list (`public_profiles` NOT among them); swept the
      remaining stale "41 files" prose mentions to self-deriving wording; corrected Public
      Contracts to disclose the new `public_profiles` view and `components_with_username`'s
      narrowed output shape; updated Verification Evidence with a provable (not pending) row for
      `components_with_username` plus a new row for `demo_hunt_leaderboard`. Did not touch the
      Step C3 live-DDL hard stop — it remains fully intact and now additionally gates the
      `public_profiles` CREATE VIEW + the two `CREATE OR REPLACE VIEW` redefinitions + the new
      GRANT. Emitted `SUPPLEMENT_APPLIED`; next step is PVL re-run from V1, NOT execute.
- [x] 4b. PVL — vc-validate-agent: full V1-V7 re-run, inner-PVL cycle 2 (26-07-26). **Gate: BLOCKED
      again.** Re-derived every Gap 6/7/8 claim from source (not trusted from the prior contract)
      and confirmed all of it holds — no regression on the fixed items; tsc/vitest baselines
      re-confirmed live and unchanged. Extended the same reasoning one step further and found a
      THIRD view sharing Gap 6's exact architecture: `component_dependencies_graph_view_v3` (Gap 9,
      NEW — 3 FAILs, same 3 dimensions as Gap 6) — confirmed via `enable-rls.sql`'s own header
      comment naming exactly 3 SECURITY DEFINER views converted to invoker-mode, and confirmed
      reachable from 3 real browser-client files (`preview.tsx`, `command-menu.tsx`,
      `use-dependencies.ts`) through the shared helper `queries.server.ts`'s
      `resolveRegistryDependencyTree()` — a level of indirection Step A2's literal per-file grep
      methodology does not reach, which is why cycles 0-3 missed it. This relation currently has
      ZERO grant at all (live 42501 today, not just a future silent-empty-result risk). Also found a
      minor CONCERN (Gap 10): the `public_profiles` column list omits `name`, which
      `components_with_username`'s live consumer reads as part of a fallback chain. **Next step:
      orchestrator must spawn vc-plan-agent in PLAN-SUPPLEMENT mode with the new SUPPLEMENT REQUEST
      (Gap 9/10), then re-run PVL from V1 once more before EXECUTE.** The Step C3 live-DDL hard stop
      remains a mandatory user-approval pause regardless of this gate's outcome.
- [x] 3e. PLAN-SUPPLEMENT (PVL supplement cycle 2, 26-07-26) — vc-plan-agent resolved Gaps 9/10 per
      the SUPPLEMENT REQUEST (new Step B3e: `public_profiles` substitution + first-ever grant for
      `component_dependencies_graph_view_v3`; `name` added to the `public_profiles` column list in
      B3c-i). Additionally applied 5 orchestrator-directed decisions found during an independent
      exhaustive indirect-relation audit and a direct source read of
      `restore-authenticated-grants.sql:149`: **Decision 1 (SECURITY FIX)** — new Step B0 replaces
      the table-level `GRANT SELECT, UPDATE ON public.users TO authenticated` with a column-scoped
      UPDATE grant excluding `is_admin` and other privileged columns (live
      privilege-escalation bug); **Decision 2** — rejected any RLS-based admin-override policy,
      keeping admin writes on the existing `SECURITY DEFINER` RPC pattern
      (`supabase/admin-functions.sql`); **Decision 3** — new Step B3f adds the missing
      `GRANT EXECUTE` for both existing admin RPCs, confirms `update_demo_info_as_admin` is live-used
      and `update_submission_as_admin` is dormant, and narrows this phase's Exit Gate claim to
      exclude two `useSubmissions.ts` admin write flows (`demo_hunt_scores`, `components.is_public`)
      that have no covering RPC and are NOT fixed by this phase; **Decision 4** — new Step B9
      classifies `use-analytics.ts`'s raw `anon`-key `component_analytics` path as explicitly
      out-of-scope with a backlog note, rather than silently unmentioned; **Decision 5** — folded
      into Gap 10's resolution (`name` added to `public_profiles`). Added Steps D5/D6 (privilege-
      escalation negative test; admin-RPC-callable positive test). Blast Radius, Touchpoints, Public
      Contracts, and Verification Evidence updated accordingly. Emitted `SUPPLEMENT_APPLIED`; next
      step is PVL re-run from V1, NOT execute.
- [x] 4c. PVL — vc-validate-agent: full V1-V7 re-run, inner-PVL cycle 3 (26-07-26). **Gate: BLOCKED
      again.** Re-derived Gaps 9/10/11's supplement-cycle-2 resolution from source (not trusted from
      the prior contract): the `component_dependencies_graph_view_v3` `su`/`du` substitution + view
      grant (Gap 9), the `name` column addition (Gap 10), and the five orchestrator-directed security
      decisions (B0/B3f/B9) all independently re-confirmed correct AS FAR AS THEY GO. Extended the
      audit further (following this task's explicit "the last 4 cycles each found something new, keep
      looking" instruction) and found 2 new FAIL-level gaps plus 1 CONCERN: Gap 12
      (`public.component_dependencies_closure`, the view's own base FROM table, has zero grant/policy
      anywhere — Step B3e's fix is incomplete, mirrors the exact Gap-1/Step-B3b pattern but was not
      applied here); Gap 13 (Step B0's column-scoped `users` UPDATE grant omits `role`, but a real live
      browser-client write to `users.role` exists at `feedback-dialog.tsx:157-162` — schema-confirmed
      as a non-privileged professional-role enum, not an admin/moderation column — applying the grant
      as specified would break this live feature); Gap 14 (methodology, CONCERN: supplement cycle 2's
      claimed Step A2 fix for Gap 11 — tracing into shared query-helpers and distinguishing
      browser/anon vs service-role clients — was never actually written into the Step A2 checklist
      item, only into prose elsewhere; per instruction, a methodology fix stated only in prose is
      insufficient). tsc/vitest baselines RE-CONFIRMED live and unchanged
      (tsc: exit 2, same 4 errors in `add-registry-modal.tsx`; vitest: 57/62, same 5 pre-existing
      failures). `validate-plan-artifact.mjs` re-confirmed as a harness false positive (2
      failures/3 warnings this run — phase-stub misclassification, unchanged conclusion);
      `validate-phase-stub.mjs` re-confirmed clean (0/0). **Next step: orchestrator must spawn
      vc-plan-agent in PLAN-SUPPLEMENT mode with the SUPPLEMENT REQUEST below (Gaps 12/13/14), then
      re-run PVL from V1 once more before EXECUTE.** The Step C3 live-DDL hard stop remains a
      mandatory user-approval pause regardless of this gate's outcome.
- [x] 4d. PLAN-SUPPLEMENT (PVL supplement cycle 3, 26-07-26) — vc-plan-agent resolved Gaps 12/13/14
      per the SUPPLEMENT REQUEST: (1) Gap 12 — Step B3e's SQL batch now includes the missing
      `GRANT SELECT ON public.component_dependencies_closure TO authenticated;` plus a named
      `component_dependencies_closure_select_all` permissive read policy, mirroring the Step B3b
      base-table-companion-grant pattern exactly; (2) Gap 13 — `role` added to Step B0's granted
      column list (and removed from the "EXCLUDING" prose), with a distinguishing note that `role`
      (self-described profile field) is not `is_admin` (privilege flag) — confirmed live write at
      `feedback-dialog.tsx:156-161`; (3) Gap 14 — Step A2's own checklist text rewritten with the
      numbered recursive-local-import-tracing + browser/anon-vs-service-role-client-classification
      methodology, replacing the prior prose-only (never-executable) version. All three edits
      grep-verified applied to the correct sections. Step C3's existing generic "any grant/RLS
      statement" hard-stop wording already covers the two new Edit-1 statements without further
      change. Emitted `SUPPLEMENT_APPLIED`; next step is PVL re-run from V1, NOT execute.
- [x] 5. EXECUTE — all AUTHORABLE checklist items done (Steps A1-A4, B0-B9, C1-C2: 3 SQL files
      edited, 30 statements, 1 new gap documented — `public.templates`, see backlog note); both
      Fully-Automated regression gates (tsc, vitest) green at documented baseline. **Steps C3-C5,
      D1-D6 remain undone — this is a documented gap, not silently skipped: they are gated behind
      the Step C3 mandatory user-approval hard stop and require a live database connection this
      agent does not have.** See phase report's "AWAITING USER APPROVAL — Step C3 (HARD STOP)"
      section for the exact statements pending approval.
- [x] 4e. PVL — vc-validate-agent: full V1-V7 re-run, inner-PVL cycle 4 (26-07-26). **Gate: CONDITIONAL.**
      Grep-verified all three cycle-3 fixes (Gap 12 component_dependencies_closure grant+policy;
      Gap 13 `role` added to Step B0's column list; Gap 14 Step A2 methodology rewrite) land in the
      executable checklist text, not just prose — first cycle with zero re-opened prior gaps. Extended
      the audit into two new areas per instruction to keep hunting rather than rubber-stamp: (1) a full
      column-count reconciliation of Step B0's granted+excluded `users` column lists against the real
      24-column schema — found `pro_banner_url` unaccounted for in either list (Gap 15, CONCERN, no
      live call site found so no live break today); (2) a cross-file consistency check of Step B3f's
      "likely uncallable" rationale against Postgres's documented default PUBLIC-EXECUTE privilege and
      against ~25 other ungranted `rpc-functions.sql` functions the plan does not claim are broken (Gap
      16, informational, no fix needed). Also re-confirmed `enable-rls.sql`'s "3 views" claim is
      exhaustive against `supabase/views.sql`, and that `use-analytics.ts` is the only browser-executed
      raw anon-key call site. tsc/vitest baselines re-run live, unchanged (exit 2/4 errors;
      57/62 passing). Net Gate: 0 FAILs / 2 CONCERNs → CONDITIONAL (first non-BLOCKED verdict this
      program). **Next step: one more narrow PLAN-SUPPLEMENT cycle to resolve Gap 15 (a one-line
      decision: grant or exclude `pro_banner_url`), then a final PVL re-run should reach PASS.** The
      Step C3 live-DDL hard stop remains a mandatory user-approval pause regardless of this gate's
      outcome.
- [x] 4f. PLAN-SUPPLEMENT (PVL supplement cycle 4, 26-07-26) — vc-plan-agent resolved Gaps 15/16 per
      the SUPPLEMENT REQUEST: (1) Gap 15 — `pro_banner_url` added to Step B0's granted `users` UPDATE
      column list (now 13 granted + 11 excluded = all 24 scalar columns accounted for), consistent
      with the already-granted `image_url`/`display_image_url` self-service display columns; a
      partition-completeness rule was added so future readers re-verify the 24-column count
      mechanically whenever either list changes; (2) Gap 16 — Step B3f's "likely uncallable"
      rationale was corrected from a corrective claim to a defensive/explicit one (Postgres grants
      `EXECUTE` to `PUBLIC` by default absent an explicit REVOKE; ~25 other `rpc-functions.sql`
      functions are live-called with zero `GRANT EXECUTE` and are not claimed broken) — the
      `GRANT EXECUTE` statements themselves are unchanged and still land. Both edits grep-verified
      applied to the correct sections. Emitted `SUPPLEMENT_APPLIED`; next step is a final PVL
      re-run from V1, NOT execute.
- [x] 6. EVL — both Fully-Automated gates (tsc, vitest) re-confirmed green at baseline via a
      spawned vc-tester run. One EVL fix cycle applied (26-07-26): the `REVOKE UPDATE ON
      public.users FROM authenticated;` statement moved from report prose into
      `supabase/restore-authenticated-grants.sql:180` (a security fix that depended on an operator
      reading an adjacent note is not self-sufficient) — regression gates re-confirmed unchanged
      after the fix. EVL HANDOFF SUMMARY written (gates_green, known_gaps, follow_up_stubs,
      context_partial, preliminary_packet_path, closeout_classification — see UPDATE PROCESS
      handoff). All Agent-Probe/Hybrid live gates (C5, D1-D6, E7, E8) are correctly NOT included
      in "EVL gates green" — they require the live DB connection gated behind Step C3 and are not
      part of this phase's automated EVL scope.
- [x] 4g. PVL — vc-validate-agent: full V1-V7 re-run, inner-PVL cycle 5 (26-07-26). **Gate: CONDITIONAL.**
      Re-derived Gaps 15/16's supplement-cycle-4 resolution from source (not from the changelog): grep-
      and-count-confirmed Step B0's granted (13) + excluded (11) `users` column lists now sum to exactly
      the 24 real scalar columns on `apps/web/prisma/schema.prisma:616-640` with zero overlap and zero
      omission, and confirmed no privileged column (`is_admin`, `email`, `ref`, `paypal_email`,
      `is_partner`, `bundles_fee`, `stripe_id`) is in the granted list. Re-read `supabase/restore-
      authenticated-grants.sql`, `supabase/views.sql`, and `supabase/admin-functions.sql` in full and
      confirmed every SQL claim in the plan text against the live files (line-149 `users` grant,
      line-151/156 policies, the commented `public_profiles` block at :295-299, zero `templates`
      statements anywhere, zero `GRANT EXECUTE` statements anywhere in any tracked SQL, zero grant on
      `component_dependencies_closure`). Re-ran `tsc --noEmit` (exit 2, same 4 errors,
      `add-registry-modal.tsx:168,389`) and `vitest` (57/62, same 5 pre-existing failures) live — both
      match the documented baseline exactly. Confirmed `feedback-dialog.tsx:156-161`'s live `role` write
      and confirmed zero live write call sites to `pro_banner_url` anywhere in `apps/web`. Found no new
      FAIL and no re-opened prior gap. Extended the audit into two new areas per the task's explicit
      instruction to keep hunting rather than rubber-stamp: (1) Gap 17 (NEW, CONCERN) — the Exit Gate
      section explicitly names the two `useSubmissions.ts` admin-write exclusions but does NOT name the
      `component_analytics` anon-role exclusion (Blast Radius Decision 4 / Step B9), even though that
      exclusion is real and already documented elsewhere in the plan; (2) Gap 18 (NEW, CONCERN) — the
      Exit Gate checklist bullet ("Gap 6/7 — pending SUPPLEMENT resolution") and the Verification
      Evidence table's Gap 9 row ("pending SUPPLEMENT resolution this cycle; not yet provable") are both
      stale: Gap 6/7 was resolved at PVL supplement cycle 1 and Gap 9 at cycle 2 (further completed by
      Gap 12 at cycle 3), re-confirmed clean every cycle since, but these two annotations were never
      updated to match — unlike the adjacent Gap 6 row in the same table, which correctly reads
      "resolved by PVL supplement cycle 1 ... provable once executed." Both new findings are pure
      documentation-completeness issues with zero functional or security impact (the underlying fixes
      are confirmed correctly present in the executable checklist/SQL text) — Net Gate: 0 FAILs / 2
      CONCERNs → CONDITIONAL. **Next step: either a narrow text-only PLAN-SUPPLEMENT cycle (2 one-line
      fixes) or accept both as documented CONDITIONAL gaps and proceed to EXECUTE — this cycle's
      findings carry no functional risk either way.** The Step C3 live-DDL hard stop remains a mandatory
      user-approval pause regardless of this gate's outcome.
- [x] 4h. PLAN-SUPPLEMENT (PVL supplement cycle 5, 26-07-26, text-only) — vc-plan-agent resolved Gaps 17/18: (1) Gap 17 — added the anon-role `component_analytics` exclusion sentence to the Exit Gate narrowed-claim block, matching the style of the existing `useSubmissions.ts` exclusions; (2) Gap 18 — updated the Exit Gate's Gap 6/7 bullet and the Verification Evidence table's Gap 9 row from stale "pending SUPPLEMENT resolution" wording to resolved wording, mirroring the adjacent Gap 6 row's phrasing. Both edits are documentation-only — zero SQL, checklist, or Blast Radius changes. PVL loop closes here: CONDITIONAL accepted by orchestrator under standing /goal; no further PVL re-run required.
- [x] 7. UPDATE PROCESS (26-07-26) — phase report finalized (SPEC Achievement + Program-Wide
      Learnings sections added), umbrella `## Current Execution State` rewritten, backlog note
      written for the `public.templates` gap, `process/context/tests/all-tests.md` baseline
      corrected. **Plan intentionally NOT archived — still `active/`.** Phase 01's own exit gate
      (C3 user approval → C4 apply → C5/D1-D6 live verification) has not been reached; this is
      "Keep in active/testing" per the closeout packet, not "Ready for UPDATE PROCESS archival."
      Commit is a separate orchestrator-owned step, not performed by this agent.

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or the Validate Contract
section reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator
must spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder. **Current status (26-07-26,
inner-PVL cycle 5 complete): Gaps 15/16 (cycle 4) re-confirmed resolved from source. This cycle found**
**2 new documentation-completeness CONCERNs (Gap 17 — Exit Gate omits the anon-role**
**`component_analytics` exclusion; Gap 18 — stale "pending SUPPLEMENT resolution" wording for the**
**already-resolved Gap 6/7/9). Net Gate: CONDITIONAL (0 FAILs / 2 CONCERNs, both zero-functional-impact**
**text fixes). This is a legitimate terminal gate — 4 supplement cycles have already run. Orchestrator**
**may either run one more narrow text-only PLAN-SUPPLEMENT cycle, or accept both CONCERNs and route to**
**EXECUTE. The Step C3 live-DDL hard stop is unaffected either way.**

---

## Touchpoints

- `supabase/restore-authenticated-grants.sql`
- `supabase/views.sql` (Gap 6/7/9 fix: new `public_profiles` view + redefinitions of
  `components_with_username`, `demo_hunt_leaderboard`, and `component_dependencies_graph_view_v3`)
- Read-only: all files identified via `useClerkSupabaseClient` (defined at `apps/web/lib/clerk.ts:66`)
  — self-deriving count at execute time, NOT a fixed 41 (confirmed stale; live count 51 as of
  26-07-26 research) — PLUS, per Gap 9/E9, shared query-helper modules those files call
  (`apps/web/lib/queries.server.ts`, `apps/web/lib/queries.ts`) must also be traced for indirect
  `.from()`/`.rpc()` call sites.
- **[NEW — PVL supplement cycle 2, 26-07-26]** `supabase/admin-functions.sql` — grant-only addition
  (Decision 3, Step B3f), no function body changes.

---

## Public Contracts

- Existing browser-client query call signatures are unchanged — only the live grant/RLS state
  changes underneath them.
- **CORRECTED (PVL supplement cycle 1, 26-07-26): this phase DOES introduce one new view,
  `public.public_profiles`** (Step B3c-i) — a narrow-column, `security_invoker = off` view over
  `public.users`'s safe columns only (`id, username, display_name, display_username,
  display_image_url, image_url, bio, github_url, twitter_url, website_url` — **plus `name`, per Gap
  10 below**). No new tables or RPCs are introduced. `components_with_username`'s output shape
  changes: its `"user"` JSON object narrows from the full `to_jsonb(u.*)` `users` row to the safe
  `public_profiles` column set (Step B3c-ii) — downstream consumers must be checked against this
  narrower shape. The known live consumer is
  `apps/web/components/features/component-page/info-section.tsx:79-90`, which reads
  `username`/display fields **and `user.name` as part of a fallback chain** — the `name` column must
  be added to `public_profiles` (Gap 10) or this consumer silently loses one fallback rung.
  `demo_hunt_leaderboard`'s `component_user_data`/`user_data` JSON fields narrow identically (Step
  B3b resolution). **NEW (Gap 9, this cycle): `component_dependencies_graph_view_v3`'s
  `su`/`du`-derived columns (`source_author_username`, `source_author_display_username`,
  `dependency_author_username`, etc.) will ALSO narrow to the `public_profiles` column set once Step
  B3e lands — its 3 live consumers (`preview.tsx`, `command-menu.tsx`, `use-dependencies.ts`, via
  `queries.server.ts`) only destructure `dependency_author_username`/`source_author_username`
  (plain scalar columns, not a nested user object), so they are unaffected by the narrowing itself,
  but they currently receive a 42501 error (no grant exists yet) rather than any data at all.**
- **[NEW — PVL supplement cycle 2, 26-07-26, Decision 1 — REAL BEHAVIOR CHANGE]** The `users` table
  UPDATE grant narrows from table-level to column-scoped (Step B0). Any authenticated browser-client
  write to `users.is_admin`, `email`, `ref`, `paypal_email`, `stripe_id`, `role`, `is_partner`,
  `bundles_fee`, `manually_added`, `created_at`, `updated_at`, or `id` will now be REJECTED where
  previously (incorrectly) permitted. This is the intended security fix — no legitimate browser-client
  code path is known to write these columns today (they are server/admin-managed), so this is not
  expected to break any live feature, but it IS a genuine grant-surface narrowing and must be called
  out explicitly as a Public Contract change.
- **[NEW — PVL supplement cycle 2, 26-07-26, Decision 3]** `supabase/admin-functions.sql`'s two
  existing RPCs (`update_submission_as_admin`, `update_demo_info_as_admin`) gain `GRANT EXECUTE ...
  TO authenticated`. No new RPC is introduced by this phase. Both RPCs already self-check `is_admin`
  server-side, so granting EXECUTE does not widen who can successfully perform an admin write — it
  only makes the (previously likely-uncallable) RPCs callable at all for legitimate admins.
- **[NEW — PVL supplement cycle 2, 26-07-26, Decision 4]** `component_analytics`'s `anon`-role
  read/write path (`use-analytics.ts`) is explicitly OUT OF SCOPE — no grant, no RLS change, no
  Public Contract change for this relation in this phase. Recorded here so its exclusion is not
  silent.

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| Live `information_schema.role_table_grants`/`pg_policies` query, before/after diff | Agent-Probe | AC13 |
| BookmarkButton interaction on component detail page + preview dialog, persists across reload | Hybrid | AC2 |
| Cross-reference of all browser-client files' (self-deriving count) `.from()`/`.rpc()` call sites vs confirmed grant list | Hybrid (desk cross-reference automatable; final live confirmation Agent-Probe) | AC1, AC3 |
| `templates` anon write-grant revoke confirmed via live introspection | Agent-Probe | AC13 |
| `demo_hunt_leaderboard` view query succeeds without 42501 (depends on Step B3b) | Agent-Probe | AC1, AC3 |
| `prompt_rules` UPDATE/DELETE cross-user attempt denied | Hybrid | AC1 (security-adjacent) |
| `components_with_username` view queryable without 42501 (Step B3c) | Agent-Probe | AC1, AC3 |
| `components_with_username` returns non-empty, correctly-populated data for a cross-user (not just own-user) registry dependency, sourced via the new `public_profiles` view (Steps B3c-i/B3c-ii) | Agent-Probe | AC1, AC3 — **resolved by PVL supplement cycle 1 (26-07-26); provable once Steps B3c-i/B3c-ii are executed and applied** |
| `demo_hunt_leaderboard` returns non-empty, correctly-populated data for a multi-contestant leaderboard (not filtered to the caller's own rows), sourced via the same `public_profiles` substitution (Gap 7 fold-in) | Agent-Probe | AC1, AC3 (currently latent/no live caller, but fixed alongside Gap 6 at no extra cost) |
| **NEW (Gap 9): `component_dependencies_graph_view_v3` is queryable at all (currently zero grant, live 42501) AND returns non-empty, correctly-populated data for a cross-user registry dependency, sourced via the same `public_profiles` substitution (Step B3e)** | Agent-Probe | AC1, AC3 — **resolved by PVL supplement cycle 3, 26-07-26 (added the `component_dependencies_closure` companion grant); provable once Step B3e executes** |
| **NEW (PVL supplement cycle 2, Decision 1): authenticated non-admin session attempts `UPDATE users SET is_admin = true` on own row and is REJECTED after Step B0's column-scoped grant lands (Step D5)** | Hybrid | Security fix, not tied to a single AC number — closes the ORCHESTRATOR SECURITY FINDING privilege-escalation gap |
| **NEW (PVL supplement cycle 2, Decision 3): both `update_submission_as_admin` and `update_demo_info_as_admin` RPCs are callable by an admin session post-Step-B3f grant, and still reject a non-admin session (Step D6)** | Hybrid | AC1 (security-adjacent) |
| **NEW (PVL supplement cycle 2, Decision 3, narrowed claim): `useSubmissions.ts`'s direct `demo_hunt_scores`/`components.is_public` admin writes remain unfixed by this phase — explicitly excluded from this Exit Gate, tracked as a named follow-up** | N/A — out-of-scope exclusion (not a proving strategy; see backlog note) | Not claimed by this phase — documented exclusion only, gate stays narrowed not PASS-claiming |

```bash
# Post-fix live verification (run after Step C4 approval + apply)
# information_schema.role_table_grants query against production — Agent-Probe, requires live connection
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md`
- Last completed step: PLAN-SUPPLEMENT (PVL supplement cycle 5, text-only, 26-07-26). vc-plan-agent
  resolved Gaps 17/18 from the inner-PVL cycle 5 CONDITIONAL verdict: added the anon-role
  `component_analytics` exclusion sentence to the Exit Gate narrowed-claim block (Gap 17), and
  updated the Exit Gate's Gap 6/7 bullet plus the Verification Evidence table's Gap 9 row from
  stale "pending SUPPLEMENT resolution" wording to resolved wording (Gap 18). Both edits are
  documentation-only — grep-verified applied, zero SQL/checklist/Blast Radius change.
- Validate-contract status: **26-07-26 inner-pvl CONDITIONAL cycle 5 — Gaps 17/18 resolved by
  text-only supplement; CONDITIONAL accepted by orchestrator under standing /goal; no further PVL
  re-run required.**
- Next step: **EXECUTE (vc-execute-agent)**. The Step C3 live-DDL hard stop remains a mandatory
  user-approval pause before any grant/RLS SQL — including all 3 view redefinitions, the
  `public_profiles` CREATE VIEW, the column-scoped `users` UPDATE grant, the 2 new `GRANT EXECUTE`
  statements, and the `component_dependencies_closure` grant/policy — is applied to the live
  production database; it is not satisfied by any PVL pass, past or future.

---

## Test Infra Improvement Notes

- **Candidate backlog note (found during this VALIDATE pass, not blocking):** `apps/web/lib/clerk.ts:70-71`
  has a null-safety bug in `useClerkSupabaseClient`'s session-cache guard —
  `_clientCache?.sessionId === session.id` evaluates `true` when both sides are `undefined` (e.g. a
  mocked/loading Clerk session with no `id` yet), then dereferences `_clientCache.client` on a
  still-`null` cache, throwing `TypeError: Cannot read properties of null (reading 'client')`. This
  is the root cause of exactly **1** of the 5 currently-failing vitest tests
  (`header-smoke.test.tsx` — stack trace `TypeError: Cannot read properties of null (reading
  'client') ❯ useClerkSupabaseClient lib/clerk.ts:71:27`). **INNER-LOOP RESEARCH correction
  (26-07-26): the prior claim of "3 of the 5" was wrong — `font-cozy-sweep.test.tsx` actually fails
  on `useUser can only be used within the <ClerkProvider />` (via `useIsAdmin`), and
  `landing-smoke.test.tsx` fails on `No "SignUpButton" export is defined on the "@clerk/nextjs"
  mock` — neither is caused by this null-guard bug.** It sits inside the exact file this phase's
  audit is centered on (`apps/web/lib/clerk.ts`), but the bug itself is a client-side caching defect
  unrelated to server-side grants/RLS — out of this phase's Blast Radius (read-only per that
  section) unless the umbrella wants to fold in a 1-line null-guard fix
  (`if (_clientCache && _clientCache.sessionId === session.id)`). Recommend a standalone backlog
  note rather than silently expanding Phase 1's scope. **PVL cycle 2: re-confirmed the exact code at
  `clerk.ts:64-77` — claim stands unchanged (now corrected to 1-of-5 by inner-loop research).**
  **INNER-PVL cycle 3 (26-07-26): re-confirmed unchanged again; not re-derived from first
  principles this cycle since it was already independently re-verified last cycle and this cycle's
  effort was focused on the Gap 6 discovery.** **INNER-PVL cycle 4 (26-07-26): re-confirmed
  unchanged again (grant/RLS/view scope of this cycle's effort was Gap 9, not this file).**
- **Documentation drift confirmed (informational):** `process/context/tests/all-tests.md` currently
  states "48 tests / 15 files, all passing" as the live baseline. The actual on-disk state confirmed
  during this VALIDATE pass (25-07-26) is **62 tests / 17 files, 57 passing / 5 failing**. This is a
  pre-existing doc-drift issue (not introduced by this program) — flagged for whichever phase/pass
  next touches `all-tests.md` (Phase 6 is the natural owner, since it already corrects
  `all-context.md` stale claims under AC14, though `all-tests.md` is a separate file from
  `all-context.md` and isn't explicitly in Phase 6's scope — may need its own backlog note if Phase 6
  doesn't pick it up).

---

## Inner Loop Refresh Note

**Date: 2026-07-26** (newer than the existing Validate Contract's `date: 2026-07-25` — this note is
the mechanical trigger for the Step 4b `generated-by: outer-pvl` re-validation rule: PVL MUST re-run
from V1 before EXECUTE.)

Inner-loop RESEARCH and INNOVATE ran on 2026-07-26, after the outer-PVL validate-contract below was
written (25-07-26, cycle 2, PASS). Drift found and forks resolved:

- **Drift found (RESEARCH):**
  - `components_with_username` is a `security_invoker=on` view (`supabase/enable-rls.sql:8-11,41`)
    with no grant anywhere for the view itself (grep-confirmed against
    `supabase/restore-authenticated-grants.sql`, which grants only the base `components` table at
    line 53), and it has a live browser-client consumer at
    `apps/web/components/features/component-page/info-section.tsx:79-80` — a gap the prior contract
    did not cover.
  - `useClerkSupabaseClient` is defined at `apps/web/lib/clerk.ts:66` (plan previously said `:63`).
  - Live browser-client file count is 51, not 41 (per Fork 4, the fix is to make this self-deriving,
    not to hardcode either number).
  - `tsc --noEmit` currently exits 2 with exactly 4 errors, all in
    `add-registry-modal.tsx:168,389` (escaped-backtick syntax error in uncommitted dirty WIP, outside
    this phase's Blast Radius).
  - `vitest` currently shows 57/62 passing, 5 failing; only 1 of the 5 (`header-smoke.test.tsx`) is
    actually caused by the `clerk.ts:70-71` null-guard bug (the plan's prior "3 of 5" claim was
    wrong — `font-cozy-sweep.test.tsx` and `landing-smoke.test.tsx` fail for unrelated Clerk-mock
    reasons).
  - `author_payouts`/`payout_rates` have zero browser-client call sites (no grant needed);
    `bundles`/`bundle_plans`/`bundle_purchases` are server-side-only (out of scope) — this answers
    Step A4's previously open question.

- **Forks resolved (INNOVATE):**
  - Fork 1 — FOLD IN: `components_with_username` gets its grant in this phase (new Step B3c).
    **[Re-opened by INNER-PVL cycle 3 — see Gap 6 in the Validate Contract; the FOLD IN decision
    stands, but the specific "grant only, no RLS" implementation does not.]**
  - Fork 2 — REJECT fixing `add-registry-modal.tsx`: out of Blast Radius and would touch uncommitted
    WIP; the Exit Gate's tsc criterion instead becomes a no-NEW-errors-vs-confirmed-foreign-baseline
    standard.
  - Fork 3 — REJECT fixing `clerk.ts`: Blast Radius declares it read-only; backlog note only, with
    the corrected 1-of-5 attribution.
  - Fork 4 — self-deriving browser-client file count via
    `grep -rl "useClerkSupabaseClient" apps/web/{app,components,lib,hooks}`, never a hardcoded
    number.
  - Blast Radius does NOT gain `clerk.ts` or `add-registry-modal.tsx` as writable entries — both
    stay read-only/out-of-scope.

**Mechanical trigger:** this note's date (2026-07-26) is strictly newer than the Validate Contract's
`date: 2026-07-25` below. Per the orchestrator's Step 4b `generated-by` check
(`generated-by: outer-pvl` + newer Inner Loop Refresh Note found ⇒ inner R+I has run ⇒ re-run PVL
from V1), the existing contract is superseded-pending and PVL must re-run before EXECUTE. **This
re-run (cycle 3, inner-pvl) is documented in the Validate Contract below and found Gap 6/7/8 —
Gate: BLOCKED.**

**Date: 2026-07-26 (PVL supplement cycle 1, second entry this date).** vc-plan-agent ran a
PLAN-SUPPLEMENT cycle in response to the above cycle-3 `Gate: BLOCKED` verdict and its SUPPLEMENT
REQUEST (Gaps 6/7/8). Per the orchestrator's locked decision (take the view-redefinition fix; do
not descope cross-user correctness), the plan now: extends Blast Radius by one file
(`supabase/views.sql`); adds Steps B3c-i/B3c-ii (new `public.public_profiles` view + view
redefinitions for `components_with_username` and `demo_hunt_leaderboard`); makes Step C2
mandatory; corrects the stale 14-relation baseline to 13; sweeps stale "41 files" prose; and
corrects Public Contracts/Verification Evidence accordingly. This note's date is the mechanical
trigger for the next `generated-by: inner-pvl: phase-1` re-run: PVL MUST re-run from V1 again
before EXECUTE — this supplement is not itself a validate pass.

**Date: 2026-07-26 (inner-PVL cycle 2, third entry this date).** vc-validate-agent re-ran PVL from
V1 against the PVL-supplement-cycle-1 plan text above. Re-derived Gaps 6/7/8 from source (not from
trusting the prior contract) and confirmed the supplement's fix is internally consistent and holds.
Extended the same architectural reasoning (which views share `security_invoker=on` +
INNER-JOIN-to-`public.users`) one step further and found a THIRD such view,
`component_dependencies_graph_view_v3` — confirmed via `enable-rls.sql`'s own header comment (which
names exactly 3 SECURITY DEFINER views, not 2), reachable from 3 real browser-client files through a
shared query-helper indirection (`queries.server.ts`), and currently ZERO-granted (live 42501 today).
This is Gap 9, newly discovered this cycle, BLOCKING. Also found Gap 10 (CONCERN): the
`public_profiles` column list omits `name`, needed by `components_with_username`'s live consumer's
fallback chain. See the Validate Contract below for the full analysis — `Gate: BLOCKED` again.
Next step: PLAN-SUPPLEMENT cycle 2, then PVL re-run from V1 once more before EXECUTE.

**Date: 2026-07-26 (PVL supplement cycle 2, fourth entry this date).** vc-plan-agent resolved Gaps
9/10 per the SUPPLEMENT REQUEST: new Step B3e applies the `public_profiles` substitution to
`component_dependencies_graph_view_v3`'s `su`/`du` joins plus its first-ever `GRANT SELECT`; `name`
added to the `public_profiles` column list in Step B3c-i. Additionally applied 5 orchestrator-locked
decisions from an independent exhaustive indirect-relation audit and a direct read of
`restore-authenticated-grants.sql:149`:

- **Decision 1 (SECURITY FIX):** new Step B0 replaces the table-level
  `GRANT SELECT, UPDATE ON public.users TO authenticated` with a column-scoped UPDATE grant that
  excludes `is_admin` and every other privileged/billing column — closes a live
  privilege-escalation bug (any authenticated user could currently set their own `is_admin = true`,
  since RLS restricts which ROW is updatable but not which COLUMNS).
- **Decision 2 (REJECTED):** no RLS policy will read `is_admin` for an admin-override branch — admin
  writes stay on the existing `SECURITY DEFINER` RPC pattern (`supabase/admin-functions.sql`), which
  does not derive authority from a column any user could (until Decision 1 lands) set on themselves.
- **Decision 3:** new Step B3f adds the missing `GRANT EXECUTE` for both existing admin RPCs
  (`update_submission_as_admin`, dormant; `update_demo_info_as_admin`, live-used). Two
  `useSubmissions.ts` admin write flows (`demo_hunt_scores`, `components.is_public`) have no covering
  RPC and are NOT fixed by this phase — a new RPC pair is deferred to a named follow-up, and this
  phase's Exit Gate is explicitly narrowed to not claim those flows work.
- **Decision 4:** new Step B9 classifies `use-analytics.ts`'s raw `anon`-key `component_analytics`
  path as explicitly out-of-scope (unenforceable RLS boundary for unauthenticated client-supplied
  identifiers; currently fails silently, not a live user-visible break) — recorded with a backlog
  note rather than left unmentioned.
- **Decision 5:** folded into the Gap 10 fix above (`name` added to `public_profiles`).

Blast Radius, Touchpoints, Public Contracts, Verification Evidence, the Implementation Checklist
(new Steps B0, B3f, B9, D5, D6), and the Exit Gate (narrowed admin-write claim) were all updated.
This note's date is the mechanical trigger for the next `generated-by: inner-pvl: phase-1` re-run:
PVL MUST re-run from V1 again before EXECUTE — this supplement is not itself a validate pass, and it
does not modify the existing `Gate: BLOCKED` contract body below (left as the historical record of
what cycle 2 found).

**Date: 2026-07-26 (PVL supplement cycle 3, fifth entry this date).** vc-plan-agent resolved Gaps
12/13/14 per the SUPPLEMENT REQUEST: Step B3e's SQL batch gains the missing
`GRANT SELECT ON public.component_dependencies_closure TO authenticated;` plus a named
`component_dependencies_closure_select_all` permissive read policy (Gap 12, mirroring the Step B3b
base-table-companion-grant pattern); Step B0's granted column list gains `role` and drops it from the
"EXCLUDING" prose, with a distinguishing note vs `is_admin` (Gap 13, confirmed live write at
`feedback-dialog.tsx:156-161`); Step A2's own checklist text is rewritten with the numbered
recursive-local-import-tracing + browser/anon-vs-service-role-client-classification methodology,
replacing the prior prose-only version that was never actually executable (Gap 14). All three edits
were grep-verified against the plan text after applying. Step C3's hard-stop wording ("any grant/RLS
statement") already covers the two Gap-12 statements without further change — confirmed, not
re-edited. This note's date is the mechanical trigger for the next
`generated-by: inner-pvl: phase-1` re-run: PVL MUST re-run from V1 again before EXECUTE — this
supplement is not itself a validate pass.

**Date: 2026-07-26 (PVL supplement cycle 4, sixth entry this date).** vc-plan-agent resolved Gaps
15/16 per the SUPPLEMENT REQUEST from the cycle-4 inner-PVL CONDITIONAL verdict: Step B0's granted
`users` UPDATE column list gains `pro_banner_url` (Gap 15 — the granted+excluded lists now sum to
all 24 scalar columns; no live call site exists today so this is an accounting fix, not a behavior
change), and Step B3f's item 1 rationale is corrected from "likely uncallable absent an explicit
grant" to "defensive/explicit, since Postgres grants EXECUTE to PUBLIC by default" (Gap 16 —
informational only; the `GRANT EXECUTE` statements themselves are unchanged). Both edits were
grep-verified against the plan text after applying. This note's date is the mechanical trigger for
the next `generated-by: inner-pvl: phase-1` re-run: PVL MUST re-run from V1 once more before
EXECUTE — this supplement is not itself a validate pass, and it does not modify the existing
`Gate: CONDITIONAL` contract body below (left as the historical record of what cycle 4 found).

**Date: 2026-07-26 (PVL supplement cycle 5, text-only, seventh entry this date).** vc-plan-agent resolved Gaps 17/18 from the cycle-5 inner-PVL CONDITIONAL verdict: (1) Gap 17 — the Exit Gate narrowed-claim block gains a sentence naming the anon-role `component_analytics` exclusion, matching the style of the two existing `useSubmissions.ts` exclusions and staying consistent with Blast Radius Decision 4 / Step B9 / Public Contracts, which already documented this exclusion; (2) Gap 18 — the Exit Gate's Gap 6/7 bullet and the Verification Evidence table's Gap 9 row are updated from stale "pending SUPPLEMENT resolution" wording to resolved wording, mirroring the adjacent Gap 6 row's correct phrasing. Both edits are pure documentation fixes — zero SQL, checklist, or Blast Radius change. This closes the PVL loop: CONDITIONAL is accepted (0 FAILs, 2 CONCERNs, both zero-functional-impact text fixes, 5 supplement cycles already run) — no further PVL re-run is required before EXECUTE. The Step C3 live-DDL hard stop remains a mandatory user-approval pause regardless.

---
## Validate Contract

Status: CONDITIONAL
Date: 26-07-26
date: 2026-07-26
generated-by: inner-pvl: phase-1
supersedes: 2026-07-26 (inner-pvl, CONDITIONAL cycle 4) — cycle 4's 2 CONCERNs (Gap 15
`pro_banner_url` missing from Step B0's granted+excluded `users` column lists; Gap 16 Step B3f's
"likely uncallable" rationale unverified against Postgres default-privilege semantics) were both
resolved by PVL supplement cycle 4 (`pro_banner_url` added to the granted list; Step B3f's rationale
corrected to defensive/explicit). This re-validate re-derived both resolutions from source (not from
the changelog) and confirmed them, then continued the program's established discipline of extending
the audit into areas no prior cycle had fully covered rather than rubber-stamping a clean-looking
result. It found 2 NEW documentation-completeness CONCERNs (Gap 17, Gap 18 — see below), both with
zero functional or security impact. Net verdict: 0 FAILs (unchanged from cycle 4 — this is now the
second consecutive cycle with none), 2 CONCERNs (both new, both cosmetic) → CONDITIONAL.

Parallel strategy: sequential (single agent). Rationale: signal score 5/7 (S2 schema/auth surface —
grants/RLS; S4 phase-program classification; S5 caller explicitly requested non-rubber-stamp,
verify-from-source scrutiny; S6 high-risk class — auth/permission RLS + privilege-escalation fix; S7
audit surface spans 51+ browser-client files) scores HIGH on the threshold table. Per
`vc-agent-strategy-compare`, a 4+ score recommends workflow or agent-team fan-out for independent
dimension work — but this cycle's actual task (re-derive prior gap resolutions from source, then
extend the same "trace the mechanism all the way through" reading into new territory) is a single
continuous reading chain (schema -> grants file -> live call site, for the column reconciliation;
Exit Gate text -> Blast Radius text -> Verification Evidence text, for the completeness check), not
independent parallel dimensions. Every prior cycle in this program (0-4) reached the identical
conclusion for the identical reason and is not repeated here. Recommend the next re-validate pass (if
triggered) also run single-agent, unless the next round of findings splits into genuinely independent
areas.

### What this cycle checked (auditable — so the CONDITIONAL is not assumed)

- **24-column partition, re-derived from source, not trusted from the changelog:** read
  `apps/web/prisma/schema.prisma:616-640` directly and enumerated all 24 scalar columns on `users`
  (`id, created_at, updated_at, image_url, username, name, email, manually_added, is_admin,
  twitter_url, bio, github_url, pro_referral_url, website_url, pro_banner_url, display_name,
  display_username, display_image_url, ref, paypal_email, role, is_partner, bundles_fee, stripe_id`).
  Cross-checked every one of the 24 against Step B0's granted list (13: `username, name, bio,
  twitter_url, github_url, pro_referral_url, website_url, display_name, display_username,
  display_image_url, image_url, pro_banner_url, role`) and excluded list (11: `id, created_at,
  updated_at, manually_added, is_admin, email, ref, paypal_email, is_partner, bundles_fee,
  stripe_id`). Result: 13 + 11 = 24, every column appears in exactly one list, zero overlap, zero
  omission. The partition is now mathematically complete (Gap 15 fully resolved).
- **No privileged column in the granted list:** confirmed `is_admin`, `email`, `ref`, `paypal_email`,
  `is_partner`, `bundles_fee`, `stripe_id` are all in the EXCLUDING list, none in the granted list.
  The privilege-escalation hole this phase exists to close (Step B0) stays closed.
- **Live source re-confirmation of all 3 writable SQL files:** read `supabase/restore-authenticated-
  grants.sql` (313 lines), `supabase/views.sql` (126 lines), and `supabase/admin-functions.sql` (95
  lines) in full this cycle. Confirmed: the `users` grant at line 149 and its two policies at
  151-154/156-160 match the plan's citations; the commented-out `public_profiles` block at 295-299
  matches Step B3c-i's prescribed text verbatim; zero `templates` grant/policy statements exist
  anywhere in the file (matches the plan's claim that `templates`'s REVOKE will be its first tracked
  grant-state entry); `component_hunt_rounds_select_all` exists at 263-264 as the cited RLS-policy
  precedent; both admin functions (`update_submission_as_admin`, `update_demo_info_as_admin`) check
  `is_admin` via `public.requesting_user_id()` before any write, with no bypass path; `views.sql`'s
  three views (`components_with_username`, `component_dependencies_graph_view_v3`,
  `demo_hunt_leaderboard`) each JOIN `public.users` exactly as the plan's Gap 6/7/9 analysis
  describes; `component_dependencies_closure` has zero GRANT anywhere in any tracked `supabase/*.sql`
  file (confirmed via a repo-wide grep across all 8 tracked SQL files), matching Gap 12's claim.
- **Zero `GRANT EXECUTE` anywhere in tracked SQL, re-confirmed by grep across all 4 files that could
  contain one** (`rpc-functions.sql`, `admin-functions.sql`, `search-functions.sql`, `restore-
  authenticated-grants.sql`) — Gap 16's evidentiary basis re-confirmed unchanged.
- **`role` live-write call site re-confirmed:** read `feedback-dialog.tsx` lines 95-165 directly;
  confirmed `supabase.from("users").update({ role: ... }).eq("id", user.id)` at line ~157, scoped to
  the caller's own row via `useClerkSupabaseClient()`. Gap 13's fix (role in the granted list) remains
  necessary and correctly applied.
- **`pro_banner_url` live call-site re-confirmed:** repo-wide grep found only 2 references outside
  generated Prisma output — `pro-list.tsx:28` (read) and `header.client.tsx:71` (a type declaration,
  not a write) — zero write call sites anywhere in `apps/web`. Gap 15's "no live regression" claim
  re-confirmed.
- **Regression gates re-run live this cycle (not trusted from the changelog):**
  `corepack pnpm --filter web exec tsc --noEmit` → exit 2, exactly 4 errors, all in
  `add-registry-modal.tsx:168,389` (identical to every prior cycle). `corepack pnpm --filter web test`
  → 57 passing / 5 failing / 62 total, same 4 files (`font-cozy-sweep.test.tsx`,
  `landing-smoke.test.tsx`, `header-smoke.test.tsx`, `app/api/magic/__tests__/route.test.ts` ×2).
  Both baselines match the plan's documented figures exactly.
- **Blast Radius writable-entry sanity check:** confirmed exactly 3 files are declared writable —
  `supabase/restore-authenticated-grants.sql`, `supabase/views.sql`, `supabase/admin-functions.sql`
  (the conditional 4th, a new migration file, is explicitly hedged as "if Phase 6's baseline approach
  is already in flight," not a hard commitment). No `apps/web` source file, `clerk.ts`, or
  `add-registry-modal.tsx` is listed as writable — all three are explicitly read-only or out-of-scope.
- **NEW this cycle — Gap 17 (CONCERN):** the Exit Gate section's "NARROWED CLAIM" comment block
  explicitly names the two `useSubmissions.ts` admin-write flows (`demo_hunt_scores` INSERT/UPDATE,
  `components.is_public` UPDATE) as excluded from this phase's claim of success, but does NOT name the
  `component_analytics` anon-role exclusion (Blast Radius Decision 4 / Step B9) anywhere in the Exit
  Gate section itself (grep-confirmed: zero occurrences of "component_analytics" within the Exit Gate
  section's line range). The exclusion IS documented elsewhere in the plan (Blast Radius, Public
  Contracts, Step B9's checklist item) — this is a completeness gap in ONE section restating a
  decision already made correctly elsewhere, not a missing decision. Zero functional impact; the
  exclusion is real and correctly reasoned regardless of where it is stated.
- **NEW this cycle — Gap 18 (CONCERN):** two annotations in the plan body are stale relative to
  supplement cycles that already ran. (a) The Exit Gate's bulleted acceptance criteria list still
  reads "`components_with_username` (and, if in scope, `demo_hunt_leaderboard`) returns CORRECT,
  non-empty cross-user data ... (Gap 6/7 — pending SUPPLEMENT resolution)" — but Gap 6/7 was resolved
  at PVL supplement cycle 1 (26-07-26) and re-confirmed clean at every cycle since. (b) The
  "## Verification Evidence" table's Gap 9 row still reads "pending SUPPLEMENT resolution this cycle;
  not yet provable" — but Gap 9 was resolved at supplement cycle 2 and further completed by Gap 12's
  fix at supplement cycle 3. Both annotations were never updated to match the resolutions, unlike the
  adjacent Gap 6 row in the same Verification Evidence table, which correctly reads "resolved by PVL
  supplement cycle 1 (26-07-26); provable once Steps B3c-i/B3c-ii are executed and applied." This is a
  documentation-consistency defect (an annotation not propagated when its underlying fix landed), not
  a functional or security defect — the fixes themselves are confirmed correctly present in the
  executable checklist/SQL text (see the source re-confirmation above).
- **Execute-agent readiness read-through:** read the plan as an execute-agent would. Step C3's hard
  stop wording ("any grant/RLS statement") is generic enough to cover every fix added across all 5
  cycles without further wording changes. Step B4/B5/B6 correctly leave a bounded judgment call to
  execute-agent (per the INNOVATE-locked Fork A3 "per-table not blanket" design) rather than leaving
  an open-ended ambiguity — this is intentional design, not a plan gap. No open "TBD" or unresolved
  placeholder was found anywhere in the Implementation Checklist, Blast Radius, or Exit Gate sections
  this cycle (a targeted grep for "TBD" and "pending" found only the two Gap 18 occurrences addressed
  above).

### Test gates (C3 5-column table)

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC1/AC3 | browser-client grant-coverage desk cross-reference (self-deriving count) | Fully-Automated | `grep -rl "useClerkSupabaseClient" apps/web/{app,components,lib,hooks}` file count cross-referenced against Step A3's gap list, PLUS a follow-through grep into shared query helpers (`queries.server.ts`, `queries.ts`) called by those files, distinguishing browser-authenticated vs service-role callers (script to be authored by execute-agent; Step A2 checklist text contains this instruction — Gap 14 resolved, re-confirmed cycle 5) | A |
| AC1/AC3 | Live confirmation: zero remaining ungranted relations | Agent-Probe | Live `information_schema.role_table_grants` query post-fix, diffed against Step B/B3b/B3c/B3e decision list, including the `component_dependencies_closure` grant (Gap 12) | A — SQL fully specified; provable once executed |
| AC2 | BookmarkButton persists across reload (detail page + preview dialog) | Hybrid | Manual or Playwright-driven bookmark toggle + reload check on both surfaces, real/seeded Clerk session | B |
| AC13 | Grant/RLS diff before/after | Agent-Probe | `information_schema.role_table_grants` + `pg_policies` query, pre/post fix, recorded in phase report | A |
| AC13 | `templates` anon write-grant revoke confirmed | Agent-Probe | Live introspection confirms `anon` has no INSERT/UPDATE/DELETE on `public.templates` | A |
| AC1/AC3 (Gap 1) | `demo_hunt_leaderboard` view queryable without 42501 | Agent-Probe | Live query against the view as an authenticated test session, AFTER Step B3b's SQL is applied (Step C3 hard-stop gated) | B |
| AC1 security-adjacent (Gap 3) | `prompt_rules` UPDATE/DELETE denied cross-user | Hybrid | Two-Clerk-session test: session B attempts to update/delete session A's `prompt_rules` row, expect 0 rows affected / RLS denial | B |
| AC1/AC3 (Gap 6, RESOLVED) | `components_with_username` returns correct, non-empty data for a registry dependency authored by a DIFFERENT user | Agent-Probe | Live query as authenticated session A against a public component authored by session B; assert non-empty result with populated `username`/`user` fields | B — fix fully specified; provable once executed |
| AC1/AC3 (Gap 9, RESOLVED) | `component_dependencies_graph_view_v3` view-level grant + `su`/`du` substitution | Agent-Probe | Live query as authenticated session A resolving a registry dependency authored by session B; assert non-empty result | B — fix specified, includes the Gap 12 closure-table grant |
| AC1/AC3 (Gap 12, RESOLVED) | `public.component_dependencies_closure` (base FROM table of the view above) is queryable by `authenticated` at all | Agent-Probe | Live query resolving a registry dependency; assert no 42501 originating from the closure table specifically | B — grant+policy SQL confirmed present in Step B3e's checklist text this cycle |
| Security (Gap 13, RESOLVED) | Feedback dialog's own-row `users.role` write continues to succeed after Step B0's column-scoped grant lands | Hybrid | Authenticated session submits the feedback dialog with a changed `role` value; assert the update succeeds (not a 42501/column-not-found rejection) | B — `role` confirmed present in Step B0's granted column list this cycle |
| Security (Step B0, unchanged) | Non-admin authenticated session cannot set `is_admin = true` on own row | Hybrid | `UPDATE users SET is_admin = true WHERE id = auth.jwt()->>'sub'` attempt, assert rejection (Step D5) | B |
| Security (Step B3f, unchanged) | Both admin RPCs callable by admin, rejected for non-admin | Hybrid | Step D6 — both `update_submission_as_admin`/`update_demo_info_as_admin` calls, admin succeeds / non-admin rejected | B |
| Breaking changes (Gap 15, RESOLVED this cycle) | `users.pro_banner_url` is now accounted for in Step B0's granted list (13 granted + 11 excluded = all 24 scalar columns) | Fully-Automated (accounting check) | Manual column-by-column reconciliation of the granted+excluded lists against `apps/web/prisma/schema.prisma:616-640` — re-run this cycle, confirmed exact | A — partition confirmed complete this cycle |
| Documentation completeness (Gap 17, NEW — CONCERN) | Exit Gate section does not restate the `component_analytics` anon-role exclusion alongside the two `useSubmissions.ts` exclusions it does name | N/A — plan-completeness gap, not a proving strategy | Grep of the Exit Gate section's line range for "component_analytics": 0 matches; the exclusion exists correctly in Blast Radius/Public Contracts/Step B9 | C — one-line addition to the Exit Gate's narrowed-claim comment block would close this |
| Documentation completeness (Gap 18, NEW — CONCERN) | Exit Gate bullet and Verification Evidence Gap 9 row both still say "pending SUPPLEMENT resolution," stale since supplement cycles 1-3 resolved the underlying gaps | N/A — plan-completeness gap, not a proving strategy | Both annotations checked against the supplement-cycle changelog and the adjacent (correctly-updated) Gap 6 row in the same table | C — update both annotations to match the already-resolved state, mirroring the adjacent Gap 6 row's wording |
| Regression | No new `tsc --noEmit` errors beyond the confirmed foreign baseline | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` — RE-CONFIRMED LIVE this cycle (26-07-26): exit 2, exactly 4 errors, all in `add-registry-modal.tsx:168,389` | A |
| Regression | No NEW `vitest` failures vs documented baseline | Fully-Automated | `corepack pnpm --filter web test` — RE-CONFIRMED LIVE this cycle (26-07-26): 57/62 passing, 5 pre-existing failures across 4 files, exact match to the plan's documented baseline | A |

gap-resolution legend: A — proven now (re-confirmed live this cycle, or SQL/checklist text fully
specified and grep-confirmed present) · B — fixed in this plan (execute-agent authors the script/SQL
as part of the checklist, plan text is complete) · C — the annotation/section as currently written
does NOT resolve the gap; a plan-text change is required before this becomes an A · D — backlog stub
(n/a this cycle).

C-4 reconciliation: no `Known-Gap` row is used as a `strategy:` value above — Gaps 17/18's `C` rows
are documentation-completeness problems (a decision already made correctly elsewhere, or an
annotation not updated), not Known-Gap coverage claims for developed behavior.

Failing stub (for the Fully-Automated file-audit row):
```
test("should confirm every file calling useClerkSupabaseClient (directly or via a shared query helper it calls, distinguishing browser-authenticated from service-role callers) has its target relations present in the confirmed grant list", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: browser-client grant-coverage desk cross-reference, including indirect relations reached through shared helpers like queries.server.ts, and the client-type distinction needed to exclude service-role-only call sites")
})
```

### Dimension findings

- Infra fit: PASS — no infra/container/deploy surface touched; re-confirmed Gap 2
  (`component_analytics` vs `mv_component_analytics`) still correctly scoped, unchanged this cycle.
- Test coverage: **CONCERN** (NEW this cycle, Gap 18) — the regression gates themselves
  (tsc/vitest) are re-confirmed live and exact-matching the documented baseline (this part is PASS-
  grade), but two of the plan's own Verification-Evidence-adjacent annotations (the Exit Gate's Gap
  6/7 bullet and the Verification Evidence table's Gap 9 row) misstate already-resolved gaps as
  "pending," which could mislead an execute-agent or reviewer skimming only those two sections into
  re-litigating settled decisions or under-trusting genuinely complete coverage. This is scored under
  Test coverage because both stale annotations live inside the plan's coverage-reporting apparatus
  (Exit Gate acceptance criteria + Verification Evidence table), not the underlying grant/RLS fixes,
  which are independently re-confirmed correct this cycle (see source re-confirmation above).
- Breaking changes: PASS — Gap 15 (the only open Breaking-changes finding from cycle 4) is now fully
  resolved: the 24-column partition is mathematically complete and no privileged column leaked into
  the granted list. No new breaking-change-class finding this cycle.
- Security surface: PASS — Gap 13's `role` write path, Step B0's is_admin exclusion, and Gap 12's
  `component_dependencies_closure` grant/policy all re-confirmed sound from direct source reads this
  cycle (not from the changelog). Both admin `SECURITY DEFINER` RPCs re-confirmed to check `is_admin`
  before any write, no bypass path. Gap 16 remains informational only (no privilege change either way).
- Section — Implementation Checklist (Steps A-D): PASS — no new checklist defect found this cycle;
  Step B0's granted+excluded lists are now a complete, correct partition (Gap 15 closed); Steps B3b/
  B3c/B3c-i/B3c-ii/B3e/B3f all re-confirmed grep-present and correctly shaped in the executable
  checklist text (not merely prose) against a fresh read of the live SQL files this cycle.
- Section — Exit Gate / Verification Evidence (NEW dimension this cycle): **CONCERN** — Gap 17 (Exit
  Gate omits the `component_analytics` anon-role exclusion that Step B9/Blast Radius already
  correctly documents) and Gap 18 (two stale "pending SUPPLEMENT resolution" annotations for
  already-resolved Gap 6/7/9) are both real, findable, low-severity completeness gaps in these two
  reporting sections specifically. Neither affects the correctness of the underlying grant/RLS fixes,
  which are independently confirmed sound above.

### Net Gate Derivation

| Layer 1 dimensions | Status |
|---|---|
| Infra fit | PASS |
| Test coverage | CONCERN |
| Breaking changes | PASS |
| Security surface | PASS |

| Layer 2 sections | Status |
|---|---|
| Implementation Checklist (Steps A-D) | PASS |
| Exit Gate / Verification Evidence (documentation accuracy) | CONCERN |

**Totals: 0 FAILs / 2 CONCERNs / 4 PASSes**

**→ Net Gate: CONDITIONAL**

Decision rationale: this cycle re-derived Gap 15/16's cycle-4 resolutions from source (not from the
changelog) via a live re-read of the schema, all 3 writable SQL files, and the two relevant live-call-
site files (`feedback-dialog.tsx`, `pro-list.tsx`/`header.client.tsx`), and confirmed both fully
resolved with zero regression. It then extended the same "trace it all the way through, don't
rubber-stamp" discipline that found every prior gap in this program to two places no prior cycle had
checked: whether the Exit Gate's own stated exclusions are complete (Gap 17), and whether the plan's
gap-status annotations are current relative to the supplement cycles that resolved them (Gap 18).
Both findings are pure documentation-completeness issues with zero functional or security impact —
the underlying fixes they reference are independently confirmed correct in the executable
checklist/SQL text. Per orchestration.md's V3 Net Gate Rule, zero FAILs plus CONCERNs the user/
orchestrator can accept yields CONDITIONAL, not BLOCKED. This is now the second consecutive cycle
with zero FAILs and zero re-opened prior gaps — a second independent signal (after cycle 4) that this
program has converged on the plan's substantive grant/RLS architecture; the remaining residue across
both cycles has been exclusively bookkeeping/annotation-accuracy issues, not new architectural or
security defects.

### Findings

| Finding | Severity | Proposed fix |
|---|---|---|
| Exit Gate section names the two `useSubmissions.ts` admin-write exclusions but not the `component_analytics` anon-role exclusion, even though the latter is a real, already-documented (Blast Radius Decision 4 / Step B9) exclusion | CONCERN | Add one line to the Exit Gate's "NARROWED CLAIM" comment block naming the `component_analytics` anon-role exclusion, mirroring the existing two-flow wording |
| Exit Gate bullet ("Gap 6/7 — pending SUPPLEMENT resolution") and Verification Evidence table's Gap 9 row ("pending SUPPLEMENT resolution this cycle; not yet provable") are both stale — the referenced gaps were resolved at supplement cycles 1-3 and re-confirmed clean since | CONCERN | Update both annotations to "RESOLVED" wording, mirroring the adjacent (already-correct) Gap 6 row's phrasing in the same Verification Evidence table |
| Gaps 15/16 (prior cycle) — `pro_banner_url` added to Step B0's granted column list; Step B3f's rationale corrected to defensive/explicit | RESOLVED (re-confirmed from source this cycle: 24-column partition verified exact, zero write call site to `pro_banner_url` confirmed) | No further action |
| Gaps 1/3/6/7/9/12/13/14 (earlier cycles) — full Gap history: `demo_hunt_scores`/`demo_hunt_votes` grants, `prompt_rules` ownership policies, `public_profiles` view + 3 view redefinitions, `component_dependencies_closure` grant/policy, `role` column addition, Step A2 methodology rewrite | RESOLVED (unchanged this cycle, re-confirmed via direct source reads of all 3 writable SQL files) | No further action |
| Both admin `SECURITY DEFINER` RPCs (`update_submission_as_admin`, `update_demo_info_as_admin`) | CONFIRMED SAFE (re-read this cycle) — both check `is_admin` via the non-spoofable `requesting_user_id()` before any write; no bypass path | No further action |
| Blast Radius writable-entry set (exactly 3 files: `restore-authenticated-grants.sql`, `views.sql`, `admin-functions.sql`; no `apps/web` source file, `clerk.ts`, or `add-registry-modal.tsx`) | CONFIRMED (re-checked this cycle) | No further action |
| Live-DDL hard stop (Step C3) | PASS — wording ("any grant/RLS statement") remains generic enough to cover every fix added across all 5 cycles | — |
| Plan-artifact validator | INFORMATIONAL, not a plan defect — `validate-plan-artifact.mjs` misclassifies this phase-stub shape; `validate-phase-stub.mjs` (the correct tool) is clean, unchanged conclusion from prior cycles, not independently re-run this cycle (no plan structure changed) | — |
| Exit Gate tsc/vitest baselines | RE-CONFIRMED LIVE this cycle | Both commands re-run; exact match to documented baseline (tsc exit 2/4 errors; vitest 57/62) |

### Plan updates applied

None this cycle. This CONDITIONAL verdict's 2 CONCERNs (Gap 17, Gap 18) are both optional one-line
text additions/corrections to the Exit Gate and Verification Evidence sections — neither blocks
EXECUTE, and both are recorded here plus in the SUPPLEMENT REQUEST below for the orchestrator to
route as it sees fit (one more narrow text-only supplement, or accept as documented CONDITIONAL and
proceed).

### Execute-agent instructions

(Retained from prior cycles for continuity; E1-E12 are all satisfied by the current checklist text —
kept below for traceability only, no further action needed on them. One new item, E13, for Gap 17/18
— informational only, does not change any SQL execute-agent must author.)

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | Author the `GRANT SELECT ON public.demo_hunt_scores, public.demo_hunt_votes TO authenticated;` + matching `FOR SELECT TO authenticated USING (true)` policies as part of Step C1, using `component_hunt_rounds_select_all` (`restore-authenticated-grants.sql:263-264`) as the copy-paste precedent | Step C1 |
| E2 | Before finalizing Step B5, run a targeted grep/read of `apps/web/lib/queries.ts:363,498` to confirm whether the grant target is `component_analytics`, `mv_component_analytics`, or both | Step B5 |
| E3 | Write explicit `FOR UPDATE`/`FOR DELETE` policies for `prompt_rules` with both `USING` and `WITH CHECK` (UPDATE) scoped to `user_id = auth.jwt()->>'sub'` | Step B2/C1 |
| E4 | Add a cross-user negative-test sub-step to D3: authenticate as a second test user, attempt to UPDATE/DELETE the first user's `prompt_rules` row, and confirm 0 rows affected | Step D3 |
| E5 | When running the Exit Gate's `vitest` command, diff against the documented 57/62 baseline; do NOT attempt to fix the 5 pre-existing failures (out of Blast Radius) | Exit Gate |
| E6 | Record in the phase report whether the ROLLBACK comment block was used or avoided in favor of fixing forward | Step C5 |
| E7 | Add a live Agent-Probe verification step for `components_with_username`/`demo_hunt_leaderboard` asserting a NON-EMPTY result with populated username data, not merely "no 42501" | Step D3/D4 |
| E8 | Apply Step B3e's `public_profiles` substitution to `component_dependencies_graph_view_v3`, then verify a NON-EMPTY cross-user result | Step B3e/D3/D4 |
| E9 | Trace shared query-helper modules (`queries.server.ts`, `queries.ts`) for indirect `.from()`/`.rpc()` call sites, distinguishing browser/anon vs service-role clients | Step A2 |
| E10 (Gap 12, satisfied) | `GRANT SELECT ON public.component_dependencies_closure TO authenticated;` + permissive policy — confirmed present in Step B3e's SQL batch | Step B3e/C1/D3 |
| E11 (Gap 13, satisfied) | `role` confirmed present in Step B0's granted column list — add a live Hybrid test to Step D5's scope confirming the feedback-dialog role write succeeds post-grant | Step B0/C1/D5 |
| E12 (Gap 15, satisfied) | `pro_banner_url` confirmed present in Step B0's granted column list this cycle — no further action | Step B0/C1 |
| E13 (NEW, Gap 17/18, informational) | Optional: when next touching this plan's text (this supplement or a future one), add the `component_analytics` exclusion line to the Exit Gate's narrowed-claim block, and update the Gap 6/7 Exit Gate bullet + Gap 9 Verification Evidence row from "pending SUPPLEMENT resolution" to resolved wording matching the adjacent Gap 6 row. No SQL or checklist behavior changes as a result — this is a documentation-accuracy pass only | Exit Gate / Verification Evidence sections, whenever next edited |

### Backlog artifacts

| Artifact | Location | What it tracks |
|---|---|---|
| `clerk-ts-session-cache-null-guard_NOTE_25-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` | The `useClerkSupabaseClient` null-safety bug at `apps/web/lib/clerk.ts:70-71` (drives 1 of the 5 pre-existing vitest failures); a 1-line fix, out of Phase 1's grant/RLS blast radius |
| `all-tests-md-baseline-drift_NOTE_25-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` (or `process/context/` maintenance queue) | `process/context/tests/all-tests.md` claims 48/15; live-confirmed as of 26-07-26 is 62/17, 57 passing |
| `add-registry-modal-tsc-syntax-error_NOTE_26-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` | Escaped-backtick template-literal syntax error in `add-registry-modal.tsx:168,389` (uncommitted dirty WIP); causes the 4 `tsc --noEmit` errors this phase's Exit Gate treats as a foreign baseline |
| `validate-plan-artifact-phase-stub-false-positive_NOTE_26-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` (or a harness-level backlog) | `validate-plan-artifact.mjs` misclassifies phase-stub-shaped plans; `validate-phase-stub.mjs` is the correct tool and returns clean |
| `rpc-functions-grant-execute-audit_NOTE_26-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` | Whether this Supabase project's ~29 RPC functions rely on Postgres's default PUBLIC-EXECUTE privilege or an untracked out-of-band revoke; recommend a live introspection pass in a future phase |

### Known Gaps (informational — not excluded from the FAIL/CONCERN count; these are documented risk items still open, not a Known-Gap coverage claim for developed behavior)

- `demo_hunt_leaderboard`'s cross-user `users`-RLS mechanism (Gap 7 / CONCERN, latent) — zero live
  callers, unchanged this cycle.
- 5 pre-existing vitest failures (unrelated to this phase) — re-confirmed live this cycle.
- Edge-function deployment status (`generate-embeddings`, `ai-search-oai`) remains unverified per the
  SPEC's own Known Gaps — irrelevant to Phase 1's grant/RLS scope.
- Future-fragility note (informational, not scored): `public.public_profiles`'s `security_invoker =
  off` posture depends on nobody re-running `enable-rls.sql`'s blanket security-invoker sweep after
  `public_profiles` is created.
- Gap 16 (informational): whether `supabase/rpc-functions.sql`/`search-functions.sql`'s functions rely
  on Postgres's default PUBLIC-EXECUTE grant or an untracked out-of-band revoke is unresolved and
  cannot be settled from tracked files alone — does not block this phase.
- Gap 17/18 (NEW, informational, this cycle): the two documentation-completeness CONCERNs above are
  the ONLY new items this cycle found; both are cosmetic and do not affect the correctness of any
  grant/RLS fix.

### What this coverage does NOT prove

- It does not prove Gaps 1/6/7/9/12/13's fixes work end-to-end — that still requires live execution
  (Step C3 hard stop) and the Agent-Probe checks in Test gates above; this cycle re-confirms the plan
  TEXT for those fixes is internally consistent, grep-present in the executable checklist and the live
  SQL files, and traces correctly through the view/RLS/grant mechanism on paper — not that the live
  database will behave identically once the SQL actually runs.
- Gap 16's conclusion (Step B3f's grant is likely a no-op) remains an inference from documented
  Postgres defaults and internal plan-evidence consistency, not an empirical live confirmation (any
  such probe is out of scope, a session hard stop). Step D6's live test remains the actual source of
  truth once EXECUTE runs.
- The `grep`-based browser-file desk cross-reference (Fully-Automated tier) proves file/call-site
  inventory completeness for DIRECT `useClerkSupabaseClient` callers only; this cycle did not
  exhaustively re-run that grep against all 51+ files plus every transitive shared-helper import from
  scratch this cycle (it was last fully re-run at cycle 3/Gap 14's resolution) — a further level of
  indirection could still be hiding something.
- The BookmarkButton Hybrid check proves the two named UI surfaces work; it does not prove every other
  browser-client call site works.
- The tsc/vitest regression gates prove no NEW breakage in those two automated surfaces; they do not
  touch the Supabase RLS/grant question at all.
- Live-DDL verification (Step C5, D1-D4) has not run — Step C3's hard stop still gates any live
  application; no PVL pass, past or future, satisfies it.
- None of the above gates prove `demo_hunt_leaderboard` renders CORRECT scores/rankings, or that
  `component_dependencies_graph_view_v3`'s dependency resolution renders correct file trees beyond the
  single query's row shape — only that the query itself can return non-empty, correctly-scoped rows
  once executed.
- Gap 17/18's resolution status (whether the orchestrator chooses to run one more text-only supplement
  or accept them as CONDITIONAL) is not itself proven or decided by this contract — it is left open for
  the orchestrator/user per the "Accepted by" field below.
- This cycle's re-confirmation of the 24-column `users` partition does not extend to any other table's
  grant statement — every other table this plan grants uses a blanket `SELECT, INSERT, UPDATE[,
  DELETE]` (no column scoping), so the class of defect Gap 13/15 represent (an omitted column in a
  column-scoped list) cannot structurally recur elsewhere in this plan.

Gate: CONDITIONAL (0 FAILs — second consecutive cycle with none; 2 CONCERNs, both NEW this cycle and
both pure documentation-completeness issues with zero functional or security impact: Gap 17 — the
Exit Gate section does not restate the already-correct `component_analytics` anon-role exclusion
alongside the two `useSubmissions.ts` exclusions it does name; Gap 18 — two annotations, the Exit
Gate's Gap 6/7 bullet and the Verification Evidence table's Gap 9 row, still read "pending SUPPLEMENT
resolution" even though both underlying gaps were resolved 2-3 cycles ago and re-confirmed clean since).
This is a legitimate terminal CONDITIONAL gate per orchestration.md's PVL routing rule (Gate =
CONDITIONAL with N≥1 recorded fix cycles is legal for EXECUTE) — 4 supplement cycles have already run
against this plan. Recommend: EITHER one more narrow, text-only PLAN-SUPPLEMENT cycle to apply the two
one-line corrections named in Gap 17/18 and E13, OR accept both as documented CONDITIONAL gaps and
proceed directly to EXECUTE, since neither affects any SQL statement, any grant, any RLS policy, or
any test gate's correctness — they are purely about where an already-correct fact is (or is not)
restated in the plan's prose. The Step C3 live-DDL hard stop remains a mandatory user-approval pause
regardless of this gate's outcome or which option is chosen — no PVL pass, past or future, satisfies
it.
Accepted by: N/A this cycle — CONDITIONAL gate with 2 open, zero-functional-impact documentation
CONCERNs (Gap 17, Gap 18). Given their triviality and the fact that 4 supplement cycles have already
resolved every substantive architectural/security finding this program surfaced, recommend the
orchestrator/user accept this CONDITIONAL as-is and proceed to EXECUTE rather than spending a 5th
supplement cycle on cosmetic text — but if strict zero-CONCERN discipline is preferred, one more
narrow text-only supplement (per E13) would close both cleanly. Record whichever decision is taken
explicitly here.
