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

---

## Implementation Checklist

### Step A — Audit all browser-client files against the confirmed 13-relation baseline
(count is self-deriving — see A1; SPEC's prior "41 files"/"14-relation" figures are both stale,
corrected 26-07-26)

- [ ] A1. Re-derive the current browser-client file list at execute time via
      `grep -rl "useClerkSupabaseClient" apps/web/{app,components,lib,hooks}` (or the call sites of
      `useClerkSupabaseClient` defined at `apps/web/lib/clerk.ts:66`) — do NOT assume a fixed count.
      **INNER-LOOP RESEARCH finding (26-07-26): the live count as of this research pass is 51 files,
      not 41 — this checklist and all references below to "41 browser-client files" are a stale
      snapshot from the SPEC. Count and list re-derived fresh at execute time; the file count is
      expected to keep drifting and must never be hardcoded again.** Cross-reference the re-derived
      list against the known SPEC citation list.
- [ ] A2. For each file, extract every `.from()`/`.rpc()` call site and the relation/function name
      it targets. **VALIDATE finding (see Gap 2 below): distinguish base tables from views/matviews
      reached via PostgREST foreign-key-embed syntax (e.g. `mv_component_analytics!component_analytics_component_id_fkey(...)`)
      — the embed target is what actually needs the grant, not necessarily the name in the fkey label.**
- [ ] A3. Diff the full target-relation set against the confirmed 13-relation grant baseline
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
- [ ] A4. Note: `author_payouts`, `payout_rates`, `bundles`, `demo_hunt_scores` are out-of-scope
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

- [ ] B1. `demo_bookmarks` — user-owned table (bookmark belongs to the authenticated user). Extend
      grants + write a scoped RLS policy (`user_id = auth.jwt()->>'sub'` pattern — **VALIDATE
      correction: the closest visible exemplar in `restore-authenticated-grants.sql` is
      `components_insert_own`/`_update_own`/`_delete_own`, NOT a `templates_insert_own`-style
      policy — `templates` has no grant/policy statements in any tracked `supabase/*.sql` file at
      all (grep-confirmed); its live policy names are known only from the SPEC's live-DB audit
      narrative, not from a file execute-agent can open and copy**).
- [ ] B2. `prompt_rules` — confirm ownership model (per-user or per-org) from schema; write scoped
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
- [ ] B3. `demo_hunt_leaderboard` (view) — read-only view; grant `SELECT` to `authenticated` only,
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
- [ ] B3b. **[NEW — added by VALIDATE, required before Step C1]** Grant narrow, read-only access to
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
- [ ] B3c. **[NEW — added by INNER-LOOP RESEARCH+INNOVATE, 26-07-26]** `components_with_username`
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

- [ ] B3c-i. **[NEW]** Create `public.public_profiles`:
      `CREATE VIEW public.public_profiles WITH (security_invoker = off) AS SELECT id, username,
      display_name, display_username, display_image_url, image_url, bio, github_url,
      twitter_url, website_url FROM public.users;` plus
      `GRANT SELECT ON public.public_profiles TO authenticated;` — exact text prescribed at
      `restore-authenticated-grants.sql:295-299`. `security_invoker = off` is safe HERE
      precisely because the column list excludes every sensitive column (`email`,
      `paypal_email`, `stripe_id`, `lemon_squeezy_customer_id`, `ref`, `is_admin`) — the
      grants file states this explicitly at `:302-304`; cite it in the applied SQL's comment.
- [ ] B3c-ii. **[NEW]** Redefine `components_with_username` (`supabase/views.sql:5-33`) via
      `CREATE OR REPLACE VIEW`: change `JOIN public.users u ON u.id = c.user_id` to
      `JOIN public.public_profiles u ON u.id = c.user_id`, and replace the
      `to_jsonb(u.*) AS "user"` projection with the equivalent narrow-column shape sourced
      from `public_profiles` (same safe column list as B3c-i). Keep `components_with_username`
      itself `security_invoker=on` — only the base relation it joins changes, not its own
      invoker posture. Apply the identical substitution to `demo_hunt_leaderboard`'s two
      `public.users` joins (`cu`, `du` — `supabase/views.sql:118-122`) in the same statement
      batch, per the Gap 7 fold-in resolution at Step B3b below.

- [ ] B3e. **[NEW — required by inner-PVL cycle 2, 26-07-26, Gap 9, BLOCKING]** Apply the identical
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

- [ ] B4. `plans` — read-only reference data (subscription plan catalog); likely safe for a broad
      `SELECT` grant to `authenticated` (or even `anon` if publicly listed pricing) — confirm no
      row-level sensitivity, grant accordingly.
- [ ] B5. `component_analytics` — confirm read pattern: aggregate stat or per-user? If aggregate
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
- [ ] B6. `collections` — 0 live rows; confirmed out-of-scope for membership UI, but read access
      may still be needed if any of the browser-client files renders collection metadata read-only. If no
      current read call site exists, do NOT grant preemptively — record as "no active call site,
      grant deferred until a consumer exists."
- [ ] B7. `feedback` — likely write-once-no-update pattern (a user submits feedback, never edits
      it). Grant `INSERT` + narrow `SELECT` (own rows only) via RLS; no `UPDATE`/`DELETE` grant.
- [ ] B8. Revoke `templates`'s excess `anon` `INSERT`/`UPDATE`/`DELETE` grants (F5 hygiene item) —
      low severity, not currently exploitable (no matching `{anon}` write RLS policy), but tighten
      as defense-in-depth per AC13. **VALIDATE note: since `templates` has no tracked grant
      statements anywhere in `supabase/*.sql` today, this REVOKE will be the FIRST time any part of
      `templates`'s live grant state becomes version-controlled — document this explicitly in the
      phase report so Phase 6 (schema source of truth) knows the rest of `templates`'s grants/policies
      still need to be reverse-engineered from the live DB and added to the tracked file, not just
      the revoke.**

### Step C — Extend and apply the fix

- [ ] C1. Extend `supabase/restore-authenticated-grants.sql` with the Step B (and B3b) decisions as
      new `GRANT`/`CREATE POLICY` statements, following the existing file's structure and comment
      style.
- [ ] C2. Resolve the commented-out `public_profiles` block (`restore-authenticated-grants.sql:295`)
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

---

## Exit Gate

```bash
# Live grant/policy state confirmation (run via the same introspection query used in the baseline audit)
# Expected: demo_bookmarks, prompt_rules, demo_hunt_leaderboard (view) + its demo_hunt_scores/
# demo_hunt_votes base-table dependency, plus any other Step B-approved additions present in the
# authenticated grant list; templates anon write grants revoked

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
  cross-user data, not merely "no permission error" (Gap 6/7 — pending SUPPLEMENT resolution)
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
- [ ] 5. EXECUTE — all checklist items done; per-section test gates run and green (or gaps documented)
- [ ] 6. EVL — all EVL gates green; follow-up stubs registered; EVL HANDOFF SUMMARY written
- [ ] 7. UPDATE PROCESS — phase report written, umbrella state updated, commit done

**Validate-contract required before execute.** If step 4 (PVL) is unchecked or the Validate Contract
section reads "(placeholder — vc-validate-agent writes this section before EXECUTE)", orchestrator
must spawn vc-validate-agent first. A partial contract missing Plan updates applied / Execute-agent
instructions / Test gates sections is treated as a placeholder. **Current status: Gate is BLOCKED —
do NOT route to EXECUTE. Route to PLAN-SUPPLEMENT.**

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
| **NEW (Gap 9): `component_dependencies_graph_view_v3` is queryable at all (currently zero grant, live 42501) AND returns non-empty, correctly-populated data for a cross-user registry dependency, sourced via the same `public_profiles` substitution (Step B3e)** | Agent-Probe | AC1, AC3 — **pending SUPPLEMENT resolution this cycle; not yet provable** |

```bash
# Post-fix live verification (run after Step C4 approval + apply)
# information_schema.role_table_grants query against production — Agent-Probe, requires live connection
```

---

## Resume and Execution Handoff

- Selected plan file path: `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md`
- Last completed step: PVL cycle 4 / inner-PVL cycle 2 (26-07-26) — **Gate: BLOCKED.** Full V1-V7
  re-run re-confirmed the prior cycle's Gaps 6/7/8 as correctly resolved (re-derived from source, not
  trusted), and found a NEW previously-undiscovered gap: a third `security_invoker=on` view,
  `component_dependencies_graph_view_v3`, shares Gap 6's INNER-JOIN-to-`public.users` architecture,
  has zero grant at all today (live 42501), and is reached by 3 real browser-client callers through
  a shared query-helper indirection that Step A2's audit methodology did not trace into (Gap 9).
  Also found a minor CONCERN: the `public_profiles` column list omits `name` (Gap 10).
- Validate-contract status: **BLOCKED, written 26-07-26 (inner-pvl: phase-1), supersedes the
  26-07-26 inner-pvl BLOCKED contract (cycle 1, Gaps 6/7/8) that the prior PVL supplement cycle
  resolved.** Do not route to EXECUTE.
- Next step: Orchestrator must spawn vc-plan-agent in PLAN-SUPPLEMENT mode with the new SUPPLEMENT
  REQUEST (Gap 9/10) below, then re-spawn vc-validate-agent to re-run PVL from V1 once more against
  the supplemented plan. The Step C3 live-DDL hard stop remains a mandatory user-approval pause
  before any grant/RLS SQL — including all 3 view redefinitions and the `public_profiles` CREATE
  VIEW — is applied to the live production database; it is not satisfied by any PVL pass, past or
  future.

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

---

## Validate Contract

Status: BLOCKED
Date: 26-07-26
date: 2026-07-26
generated-by: inner-pvl: phase-1
supersedes: 2026-07-26 (inner-pvl, BLOCKED) — that contract's Gaps 6/7/8 were resolved by PVL
supplement cycle 1 (public_profiles view + components_with_username/demo_hunt_leaderboard
redefinition). This re-validate re-derived every "resolved" claim from source (per instruction, no
early exit) and confirmed all of it holds. It also traced the same INNER-JOIN-to-`public.users`
architecture one step further and found a THIRD view sharing it
(`component_dependencies_graph_view_v3`, Gap 9) that was never in Blast Radius and is reached by 3
real browser-client callers with currently ZERO grant (live 42501 today) — plus a small column-list
completeness gap (Gap 10, `name` missing from the `public_profiles` projection). Net verdict stays
BLOCKED, now for a new reason.

Parallel strategy: sequential (single agent). Rationale: signal score 5/7 (S2 schema/auth surface —
grants/RLS; S4 phase-program classification; S5 caller explicitly requested non-rubber-stamp
scrutiny; S6 high-risk class — auth/permission RLS; S7 audit surface spans 51+ browser-client files)
scores HIGH on the threshold table. As with the prior cycle, this pass traced one continuous
Postgres RLS/`security_invoker` reasoning chain across 8 source files (enable-rls.sql, views.sql,
restore-authenticated-grants.sql, queries.ts, queries.server.ts, clerk.ts, info-section.tsx, plus the
3 new browser-client callers of `resolveRegistryDependencyTree`) — a single deep-mode agent was
correct; fan-out would have fragmented the chain that found Gap 9 (the discovery required following
an indirection through a shared server-side helper function, not just grepping literal `.from()`
calls in the 51 self-derived files). Recommend the NEXT re-validate pass also run single-agent, and
recommend the next PLAN-SUPPLEMENT explicitly widen Step A2's methodology instruction to require
tracing through shared query helpers (see Execute-Agent Instruction E9) so a 4th such view cannot
hide the same way.

### Test gates (C3 5-column table)

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC1/AC3 | browser-client grant-coverage desk cross-reference (self-deriving count) | Fully-Automated | `grep -rl "useClerkSupabaseClient" apps/web/{app,components,lib,hooks}` file count cross-referenced against Step A3's gap list, PLUS a follow-through grep into shared query helpers (`queries.server.ts`, `queries.ts`) called by those files, for any `.from()`/`.rpc()` call not literally inside the 51-file set (script to be authored by execute-agent) | B |
| AC1/AC3 | Live confirmation: zero remaining ungranted relations | Agent-Probe | Live `information_schema.role_table_grants` query post-fix, diffed against Step B/B3b/B3c/B3e decision list | A |
| AC2 | BookmarkButton persists across reload (detail page + preview dialog) | Hybrid | Manual or Playwright-driven bookmark toggle + reload check on both surfaces, real/seeded Clerk session | B |
| AC13 | Grant/RLS diff before/after | Agent-Probe | `information_schema.role_table_grants` + `pg_policies` query, pre/post fix, recorded in phase report | A |
| AC13 | `templates` anon write-grant revoke confirmed | Agent-Probe | Live introspection confirms `anon` has no INSERT/UPDATE/DELETE on `public.templates` | A |
| AC1/AC3 (Gap 1) | `demo_hunt_leaderboard` view queryable without 42501 | Agent-Probe | Live query against the view as an authenticated test session, AFTER Step B3b's SQL is applied (Step C3 hard-stop gated) | B |
| AC1 security-adjacent (Gap 3) | `prompt_rules` UPDATE/DELETE denied cross-user | Hybrid | Two-Clerk-session test: session B attempts to update/delete session A's `prompt_rules` row, expect 0 rows affected / RLS denial | B |
| AC1/AC3 (Gap 6, RESOLVED-pending-execute) | `components_with_username` returns correct, non-empty data for a registry dependency authored by a DIFFERENT user | Agent-Probe | Live query as authenticated session A against a public component authored by session B; assert non-empty result with populated `username`/`user` fields | B — fix now fully specified (Steps B3c-i/B3c-ii); provable once executed |
| AC1/AC3 (Gap 9, NEW — BLOCKING) | `component_dependencies_graph_view_v3` (studio dependency resolution) returns correct, non-empty data for a cross-user dependency, and is queryable at all (currently has zero grant) | Agent-Probe | Live query as authenticated session A resolving a registry dependency authored by session B via `resolveRegistryDependencyTree`; assert non-empty result — NOT merely absence of a 42501 | C — no checklist item covers this relation at all yet; plan-text fix required, see SUPPLEMENT REQUEST |
| Regression | No new `tsc --noEmit` errors beyond the confirmed foreign baseline | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` — RE-CONFIRMED LIVE this cycle (26-07-26): exit 2, exactly 4 errors, all in `add-registry-modal.tsx:168,389` | A |
| Regression | No NEW `vitest` failures vs documented baseline | Fully-Automated | `corepack pnpm --filter web test` — RE-CONFIRMED LIVE this cycle (26-07-26): 57/62 passing, 5 pre-existing failures across 4 files, exact match to the plan's documented baseline | A |

gap-resolution legend: A — proven now (re-confirmed live this cycle) · B — fixed in this plan
(execute-agent authors the script/SQL as part of the checklist) · C — the checklist item as
currently written does NOT resolve the gap; a plan-text change is required before this becomes a B ·
D — backlog stub (n/a this cycle).

C-4 reconciliation: no `Known-Gap` row is used as a `strategy:` value above — Gap 9's `C` row is an
unresolved plan-completeness problem (a whole relation missing from the checklist), not a Known-Gap
coverage claim for developed behavior.

Failing stub (for the Fully-Automated file-audit row):
```
test("should confirm every file calling useClerkSupabaseClient (directly or via a shared query helper it calls) has its target relations present in the confirmed grant list", () => {
  throw new Error("NOT IMPLEMENTED — TDD stub: browser-client grant-coverage desk cross-reference, including indirect relations reached through shared helpers like queries.server.ts")
})
```

### Dimension findings

- Infra fit: PASS — no infra/container/deploy surface touched; re-confirmed Gap 2
  (`component_analytics` vs `mv_component_analytics`) still correctly scoped, unchanged this cycle.
- Test coverage: PASS — Exit Gate tsc/vitest baselines independently re-run live this cycle
  (2026-07-26) and match the plan's documented figures exactly (tsc: exit 2, 4 errors in
  `add-registry-modal.tsx`; vitest: 57/62, 5 pre-existing failures in the same 4 named files).
- Breaking changes: **FAIL** — Gap 9 (NEW, this cycle): `component_dependencies_graph_view_v3` is
  used by 3 real browser-client surfaces (registry-preview, command palette, studio editor
  dependency loading) and currently has no grant at all — those 3 features are live-broken today
  (42501) and this phase's stated Purpose ("extends the grant-restoration script... for every
  relation the [51] browser-client files reference") does not yet cover it, so the plan's own
  completeness claim does not hold.
- Security surface: **FAIL** — Gap 9 (NEW, this cycle): `component_dependencies_graph_view_v3` is
  confirmed one of exactly 3 views converted to `security_invoker=on` by `enable-rls.sql`'s own
  header comment (`supabase/enable-rls.sql:6-11`, naming `components_with_username`,
  `component_dependencies_graph_view_v3`, and `demo_hunt_leaderboard` explicitly), and its view body
  INNER JOINs `public.users su`/`du` twice (mirrors Gap 6/7's exact mechanism: caller's own-row-only
  `users_select_self` RLS filters the JOIN, so cross-user rows are silently excluded once granted).
  It is reached with the browser `useClerkSupabaseClient` instance from THREE real files:
  `apps/web/components/features/publish/components/preview.tsx:51,65`,
  `apps/web/components/ui/command-menu.tsx:141,295`, and
  `apps/web/components/features/studio/editor/hooks/use-dependencies.ts:26,157` — all three pass
  their `supabase` client into `apps/web/lib/queries.server.ts`'s `resolveRegistryDependencyTree()`,
  which performs the actual `.from("component_dependencies_graph_view_v3")` call
  (`queries.server.ts:38-41`). This relation has ZERO grant anywhere in
  `restore-authenticated-grants.sql` (grep-confirmed) — unlike `components_with_username`, which at
  least gets fixed by this cycle's already-planned Steps B3c-i/B3c-ii, this one currently 42501s in
  production for all 3 call sites and has no remedy anywhere in the plan. Minor companion finding
  (Gap 10, CONCERN not FAIL): the `public_profiles` column list prescribed at Step B3c-i (`id,
  username, display_name, display_username, display_image_url, image_url, bio, github_url,
  twitter_url, website_url`) omits `name` — but the live `components_with_username` consumer
  (`info-section.tsx:182,186,191,210,214,224`) reads `user.display_name || user.name ||
  user.username` as a 3-way fallback chain. For any user with `display_name` unset but `name` set,
  the post-fix result silently drops to the `username` fallback instead of showing the actual name —
  a minor display-fidelity regression, not a security leak (`name` is a public display field, not in
  the sensitive-column exclusion list) and not a functional break (chain still resolves to
  `username`). Confirmed via direct schema read (`apps/web/prisma/schema.prisma`'s `users` model) —
  no new sensitive column was added since the grants file's comment was written; the whitelist
  approach (naming exactly 10 safe columns rather than `SELECT *`) is confirmed sound regardless of
  future schema drift, this is purely a completeness gap in which safe columns were named.

  A near-identical mechanism affects Step B3b's `demo_hunt_leaderboard` fix (Gap 7, CONCERN, unchanged
  from the prior cycle — its one browser-client consumer, `getRoundSubmissions()`, has zero live
  callers anywhere in `apps/web`; the live `/contest/leaderboard` UI uses the service-role client and
  is unaffected today).

- Section — Implementation Checklist (Steps A-D): **FAIL** (mirrors Security surface finding, Gap 9)
  — no checklist step names `component_dependencies_graph_view_v3` at all (it appears only once, in
  passing, as an example of an existing `security_invoker=on` view at line ~145 of this plan). Step
  A2's methodology ("For each file, extract every `.from()`/`.rpc()` call site") is mechanically
  under-specified: literally grepping `.from(`/`.rpc(` inside the 51 self-derived
  `useClerkSupabaseClient`-calling files will NOT find this relation, because the actual `.from()`
  call lives one level of indirection away, inside the shared helper `queries.server.ts`, which
  receives an already-instantiated client as a function parameter rather than calling
  `useClerkSupabaseClient()` itself. This is exactly why cycles 0-3 (and the prior cycle's Step A2
  audit) missed it — a literal per-file grep is the described methodology, and this relation
  structurally evades that grep. Step A2 needs an explicit instruction to also trace into shared
  query-helper modules invoked by those files (see Execute-Agent Instruction E9).

### Net Gate Derivation

| Layer 1 dimensions | Status |
|---|---|
| Infra fit | PASS |
| Test coverage | PASS |
| Breaking changes | FAIL |
| Security surface | FAIL |

| Layer 2 sections | Status |
|---|---|
| Implementation Checklist (Steps A-D) | FAIL |

**Totals: 3 FAILs / 1 CONCERN / 2 PASSes**

**→ Net Gate: BLOCKED**

Decision rationale: this cycle re-derived every Gap 6/7/8 claim from source (not from trusting the
prior contract) and confirmed all of it holds — no regression on the already-fixed items. It then
extended the same line of reasoning (which views share the `security_invoker=on` +
INNER-JOIN-to-`public.users` architecture) one step further than the prior cycle did, and found a
third view in that exact family, confirmed via the `enable-rls.sql` header comment's own explicit
3-view list — this was always discoverable from that one comment, but the prior cycles' Step A audit
methodology (grep the 51 files directly) structurally could not surface it because the call site is
indirect. The 3 FAILs are one underlying gap (Gap 9: a whole relation missing from Blast Radius,
checklist, and audit methodology) surfacing across the same three dimensions as Gap 6 did last
cycle, not three independent problems. Per orchestration.md's V3 Net Gate Rule, any FAIL forces the
gate to BLOCKED. This is not a case for CONDITIONAL acceptance: the gap is concrete and mechanically
fixable (extend the already-designed `public_profiles` substitution to a third view, and add its
first-ever grant) using the exact same remedy pattern already locked in for Gap 6 — not a new
architectural decision, just applying the established one more time and widening the audit
methodology so a fourth instance cannot hide the same way.

### Findings

| Finding | Severity | Proposed fix |
|---|---|---|
| `component_dependencies_graph_view_v3` shares Gap 6's INNER-JOIN-to-`public.users` architecture AND has zero grant anywhere — live 42501 today for 3 real browser-client callers (studio editor dependency loading, registry preview, command palette) | FAIL | Extend Blast Radius (already noted inline) to cover this view; add a new checklist step (Step B3e, already added inline) applying the same `public_profiles` substitution to its `su`/`du` joins plus its first-ever `GRANT SELECT ... TO authenticated` |
| `public_profiles` column list omits `name`, which the live `components_with_username` consumer reads as part of a 3-way fallback chain | CONCERN | Add `name` to the column list in Step B3c-i (and the corresponding narrow-column projection in B3c-ii/B3e) — not sensitive, trivial fix |
| Step A2's "extract every `.from()`/`.rpc()` call site" methodology does not by itself find relations reached only through a shared query-helper module (e.g. `queries.server.ts`) that receives an injected client parameter | CONCERN (methodology gap, not itself blocking, but is the root cause that let Gap 9 hide for 4 cycles) | Add an explicit Step A2 sub-instruction: after listing the 51 self-derived files, also grep each file's local imports for shared query-helper modules (`queries.server.ts`, `queries.ts` exports called with a passed-in client) and trace `.from()`/`.rpc()` calls inside those too |
| Gaps 6/7/8 (prior cycle) — `public_profiles` view, `components_with_username`/`demo_hunt_leaderboard` redefinition, `demo_hunt_scores`/`demo_hunt_votes` grants, prompt_rules ownership policies, matview-vs-table distinction, stale "41 files" prose, 13-relation baseline correction | ✅ RESOLVED (re-confirmed from source this cycle, not merely re-read from the prior contract) | No further action |
| Exit Gate tsc/vitest baselines | ✅ RESOLVED (re-confirmed live this cycle) | Both commands re-run live this cycle; exact match to documented baseline |
| Live-DDL hard stop (Step C3) | ✅ PASS | — |
| Blast Radius correctly excludes clerk.ts/add-registry-modal.tsx as writable | ✅ PASS | — |
| Plan-artifact validator | ✅ INFORMATIONAL, not a plan defect | Re-ran this cycle: `validate-plan-artifact.mjs` returns 4 failures / 3 warnings (missing generic Overview/Complexity/Phase-Completion-Rules/Acceptance-Criteria sections — the count is higher than the prior cycle's 2/3 purely because this cycle's own Findings-table wording no longer happens to contain the literal phrases "Phase Completion Rules"/"Acceptance Criteria" as incidental prose, which the prior cycle's differently-worded row did; the validator has no semantic understanding, it just regex-matches those exact phrases anywhere in the file). Same harness false-positive pattern confirmed by the prior cycle (this file is a phase-stub, not a single-plan shape). `validate-phase-stub.mjs` — the correct tool for this shape — returns 0 failures / 0 warnings, re-confirmed this cycle. Not re-litigated further; prior cycle's conclusion stands. |

### Plan updates applied

None this cycle — BLOCKED verdict. Per phase separation, inline annotation notes documenting Gap
9/10 findings were added directly to the Blast Radius section, a new Step B3e placeholder was added
to the Implementation Checklist, and a new bullet was added to "Blockers That Would Justify BLOCKED
Status" — all for traceability. The full SQL/grant authoring for Step B3e is left for the next
PLAN-SUPPLEMENT cycle (or execute-agent, once unblocked) to write out in full, mirroring
Steps B3c-i/B3c-ii's already-completed pattern.

### Execute-agent instructions

(Held pending supplement — the plan cannot go to EXECUTE from a BLOCKED gate. Retained from the
prior cycle for continuity, plus 2 new items (E8, E9) once Gap 9/10 are resolved and the gate reaches
PASS/CONDITIONAL:)

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | Author the `GRANT SELECT ON public.demo_hunt_scores, public.demo_hunt_votes TO authenticated;` + matching `FOR SELECT TO authenticated USING (true)` policies as part of Step C1, using `component_hunt_rounds_select_all` (`restore-authenticated-grants.sql:263-264`) as the copy-paste precedent | Step C1 |
| E2 | Before finalizing Step B5, run a targeted grep/read of `apps/web/lib/queries.ts:363,498` to confirm whether the grant target is `component_analytics`, `mv_component_analytics`, or both — do not assume the name in Step A3's gap list is the final answer | Step B5 |
| E3 | Write explicit `FOR UPDATE`/`FOR DELETE` policies for `prompt_rules` with both `USING` and `WITH CHECK` (UPDATE) scoped to `user_id = auth.jwt()->>'sub'` — do not use a single loose `FOR ALL USING (true)` policy for this table | Step B2/C1 |
| E4 | Add a cross-user negative-test sub-step to D3: authenticate as a second test user, attempt to UPDATE/DELETE the first user's `prompt_rules` row, and confirm 0 rows affected | Step D3 |
| E5 | When running the Exit Gate's `vitest` command, diff against the documented 57/62 baseline (5 named pre-existing failures) rather than expecting a fully-green suite; do NOT attempt to fix the 5 pre-existing failures as part of this phase (out of Blast Radius) unless one turns out to be grant-related after investigation | Exit Gate |
| E6 | Record in the phase report whether the `restore-authenticated-grants.sql` ROLLBACK comment block was used or avoided in favor of fixing forward, per the Step C5 note | Step C5 |
| E7 | Whatever remedy is chosen for Gap 6 (and Gap 7), add a live Agent-Probe verification step that queries `components_with_username` (or its replacement) as session A for a component authored by session B, and asserts a NON-EMPTY result with populated username data — not merely "no 42501" | Step D3/D4 |
| E8 (NEW, Gap 9) | Apply Step B3e's `public_profiles` substitution + first-ever grant to `component_dependencies_graph_view_v3`, then add a live Agent-Probe verification step: as session A, call `resolveRegistryDependencyTree()` (or query the view directly) for a dependency authored by session B, and assert a NON-EMPTY result — not merely "no 42501". Also add `name` to the `public_profiles` column list (Gap 10) in the same B3c-i statement | Step B3e/D3/D4 |
| E9 (NEW, methodology) | When re-deriving Step A2's per-file `.from()`/`.rpc()` audit, also trace each of the 51 files' local imports for shared query-helper modules (e.g. `queries.server.ts`, `queries.ts`) called with a passed-in `supabase` client, and extract `.from()`/`.rpc()` call sites inside those helpers too — a literal per-file grep alone misses relations reached only through this one level of indirection (this is exactly how Gap 9 stayed hidden for 4 cycles) | Step A2 |

### Backlog artifacts

| Artifact | Location | What it tracks |
|---|---|---|
| `clerk-ts-session-cache-null-guard_NOTE_25-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` | The `useClerkSupabaseClient` null-safety bug at `apps/web/lib/clerk.ts:70-71` (drives 1 of the 5 pre-existing vitest failures — `header-smoke.test.tsx`); a 1-line fix, out of Phase 1's grant/RLS blast radius |
| `all-tests-md-baseline-drift_NOTE_25-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` (or `process/context/` maintenance queue) | `process/context/tests/all-tests.md` claims 48/15; live-confirmed 25/26-07-26 is 62/17, 57 passing |
| `add-registry-modal-tsc-syntax-error_NOTE_26-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` | Escaped-backtick template-literal syntax error in `apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx:168,389` (uncommitted dirty WIP); causes the 4 `tsc --noEmit` errors this phase's Exit Gate treats as a foreign baseline, not fixed here |
| `validate-plan-artifact-phase-stub-false-positive_NOTE_26-07-26.md` (suggested filename, not yet created) | `process/features/supabase-interconnect/backlog/` (or a harness-level backlog) | `validate-plan-artifact.mjs` misclassifies phase-stub-shaped plans (`phase-*.md`) as "legacy plan shape" and still demands single-plan-only sections that the phase-stub template intentionally omits; reproduces across all 6 phase plans in this program; `validate-phase-stub.mjs` is the correct tool and returns clean |

### Known Gaps (informational — not excluded from the FAIL/CONCERN count; these are documented risk items still open, not a Known-Gap coverage claim for developed behavior)

- `demo_hunt_leaderboard`'s cross-user `users`-RLS mechanism (Gap 7 / CONCERN) — latent, zero live
  callers, unchanged this cycle.
- `public_profiles` column list omits `name` (Gap 10 / CONCERN) — minor display-fidelity gap, not a
  security or functional break.
- 5 pre-existing vitest failures (unrelated to this phase) — re-confirmed live this cycle.
- Edge-function deployment status (`generate-embeddings`, `ai-search-oai`) remains unverified per
  the SPEC's own Known Gaps — irrelevant to Phase 1's grant/RLS scope, noted only for completeness.

### What this coverage does NOT prove

- Nothing in this contract proves Gap 9 is fixed — it proves the OPPOSITE: that
  `component_dependencies_graph_view_v3` has no working fix in the current plan text at all, not even
  an incomplete one. This contract's job was to catch that before EXECUTE, which it did.
- It does not prove Gap 6/7's fix (from the prior supplement) works end-to-end — that still requires
  live execution (Step C3 hard stop) and the Agent-Probe checks in Test gates above; this cycle only
  re-confirms the plan TEXT for that fix is internally consistent and traces correctly through the
  view/RLS mechanism on paper.
- The `grep`-based browser-file desk cross-reference (Fully-Automated tier) proves file/call-site
  inventory completeness for DIRECT `useClerkSupabaseClient` callers only — even with E9's widening,
  it does not prove there is no FOURTH level of indirection (e.g. a helper calling another helper)
  beyond the one level this cycle found.
- The BookmarkButton Hybrid check proves the two named UI surfaces work; it does not prove every
  other of the browser-client files' call sites work.
- The tsc/vitest regression gates prove no NEW breakage in those two automated surfaces; they do not
  touch the Supabase RLS/grant question at all.
- Live-DDL verification (Step C5, D1-D4) has not run — Step C3's hard stop still gates any live
  application, and this cycle found a new reason that gate must remain firm.
- None of the above gates prove `demo_hunt_leaderboard` renders CORRECT scores/rankings, or that
  `component_dependencies_graph_view_v3`'s dependency resolution renders correct file trees beyond
  the single query's row shape — only that the query itself returns non-empty, correctly-scoped rows
  once Gap 9 is resolved.

Gate: BLOCKED (3 FAILs — Breaking changes, Security surface, Implementation Checklist Section, all
tracing to one underlying gap (Gap 9: a third `security_invoker=on`+INNER-JOIN-to-`users` view,
`component_dependencies_graph_view_v3`, missing from Blast Radius/checklist and currently ungranted —
live 42501 today for 3 real callers) — plus 2 CONCERNs: Gap 7 (demo_hunt_leaderboard's identical
latent mechanism, unchanged from before) and Gap 10 (public_profiles column list omits `name`).
Return to PLAN-SUPPLEMENT: the plan must extend Blast Radius/checklist to cover
`component_dependencies_graph_view_v3` with the same `public_profiles` substitution + grant pattern
already established for Gap 6, add `name` to the `public_profiles` column list, and widen Step A2's
audit methodology to trace through shared query-helper modules. The Step C3 live-DDL hard stop
remains in force regardless of this gate's outcome.)
Accepted by: N/A — Gate is BLOCKED; no CONCERN acceptance applies until the FAILs are resolved or the
user explicitly converts them to CONDITIONAL with documented rationale.
