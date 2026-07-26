# Embedding Backfill Cron — Operator Install Guide

**TL;DR:** Install a plain hourly crontab entry on gayo-vps (as the `higherbits` user) that curls
`/api/cron/gen-usage-embeddings`. Run the dry-run first. **This install is operator-only — no agent
performs any step in this document.**

---

## What this schedules

`GET /api/cron/gen-usage-embeddings` (`apps/web/app/api/cron/gen-usage-embeddings/route.ts`) asks
the database which components/demos are missing embeddings
(`get_missing_usage_embedding_items()`), then invokes the `generate-embeddings` Supabase edge
function once per item. The route does **not** call OpenAI/Gemini itself — the edge function does,
using its own Deno-side credentials. No new secret is needed in the `apps/web` runtime.

The route is guarded by a bearer token: requests whose `Authorization` header is not
`Bearer $CRON_SECRET` get a 401.

---

## Environment variables

| Variable | Where it lives | Required | Notes |
|---|---|---|---|
| `CRON_SECRET` | `apps/web` runtime env **and** the crontab file | yes | Must match on both sides or every run 401s. |
| `EMBEDDING_CRON_BATCH_CAP` | `apps/web` runtime env | no (default **20**) | Max items processed per run. |

**Batch cap behavior (read this):** the cap applies on *every* call, not only in dry-run mode. A run
processes at most `EMBEDDING_CRON_BATCH_CAP` items (default 20). Items over the cap are **not**
dropped — `get_missing_usage_embedding_items()` recomputes missing items from live DB state on each
call, so the leftovers are simply picked up on the next hourly run. A non-numeric or non-positive
value falls back to 20.

---

## Step 1 — Re-verify the deploy target

The deploy path, app user, and pm2 app name have drifted before (see
`process/context/all-context.md` §Deployment, which carries a standing warning about exactly this).
**Confirm them at install time — do not trust the values below blindly:**

```bash
pm2 list
ls /home/*/htdocs/
```

Values as documented today:

- app user: `higherbits`
- app path: `/home/higherbits/htdocs/higherbits.dev`
- pm2 app: `higherbits.dev`

If any of these differ from what `pm2 list` / `ls` shows, use the real values and update
`process/context/all-context.md` §Deployment.

---

## Step 2 — Dry-run manually BEFORE installing the schedule

Confirm the route works and see what it *would* process, with zero edge-function invocations and
zero paid API spend:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  'https://higherbits.dev/api/cron/gen-usage-embeddings?dryRun=true'
```

Expected: HTTP 200 and a JSON body shaped like

```json
{
  "dryRun": true,
  "wouldProcess": 3,
  "totalMissing": 3,
  "cap": 20,
  "items": [{ "item_type": "component", "item_id": 11 }]
}
```

`wouldProcess` is what **this** run would do (it never exceeds `cap`). `totalMissing` is the
**uncapped** backlog. If `totalMissing` stays flat or grows across successive dry-runs, the hourly
cap is not keeping up — raise `EMBEDDING_CRON_BATCH_CAP` or run the job more often.

`?dryRun=true` short-circuits before the processing loop, so it makes **no** `functions.invoke`
call. Omitting the flag runs the job for real.

A 401 here means `CRON_SECRET` in your shell does not match the one in the app's runtime env.

---

## Step 3 — Create the log directory

Cron's default mail delivery is usually unconfigured on a fresh VPS, so output is redirected to a
file. That directory must exist first, or every run's output is lost:

```bash
mkdir -p /home/higherbits/logs
```

---

## Step 4 — Install the crontab (the one privileged step)

Log in and switch to the app user. **Always use `su - higherbits`, never `sudo -u higherbits`** —
`sudo -u` pollutes `HOME` and breaks corepack on this host.

```bash
ssh root@72.62.196.231
su - higherbits
crontab -e
```

Paste exactly this (two lines — a variable declaration, then the schedule):

```
CRON_SECRET=<value>
0 * * * * flock -n /tmp/embedding-cron.lock -c 'curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://higherbits.dev/api/cron/gen-usage-embeddings' >> /home/higherbits/logs/embedding-cron.log 2>&1
```

Replace `<value>` with the real secret. `CRON_SECRET=` is a standard crontab variable declaration —
cron reads it and interpolates it into the command via `$CRON_SECRET`.

Install it as the **`higherbits` user's** crontab, never root's.

### What each part does

- `0 * * * *` — hourly, on the hour. Matches the cadence originally declared in
  `apps/web/vercel.json` (that Vercel cron entry never fires; the app runs on gayo-vps pm2).
- `flock -n /tmp/embedding-cron.lock -c '...'` — prevents two runs overlapping if a slow run is
  still in flight when the next hour fires. `-n` means "give up immediately rather than wait."
- `curl -fsS` — `-f` treats HTTP >= 400 as a failure (non-zero exit), `-s` silences the progress
  meter, `-S` still prints curl's own error message to stderr so failures remain visible.
- `>> ... 2>&1` — appends both stdout and stderr to the log.

---

## Step 5 — Confirm it ran

```bash
tail -n 50 /home/higherbits/logs/embedding-cron.log
```

A successful run appends the route's JSON response (the list of items it processed). A failed run
appends curl's error text.

---

## Operator safety notes

**A skipped run is silent.** If `flock` cannot get the lock (a previous run is still going), the
command exits without producing output — no error, no log line, nothing. An "hour with no log
entry" therefore means *"the previous run was still in flight,"* not *"the job failed."* Diagnose
accordingly before assuming breakage.

**Secret handling.** The `CRON_SECRET` value lives only inside the crontab file itself, which the
cron spool protects with owner-only (600) permissions. Do not copy it into any other file on the
host. Never log its value — the `curl` command above deliberately does not echo request headers, and
the route never returns the secret in any response body. If you add flags for debugging, do **not**
add `-v` or `--trace`, which would print the `Authorization` header into the log file.

**Removing the schedule.** `crontab -e` as the `higherbits` user and delete both lines.

---

## Related files

- Route: `apps/web/app/api/cron/gen-usage-embeddings/route.ts`
- Tests: `apps/web/app/api/cron/gen-usage-embeddings/__tests__/route.test.ts`
- Verification seed data: `supabase/seed-embedding-verification.sql` (authored, not applied)
- Edge function invoked: `supabase/functions/generate-embeddings/`
