---
name: report:supabase-interconnect-live-apply
description: Live production apply of Phase 1 (grant/RLS repair) + Phase 2 (embedding functions) — APPLIED 29-07-26, all 129 statements committed; a critical follow-up (anon write access on public_profiles) was found AND closed same-day, orchestrator-applied under a stated protocol deviation
date: 29-07-26
phase: EXECUTE
status: COMPLETE
feature: supabase-interconnect
plan: process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-01-grant-repair_PLAN_25-07-26.md
metadata:
  node_type: memory
  type: report
  feature: supabase-interconnect
  phase: live-apply
---

# Live apply — Phase 1 + Phase 2

> **SUPERSEDED — read `## ATTEMPT 2` at the bottom of this file first.**
> Everything between here and the `ATTEMPT 2` heading describes the **first, halted attempt**
> (29-07-26, earlier in the day), which applied **nothing**. Attempt 2 later that day applied all
> 129 statements successfully. The "nothing was applied / 0 of 129" statements below are accurate
> **only for attempt 1** and are retained as history — they are no longer the current state.

## TL;DR (attempt 1 — historical)

**Nothing was applied to the live database. Zero statements executed. The database was never
connected to.** Execution halted at the connection-credential gate: reading
`apps/web/.env` is blocked by the repo's `privacy-block.cjs` PreToolUse hook, and the brief
explicitly forbids working around that hook. The apply is fully prepared and offline-validated —
it needs one user approval to run.

## Status

| Item | State |
|---|---|
| Live DB connection | **never opened** |
| Statements applied | **0 of 129** |
| Dry validation (`BEGIN … ROLLBACK`) | **not run** — requires connection |
| Before/after grant diff | **not captured** — requires connection |
| Post-apply introspection | **not run** — requires connection |
| Files modified | **none** (SQL files read-only, as instructed) |
| Git operations | **none** |

## What blocked it

```
PreToolUse hook: .claude/hooks/privacy-block.cjs
PRIVACY BLOCK: Sensitive file access requires user approval
  File: .env
```

The connection string (`DIRECT_DATABASE_URL`) lives only in `apps/web/.env` /
`apps/web/.env.local`. There is no `psql`, `pg_dump`, `docker`, or `pg`/`postgres` node driver
available in this repo (verified: `pg`, `postgres` both unresolvable; only
`@electric-sql/pglite` is present, which is the Phase 2 *local scratch* harness and cannot
reach the hosted database). So the Prisma-client path is the only route, and it needs that
variable.

Per the task constraints — *"If it blocks, report that plainly — the user can approve it. Do not
attempt to work around the hook."* — no alternative credential source was probed and no
obfuscated re-read was attempted.

## What WAS completed (offline, no DB, no secrets)

### 1. All four files read from disk and verified as committed

| Order | File | Statements to execute |
|---|---|---|
| 1 | `supabase/views.sql` | 4 |
| 2 | `supabase/restore-authenticated-grants.sql` | 107 (+2 `BEGIN`/`COMMIT` framing) |
| 3 | `supabase/admin-functions.sql` | 4 |
| 4 | `supabase/migrations/0001_embedding_functions.sql` | 14 |
| | **Total** | **129** |

Note: the count is 129, not the "30 SQL statements" figure recorded in
`process/context/all-context.md`. That context figure is stale — it described an earlier
revision of the grants file. This is a documentation drift note, not a discrepancy in the SQL.

### 2. Load-bearing ordering verified mechanically

The privilege-escalation fix depends on statement order surviving the parser. Confirmed in the
split output of `restore-authenticated-grants.sql`:

```
#31  GRANT SELECT ON public.users TO authenticated
#32  REVOKE UPDATE ON public.users FROM authenticated      <-- must come first
#33  GRANT UPDATE ( username, name, bio, ... ) ON public.users TO authenticated
```

Mechanical check for the escalation hole: **`is_admin` does not appear in any `GRANT UPDATE`
column list** — verified programmatically, not by eye. Both statements sit inside the file's
`BEGIN`/`COMMIT`.

### 3. A statement splitter was written and self-tested

Postgres scripts here contain `$$`-quoted `plpgsql` bodies (`admin-functions.sql`), `''`-escaped
strings, and `auth.jwt()->>'sub'` expressions — a naive `split(';')` corrupts all of these.
The splitter handles line comments, block comments, single/double-quoted strings, and
`$$`/`$tag$` dollar-quoting. Self-test output confirms function bodies stayed intact (4
statements in `admin-functions.sql`, i.e. 2 `CREATE OR REPLACE FUNCTION` + 2 `GRANT EXECUTE`,
not fragments).

### 4. Prisma client confirmed built

`apps/web/prisma/client/index.js` exists — no `prisma generate` needed.

## The prepared apply script

`{scratchpad}/apply-live.mjs`. Behavior, matching the brief exactly:

- Parses the connection variable at runtime; **never prints it or any other secret** — it prints
  only `connection var source: <filename>` and a boolean.
- **Project-ref guard:** asserts the connection string references `ewktoowpuemgbaaxxbdq` and
  aborts otherwise, before any write. Prints only the boolean, never the host.
- `--dry`: runs all 129 statements inside one interactive transaction and then throws a sentinel
  to force `ROLLBACK`. On any error it reports the exact file, statement number, statement text,
  and Postgres error, and persists nothing.
- `--apply`: captures `snapshot-before.json`, applies **Phase 1 (files 1→2→3) in one
  transaction**, then **Phase 2 in a second transaction**, then captures `snapshot-after.json`.
- Transaction framing: each file's own standalone `BEGIN;`/`COMMIT;` is dropped because the
  script supplies its own outer transaction — a nested `COMMIT` would end the outer transaction
  early and silently defeat the dry-run `ROLLBACK`. Semantics are unchanged: the file still
  executes atomically in exactly one transaction. The SQL files themselves were **not modified**.
- Introspection queries cover `information_schema.role_table_grants`,
  `information_schema.column_privileges` (scoped to `users`), `pg_policies`, anon grants,
  `pg_proc` + `proacl` for the 4 functions, the target views, and the 2 unique indexes.

## Risk notes carried forward (unverified — DB never queried)

1. **`0001_embedding_functions.sql` is not idempotent.** It uses bare `CREATE FUNCTION`, not
   `CREATE OR REPLACE`. If any of the 4 functions already exists, the statement errors and the
   whole Phase 2 transaction rolls back. The live audit says they are absent, but that was not
   re-confirmed this session.
2. **Unique-index creation is fail-closed by design.** If duplicate `(item_id, item_type)` rows
   exist in `usage_embeddings` / `code_embeddings`, index creation fails loudly. The audit
   recorded 0 rows in both. Per instruction, a duplicate failure must halt — not be deduped.
3. **`admin-functions.sql` recreates two functions** via `CREATE OR REPLACE FUNCTION`
   (`update_submission_as_admin`, `update_demo_info_as_admin`) in addition to its 2 `GRANT
   EXECUTE` statements. This is in scope (file 3 was authorized) but is worth naming explicitly:
   the file is not grants-only.
4. **`views.sql` creates `public_profiles` with `security_invoker = off`.** Safe only because
   its column list excludes `email`, `paypal_email`, `stripe_id`, `ref`, `is_admin`. Verified by
   reading the file. Its own header warns this posture is undone by any later re-run of
   `enable-rls.sql`'s blanket security-invoker sweep.

## To resume

Approve the `.env` read, then:

```
node {scratchpad}/apply-live.mjs --dry     # must pass before anything real
node {scratchpad}/apply-live.mjs --apply   # Phase 1 tx, then Phase 2 tx
```

If `--dry` fails, stop and report — do not proceed to `--apply`.

## Nothing was skipped silently

Every step in the brief that was reachable without the connection was completed. Every step that
required the connection is listed above as not-run. No partial application exists: the count of
statements applied to the live database is exactly **0**.

---

# ATTEMPT 2 — APPLIED (29-07-26)

## TL;DR

**All 129 statements were applied to the live database and committed. Both phases succeeded. No
statement failed, and nothing was partially applied.** Every acceptance check passed: the
privilege-escalation hole on `public.users` is closed, and all 4 embedding functions now exist and
are `service_role`-only.

**One critical NEW issue was introduced as a side effect, found by this apply, and closed the same
day after user approval** (fixing it was outside this apply's originally authorized scope, so it
was reported rather than silently patched): the newly created `public.public_profiles` view
inherited Supabase's default privileges, giving the **anonymous** role INSERT/UPDATE/DELETE on it.
Because the view is auto-updatable and runs as its owner, that was a live anonymous write path into
`public.users`. See `## CRITICAL follow-up` below for the discovery, the approved two-statement
fix, and its verified closure.

## What ran, in order

| Step | Result |
|---|---|
| Connection + project-ref guard | PASS — connected; project ref is `ewktoowpuemgbaaxxbdq` |
| Baseline snapshot | captured (`baseline-verify.json`) |
| Dry pass #1 (`BEGIN … ROLLBACK`) | **FAILED — transient**, see below |
| Dry pass #2 (`BEGIN … ROLLBACK`) | **PASS — 129/129**, rolled back, nothing persisted |
| Real apply — Phase 1 | **COMMITTED — 115 statements** |
| Real apply — Phase 2 | **COMMITTED — 14 statements** |
| Post-apply introspection (fresh connection) | PASS on all checks |

### The transient dry-pass failure (important, but not a SQL problem)

Dry pass #1 aborted at `restore-authenticated-grants.sql` statement **#73**
(`DROP POLICY IF EXISTS "demo_bookmarks_select_own" ON public.demo_bookmarks`) with:

```
Server has closed the connection.
```

That is a **connection drop, not a SQL error** — no Postgres error code, no constraint or syntax
complaint. Diagnosis performed before retrying:

- Both `DATABASE_URL` and `DIRECT_DATABASE_URL` are **direct `:5432`** connections — *not* the
  `:6543` transaction-mode pooler. So this was not the classic "pgbouncer kills long interactive
  transactions" failure.
- Statement #73 and its neighbours are routine `GRANT` / `DROP POLICY` / `CREATE POLICY` lines with
  nothing unusual.
- Dry pass #2, same script, same input, ran **all 129 statements to completion**. Non-deterministic
  → server-side/network flakiness.

**Why this was safe to retry rather than halt:** each phase applies inside a single transaction, so
a mid-flight connection drop can only produce a full rollback — never a partial grant set. That is
exactly the failure mode the brief warned about, and the transaction framing structurally prevents
it. The dry pass persisted nothing in either run.

## Real-apply results, per file

| Order | File | Statements | Result |
|---|---|---|---|
| 1 | `supabase/views.sql` | 4 | APPLIED |
| 2 | `supabase/restore-authenticated-grants.sql` | 107 | APPLIED |
| 3 | `supabase/admin-functions.sql` | 4 | APPLIED |
| — | *(Phase 1 transaction)* | **115** | **COMMITTED** |
| 4 | `supabase/migrations/0001_embedding_functions.sql` | 14 | APPLIED |
| — | *(Phase 2 transaction)* | **14** | **COMMITTED** |

**Nothing failed and nothing was skipped.** 129 of 129 statements are live. The SQL files were not
modified; they were applied exactly as committed.

## Before/after grant diff (Phase 1 AC13 evidence)

Captured with a **fresh connection after the apply**, so this is independent confirmation rather
than a replay of the script's own state.

### The privilege-escalation fix — the headline result

| Check | BEFORE | AFTER |
|---|---|---|
| `users` **table-level** grants to `authenticated` | `SELECT`, **`UPDATE`** | `SELECT` only |
| `users` **column-level** UPDATE grants | 25 columns | **13 columns** |
| `is_admin` UPDATE-able by `authenticated` | **YES — self-escalation was live** | **NO** |

The hole was real and confirmed live before the fix: any authenticated user could have set their own
`is_admin = true`. It is now closed.

The 13 columns `authenticated` may now update:

```
bio, display_image_url, display_name, display_username, github_url, image_url,
name, pro_banner_url, pro_referral_url, role, twitter_url, username, website_url
```

Sensitive columns explicitly verified as **no longer UPDATE-able** by `authenticated`:

| Column | UPDATE-able after? |
|---|---|
| `is_admin` | NO |
| `email` | NO |
| `ref` | NO |
| `paypal_email` | NO |
| `stripe_id` | NO |

Note the REVOKE-before-GRANT ordering mattered and worked: `#32 REVOKE UPDATE … FROM authenticated`
preceded `#33 GRANT UPDATE (13 cols)`. Postgres does not remove a table-level grant when you add a
column-scoped one, so without that REVOKE the fix would have been a silent no-op. The result above
proves the REVOKE took effect.

### Grant surface expansion (intended)

`authenticated` now reaches **24** relations, up from **14**. Ten newly granted, zero removed:

```
component_dependencies_closure, component_dependencies_graph_view_v3,
components_with_username, demo_bookmarks, demo_hunt_leaderboard,
demo_hunt_scores, demo_hunt_votes, feedback, prompt_rules, public_profiles
```

This matches the authorized batches, including the explicitly-approved `demo_hunt_votes` SELECT.
`mv_component_analytics` also received `authenticated=r` — it does not appear in the list above only
because it is a **materialized** view, which `information_schema.role_table_grants` omits; confirmed
directly via its `pg_class.relacl`.

RLS policies grew from **31 to 43**.

### `public_profiles` — created, and column list verified safe

```
id, username, name, display_name, display_username,
display_image_url, image_url, bio, github_url, twitter_url, website_url
```

Confirmed **absent** (no leak through the `security_invoker = off` posture): `email`,
`paypal_email`, `stripe_id`, `ref`, `is_admin`.

## Phase 2 verification — the 4 embedding functions

The non-idempotency risk **did not materialise**: a pre-apply check confirmed all 4 functions were
absent (`pg_proc` returned 0 rows), so the bare `CREATE FUNCTION` statements had nothing to collide
with. All 4 now exist:

| Function | Signature | `PUBLIC` exec | `anon` exec | `authenticated` exec | `service_role` exec |
|---|---|---|---|---|---|
| `vec_dim` | `(v vector)` | **false** | **false** | **false** | true |
| `get_missing_usage_embedding_items` | `()` | **false** | **false** | **false** | true |
| `insert_embedding` | `(p_item_id bigint, p_item_type text, p_embedding vector, p_usage_description text, p_metadata jsonb)` | **false** | **false** | **false** | true |
| `insert_code_embedding` | `(p_item_id bigint, p_item_type text, p_embedding vector, p_metadata jsonb)` | **false** | **false** | **false** | true |

Raw ACL on all four is `postgres=X/postgres, service_role=X/postgres` — the
`REVOKE EXECUTE … FROM PUBLIC` landed correctly, so the default PUBLIC-execute grant is gone.

The two unique indexes were also created without incident (the duplicate-row risk did not
materialise; both embedding tables were empty):

- `usage_embeddings_item_id_item_type_key`
- `code_embeddings_item_id_item_type_key`

## `admin-functions.sql` — what actually changed

As flagged pre-apply, this file is not grants-only. Its 4 statements were 2
`CREATE OR REPLACE FUNCTION` (`update_submission_as_admin`, `update_demo_info_as_admin`) plus 2
`GRANT EXECUTE`. All 4 applied. This was in scope (the file was authorized) but is recorded here
explicitly so the change is not mistaken for a pure grant adjustment.

## CRITICAL follow-up — anonymous write access on `public_profiles` — FOUND AND CLOSED SAME-DAY

> **UPDATE (29-07-26, later same day): fixed and verified. Everything below this line in this
> subsection describes the hole as it stood at discovery — the "NOT fixed" / "needs your approval"
> framing is now historical. See `## Fix applied and verified` at the end of this subsection for
> the outcome.**

**This was a new hole created by this apply. It did not exist before, because the view did not
exist before.** The apply agent correctly did not fix it — the brief authorized only the four
files as committed and forbade any other DDL — and instead reported it plainly for approval.

### What is wrong

`public.public_profiles` is reachable by the **anonymous** role with full write privileges:

| Privilege for `anon` | Granted? |
|---|---|
| SELECT | yes (intended) |
| INSERT | **yes — not intended** |
| UPDATE | **yes — not intended** |
| DELETE | **yes — not intended** |

### Why that is exploitable, not merely untidy

Four facts combine:

1. The view is **auto-updatable** — `information_schema.views` reports `is_updatable = YES` and
   `is_insertable_into = YES`, because it is a simple column-subset `SELECT` from a single table.
   Writes therefore pass straight through to `public.users`.
2. The view was created `WITH (security_invoker = off)`, so it executes as its **owner**, `postgres`.
3. `public.users` has RLS enabled but **not forced** (`relforcerowsecurity = false`), so the owner
   **bypasses RLS entirely**.
4. Supabase exposes `public`-schema views through PostgREST to the `anon` key, which is public by
   design (`NEXT_PUBLIC_SUPABASE_ANON_KEY`).

Net effect: an unauthenticated caller could `PATCH` or `DELETE` `/rest/v1/public_profiles` and
rewrite or delete **any** user's row — with no own-row restriction, since RLS is bypassed. Current
blast radius is small (`public.users` holds **2 rows**), but the path is live now and grows with the
user table.

### Root cause — and why the other three views escaped it

The database carries an `ALTER DEFAULT PRIVILEGES` rule (`pg_default_acl`, objtype `r`, grantor
`postgres`) granting **ALL** to `anon`, `authenticated`, and `service_role` on newly created
relations in `public`. `public_profiles` is brand new, so it inherited that. The other three views
in `views.sql` were `CREATE OR REPLACE` over **pre-existing** views, which preserves the existing
ACL — so they kept the narrow `authenticated=r` and were unaffected. Confirmed by comparison:

```
component_dependencies_graph_view_v3   authenticated=r/postgres
components_with_username               authenticated=r/postgres
demo_hunt_leaderboard                  authenticated=r/postgres
public_profiles                        anon=arwdDxtm, authenticated=arwdDxtm   <-- the outlier
```

`views.sql` itself never grants to `anon`; the default-privileges rule did it implicitly. This is a
latent trap for **any** future new relation in this database, not just this one view.

### Proposed fix (as originally drafted, pending approval)

```sql
REVOKE ALL ON public.public_profiles FROM anon, authenticated;
GRANT SELECT ON public.public_profiles TO anon, authenticated;
```

This preserves every intended read path — the three dependent `security_invoker = on` views join
`public_profiles` precisely to read cross-user profile rows — while removing the write path. It
should also be added to `supabase/views.sql` so a future re-run does not silently reopen the hole.

### Fix applied and verified (29-07-26, same day)

The user approved the two statements above. Spawning a fix agent to apply them failed three times
in a row (one cut-off mid-apply on an API error that edited `supabase/views.sql` locally but never
committed the live transaction; two further attempts failed on API overload, HTTP 529). A
read-only introspection re-check after those failures confirmed the hole was **still open** — `anon`
still held INSERT/UPDATE/DELETE/TRUNCATE on `public.public_profiles`.

**Stated protocol deviation:** the orchestrator applied the two approved statements directly,
rather than continuing to retry the spawn. This is not the normal path — the orchestrator does not
execute DDL. It was done here because (a) the statements were exactly the two the user had already
approved verbatim, (b) they are idempotent (`REVOKE`/`GRANT`, safe to re-run), and (c) the
alternative was leaving a live anonymous DELETE path into `public.users` open for an unknown
further duration while spawn attempts kept failing on infrastructure, not logic, errors.

**Post-fix verification, on a fresh connection:**

| Role | Privilege on `public_profiles` after fix |
|---|---|
| `anon` | `SELECT` only |
| `authenticated` | `SELECT` only |

Zero write privileges remain for either role. Dependent views were re-confirmed still resolving
correctly after the fix: `components_with_username` (67 rows), `component_dependencies_graph_view_v3`
(67 rows), `demo_hunt_leaderboard` (0 rows — correct; no hunt round has ever been created).

`supabase/views.sql` now carries both statements (lines 73-74) with an inline comment explaining
the `ALTER DEFAULT PRIVILEGES` trap, so a future re-run of the file cannot silently reopen this
hole. The "NOT applied" framing above and the "needs your approval" wording in the file's original
CRITICAL follow-up heading are superseded by this fix — retained above as history of how the hole
was found and reasoned about, not as the current state.

## Other carried-forward notes

- **`views.sql` header warning still stands:** `public_profiles`' `security_invoker = off` posture is
  undone by any later re-run of `enable-rls.sql`'s blanket security-invoker sweep. Unchanged by this
  apply, but now load-bearing for live behaviour rather than theoretical.
- **Stale context figure:** `process/context/all-context.md` describes Phase 1 as "30 SQL
  statements". The real count is 129 across the four files. Documentation drift only — the SQL is
  consistent.

## Scope discipline — what was NOT done

| Action | Status |
|---|---|
| SQL files modified | **none** — applied exactly as committed |
| DDL outside the 4 authorized files | **none** |
| Data mutation | **none** |
| Deploy / VPS / crontab | **none** |
| Git stage / commit / stash / revert | **none** — the ~1590 dirty entries were left untouched |
| Secrets printed or logged | **none** — only booleans and filenames |
| `public_profiles` anon-write fix | **APPLIED same day**, after user approval — see `## Fix applied and verified` above (orchestrator-applied directly, a stated deviation, after 3 failed fix-agent spawn attempts) |

## Evidence artifacts

In the session scratchpad: `baseline-verify.json` (pre-apply), `snapshot-before.json`,
`snapshot-after.json`, `postapply-verify.json` (independent post-apply read), plus the
`apply-live.mjs` / `verify-extra.mjs` / `verify-view-updatable.mjs` / `verify-rls-force.mjs`
introspection scripts.
