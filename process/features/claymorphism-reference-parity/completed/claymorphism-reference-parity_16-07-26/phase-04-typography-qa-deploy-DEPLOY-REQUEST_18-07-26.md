---
name: deploy-request:claymorphism-reference-parity-phase-04
description: "gayo-vps deploy request DRAFT for claymorphism-reference-parity Phase 4 — DRAFT ONLY, never executed by any agent"
date: 18-07-26
metadata:
  node_type: memory
  type: deploy-request
  feature: claymorphism-reference-parity
  phase: phase-04
---

# Deploy Request (DRAFT) — claymorphism-reference-parity Phase 4

> ✅ **EXECUTED 18-07-26 — see status header below.** The draft body underneath is preserved
> verbatim as the historical record of what was requested and why; it was NOT edited to reflect
> the outcome. Read the status header first.

## STATUS: EXECUTED 18-07-26

- **Deployed SHA:** `bfa2573` (5 attempts to green — see the umbrella plan's
  `## Deploy Confirmation (18-07-26)` section for the full blocker/fix narrative).
- **Precondition below ("deploy is currently BLOCKED") turned out to be working-tree-only** — the
  foreign build/tsc red was never present in the committed `main` tree; `tsc --noEmit` on the
  committed tree (re-verified in an isolated scratch worktree during this deploy) was clean.
- **Deploy path re-verification (§ below) is now RESOLVED**: confirmed live at
  `/home/higherbits/htdocs/higherbits.dev`, pm2 app `higherbits.dev`; `/home/cozy/htdocs/higherbits.dev`
  confirmed present but dead.
- **Result:** `https://higherbits.dev` returns HTTP/2 200; production HTML confirms `font-cozy` and
  `clay-surface` markers are live. pm2 app `higherbits.dev` restarted and online.
- Full narrative, all 4 blockers found/fixed, and durable process learnings:
  `process/features/claymorphism-reference-parity/completed/claymorphism-reference-parity_16-07-26/claymorphism-reference-parity-umbrella_PLAN_16-07-26.md`
  §`## Deploy Confirmation (18-07-26)`, and `process/context/all-context.md` §Deployment.

---

> ⛔ **DRAFT ONLY — NEVER EXECUTED BY ANY AGENT (historical, at draft time).** This document was a
> request for explicit human authorization. Deploy execution is a Program Goal Charter **hard
> stop**: it happens only when the user runs the commands (or explicitly authorizes an agent to)
> in a live, interactive session. No RIPER-5 agent — including under a standing `/goal` —
> may run any step below. *(The actual deploy was carried out by the user directly, consistent
> with this constraint.)*

---

## Precondition (deploy is currently BLOCKED)

The program-wide build/tsc gate is **RED**, 100% foreign-attributed:

- `apps/web/lib/queries.ts` — 33 type errors
- `apps/web/hooks/use-analytics.ts` — 2 type errors
- **0 errors in any claymorphism-reference-parity phase file** (Phase 4 tsc re-confirmed 18-07-26).

These files are owned by the user's in-flight general plan
`process/general-plans/active/console-errors-cleanup_17-07-26/`, NOT by this program. See
`process/features/claymorphism-reference-parity/backlog/foreign-build-tsc-red_NOTE_18-07-26.md`.

**Deploy is BLOCKED until ONE of:**
1. The foreign `console-errors-cleanup` fix lands and `corepack pnpm --filter web build` + `tsc --noEmit` return green, OR
2. The user records an explicit accepted-exception to deploy with the foreign red present.

The production build (`next build`) will not complete a full page-data collection while these
foreign type errors (and unset `STRIPE_SECRET_KEY` on the billing routes) persist. Phase 4's OWN
changes compile cleanly — verified 18-07-26 via
`SKIP_BUILD_VALIDATION=true NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web build`
→ `✓ Compiled successfully in 11.0s` (failure occurred only later, at page-data collection, on a
foreign Stripe route with no `STRIPE_SECRET_KEY` in the build env).

---

## ⚠️ Deploy path re-verification — UNRESOLVED, re-verify before deploy

`process/context/all-context.md` §Deployment documents the live app at
`/home/higherbits/htdocs/higherbits.dev` (user `higherbits`), pm2 app `higherbits.dev`, with
`/home/cozy/htdocs/higherbits.dev` as a STALE/DEAD copy. **This state could not be fully confirmed
during Phase 4 recon (18-07-26):**

- ✅ SSH key-auth to `root@72.62.196.231` works (one successful recon call).
- ⚠️ `pm2 list` **as root is EMPTY** — expected if the app runs under a non-root user's pm2
  (`su - higherbits`), but not independently confirmed which user owns the port-3005 process.
- ⚠️ `/home/cozy/htdocs/higherbits.dev` **EXISTS** (the doc calls this the dead copy).
- ❓ `/home/higherbits/htdocs/higherbits.dev` — **could NOT be confirmed present**; the first
  `ls /home/*/htdocs/` output was truncated before reaching a `higherbits` user, and follow-up SSH
  calls timed out (flaky link from the execute sandbox).

**Action required before running the deploy:** re-run these two read-only commands and confirm the
live path/user/pm2-name, correcting the command sequence below if drifted:

```bash
ssh root@72.62.196.231 'ls -1d /home/*/htdocs/higherbits.dev; ls -1 /home/ | grep -i higher'
ssh root@72.62.196.231 'su - higherbits -c "pm2 list"; su - cozy -c "pm2 list"'
```

If the live copy is actually under `/home/cozy` (pm2 app `higherbits`), substitute that user/path/
pm2-name into the command sequence below. **Do not deploy against an unverified path.**

---

## Exact command sequence (per all-context.md §Deployment — verify path first)

```bash
# 1. Push the merged Phase 4 commit to origin main (github.com/CLDGayo/higherbits)
git push origin main

# 2. SSH to gayo-vps and deploy as the app user (NEVER sudo -u — HOME pollution breaks corepack)
ssh root@72.62.196.231
su - higherbits -c "cd ~/htdocs/higherbits.dev \
  && git pull --ff-only origin main \
  && corepack pnpm install --no-frozen-lockfile \
  && NODE_OPTIONS=\"--max-old-space-size=3072\" corepack pnpm --filter web build \
  && pm2 restart higherbits.dev"
```

Notes:
- The `NODE_OPTIONS=--max-old-space-size=3072` heap bound is **required** — an unbounded build gets
  OOM-killed (exit 137). On a flaky SSH session, prefer a detached/`nohup`-backed build so a dropped
  connection does not kill it.
- nginx proxy config is unchanged (port 3005 → higherbits.dev).
- Pushing to GitHub alone does NOT deploy — the `su - <app-user>` pull+build+restart is required.

---

## Rollback note

```bash
# On the VPS, as the app user, in ~/htdocs/higherbits.dev:
git log --oneline -5                 # find the previous good SHA
git reset --hard <PREVIOUS_GOOD_SHA> # revert working tree to the last known-good commit
NODE_OPTIONS="--max-old-space-size=3072" corepack pnpm --filter web build
pm2 restart higherbits.dev           # (or the drift-corrected pm2 app name)
```

nginx / pm2 process config is not modified by this deploy, so rollback is a pure git-SHA + rebuild +
restart. No config revert needed.

---

## Phase 4 gate summary (context for authorization)

| Gate | Result |
|---|---|
| vitest (Gate 1) | ✅ 48/48 across 15 files (baseline 45/14 + 3 new AC5 tests; zero regressions) |
| Reference-copy grep (Gate 4, AC7) | ✅ 0 |
| Billing-surface diff (Gate 5, AC10) | ✅ empty |
| OUTPUT_DIR fix (Gate 6) | ✅ `grep -c claymorphism-3d-redesign` == 0 |
| Visual evidence (Gate 3, AC1/AC4/AC6) | ⚠️ 10/12 screenshots captured in this task folder (2 `/public-dashboard` light-mode networkidle timeouts — env-flaky API route; agent-probe review confirms font-cozy visible + no checkerboard) |
| a11y (Gate 2, AC8) | ⚠️ env known-gap — 10 failures are `waitForLoadState(networkidle)` timeouts from the Clerk-keyless dev runtime, not axe violations; font-cozy is CSS-class-only and cannot introduce a11y violations |
| build / tsc (Gate 7, AC9) | ⚠️ foreign known-gap — 35 errors, 100% in `lib/queries.ts`/`use-analytics.ts`, 0 in any Phase 4 file; Phase 4 changes compile cleanly (`✓ Compiled successfully in 11.0s`) |

Deploy authorization should wait until the foreign build/tsc red (Gate 7) is resolved or explicitly
excepted, AND the deploy path is re-verified per the section above.
