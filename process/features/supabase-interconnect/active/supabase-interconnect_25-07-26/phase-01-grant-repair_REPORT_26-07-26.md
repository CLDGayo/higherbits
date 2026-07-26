---
phase: phase-01-grant-repair
date: 2026-07-26
status: COMPLETE_WITH_GAPS
feature: supabase-interconnect
plan: process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md
---

# Phase 01 — Grant/RLS Repair — EXECUTE Report

**TL;DR.** All authorable work is done: Steps A1–C2 complete, 3 SQL files edited, 30 SQL
statements written. **Nothing was applied to the live database** — Step C3 is a mandatory
user-approval hard stop and this report ends at it. Both regression gates match the documented
foreign baseline exactly (tsc: exit 2 / same 4 errors; vitest: 57/62 / same 5 failures). One
**NEW gap the plan does not cover** was found during the audit (`public.templates` has a live
`authenticated` INSERT call site but no tracked grant) — reported, not fixed.

---

## What Was Done

### Step A — Audit (A1–A4)

**A1 — browser-client file list, re-derived at execute time (NOT assumed):**

```
grep -rl "useClerkSupabaseClient" apps/web/{app,components,lib,hooks} | sort
```
→ **51 files.** (SPEC's "41" confirmed stale; 51 matches the 26-07-26 research figure. Count
remains self-deriving — do not hardcode.)

**A2 — recursive local-import closure (the corrected methodology, per Gap 14):**

A closure walker was run from those 51 seed files, following every local import (`@/…` and
relative, never npm packages) to fixpoint, extracting `.from()`/`.rpc()` at every hop.

- **250 modules traversed** (vs. 51 with a per-file grep alone — this indirection is exactly
  what hid `component_dependencies_graph_view_v3` and `component_dependencies_closure` for four
  validate cycles).
- **42 distinct relation/function names reached.**
- Helper hubs confirmed load-bearing: `apps/web/lib/queries.ts`, `apps/web/lib/queries.server.ts`
  (the latter is the sole path to `component_dependencies_graph_view_v3`, reached from
  `publish/components/preview.tsx`, `ui/command-menu.tsx`, `studio/editor/hooks/use-dependencies.ts`).

**Role classification (in-scope vs. excluded):**

| Role at call site | Disposition |
|---|---|
| `authenticated` (via `useClerkSupabaseClient`) | IN SCOPE — audited |
| `anon` (raw `createClient`) — only `hooks/use-analytics.ts` | Recorded, explicitly OUT OF SCOPE (Step B9) |
| service-role (`supabaseWithAdminAccess` / `supabaseAdmin`) | EXCLUDED, recorded — bypasses RLS/grants |

Service-role exclusions confirmed and recorded, not silently dropped: `app/actions/authors.ts`
(`component_analytics`), `app/settings/billing/page.tsx` (`usages`, `users_to_plans`),
`app/c/[collection_slug]/page.tsx` (`collections`), `app/api/stripe/webhook/v{1,2}/route.ts`
(`plans`), and the live `/contest/leaderboard` page (service-role, as the plan predicted).

**A3 — definitive gap list vs. the confirmed 13-relation baseline**

Baseline (13, granted today): `components, demos, submissions, sandboxes, users, tags,
component_tags, demo_tags, api_keys, usages, users_to_plans, mcp_generation_requests,
component_hunt_rounds`.

| Relation | Kind | Reached from | Status |
|---|---|---|---|
| `demo_bookmarks` | table | `lib/queries.ts:627,644,702` | GAP → granted (B1) |
| `prompt_rules` | table | `lib/queries.ts:725,750,783,823,859` | GAP → granted (B2) |
| `feedback` | table | `magic/feedback-dialog.tsx:170` | GAP → granted (B7) |
| `demo_hunt_leaderboard` | view | `lib/queries.ts` | GAP → granted (B3) |
| `demo_hunt_scores` | table | view dep + `useSubmissions.ts` | GAP → read-only grant (B3b) |
| `demo_hunt_votes` | table | view dep (correlated EXISTS) | GAP → read-only grant (B3b) |
| `components_with_username` | view | `component-page/info-section.tsx:79` | GAP → view fix + grant (B3c) |
| `component_dependencies_graph_view_v3` | view | `lib/queries.server.ts` (3 callers) | GAP → view fix + grant (B3e) |
| `component_dependencies_closure` | table | base FROM of the view above | GAP → grant + policy (B3e/Gap 12) |
| `mv_component_analytics` | matview | `lib/queries.ts:363,498` (fkey-embed) | GAP → grant (B5) |
| `public_profiles` | view | created by this phase | NEW → created + granted (B3c-i) |
| `templates` | table | `publish/template/publish-template-form.tsx:119` | **NEW GAP — NOT FIXED, see below** |
| `plans` | table | server-side only | no browser call site → not granted (B4) |
| `collections` | table | server-side only | no browser call site → not granted (B6) |
| `component_analytics` | table | `anon` path only | OUT OF SCOPE (B9) |

**A4 — out-of-scope surfaces confirmed:** `author_payouts`, `payout_rates`, `bundles`,
`bundle_plans`, `bundle_purchases` have **zero** browser-client `.from()`/`.rpc()` call sites in
the 250-module closure. No read-only grant needed for any of them. The
`demo_hunt_scores`/`demo_hunt_votes` read-only carve-out stands.

### Steps B/C — SQL authored

30 statements across the 3 blast-radius files. Full text is in the diff; the apply-order list is
in the AWAITING USER APPROVAL section below.

---

## SQL Written, By File

### `supabase/views.sql` (+69 / −11)

1. **NEW** `CREATE OR REPLACE VIEW public.public_profiles WITH (security_invoker = off)` — 11 safe
   columns (`id, username, name, display_name, display_username, display_image_url, image_url,
   bio, github_url, twitter_url, website_url`). `name` included per Gap 10. Excludes every
   sensitive column (`email`, `paypal_email`, `stripe_id`, `lemon_squeezy_customer_id`, `ref`,
   `is_admin`), which is exactly why `security_invoker = off` is safe here — cited in the SQL comment.
2. `components_with_username` — `JOIN public.users u` → `JOIN public.public_profiles u`.
3. `component_dependencies_graph_view_v3` — `JOIN public.users su/du` → `JOIN public.public_profiles su/du`.
4. `demo_hunt_leaderboard` — `JOIN public.users cu/du` → `JOIN public.public_profiles cu/du`.

All three consuming views carry an explicit `WITH (security_invoker = on)` (see Deviations).

### `supabase/restore-authenticated-grants.sql` (+228 / −0 net of the B0 replacement)

- **B0 (security fix):** table-level `GRANT SELECT, UPDATE ON public.users` replaced by
  `GRANT SELECT` + a 13-column `GRANT UPDATE (...)`. Partition verified: 13 granted + 11 excluded
  = 24 scalar columns. `is_admin`, `email`, `ref`, `paypal_email`, `is_partner`, `bundles_fee`,
  `stripe_id` all excluded. `role` and `pro_banner_url` both included.
- **B1** `demo_bookmarks` — `GRANT SELECT, INSERT, DELETE` + 3 own-row policies.
- **B2** `prompt_rules` — `GRANT SELECT, INSERT, UPDATE, DELETE` + 4 own-row policies, UPDATE with
  both `USING` and `WITH CHECK` (RLS is the sole enforcement layer here — `queries.ts:816-865`
  does no app-level ownership check).
- **B7** `feedback` — `GRANT SELECT, INSERT` + 2 own-row policies. No UPDATE/DELETE.
- **B3b** `demo_hunt_scores`, `demo_hunt_votes` — `GRANT SELECT` + permissive read policies.
- **B3e/Gap 12** `component_dependencies_closure` — `GRANT SELECT` +
  `component_dependencies_closure_select_all` permissive read policy.
- **Views** — `GRANT SELECT` on `public_profiles`, `components_with_username`,
  `demo_hunt_leaderboard`, `component_dependencies_graph_view_v3`.
- **B5** — `GRANT SELECT ON public.mv_component_analytics` (see E2 finding below).
- **B8** — `REVOKE INSERT, UPDATE, DELETE ON public.templates FROM anon`.
- **C2** — the commented-out `public_profiles` prescription (`:295-299`) marked RESOLVED/APPLIED,
  original text kept for provenance. `users_select_self` was NOT widened.
- New "PHASE 1 AUDIT — relations deliberately NOT granted" block documenting the B4/B6/B9/A4
  non-grant decisions in-file.

### `supabase/admin-functions.sql` (+31)

- **B3f** — `GRANT EXECUTE` on `update_submission_as_admin(INT, TEXT, TEXT)` and
  `update_demo_info_as_admin(INT, TEXT, TEXT)` to `authenticated`, with the corrected
  defensive/explicit rationale (Gap 16) — Postgres grants EXECUTE to PUBLIC by default, so these
  are probably redundant today; they are added because they document intent and survive a future
  `REVOKE ... FROM PUBLIC`.
- Comment recording the two `useSubmissions.ts` admin write flows this phase does NOT fix
  (`demo_hunt_scores` INSERT/UPDATE, `components.is_public` UPDATE) and the named follow-up.

**E2 answered (Step B5):** the browser call sites do **not** read the base `component_analytics`
table. `lib/queries.ts:363` and `:498` embed the **matview** via PostgREST fkey-embed syntax
(`mv_component_analytics!component_analytics_component_id_fkey(...)`). The matview is therefore
the actual grant target. Matviews cannot hold RLS, so a straight `GRANT SELECT` to
`authenticated` (never `anon`) is the whole mechanism. Base `component_analytics` deliberately
not granted — its only browser path is the `anon` client (B9).

**E6:** the blunt ROLLBACK comment block was **not** used and is not recommended. The file is
idempotent/re-runnable; on a partial C4 failure, fix forward.

---

## AWAITING USER APPROVAL — Step C3 (HARD STOP)

**Nothing below has been run against the live database.** These are the statements to apply, in
order. Each line is copy-pasteable. Run as owner in the Supabase SQL Editor.

**Order matters:** `views.sql` must run before the grants file — `public.public_profiles` must
exist before it can be granted, and the three redefined views must join it.

### Batch 0 — the security fix (review this one first)

| # | Statement | What it does | Risk |
|---|---|---|---|
| 0.1 | `GRANT SELECT ON public.users TO authenticated;` | Unchanged read access to own row (RLS still own-row-only). | None — restates existing state. |
| 0.2 | `REVOKE UPDATE ON public.users FROM authenticated;` | Withdraws the pre-existing **table-level** UPDATE grant. | Momentarily removes all UPDATE on `users`; 0.3 immediately re-grants the 13 safe columns in the same transaction. |
| 0.3 | `GRANT UPDATE (username, name, bio, twitter_url, github_url, pro_referral_url, website_url, display_name, display_username, display_image_url, image_url, pro_banner_url, role) ON public.users TO authenticated;` | **Closes a live privilege-escalation hole.** With 0.2 preceding it, a user can no longer set `is_admin = true` on their own row. | **Real behavior change.** Any browser write to `is_admin`, `email`, `ref`, `paypal_email`, `stripe_id`, `is_partner`, `bundles_fee`, `manually_added`, `id`, `created_at`, `updated_at` will now be rejected. No legitimate browser path writes these. |

> **0.2 ships in the file — no manual step required.** A column-scoped `GRANT UPDATE (cols)` does
> **not** remove a pre-existing table-level `GRANT UPDATE`; the two coexist and the broader grant
> wins. Omitting the REVOKE would leave the security hole fully open while the file *reads* as
> fixed. It is therefore written into `supabase/restore-authenticated-grants.sql` immediately
> above the column-scoped GRANT (EVL fix cycle 1, 26-07-26) rather than left as an apply-time
> instruction. The ordering (REVOKE → GRANT) is load-bearing and also keeps the file idempotent
> on re-run.

### Batch 1 — `supabase/views.sql` (run this file whole, first)

| # | Statement | What it does | Risk |
|---|---|---|---|
| 1.1 | `CREATE OR REPLACE VIEW public.public_profiles WITH (security_invoker = off) AS SELECT id, username, name, display_name, display_username, display_image_url, image_url, bio, github_url, twitter_url, website_url FROM public.users;` | New narrow-column public profile view. Bypasses own-row RLS on purpose, exposing only non-sensitive columns. | Low. No sensitive column is exposed. Verify the column list before approving. |
| 1.2 | `CREATE OR REPLACE VIEW public.components_with_username WITH (security_invoker = on) AS ... JOIN public.public_profiles u ON u.id = c.user_id;` | Makes cross-user registry dependency resolution actually return rows instead of silently returning 0. | **Output shape change:** the `"user"` JSON object narrows from the full users row to the 11 safe columns. Known consumer (`info-section.tsx:79-90`) reads only username/display/name fields — unaffected. |
| 1.3 | `CREATE OR REPLACE VIEW public.component_dependencies_graph_view_v3 WITH (security_invoker = on) AS ... JOIN public.public_profiles su/du ...;` | Same fix for the dependency graph view. | Low — its consumers destructure plain scalar author-username columns only. |
| 1.4 | `CREATE OR REPLACE VIEW public.demo_hunt_leaderboard WITH (security_invoker = on) AS ... JOIN public.public_profiles cu/du ...;` | Same fix so a multi-contestant leaderboard is not filtered to the caller's own rows. | Low — `component_user_data`/`user_data` JSON narrows identically. Zero live callers today. |

### Batch 2 — `supabase/restore-authenticated-grants.sql` Phase 1 block (run second)

| # | Statement | What it does | Risk |
|---|---|---|---|
| 2.1 | `GRANT SELECT, INSERT, DELETE ON public.demo_bookmarks TO authenticated;` | **Fixes the confirmed live bookmarking bug.** | Low. |
| 2.2 | 3 × `CREATE POLICY demo_bookmarks_{select,insert,delete}_own ... user_id = auth.jwt()->>'sub'` | Restricts every bookmark op to the caller's own rows. | Low. |
| 2.3 | `GRANT SELECT, INSERT, UPDATE, DELETE ON public.prompt_rules TO authenticated;` | Restores prompt-rule CRUD. | Low **only with 2.4** — the app does no ownership check. |
| 2.4 | 4 × `CREATE POLICY prompt_rules_{select,insert,update,delete}_own` (UPDATE has both USING and WITH CHECK) | **Sole** protection stopping user B editing/deleting user A's rule. | Must land together with 2.3. |
| 2.5 | `GRANT SELECT, INSERT ON public.feedback TO authenticated;` + 2 own-row policies | Restores the feedback dialog. No UPDATE/DELETE. | Low. |
| 2.6 | `GRANT SELECT ON public.demo_hunt_scores TO authenticated;` + `demo_hunt_scores_select_all` policy | Read-only base-table dep of the leaderboard view. Does not reopen hunt-score writes. | Low — public tally data. |
| 2.7 | `GRANT SELECT ON public.demo_hunt_votes TO authenticated;` + `demo_hunt_votes_select_all` policy | Same, for the `has_voted` correlated subquery. | Low — reveals who voted for what to any authenticated user. Accept only if that is acceptable; it mirrors the existing `component_hunt_rounds_select_all` precedent. |
| 2.8 | `GRANT SELECT ON public.component_dependencies_closure TO authenticated;` + `component_dependencies_closure_select_all` policy | Without this the dependency graph view stays 42501 even once granted. | Low — structural component→component edges. |
| 2.9 | `GRANT SELECT ON public.public_profiles TO authenticated;` | Makes the new view readable. | Low. |
| 2.10 | `GRANT SELECT ON public.components_with_username TO authenticated;` | First-ever grant for this view. | Low. |
| 2.11 | `GRANT SELECT ON public.demo_hunt_leaderboard TO authenticated;` | First-ever grant. | Low. |
| 2.12 | `GRANT SELECT ON public.component_dependencies_graph_view_v3 TO authenticated;` | First-ever grant — fixes a live 42501 for 3 real callers. | Low. |
| 2.13 | `GRANT SELECT ON public.mv_component_analytics TO authenticated;` | Fixes the analytics fkey-embed read at `queries.ts:363,498`. Matview, no RLS possible. | Low — `authenticated` only, never `anon`. |
| 2.14 | `REVOKE INSERT, UPDATE, DELETE ON public.templates FROM anon;` | Defense-in-depth: `anon` must never hold write grants. | Low — not currently exploitable (no matching anon write policy). |

### Batch 3 — `supabase/admin-functions.sql` (run last)

| # | Statement | What it does | Risk |
|---|---|---|---|
| 3.1 | `GRANT EXECUTE ON FUNCTION public.update_submission_as_admin(INT, TEXT, TEXT) TO authenticated;` | Explicit EXECUTE grant. Probably redundant with Postgres's PUBLIC default. | None — the function self-checks `is_admin` before any write. |
| 3.2 | `GRANT EXECUTE ON FUNCTION public.update_demo_info_as_admin(INT, TEXT, TEXT) TO authenticated;` | Same, for the live-used RPC. | None — same self-check. |

### After approval and apply (Steps C4/C5/D — all pending)

None of the live verification has been attempted. Still owed once the SQL is applied:
C5 (introspection diff), D1/D2 (BookmarkButton on both surfaces), D3 (prompt_rules +
leaderboard, plus the cross-user negative test), D4 (final gap-list cross-reference),
D5 (`is_admin` escalation attempt must be REJECTED — absence of error is a FAIL),
D6 (both admin RPCs callable by admin, rejected for non-admin), and E7/E8 (assert
**non-empty** cross-user results, not merely "no 42501").

---

## What Was Skipped or Deferred

- **Steps C3, C4, C5, D1–D6** — blocked behind the C3 user-approval hard stop. No live DB
  connection was opened.
- **`plans` (B4), `collections` (B6)** — no browser-client call site; not granted preemptively.
- **`component_analytics` anon path (B9)** — out of scope; backlog note written.
- **`useSubmissions.ts` admin writes** (`demo_hunt_scores`, `components.is_public`) — no covering
  RPC; explicitly left broken with a named follow-up.
- **`clerk.ts` null-guard bug, `add-registry-modal.tsx` tsc errors** — read-only / out of blast
  radius (INNOVATE Forks 2 and 3). Untouched.

---

## Plan Deviations

All three are within-blast-radius implementation details. No hard-stop-class deviation.

1. **`CREATE OR REPLACE VIEW` instead of `CREATE VIEW` for `public_profiles`.** The plan
   prescribes `CREATE VIEW` verbatim. Used `CREATE OR REPLACE` to match the surrounding file's
   convention and keep the file re-runnable/idempotent, as the grants file's own header requires.
   Same resulting object.
2. **Explicit `WITH (security_invoker = on)` added to the 3 redefined views.** The plan says
   "keep `components_with_username` itself `security_invoker=on`". Their invoker posture was set
   out-of-band by `enable-rls.sql`'s `ALTER VIEW` loop; stating it explicitly in the definition
   guarantees the intended posture survives a `CREATE OR REPLACE` rather than depending on
   option-preservation semantics.
3. **`GRANT SELECT ON public.mv_component_analytics` added under Step B5.** B5 asked for a
   documented decision after confirming the read pattern (E2). The confirmed target is the
   matview; granting it is the decision. The base `component_analytics` table was NOT granted.

4. **`REVOKE UPDATE ON public.users FROM authenticated;` added to the SQL file** (EVL fix cycle 1,
   26-07-26). Originally the B0 replacement only *added* the column-scoped grant, and the required
   REVOKE lived as prose in this report's Batch 0. Postgres does not drop a pre-existing
   table-level UPDATE grant when a column-scoped grant is added, so the file as written would have
   left the privilege-escalation hole open while reading as fixed. The REVOKE now ships in
   `supabase/restore-authenticated-grants.sql` immediately above the column-scoped GRANT (ordering
   is load-bearing). Within blast radius; same file, same security intent, no new surface.

---

## EVL Fix Cycles

**Cycle 1 (26-07-26) — REVOKE statement moved from prose into the SQL file.**
EVL confirmed the Phase 1 gates green but found the security fix was not self-sufficient: applying
`supabase/restore-authenticated-grants.sql` as written would not have closed the `is_admin`
self-escalation hole, because the required `REVOKE UPDATE ON public.users FROM authenticated;`
existed only as an operator instruction in this report. A security fix that depends on someone
reading an adjacent note fails in practice. Fix: one statement inserted into the SQL file
(+ explanatory comment), and Batch 0 renumbered (0.1/0.2/0.3) so the REVOKE is documented as a
file statement rather than a manual step. No source code touched; tsc/vitest baselines unchanged.

---

## NEW GAP — `public.templates` (not covered by the plan; NOT fixed)

**Severity: likely a live break. Reported, not improvised on.**

`apps/web/components/features/publish/template/publish-template-form.tsx:119` performs
`client.from("templates").insert({...})` where `client = useClerkSupabaseClient()` (`:29`) —
i.e. a real browser write under the `authenticated` role. `templates` is **not** in the confirmed
13-relation grant baseline and has no `GRANT`/`CREATE POLICY` statement anywhere in tracked
`supabase/*.sql`. If the live DB matches the tracked state for `authenticated`, template
publishing is 42501-broken today.

The plan's Step A3 gap list does not include `templates`, and Step B8 covers only the `anon`
REVOKE. Authoring an `authenticated` grant would require choosing an ownership/RLS model for a
table whose ownership column I have not been directed to decide — outside this phase's approved
scope. **No SQL was written for it.** The B8 REVOKE is unaffected and safe either way (it touches
`anon` only).

Recommend: a narrow follow-up plan or a supplement cycle to grant + scope `templates`.

---

## Test Gate Outcomes

| Gate | Tier | Command | Result |
|---|---|---|---|
| tsc regression | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | **PASS (no new errors).** Exit 2, exactly 4 errors, all `add-registry-modal.tsx:168,389` (TS1127, TS1134, TS1005, TS1160) — identical to the documented foreign baseline. |
| vitest regression | Fully-Automated | `corepack pnpm --filter web test` | **PASS (no new failures).** `Test Files 4 failed \| 13 passed (17)`, `Tests 5 failed \| 57 passed (62)` — same 4 files (`font-cozy-sweep`, `landing-smoke`, `header-smoke`, `api/magic/route` ×2). Exact baseline match. |
| Browser-client grant-coverage cross-reference | Fully-Automated | closure walker (Step A2 above) | **PASS** — 250 modules, 42 relations/functions, gap list produced; found 1 relation the plan's own list missed (`templates`). |
| All Agent-Probe / Hybrid live gates (C5, D1–D6, E7, E8) | Agent-Probe / Hybrid | live DB + browser sessions | **NOT RUN — gated behind the C3 hard stop.** |

Per E5: the 5 pre-existing vitest failures were not touched.

---

## Test Infra Gaps Found

- **No SQL syntax/lint gate exists.** The 30 statements authored here have no automated
  verification short of applying them to a live database. A `pg_dump --schema-only` round-trip or
  a disposable-Postgres apply check would catch syntax errors before the C3 approval, instead of
  during it. Classification: **harness-drift** (missing capability, not a broken one).
- **Every meaningful gate for this phase is Agent-Probe/Hybrid.** The only Fully-Automated gates
  (tsc, vitest) do not touch Postgres grants/RLS at all — they can be green while every grant is
  wrong. This is a structural coverage gap for all Supabase-SQL work in this repo, not specific
  to Phase 1.
- **`process/context/tests/all-tests.md` drift persists** — it claims 48 tests / 15 files;
  live-confirmed today is 62 / 17 with 57 passing. Pre-existing; backlog note already named in
  the plan.

---

## Follow-up Stubs Created

| Path | Tracks |
|---|---|
| `process/features/supabase-interconnect/backlog/anon-analytics-grant-scope_NOTE_26-07-26.md` | Step B9 — the `anon`-role `component_analytics` grant/RLS decision |

Named-but-not-yet-created (from the validate contract's Backlog artifacts table, all still owed):
`clerk-ts-session-cache-null-guard_NOTE`, `all-tests-md-baseline-drift_NOTE`,
`add-registry-modal-tsc-syntax-error_NOTE`, `validate-plan-artifact-phase-stub-false-positive_NOTE`,
`rpc-functions-grant-execute-audit_NOTE`. Plus, new from this session: a `templates` grant gap note.

## CONTEXT_PARTIAL Items

`CONTEXT_PARTIAL: live Supabase grant/policy state` — the entire audit is derived from tracked
SQL files plus source code. The live database's actual grant state was never queried (no live
access is permitted before C3). Every "currently 42501" claim is an inference from tracked state,
not an observation. Step C5's introspection diff is the first point at which any of it is
empirically confirmed.

---

## Closeout Packet

- **Selected plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md`
- **Finished:** Steps A1–A4, B0–B9, C1, C2. 3 files edited, 30 SQL statements authored, 1 backlog note.
- **Verified:** both automated regression gates, at baseline.
- **Unverified:** everything requiring the live database — the entire Agent-Probe/Hybrid tier.
- **Remaining:** C3 user approval → C4 apply → C5/D1–D6 live verification → then UPDATE PROCESS.
- **Classification:** **Keep in active/testing.** Not archivable — the phase's exit gate is
  explicitly live-verification-based and none of it has run.
- **Next valid state:** present the AWAITING USER APPROVAL section to the user for the C3 decision.

## Forward Preview

**Test Infra Found.** `vitest` + `tsc` only; no SQL gate, no live-DB gate, no E2E harness. Any
future Supabase-SQL phase inherits the same Agent-Probe-only verification posture.

**Blast Radius Changes.** No expansion. Exactly the 3 declared files were written. Zero `apps/web`
source files touched; `clerk.ts` and `add-registry-modal.tsx` untouched as required. The ~245
uncommitted foreign WIP files were not staged, stashed, reverted, or edited.

**Commands to Stay Green.**
```
corepack pnpm --filter web exec tsc --noEmit   # expect exit 2, 4 errors in add-registry-modal.tsx
corepack pnpm --filter web test                # expect 57/62, 5 failures across 4 files
```

**Dependency Changes.** None. No package added, removed, or upgraded.

**For Phase 6 (schema source of truth).** `supabase/views.sql` now defines a 4th view
(`public_profiles`) that must be folded into the baseline. The `templates` REVOKE is the first
tracked statement about that table — the rest of its live grants/policies still need
reverse-engineering. `public_profiles`'s `security_invoker = off` posture is fragile: re-running
`enable-rls.sql`'s blanket invoker sweep would silently break cross-user profile resolution again.

---

## SPEC Achievement

Scored against `supabase-interconnect_SPEC_25-07-26.md` — the umbrella SPEC governs every inner
phase (phase-program inner loop skips a per-phase SPEC). Only the 4 acceptance criteria this
phase's Blast Radius covers are scored here; AC4–AC12, AC14 belong to later phases and are not
scored by this report.

| AC | Criterion (short) | Status | Why |
|---|---|---|---|
| AC1 | Every browser-client Supabase call succeeds, no 42501 | **UNMET (pending, not abandoned)** | SQL authored for every identified gap; `proven by:` a live verification pass — Agent-Probe, gated behind the Step C3 hard stop. Zero live confirmation has occurred. |
| AC2 | Bookmarking persists across both surfaces | **UNMET (pending, not abandoned)** | `demo_bookmarks` grant + policies authored (Step B1); `proven by:` a live/E2E bookmark-button check — Hybrid, gated behind C3. Not run. |
| AC3 | Full audit of all browser-client files confirms zero remaining ungranted tables/views | **UNMET — genuine gap found** | The Fully-Automated desk-audit leg (Step A2's 250-module recursive closure) IS complete and found `public.templates` as an audited-but-unfixed gap (see NEW GAP section above) — this is real, not a Known-Gap residual. The Agent-Probe "final live confirmation pass" leg has not run. Per the vacuous-green ban, a Known-Gap residual is never a basis for "met"; scored unmet as a whole. |
| AC13 | Grant-restoration fix extended + **applied against live production**, verified by live query | **UNMET (pending, not abandoned)** | SQL is extended (all 30 statements). "Applied against live production" and "verified by live query" are both explicitly Agent-Probe and have not happened — this is the literal C3/C4/C5 sequence this report ends before. |

**Disposition:** AC1, AC2, AC13 are correctly unmet because Phase 01 has not reached its own exit
gate yet (C3 user approval is outstanding) — these are NOT closed-out gaps requiring a backlog
NOTE; they are the phase's own unfinished checklist items (C3–C5, D1–D6), already tracked inline
in the plan's Implementation Checklist and this report's "What Was Skipped or Deferred" section.
Writing a duplicate backlog NOTE for each would misrepresent live, in-progress phase work as
abandoned. **AC3 is different: the `public.templates` finding is a genuine gap the plan's own
Step A3 audit list did not cover**, independent of the C3 hard stop (granting it requires an
ownership/RLS decision outside this phase's approved scope) — this one gets its own backlog NOTE
(see Follow-up Stubs, below).

---

## Follow-up Stubs Created (UPDATE PROCESS addendum)

| Path | Tracks |
|---|---|
| `process/features/supabase-interconnect/backlog/templates-authenticated-grant-scope_NOTE_26-07-26.md` | AC3 gap — `public.templates` has a live `authenticated` INSERT call site with no tracked grant; needs an ownership/RLS decision |

---

## Program-Wide Learnings (for Phases 2–6)

These are cross-phase methodology findings, not Phase 01-specific facts. Recorded here because
Phase 01 discovered them; they apply to every remaining phase in this program.

1. **Recursive-import-closure audits beat per-file grep for finding real call sites.** A per-file
   `.from()`/`.rpc()` grep across the browser-client seed files cannot see relations reached
   through shared query-helper modules (e.g. `apps/web/lib/queries.server.ts`). Phase 01's
   corrected Step A2 (recursive local-import closure — 51 seed files → 250 traversed modules,
   classifying each call site as `authenticated` / `anon` / service-role) found 3 relations
   (`component_dependencies_graph_view_v3`, `component_dependencies_closure`, `public.templates`)
   that a flat per-file grep found zero of, across 4 separate PVL cycles before the corrected
   method was applied. Any later phase auditing Supabase call sites should use the recursive
   method from the start, not discover it the hard way.
2. **Supplement agents over-report — verify every claimed edit with grep.** Across this phase's
   5 PVL supplement cycles, at least one cycle claimed edits that were never actually written to
   disk. The orchestrator now greps for each claimed edit after every PLAN-SUPPLEMENT /
   EXECUTE-supplement cycle before trusting the "applied" claim. Recommend this stays standard
   practice for Phases 2–6's own supplement cycles.
3. **String-anchor edits on ambiguous headings can silently corrupt a plan file.** One supplement
   cycle anchored a text replacement on the string `"## Validate Contract"`, matched a prose
   mention of that phrase instead of the actual section heading, and deleted roughly 6 sections
   before the corruption was caught. Line-splice editing (anchored on exact line numbers from a
   fresh `Read`) proved reliable across all other cycles; ambiguous string-anchor replace did not.
   Prefer line-splice for plan-file edits going forward.
4. **Commit task-folder artifacts early — an untracked folder has no diff baseline.** The
   string-anchor corruption above had no git history to diff against or revert to, because the
   task folder was still untracked at the time. It is committed now (`254b3b8`, `e10cb5b`). Future
   phases in this program should not let task-folder artifacts sit uncommitted across multiple
   PVL/EVL cycles.
5. **Postgres grant semantics worth remembering for Phases 2–6's own SQL:** (a) a column-scoped
   `GRANT UPDATE (cols) ON t TO role` does **not** remove a pre-existing table-level
   `GRANT UPDATE ON t TO role` — the broader grant wins unless explicitly `REVOKE`d first, and the
   REVOKE must precede the column-scoped GRANT in file order to be effective and idempotent. (b)
   `EXECUTE` on a new function defaults to `PUBLIC` at creation time in Postgres, so an explicit
   `GRANT EXECUTE ... TO authenticated` on a SECURITY DEFINER admin RPC is defensive documentation
   of intent, not a corrective fix for something currently broken — don't over-claim it as a bug
   fix in phase reports.
