# Sandbox Reaper Cron — Operator Install Guide

**TL;DR:** Add one line to the existing `/etc/cron.d/higherbits-crons` on gayo-vps so
`/api/cron/reap-sandboxes` runs every 10 minutes through the wrapper that is already installed.
Dry-run it first. **This install is operator-only — no agent performs any step in this document.**

---

## What this schedules

`GET /api/cron/reap-sandboxes` (`apps/web/app/api/cron/reap-sandboxes/route.ts`) is the backstop
against CodeSandbox credit burn. Every other guard in this change is client-side and depends on a
browser behaving: a crashed tab, a stuck websocket, or a VM started by anything other than the
studio UI still bills with nothing in the browser to stop it. This route does not depend on any tab
being open.

Each run:

1. Lists every running VM in the workspace (`sdk.sandbox.list({ status: "running" })`), **paging
   through all pages**, not just the first.
2. Looks up each VM's matching `sandboxes` row and reads `updated_at` — the app's real activity
   signal. `/api/sandbox/touch` refreshes it every 5 minutes from an active, visible, non-idle
   studio tab, and `/api/sandbox/connect` refreshes it on every start.
3. Takes one of exactly two actions per VM:
   - **inside the grace window** → `updateHibernationTimeout(id, 60)`. Cheap normalisation: the
     list API cannot report a VM's currently-configured timeout, so this pulls any legacy long
     timeout down to current policy. No effect on a live session's connectivity.
   - **past the grace window, or running with no `sandboxes` row claiming it** → `hibernate(id)`.

**`shutdown()` is never called from this automatic path.** Hibernate pauses and preserves the VM
filesystem; the app's own reconnect logic resumes it transparently. Shutdown destroys. A
false-positive hibernate costs a user a few seconds of reconnect UI; a false-positive shutdown
would cost them their work. Shutdown stays a manual escalation.

The route is guarded by a bearer token: a request whose `Authorization` header is not
`Bearer $CRON_SECRET` gets a 401, and an **unset** `CRON_SECRET` rejects every request (fails
closed) rather than matching the literal string `Bearer undefined`.

---

## Environment variables

| Variable | Where it lives | Required | Notes |
|---|---|---|---|
| `CRON_SECRET` | `apps/web` runtime env | yes | Already present — the existing wrapper reads it. Must match what the app runtime sees or every run 401s. |
| `CSB_REAPER_MAX_RUNTIME_MINUTES` | `apps/web` runtime env | no (default **30**) | Grace window. A VM whose row has not been touched in this many minutes is hibernated. |
| `CSB_HIBERNATION_TIMEOUT` | `apps/web` runtime env | no (default **60**) | The timeout the reaper normalises live VMs down to. |

**Why 30 minutes is safe, not a coin flip:** an active tab writes `updated_at` every 5 minutes, so
a live session's row is never more than ~5 minutes stale — a 6x margin inside the 30-minute window.
Even a dropped touch leaves ~10 minutes stale, still 3x inside it. Lowering
`CSB_REAPER_MAX_RUNTIME_MINUTES` below ~15 erodes that margin and starts risking reaping live
sessions; do not go below it without re-reading the arithmetic above.

---

## Step 1 — Re-verify the deploy target and the existing cron wiring

The deploy path, app user, and pm2 app name have drifted before (see
`process/context/all-context.md` §Deployment). **Confirm at install time — do not trust these
blindly:**

```bash
pm2 list
ls /home/*/htdocs/
cat /etc/cron.d/higherbits-crons
ls -l /home/higherbits/bin/higherbits-cron.sh
```

Values as documented today:

- app user: `higherbits`
- app path: `/home/higherbits/htdocs/higherbits.dev`
- pm2 app: `higherbits.dev`
- cron definition: `/etc/cron.d/higherbits-crons`, running as the `higherbits` user
- wrapper: `/home/higherbits/bin/higherbits-cron.sh` (mode `700`, owned by `higherbits`)
- log: `/home/higherbits/logs/higherbits-cron.log`

**This host does NOT use the per-user crontab that `README-embedding-cron.md` describes.** That
guide predates the current wiring. The live scheduler is the `/etc/cron.d/higherbits-crons` +
wrapper pair above, installed 2026-09-14. Follow this file, not that one.

**Why the wrapper exists, and why you must use it:** it reads `CRON_SECRET` from the app's own
override-then-plain env file and passes it to `curl` through a **stdin config block**
(`curl --config -` / `-K -`), never through argv. Process arguments are world-readable via
`ps aux` on this shared host, so putting the secret on a command line would leak it to every local
user. Do not inline a `curl -H "Authorization: Bearer ..."` command into the cron file.

---

## Step 2 — Dry-run manually BEFORE installing the schedule

`?dryRun=true` short-circuits before any SDK mutation, so it makes **zero** `hibernate` /
`updateHibernationTimeout` calls and changes nothing:

```bash
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  'https://higherbits.dev/api/cron/reap-sandboxes?dryRun=true'
```

Expected: HTTP 200 and a JSON body shaped like

```json
{
  "dryRun": true,
  "inspected": 3,
  "wouldHibernate": 1,
  "wouldTighten": 2,
  "maxRuntimeMinutes": 30,
  "decisions": [
    { "codesandboxId": "abc123", "action": "hibernate", "reason": "stale", "idleMinutes": 91.4 }
  ]
}
```

**Read `decisions` before installing the schedule.** If it proposes hibernating a VM you know is
in active use, stop and investigate — that means the activity signal is not reaching
`sandboxes.updated_at` and the reaper would interrupt real sessions. `reason` tells you which rule
fired: `stale` (row too old), `unclaimed` (running VM with no `sandboxes` row), `active` (inside
the window, tighten only).

A 401 here means `CRON_SECRET` in your shell does not match the app runtime's value.

Note this dry-run curl **does** put the secret in your shell's argv for the duration of the
command. That is acceptable for a one-off interactive check by the operator; it is not acceptable
for the scheduled entry, which is why the wrapper exists.

---

## Step 3 — Confirm the log directory exists

The wrapper appends there; it was created when the first cron was installed, but confirm:

```bash
ls -ld /home/higherbits/logs
```

---

## Step 4 — Add the schedule (the one privileged step)

```bash
ssh root@72.62.196.231
cat /etc/cron.d/higherbits-crons        # read what is already there first
```

Append one line, matching the existing entries' format exactly (cron.d lines carry a **user
field** — `higherbits` — which a user crontab does not):

```
*/10 * * * * higherbits /home/higherbits/bin/higherbits-cron.sh /api/cron/reap-sandboxes >> /home/higherbits/logs/higherbits-cron.log 2>&1
```

**Match the wrapper's real calling convention rather than the line above if they differ** — read
`/home/higherbits/bin/higherbits-cron.sh` and copy how the existing `gen-usage-embeddings` entry
invokes it. The wrapper's argument shape is the authority; this document is not.

`/etc/cron.d` files must be owned by root, mode `644`, and contain **no dots in the filename**
(`higherbits-crons` is already correct). Cron picks the change up without a reload.

### What each part does

- `*/10 * * * *` — every 10 minutes. Independent of the embedding cron's hourly cadence; a VM left
  running costs credits continuously, so a 10-minute detection window bounds the waste at roughly
  ten minutes past the grace window.
- `higherbits` — the user field. Runs unprivileged, as the app user.
- the wrapper — supplies `CRON_SECRET` via curl stdin config, never argv.
- `>> ... 2>&1` — appends both streams to the shared cron log.

---

## Step 5 — Confirm it ran

```bash
tail -n 50 /home/higherbits/logs/higherbits-cron.log
```

A successful run appends the route's JSON response. The route also emits a structured line to the
pm2 log:

```
[sandbox-reaper] run complete: { dryRun: false, inspected: 3, hibernated: 1, tightened: 2,
  failures: 0, maxRuntimeMinutes: 30,
  hibernatedDetail: [ { id: 'abc123', reason: 'stale', idleMinutes: 91 } ] }
```

```bash
pm2 logs higherbits.dev --lines 100 | grep sandbox-reaper
```

**This is the credit-burn early-warning signal.** `hibernated` climbing run after run means VMs are
routinely being abandoned without the client-side hibernate firing. `inspected` staying high while
`hibernated` stays 0 means VMs are being kept alive by activity touches — check that against how
many people are actually working.

`failures > 0` means individual VMs failed to hibernate. One failure does not abort the sweep; the
rest still get reaped, and the next run retries.

---

## Operator safety notes

**The reaper never destroys.** Its automatic path calls only `hibernate` and
`updateHibernationTimeout`. If you ever find yourself adding `shutdown` to it, that is a design
change requiring its own review, not a tuning tweak.

**A false-positive hibernate is recoverable and cheap.** The user sees the "Connecting to
sandbox" UI for a few seconds while `use-sandbox.ts`'s reconnect path calls
`/api/sandbox/connect` → `start()`. Hibernate is pause-not-destroy: the filesystem survives.

**It fails closed on a DB error.** If the `sandboxes` lookup fails, the run returns 500 without
hibernating anything, rather than treating every running VM as unclaimed and hibernating the whole
workspace.

**Secret handling.** Never add `-v` or `--trace` to the wrapper's curl for debugging — they print
the `Authorization` header into the shared log file. The route never returns the secret in any
response body.

**Removing the schedule.** Delete the line from `/etc/cron.d/higherbits-crons`. Leave the wrapper
and the other entries alone.

---

## Related files

- Route: `apps/web/app/api/cron/reap-sandboxes/route.ts`
- Tests: `apps/web/app/api/cron/reap-sandboxes/__tests__/route.test.ts`
- Activity signal (server): `apps/web/app/api/sandbox/touch/route.ts`
- Activity signal (client): `apps/web/components/features/studio/sandbox/hooks/use-sandbox.ts`
- Resume path the reaper relies on: `apps/web/app/api/sandbox/connect/route.ts`
- Sibling cron guide (older wiring — read the caveat in Step 1): `ops/README-embedding-cron.md`
