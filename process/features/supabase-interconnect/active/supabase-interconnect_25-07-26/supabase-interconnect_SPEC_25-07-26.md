---
name: plan:supabase-interconnect-spec
description: "Product-discovery SPEC for supabase-interconnect — fix + connect existing Supabase surface, no new product features"
date: 25-07-26
feature: supabase-interconnect
---

# SPEC — Supabase Interconnect

> **Supplement note (25-07-26):** this SPEC was revised after a user-approved, READ-ONLY live-database
> diagnostic (`information_schema.role_table_grants`, `pg_policies`, `pg_class`, `pg_proc`,
> `pg_extension`, row counts). Findings that were previously "suspected"/"unverified" are now cited as
> **"live-DB audit, 2026-07-25"** throughout. Sections not touched by these findings are unchanged from
> the prior draft.

## Summary

The clearest single explanation for "everything seems not interconnected" is now confirmed: the
TypeScript types file (`apps/web/types/supabase.ts`) describes a database roughly **twice the size** of
the one that actually exists. It claims 70 RPC functions; the live database has 33. It claims 11
views; the live database has 4. It's missing 2 tables (`rate_limits`, `_prisma_migrations`) that
genuinely do exist. This file was almost certainly inherited from the upstream 21st.dev project and
describes *their* schema, not this one — so every developer or agent that trusted it has been
reasoning about capabilities that were never built here.

On top of that doc-vs-reality gap, a live-database audit (2026-07-25) confirmed a real production bug:
a security lockdown three days earlier revoked table grants repo-wide, and the restore script only
brought back 14 of the tables users actually need — bookmarking is confirmed broken today, not
suspected. A background job system several features depend on was never built, and the two database
functions families it would call (embedding generation, hunt/contest scoring) don't exist in the
database at all — the read side of search works, the write side has no implementation to schedule.
The main navigation sends people to a different page than the one that's actually live. Two payment
providers both try to grant subscriptions, and the newer one (Lemon Squeezy, which is the one people
actually use to pay) is missing basic account-management screens.

This program does **not** build new product features. It repairs what's broken, wires up what's
built-but-inert, makes the navigation tell the truth, finishes the payment migration that was started,
and reconciles the database schema's version-controlled source with what's actually live — including
regenerating the fictional types file from reality. When it's done, a user's click should go where the
label says it goes, search should return results, the contest leaderboard should show real scores (once
seeded), and a Lemon Squeezy subscriber should be able to manage their own subscription.

## User Stories / Jobs To Be Done

1. **As a logged-in visitor, I want to bookmark a component**, so that I can find it again later —
   without the page silently failing. *(Confirmed broken today — live-DB audit, 2026-07-25.)*
2. **As any visitor, I want the sidebar's category counts to reflect what's actually in the catalog**,
   so that I don't click into a category expecting 130 items and find a handful.
3. **As a visitor using search, I want search to return results**, so that the search box isn't a dead
   end.
4. **As a contest participant, I want the leaderboard and hunt scores to update**, so that competing
   isn't pointless. *(Requires both a working scoring engine AND at least one seeded contest round —
   see Cross-Cutting Requirement below.)*
5. **As a user clicking "Templates" (or any main nav item), I want to land on the actual Templates
   page**, so that the navigation isn't lying to me.
6. **As a Lemon Squeezy subscriber, I want to cancel my subscription or view my invoices from my
   account settings**, so that I'm not locked out of managing something I'm paying for.
7. **As the site operator, I want confirmation that the grant rollback actually restored access on the
   live database**, so that I'm not relying on an assumption that a SQL file "should have" fixed
   production. *(Partially satisfied by this session's audit — see Gap 1 below for what's still
   missing.)*
8. **As the site operator, I want the database's version-controlled source and the generated types
   file to both match what's actually live**, so the codebase (not a stale generated file or tribal
   knowledge) is the source of truth for the schema.
9. **As the site operator, I want the recurring jobs (embeddings, hunt scoring) to run on a schedule**,
   even though I have to personally execute the one privileged install step on the VPS — and I want the
   underlying scoring/generation logic to actually exist in the database before anything schedules it.
10. **As the site operator, I want the two payment webhooks (Stripe and Lemon Squeezy) to never both
    grant a plan to the same event**, so paid access can't be double-triggered or corrupted.

## What The User Wants (Behavioral Outcomes)

- Every browser-facing Supabase read/write that a logged-in user's action can trigger succeeds (or
  fails with a normal error state) — it does not throw an unhandled Postgres permission error.
- Bookmarking a component from the component detail page or the preview dialog works and persists.
- Sidebar category counts are live numbers pulled from the catalog, not hand-typed numbers frozen in
  time.
- The main nav's "Templates" link (and any other item with both a tab-based and a route-based
  destination) sends the user to one single, correct destination — the two no longer disagree.
- The database functions that generate embeddings and compute hunt/contest scores actually exist in
  the database (they don't today), and recurring background jobs invoke them automatically on a
  schedule once the operator completes the one-time VPS install step; the repo delivers everything
  needed to install and does not require further code changes to activate.
- Search returns real results once the embedding job has populated the vector tables (this SPEC
  requires the job — and the DB functions it calls — exist and run; it does not require immediate
  historical backfill beyond what the existing manual script already provides).
- Contest/hunt pages (`/contest`, `/contest/leaderboard`, `/admin/leaderboard`) are capable of
  displaying updating scores once a contest round has been seeded — the pages are not required to show
  data on a database that has never had a round created (see Cross-Cutting Requirement).
- A Lemon Squeezy subscriber can cancel their subscription and view invoices from
  `/settings/billing`, using the same screen a Stripe subscriber uses today.
- The generated `apps/web/types/supabase.ts` file accurately reflects the live database (33 functions,
  4 views, 41 tables) instead of the current ~70-function/11-view fiction, and every RPC function
  actually referenced anywhere in `apps/web` has a matching version-controlled `CREATE FUNCTION`
  definition someone can read, diff, and review.
- The Supabase grant/RLS state is verified against the **live** database (not just the presence of a
  SQL file in the repo) before this program is considered done.

## Flow / State Diagram

### Current (broken) interconnect state

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER CLIENT (RLS-enforced, 41 files)                             │
│  ┌───────────────┐   ┌────────────────┐   ┌─────────────────────┐   │
│  │ BookmarkButton │──▶│ demo_bookmarks │──▶│ 42501 permission     │   │
│  │ (2 hot surfaces)│   │  NOT GRANTED   │   │ denied (CONFIRMED     │   │
│  │                │   │ (confirmed:    │   │ LIVE BUG — 25-07-26   │   │
│  │                │   │ live-DB audit) │   │ audit)                │   │
│  └───────────────┘   └────────────────┘   └─────────────────────┘   │
│  Also ungranted: prompt_rules, demo_hunt_leaderboard (view),         │
│  plans, component_analytics, collections, feedback, author_payouts,  │
│  payout_rates, bundles, demo_hunt_scores — confirmed via live grant  │
│  audit against the 14-relation authenticated grant list (below).     │
│                                                                       │
│  ┌───────────────┐   ┌────────────────┐   ┌─────────────────────┐   │
│  │ Nav "Templates"│──▶│ ?tab=templates │──▶│ Different page than  │   │
│  │                │   │ on "/"         │   │ /templates route     │   │
│  └───────────────┘   └────────────────┘   └─────────────────────┘   │
│                                                                       │
│  ┌───────────────┐   ┌────────────────┐   ┌─────────────────────┐   │
│  │ Sidebar counts │──▶│ hand-typed     │──▶│ Stale / wrong        │   │
│  │                │   │ numbers        │   │ numbers               │   │
│  └───────────────┘   └────────────────┘   └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCHEDULER + SCORING/GENERATION ENGINE (BOTH absent — worse than     │
│  originally assumed: the callee functions don't exist, not just the  │
│  cron)                                                                │
│  ┌────────────────┐        X        ┌──────────────────────────┐    │
│  │ vercel.json     │────never fires──▶│ update_all_hunt_scores, │    │
│  │ cron declarations│ (app is on VPS,│ process_next_round, etc. │    │
│  │                 │  not Vercel;   │ — CONFIRMED NOT IN LIVE  │    │
│  │                 │  AND pg_cron   │ DATABASE (live-DB audit)  │    │
│  │                 │  is not even   │                           │    │
│  │                 │  an installed  │ insert_embedding,         │    │
│  │                 │  extension)    │ get_missing_usage_        │    │
│  │                 │                │ embedding_items — ALSO    │    │
│  │                 │                │ CONFIRMED NOT IN LIVE DB  │    │
│  └────────────────┘                  └──────────────────────────┘    │
│  Read/search side DOES exist live: match_embeddings,                 │
│  match_embeddings_with_details, search_demos_ai_oai_v2/_extended     │
│  result: search returns nothing (no writer, not just no schedule);   │
│  contest/hunt scoring has zero DB implementation to schedule;        │
│  additionally component_hunt_rounds has 0 rows — no round has ever   │
│  been created, so even a working engine renders an empty leaderboard │
│  until a round is seeded.                                            │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  BILLING (half-migrated)                                             │
│  Lemon Squeezy (LIVE checkout) ──writes──▶ users_to_plans (0 rows —  │
│  Stripe (checkout 503'd, webhooks still active) ──writes──▶ same     │
│  table — no subscription has ever actually been recorded live)       │
│  Settings > Billing "Cancel" / "Invoices" ──calls──▶ Stripe-only route │
│                                              (breaks for LS subscribers)│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  SCHEMA SOURCE OF TRUTH — INVERTED FROM PRIOR ASSUMPTION              │
│  Live DB: 33 RPC functions, 4 views   Repo (supabase/*.sql): ~32 fns │
│  ────────────────────────────────────────────▶  tracked SQL is       │
│                                                   ROUGHLY RIGHT.       │
│  apps/web/types/supabase.ts claims: 70 functions, 11 views            │
│  ────────────────────────────────────────────▶  the GENERATED TYPES   │
│                                                   FILE is the thing    │
│                                                   that's wrong — it    │
│                                                   over-describes       │
│                                                   reality by ~2×,      │
│                                                   almost certainly     │
│                                                   inherited from       │
│                                                   upstream 21st.dev.   │
│  Also: rate_limits + _prisma_migrations tables exist live but are     │
│  ABSENT from types.ts entirely (opposite direction of drift).         │
└─────────────────────────────────────────────────────────────────────┘
```

### Target (repaired) interconnect state

```
Browser client ──▶ demo_bookmarks / prompt_rules / demo_hunt_leaderboard (view)
                   ──▶ GRANT verified live ──▶ 200 / expected data (no 42501)

Nav item ──▶ single resolved destination (route OR tab, not both) ──▶ correct page

Sidebar counts ──▶ live query (reconciled with in-flight useCategoryTagCounts WIP)
                   ──▶ accurate numbers

Hunt/embedding DB functions authored + version-controlled FIRST
   ──▶ THEN VPS crontab / systemd timer (installed by operator, scripts delivered
        by repo) invokes them on schedule
   ──▶ embedding job runs on schedule ──▶ usage_embeddings/code_embeddings populate
   ──▶ hunt scoring RPCs run on schedule ──▶ demo_hunt_scores update (once a round
        exists — seed data required to observe this, see Cross-Cutting Requirement)
   ──▶ contest/leaderboard pages show live data

Settings > Billing "Cancel" / "Invoices"
   ──▶ provider-aware routing (Stripe subscriber → Stripe route,
        Lemon Squeezy subscriber → Lemon Squeezy route)
   ──▶ both webhook families write users_to_plans with a documented
        mutual-exclusion guarantee (no double-grant)

Every RPC called from apps/web ──▶ matching CREATE FUNCTION in supabase/migrations/
   ──▶ git diff-able schema history
   ──▶ apps/web/types/supabase.ts regenerated from the LIVE database (33 fns,
        4 views, 41 tables) ──▶ types file matches reality, phantom entries removed
```

## Acceptance Criteria (Testable Outcomes)

> **Cross-cutting requirement (new, F6-driven — applies to every criterion below that references a
> table with near-zero live rows):** an acceptance criterion is unprovable on an empty table. Every
> criterion in this SPEC that depends on visible data (contest leaderboard, collections, bookmarks
> list, billing history) is stated as **"wiring is correct given seeded/real data"**, not "the page
> currently shows data" — most of these tables are genuinely empty in the live database today
> (live-DB audit, 2026-07-25: `component_hunt_rounds`=0 rows, `collections`=0, `users_to_plans`=0,
> `component_likes`=0, `demo_hunt_scores`=0, etc.). Where a surface cannot otherwise be verified, the
> phase that implements it must also produce minimal seed data as part of its own verification step
   (not as a new product feature — seeding test fixtures is a testing/verification action, not scope
> creep).

1. **Every browser-client Supabase call succeeds against the live database with no `42501`
   permission-denied error**, across all 41 files identified as using `useClerkSupabaseClient`
   (`apps/web/lib/clerk.ts:63`) — including but not limited to `demo_bookmarks`, `prompt_rules`, and
   the `demo_hunt_leaderboard` view. **Confirmed baseline (live-DB audit, 2026-07-25):** the
   `authenticated` role currently holds grants on exactly these 14 relations — `api_keys`,
   `component_hunt_rounds`, `component_tags`, `components`, `demo_tags`, `demos`,
   `mcp_generation_requests`, `sandboxes`, `submissions`, `tags`, `templates`, `usages`, `users`,
   `users_to_plans` — with 27 RLS policies across them. `demo_bookmarks`, `prompt_rules`, `plans`,
   `component_analytics`, `collections`, `feedback`, `author_payouts`, `payout_rates`, `bundles`,
   `demo_hunt_scores`, and the `demo_hunt_leaderboard` view are confirmed **absent** from this grant
   list — no dashboard hand-patch was ever applied.
   `proven by:` a live-database verification pass exercising each browser-client query path (manual or
   scripted against the real Supabase project) plus a targeted `BookmarkButton` interaction check on
   the component detail page and preview dialog, re-run after the grant fix lands.
   `strategy:` Agent-Probe (requires a live Supabase connection — baseline established this session;
   re-verification after the fix still requires a live connection).

2. **Bookmarking a component from the component detail page and from the preview dialog persists and
   survives a page reload.** *(Confirmed broken today — this criterion describes the post-fix state.)*
   `proven by:` an integration/E2E scenario driving the bookmark button in both surfaces
   (`apps/web/app/[username]/[component_slug]/page.client.tsx`,
   `apps/web/components/features/component-page/preview-dialog.tsx`) against a real or seeded
   Supabase session.
   `strategy:` Hybrid (automatable in Playwright with a real/test Supabase project; requires live DB
   for full confidence).

3. **A full audit of all 41 browser-client files confirms zero remaining ungranted tables/views** —
   the confirmed 14-relation grant list above is the baseline, and the audit's job is to find any
   table/view referenced in those 41 files that isn't on it.
   `proven by:` a systematic cross-reference of every `.from()`/`.rpc()` call site in the 41 files
   against the confirmed live grant list (source-level diff, largely deskable now that the grant list
   is known), with a final live confirmation pass after any newly-discovered gaps are fixed.
   `strategy:` Hybrid (the cross-reference itself is Fully-Automated/deskable now that the baseline
   grant list is known; the final live confirmation remains Agent-Probe).

4. **Sidebar category counts reflect a live query against `demo_tags`/`component_tags`**, reconciled
   with the in-flight uncommitted `useCategoryTagCounts()` work in `apps/web/lib/queries.ts` and
   `sidebar-layout.tsx` rather than a parallel reimplementation.
   `proven by:` a unit/component test asserting the sidebar renders counts from the live-query hook,
   not the hardcoded `demosCount` values in `lib/navigation.ts`.
   `strategy:` Fully-Automated (vitest/RTL, following the existing landing-page test pattern in
   `process/context/tests/all-tests.md`).

5. **The database functions that generate embeddings and score hunt/contest rounds are authored and
   version-controlled BEFORE any scheduler is wired to call them** (dependency order, not optional —
   live-DB audit, 2026-07-25 confirmed these are missing entirely, not merely unscheduled):
   `update_all_hunt_scores`, `process_next_round`, `process_single_round`, `update_single_demo_score`,
   `update_hunt_demos_metrics`, `get_missing_usage_embedding_items`, `insert_embedding`,
   `insert_code_embedding`, `vec_dim` must each exist as a `CREATE FUNCTION` in
   `supabase/migrations/` before AC7's scheduler work begins. A scheduler wired to non-existent
   functions is not an acceptable intermediate state.
   `proven by:` a migration file diff showing each function created, plus a local invocation of each
   new function against a scratch/seeded row confirming it executes without error.
   `strategy:` Fully-Automated (SQL migration + local execution against a disposable/test schema).

6. **The recurring background-job scheduler (embedding generation, hunt scoring) runs on a recurring
   schedule without manual invocation**, calling the functions authored under AC5. `pg_cron` is
   confirmed **not installed** as an extension on the live database (live-DB audit, 2026-07-25 — full
   installed-extension list: `pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`,
   `uuid-ossp`, `vector`), so the VPS-crontab/systemd-timer approach is the only viable path — not
   merely the preferred one. The repo delivers everything the operator needs to install it (cron
   script, systemd/crontab unit file, exact install command) so the only remaining step is the operator
   running one privileged command on gayo-vps.
   `proven by:` a dry-run/local execution of the delivered script confirms it invokes the same code
   path as `apps/web/scripts/generate-embeddings.ts` and the new AC5 functions; the install artifact is
   reviewed for correctness. Live schedule firing on the VPS is confirmed by the operator post-handoff
   and is **not** a blocking gate for this program's completion (see Constraints).
   `strategy:` Hybrid (script correctness is Fully-Automated/local; live cron firing is an operator
   Agent-Probe outside this program's automation boundary).

7. **Search returns non-empty results for at least one representative query once the AC5 embedding
   functions exist and the embedding job has run at least once** (manually or via the new schedule).
   The read/search-side RPCs (`match_embeddings`, `match_embeddings_with_details`,
   `search_demos_ai_oai_v2`, `search_demos_ai_oai_extended`) are confirmed **already live and correct**
   — this criterion is exclusively about the missing write/generation side.
   `proven by:` an integration check against `/api/search` after running the delivered embedding job
   (built on the AC5 functions) locally/against a seeded table.
   `strategy:` Agent-Probe (requires `OPENAI_API_KEY` + live Qdrant/Supabase — currently absent per
   Known Gaps).

8. **Once a contest round is seeded, the hunt/contest scoring RPCs authored under AC5 are invoked by
   the new scheduler**, and `/contest`, `/contest/leaderboard`, and `/admin/leaderboard` render
   non-empty, updating data after at least one scheduled run against that seeded round.
   `component_hunt_rounds` is confirmed to have **zero rows today** (live-DB audit, 2026-07-25) — no
   round has ever been created, independent of the scoring engine's absence. Per the Cross-Cutting
   Requirement, this program's verification step must seed at least one round; the criterion is not
   satisfied by an empty-but-correctly-wired page.
   `proven by:` an integration check calling the scheduler script locally against a seeded contest
   round (seeded as part of this program's own verification, not a new product feature), then
   asserting the leaderboard pages render updated scores.
   `strategy:` Hybrid.

9. **Every main-nav item resolves to exactly one destination** — no item simultaneously has a live
   tab-based destination (`?tab=`) and a disagreeing standalone route. `/templates` specifically is
   reconciled so the nav item and the route show the same page.
   `proven by:` an automated route-reachability check (new or extended, e.g. building on
   `e2e/a11y.spec.ts`'s route list) asserting every nav-declared destination loads the expected page
   content, plus a regression check that `/public-dashboard` and `/import-old` are either linked from
   somewhere discoverable or intentionally documented as admin/internal-only (not silently orphaned).
   `strategy:` Fully-Automated (Playwright).

10. **A Lemon Squeezy subscriber can cancel their subscription and view invoices from
    `/settings/billing`**, using a Lemon-Squeezy-aware code path (not silently routed to the
    Stripe-only endpoints at `page.client.tsx:184,159`). `users_to_plans` is confirmed to have **zero
    rows today** (live-DB audit, 2026-07-25) — no real subscription has ever been recorded, so this
    criterion's routing logic must be verified against fixtures, not live subscriber data (per the
    Cross-Cutting Requirement).
    `proven by:` a component/integration test asserting the billing page selects the correct
    cancel/invoice code path based on the user's actual provider (read from `users_to_plans` or
    equivalent), covering both a Stripe-provider fixture and a Lemon-Squeezy-provider fixture.
    `strategy:` Fully-Automated (vitest/RTL with mocked provider state) for the routing logic;
    Agent-Probe for confirming the real Lemon Squeezy API calls succeed end-to-end (no live LS test
    account confirmed available — see Known Gaps).

11. **The Stripe and Lemon Squeezy webhooks cannot both grant a plan for the same billing event** —
    a documented mutual-exclusion mechanism (e.g. provider-tagged rows, idempotency key, or
    exclusivity check) prevents a double-write to `users_to_plans`.
    `proven by:` a unit test simulating both webhooks firing for equivalent events and asserting only
    one grant lands / the second is a no-op or rejected.
    `strategy:` Fully-Automated (vitest, mocking both webhook handlers).

12. **`apps/web/types/supabase.ts` is regenerated from the live database and matches reality**: 33
    RPC functions, 4 views (`mv_component_analytics`, `component_dependencies_graph_view_v3`,
    `components_with_username`, `demo_hunt_leaderboard`), and all 41 live tables including
    `rate_limits` and `_prisma_migrations` (both confirmed live but currently absent from the types
    file — live-DB audit, 2026-07-25). Every phantom entry the old file claimed
    (`component_stats`, `component_hunt_current_round`, `referral_analytics`,
    `monthly_referral_analytics`, `mv_detailed_component_analytics`,
    `component_dependencies_graph_view`/`_v2`, and ~37 phantom functions) is removed from the
    generated file. A new `supabase/migrations/` directory becomes the version-controlled source of
    truth, and every RPC function called anywhere in `apps/web` (via `.rpc()`) has a matching
    `CREATE FUNCTION` definition inside it.
    `proven by:` a script or manual audit diffing the live `pg_proc`/`pg_class` catalogs against both
    `apps/web/types/supabase.ts` and `supabase/migrations/**/*.sql`, confirming zero gaps in either
    direction for functions actually called from `apps/web`.
    `strategy:` Agent-Probe (requires live DB introspection to regenerate/confirm against; the
    resulting diff review is Fully-Automated).

13. **The grant-restoration fix (`supabase/restore-authenticated-grants.sql`) is extended to cover the
    confirmed-missing relations** (`demo_bookmarks`, `prompt_rules`, `demo_hunt_leaderboard`) **and
    applied against the live production database**, verified by live query — not assumed from the SQL
    file's presence in the repo. The commented-out `public_profiles` block is either applied or
    explicitly deferred with a documented reason. Additionally, `templates`'s excess `anon` write
    grants (`INSERT`/`UPDATE`/`DELETE` — confirmed present but inert today because no `anon`-targeted
    RLS policy permits those writes; low-severity defense-in-depth hygiene, not an active
    vulnerability) are revoked as part of the same grant-hardening pass.
    `proven by:` a live `information_schema.role_table_grants` (and `pg_policies`) query against
    production, run before and after the fix, confirming the expected grant set — recorded as evidence
    in a phase report. The 2026-07-25 audit's 14-relation grant list serves as the documented
    pre-fix baseline.
    `strategy:` Agent-Probe.

14. **`process/context/all-context.md`'s at least 3 identified stale claims (local_users dual-store,
    "Lemon Squeezy is dead", themes surface) are corrected** via a `vc-audit-context` pass, so future
    agents don't re-derive wrong assumptions from this file.
    `proven by:` a diff of `all-context.md` showing the three claims corrected, verified by
    `vc-audit-context`'s standard checks.
    `strategy:` Fully-Automated (doc-only change, verified by the existing `vc-audit-context`
    validator scripts).

## Out Of Scope

This program explicitly does **not** build any of the following, even though they touch the same
tables and would be natural next steps:

- **Collection membership UI** — `collections` / `components_to_collections` stay read-only-adjacent;
  no new UI for users to add/remove components from a collection. (`collections` is confirmed to have
  0 live rows — this is not a data-population task either.)
- **Creator-payout write path** — `author_payouts` / `payout_rates` remain read-only. Nobody gets a
  new feature to trigger or record a payout. The existing zero-value read surface is accepted as a
  known gap (see below), not fixed by writing payouts.
- **Referral program** — `referral_analytics` / `monthly_referral_analytics` stay dormant/orphaned.
  No referral feature is built or wired.
- **Bundle purchases** — `bundle_purchases` stays written only by the non-live Stripe v2 path; no new
  bundle-purchase feature or UI is added. (Confirmed 0 live rows across `bundles`, `bundle_items`,
  `bundle_plans`, `bundle_purchases`.)
- **Deleting the 6 confirmed-dead tables** (`code_embeddings`, `usage_embeddings`,
  `backup_code_embeddings`, `backup_usage_embeddings`, `components_to_collections`,
  `demo_hunt_winners`) — they are documented as dead in this program's findings, not dropped from the
  schema. (All confirmed 0 live rows.)
- **Deleting orphaned views/RPCs** (`component_dependencies_graph_view`/`_v2`,
  `mv_detailed_component_analytics`, `components_with_username`, `component_stats`,
  `component_hunt_current_round`, `get_hunt_demos_list_v3`, `get_user_profile_demo_list_v2`,
  `check_api_key`/`_v2`, etc.) — they are documented and version-controlled (per AC12) but not
  removed. Note per F2: several of these (e.g. `component_stats`, `component_hunt_current_round`,
  `referral_analytics`, `monthly_referral_analytics`, `mv_detailed_component_analytics`,
  `component_dependencies_graph_view` v1/v2) do not actually exist live at all — they are phantom
  entries in `types.ts` being removed, not live objects being preserved-but-undocumented.
- **Any new product feature** not already shipped in some partial/inert form — this program connects
  and repairs existing surfaces only. Minimal seed-data fixtures created solely to make an acceptance
  criterion observable (per the Cross-Cutting Requirement) are a verification action, not a feature.
- **Historical embedding backfill at scale** — the scheduler makes the job run going forward; a full
  backfill of all historical components/demos is not required by this SPEC (the existing manual
  `generate-embeddings.ts` script remains the documented fallback for a one-time backfill if the
  operator chooses to run it).
- **Live-provider billed feasibility probes** requiring real Stripe/Lemon Squeezy charges — verification
  uses test-mode/mocked provider calls, not live money movement.
- **Authoring any DB function beyond the 9 named in AC5** — the F3 finding only confirms these 9 are
  missing and required by the scheduler/search gaps already in scope; authoring additional net-new
  RPCs not already referenced by existing app code remains out of scope.

## Constraints

- **No new product features.** Every acceptance criterion repairs, connects, or documents something
  that already exists in the codebase or live database today (or authors the small, named set of DB
  functions in AC5 that existing app-adjacent scheduling logic already depends on).
- **Scheduler handoff is a hard-stop, not a blocker.** The phase(s) that need a scheduler must deliver
  the cron scripts, the systemd/crontab unit file, and the exact install command(s) as repo artifacts.
  `pg_cron` is confirmed not installed (live-DB audit, 2026-07-25), so this VPS-crontab path is the
  only viable mechanism, not merely the chosen one. The user personally runs the one privileged install
  step on gayo-vps (`ssh root@72.62.196.231`, per the deployment memory). This program is NOT blocked
  on the user completing that step — AC6's "live schedule firing" confirmation is explicitly
  non-blocking (see AC6's `proven by:` note).
- **DB functions before scheduling (F3 dependency order).** No phase may wire a scheduler to a
  hunt-scoring or embedding-generation function that does not yet exist in the live database. AC5 is a
  hard predecessor of AC6/AC7/AC8.
- **Deploy path.** Any code change ships via the documented gayo-vps pm2 deploy procedure (see
  `process/context/all-context.md` §Deployment) — never Vercel, despite `vercel.json`'s presence.
- **`.env` access boundary — narrowed by this session's approved audit.** The user has already
  approved and the orchestrator has already executed one READ-ONLY diagnostic pass against the live
  database (grants, policies, table/view/function inventory, row counts) — that specific approval does
  not need to be re-requested. Any *further* live-credential access beyond what this diagnostic already
  covered (e.g. live write operations, edge-function deployment checks requiring dashboard/API access)
  must either request explicit new user authorization for that specific check, or degrade to a
  documented Known Gap rather than fabricate a result.
- **~45 uncommitted files exist in the working tree today**, including WIP `useCategoryTagCounts()`
  work in `apps/web/lib/queries.ts` and a partial rewrite of `sidebar-layout.tsx`. Any phase touching
  sidebar counts or category queries MUST reconcile with this WIP, not duplicate or overwrite it.
- **Grant fixes must be verified against the live database, never assumed from the presence of a SQL
  file in the repo** (per AC13) — this is the direct lesson from Gap 1 already having escaped once. The
  2026-07-25 audit's 14-relation baseline is the documented pre-fix state; any new grant work must be
  re-verified live post-fix, not assumed correct from the diff alone.
- **Wiring-correctness vs data-presence must be distinguished in every test/verification artifact**
  (Cross-Cutting Requirement, F6-driven) — a passing test against an empty table proves nothing; seed
  minimal fixtures where a surface has no live data to observe against.
- **Dual-write safety.** Any billing fix must not weaken existing webhook signature verification or
  the existing `payment_status` allow-list gate documented in `all-context.md`.
- **Existing test/build gates stay green.** Whatever the current vitest/tsc/build baseline is at
  program start (see `process/context/tests/all-tests.md` for the last recorded count), it must not
  regress as a side effect of this program's changes.

## Open Questions

None — the two major forks (scope boundary and scheduler ownership split) were locked via clarification
before this SPEC was written; see the LOCKED clarifications in the session context. The live-database
diagnostic that was outstanding at first-draft time has since run (see the Known Gaps resolutions
below); any remaining secondary ambiguity is captured as a Known Gap for PLAN/INNOVATE to resolve, not
an open SPEC question.

## Known Gaps / Documented Risks

These are accepted, explicitly documented risks/limitations — not blockers to writing or approving
this SPEC:

- **Creator-payout read surface will keep showing zeros.** Since writing payout rows is out of scope,
  `app/api/author/stats/route.ts:155,184` continues to render `author_payouts`/`payout_rates` reads
  that are always empty. This is expected, not a regression. (Confirmed both tables are 0 live rows.)
- **Edge-function deployment status is unverified.** Whether `supabase/functions/generate-embeddings`
  and `ai-search-oai` are actually deployed to the live Supabase project (vs. only present in the
  repo) has not been confirmed this session — the READ-ONLY diagnostic covered grants/policies/schema
  inventory/row counts only, not edge-function deployment state.
- **No live Lemon Squeezy test account confirmed available** for end-to-end verification of AC10's
  cancel/invoice flow — the routing-logic half of AC10 is Fully-Automated, but the "real LS API call
  succeeds" half is Agent-Probe and may end in INCONCLUSIVE if no test credentials exist.
- **No `apps/web/.env.example` exists.** There is no authoritative list of required env vars for
  `apps/web` specifically (only a stale root `.env.example`). This is a process gap this program may
  choose to close as a side effect of AC6/AC7's env-var needs, but it is not itself a numbered
  acceptance criterion.

**Resolved this session (moved out of Known Gaps — now cited as verified facts above, live-DB audit
2026-07-25):**
- ~~Live row counts unverified~~ → confirmed (see Cross-Cutting Requirement and per-criterion notes).
- ~~DB-side `pg_cron` existence unverified~~ → confirmed NOT installed (see AC6, Constraints).
- ~~Whether a dashboard hand-patch restored the grants~~ → confirmed no — the 14-relation grant list is
  the complete, unpatched state; no manual dashboard grant was ever applied.

## Background / Research Findings

Established this session by three parallel research agents (initial pass) plus a subsequent
user-approved READ-ONLY live-database diagnostic (`information_schema.role_table_grants`,
`pg_policies`, `pg_class`, `pg_proc`, `pg_extension`, row counts) — cited below as **"live-DB audit,
2026-07-25"**; all citations verified against source or live database at the time noted.

**Architecture:** Three uncoordinated data-access layers hit one Supabase Postgres database —
service-role admin client (`apps/web/lib/supabase.ts:21`, bypasses RLS, server-only), browser client
(`apps/web/lib/clerk.ts:63`, RLS-enforced, used in 41 files), and Prisma direct connection (bypasses
RLS, `apps/web/lib/api/server/*`). App reaches 29 tables via `.from()`, 21 RPCs via `.rpc()`.
**Live DB (confirmed, live-DB audit 2026-07-25): 41 tables, 4 views (1 matview), 33 RPC functions —
not the 40/11/70 figures `apps/web/types/supabase.ts` claims.**

**Gap 1 (live prod bug, highest severity — CONFIRMED, not suspected).** `supabase/enable-rls.sql`
(2026-07-22) revoked all `anon`/`authenticated` grants repo-wide. `supabase/restore-authenticated-grants.sql`
(commit `6358da7`, 2026-07-24) restored grants — but the live-DB audit (2026-07-25) confirms
`authenticated` currently holds grants on exactly 14 relations (`api_keys`, `component_hunt_rounds`,
`component_tags`, `components`, `demo_tags`, `demos`, `mcp_generation_requests`, `sandboxes`,
`submissions`, `tags`, `templates`, `usages`, `users`, `users_to_plans`; 27 RLS policies total), and
`demo_bookmarks`, `prompt_rules`, and the `demo_hunt_leaderboard` view remain ungranted while still
queried from the browser client (`apps/web/lib/queries.ts:627,644,701,725,750,783,824,859,1257`),
affecting the two highest-traffic bookmark surfaces (`page.client.tsx:940,950`,
`preview-dialog.tsx:419,429`). Also confirmed absent from the grant list: `plans`,
`component_analytics`, `collections`, `feedback`, `author_payouts`, `payout_rates`, `bundles`,
`demo_hunt_scores`. A `public_profiles` grant exists only inside a commented-out block
(`restore-authenticated-grants.sql:295`) and was never applied. No dashboard hand-patch was applied —
confirmed by the audit matching the SQL file's restored scope exactly.

**Gap 2 (scheduler AND scoring/generation engine both absent — worse than originally assumed).**
`apps/web/vercel.json:8` declares crons that never fire because the app runs on gayo-vps pm2, not
Vercel. Live-DB audit (2026-07-25) confirms `pg_cron` is **not** an installed extension (installed set:
`pg_stat_statements`, `pgcrypto`, `plpgsql`, `supabase_vault`, `uuid-ossp`, `vector`) — so a database-
side scheduler alternative is unavailable, not merely undesired. More significantly, the audit confirms
the functions a scheduler would need to call **do not exist in the live database at all**:
`update_all_hunt_scores`, `process_next_round`, `process_single_round`, `update_single_demo_score`,
`update_hunt_demos_metrics` (hunt/contest scoring) and `get_missing_usage_embedding_items`,
`insert_embedding`, `insert_code_embedding`, `vec_dim` (embedding generation/backfill) are all absent.
The read/search side is confirmed present and working: `match_embeddings`,
`match_embeddings_with_details`, `search_demos_ai_oai_v2`, `search_demos_ai_oai_extended` all exist
live — consumer path (`/api/search`/`/api/search-mcp` → `ai-search-oai` edge fn →
`search_demos_ai_oai_extended` RPC) is wired, only the producer/write side has no DB implementation.
Consequence: writing a cron before authoring these 9 functions would call non-existent functions and
fail — dependency order matters (see AC5, Constraints). Vector columns confirmed live on:
`code_embeddings.embedding`, `usage_embeddings.embedding`, `backup_code_embeddings.embedding`,
`backup_usage_embeddings.embedding`, `demos.embedding`, `demos.embedding_oai`. Matviews
`mv_component_analytics` (confirmed live, `security_invoker` unset — matviews don't support it) also
lack an app-level refresh trigger.

**Gap 3 (dual navigation systems):** Main nav items are tab values
(`apps/web/hooks/use-navigation.ts:96-105` → `navigateToTab()` → `?tab=` on `/`), while real standalone
routes also exist for overlapping concepts. `/templates` (real page, but nav sends `?tab=templates`
instead), `/public-dashboard` and `/import-old` (zero inbound links) are drifted/orphaned.
`/c/[collection_slug]` and `/maintenance` are confirmed correctly wired, not orphaned. Sidebar counts
are hardcoded in `lib/navigation.ts` (`getTagDemosCount()`, `queries.ts:1098-1102`). A WIP,
uncommitted `useCategoryTagCounts()` (+40 lines `queries.ts`) and a +231-line `sidebar-layout.tsx`
rewrite already target this gap and must be reconciled, not duplicated. `themes` has zero references
in `apps/web` despite being documented as live in `all-context.md` — pure doc drift.

**Gap 4 (billing half-migrated, and confirmed never actually exercised end-to-end):** Lemon Squeezy is
the live checkout path (4 call sites: `pricing/page.client.tsx:69`, `upgrade-pro-step.tsx:69`,
`settings/billing/page.client.tsx:230`, magic onboarding); its webhook writes `users_to_plans`
(`app/api/lemonsqueezy/webhook/route.ts:59-109`). Stripe v1+v2 webhooks also fully write
`users_to_plans` (`app/api/stripe/webhook/v2/route.ts`) despite checkout being 503'd
(`create-checkout/route.ts:9-17`). **Live-DB audit (2026-07-25) confirms `users_to_plans` has 0 live
rows** — no subscription, from either provider, has ever actually been recorded in production. Cancel/
invoice management (`settings/billing/page.client.tsx:184,159`) still calls Stripe-only routes,
breaking for LS subscribers whenever one does eventually sign up. Both webhook families writing the
same table remains a documented double-write hazard regardless of current zero-row state. Creator
payouts read-only (`api/author/stats/route.ts:155,184`), never written — out of scope per locked
clarification; confirmed 0 rows on both `author_payouts` and `payout_rates`.

**Gap 5 (schema source of truth — INVERTED from the prior draft's framing).** Live-DB audit
(2026-07-25) confirms the live database has **33 RPC functions and 4 views**, not the 70/11 the prior
draft assumed. Tracked `supabase/*.sql` defines ~32 functions — closely matching the 33 live, meaning
**the tracked SQL is approximately correct.** The party that is wrong is
`apps/web/types/supabase.ts`, which claims 70 functions and 11 views — over-describing reality by
roughly 2×, almost certainly inherited from the upstream 21st.dev project's schema rather than
describing this repo's. Confirmed live functions (33, full list): check_rate_limit,
components_dependencies_trigger, create_api_key, demos_dependencies_trigger,
get_admin_liked_demos_v1, get_collections_v1, get_daily_user_earnings_v2, get_demos_list_v2,
get_demos_submissions, get_hunt_demos_list_v2, get_pro_publishers, get_template_tags,
get_templates_v3, get_user_bookmarks_list, get_user_components_counts,
get_user_profile_demo_list, get_user_profile_demo_list_v2, get_user_state, hunt_toggle_demo_vote,
increment_api_usage, is_trigger_operation, match_embeddings, match_embeddings_with_details,
purchase_component, record_mcp_component_usage, requesting_user_id,
search_demos_ai_oai_extended, search_demos_ai_oai_v2, update_component_dependencies_closure,
update_component_with_tags, update_demo_info_as_admin, update_demo_tags,
update_submission_as_admin. Confirmed live views (4): `mv_component_analytics` (matview),
`component_dependencies_graph_view_v3`, `components_with_username`, `demo_hunt_leaderboard` (last
3 all `security_invoker=on`). Everything else `types.ts` lists as a view or function — including
`component_stats`, `component_hunt_current_round`, `referral_analytics`,
`monthly_referral_analytics`, `mv_detailed_component_analytics`,
`component_dependencies_graph_view` v1/v2 — does not exist live. Drift also runs the opposite
direction for tables: `rate_limits` (16 live rows) and `_prisma_migrations` exist live but are absent
from `types.ts` entirely. **Mitigating fact:** all 21 RPCs actually called from `apps/web` exist live
— there is no active runtime breakage from the phantom functions today; the risk is prospective (new
code trusting `types.ts` will call something that isn't there).

**Dormancy reconciled:** of 11 zero-`.from()` tables, only 6 are truly dead (listed in Out of Scope);
5 others are correctly reached indirectly through RPCs and are NOT gaps.

**Complete seams (confirmed working, not to be touched):** Clerk↔`users` sync is complete (no
`local_users` dual-store in this app despite `all-context.md`'s stale claim); R2/CodeSandbox degrade
gracefully when unconfigured; the Magic MCP usage-tracking loop (`check_rate_limit` →
`increment_api_usage` + `record_mcp_component_usage`) closes correctly.

**Env readiness:** no `apps/web/.env.example` exists; only a stale root-level one. Some integrations
guard on absence gracefully (Clerk webhook 500, Lemon Squeezy 503, Stripe 503, CRON_SECRET 401); others
do not (Supabase clients, R2 — both throw at module import time on missing env vars).

**Data population state (new, live-DB audit 2026-07-25 — explains a material share of apparent
"inertness" as absent data, not broken wiring):** Live row counts: `users`=1, `components`=4,
`demos`=4, `submissions`=4, `sandboxes`=5, `plans`=5, `tags`=9, `demo_tags`=18,
`component_analytics`=4, `component_dependencies_closure`=4, `templates`=1, `api_keys`=1,
`demo_bookmarks`=1 (the one pre-existing row predates the 2026-07-22 grant lockdown — consistent with
bookmarking having worked before that date and broken since), `rate_limits`=16. **Zero rows:**
`collections`, `bundles`, `bundle_items`, `bundle_plans`, `bundle_purchases`,
`component_hunt_rounds` (no contest round has ever been created), `component_likes`, `component_tags`,
`components_purchases`, `components_to_collections`, `demo_hunt_scores`, `demo_hunt_votes`,
`demo_hunt_winners`, `feedback`, `mcp_component_usage`, `mcp_generation_requests`, `author_payouts`,
`payout_rates`, `referral_payments`, `usages`, `users_to_plans` (no subscription of either provider has
ever been recorded), `code_embeddings`, `usage_embeddings`, `backup_code_embeddings`,
`backup_usage_embeddings`, `templates_tags`, `prompt_rules`, `_prisma_migrations`.

**F5 — low-severity grant hygiene (new, live-DB audit 2026-07-25):** `public.templates` grants
`anon` role `DELETE`/`INSERT`/`SELECT`/`UPDATE`, but the only policy targeting `{public}` is
`templates_select_public` (SELECT-only, `USING (is_public = true OR user_id = auth.jwt()->>'sub')`).
All write policies (`templates_insert_own`/`_update_own`/`_delete_own`) target `{authenticated}` and
are scoped to `user_id = auth.jwt()->>'sub'`. With RLS enabled and no matching `{anon}` write policy,
anon writes are denied today — **not exploitable, but a defense-in-depth hygiene gap**. Also confirmed:
no function/routine privileges are granted to `anon` at all. This is folded into AC13 as a low-severity
cleanup item, not treated as a security incident.

## Suggested Phase Decomposition (proposal for PLAN — not binding)

Re-ordered to reflect confirmed severity and the F3 dependency (DB functions must exist before any
scheduler references them):

1. **Phase 1 — Live grant/RLS repair + verification (Gap 1, confirmed live prod bug).** Highest
   severity, confirmed broken on the busiest surface. Audit all 41 browser-client files against the
   known 14-relation baseline, extend `restore-authenticated-grants.sql` to cover the confirmed-missing
   relations, revoke `templates`'s excess `anon` write grants (F5), verify live.
2. **Phase 2 — Author the missing DB functions (Gap 2, part 1 — F3 dependency).** Write and
   version-control the 9 confirmed-missing functions (`update_all_hunt_scores`, `process_next_round`,
   `process_single_round`, `update_single_demo_score`, `update_hunt_demos_metrics`,
   `get_missing_usage_embedding_items`, `insert_embedding`, `insert_code_embedding`, `vec_dim`) as
   `supabase/migrations/` entries, verified locally against a scratch/seeded schema BEFORE any
   scheduler work begins.
3. **Phase 3 — Scheduler foundation (Gap 2, part 2).** Build the cron scripts + install unit wiring
   the Phase 2 functions and the embedding job into a schedule; hand off the one privileged VPS step
   (no `pg_cron` alternative exists) to the operator as a documented non-blocking checkpoint. Seed at
   least one contest round and minimal fixture data to make AC8/leaderboard verification observable.
4. **Phase 4 — Navigation reconciliation (Gap 3).** Resolve the tab-vs-route conflicts, reconcile with
   the in-flight `useCategoryTagCounts()` WIP, fix sidebar counts.
5. **Phase 5 — Billing unification (Gap 4).** Provider-aware cancel/invoice routing on
   `/settings/billing` (verified via fixtures, since `users_to_plans` has 0 live rows); add/confirm the
   dual-webhook mutual-exclusion guarantee.
6. **Phase 6 — Schema source of truth + doc correction (Gap 5, inverted, + AC14).** Regenerate
   `apps/web/types/supabase.ts` from the live database (33 functions, 4 views, 41 tables); confirm
   `supabase/migrations/` fully covers every `apps/web`-called RPC (including the Phase 2 additions);
   correct the 3+ stale `all-context.md` claims via `vc-audit-context`.

## TL;DR

The types file lied about the schema's size by ~2× (70 vs 33 functions, 11 vs 4 views) — that's the
real reason "everything seems not interconnected." Layered on top: bookmarking is a confirmed live
prod bug (14-relation grant baseline now known exactly), the scheduler gap is worse than assumed
because the 9 functions it would call don't exist in the DB at all (author them first — hard
dependency), `pg_cron` is confirmed unavailable so the VPS-crontab handoff is the only path, and most
"inert" pages are inert partly because their tables are genuinely empty (0 rows), not only because
wiring is missing — every data-dependent acceptance criterion now explicitly separates "correctly
wired" from "has data" and requires seed fixtures where needed. 14 numbered acceptance criteria (was
13 — AC5 split out as its own predecessor criterion), each tagged with how it gets proven and whether
that proof is automatable or requires a live-database/live-provider probe. No new product features;
scope boundary unchanged.
