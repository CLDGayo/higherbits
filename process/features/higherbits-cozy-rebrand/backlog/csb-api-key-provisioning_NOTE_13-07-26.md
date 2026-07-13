---
name: plan:higherbits-cozy-rebrand-csb-api-key-provisioning
description: "Backlog — CSB_API_KEY (CodeSandbox) not provisioned, blocks studio publish CodeSandbox export"
date: 13-07-26
metadata:
  node_type: memory
  type: backlog-note
  feature: higherbits-cozy-rebrand
---

# CSB_API_KEY (CodeSandbox) not provisioned — env var needed

**Date:** 13-07-26
**Source:** UPDATE PROCESS closeout for the `higherbits-cozy-rebrand` program, LS-readiness
follow-up batch (commit `56eb4ef`, studio UX hardening).

**Gap:** The Creator Studio publish flow's CodeSandbox export step depends on a `CSB_API_KEY`
env var that is not currently set anywhere in this repo's `.env.example` / deployed environment.
Without it, the CodeSandbox export leg of publish is expected to fail or silently no-op.

**Why deferred:** Requires the user to obtain a CodeSandbox API key (account-level credential),
not a code change.

**Suggested resolution:**
1. User obtains a CodeSandbox API key from their CodeSandbox account settings.
2. Add `CSB_API_KEY` to `apps/web/.env.local` (dev) and the gayo-vps deployed env.
3. Confirm the studio publish flow's CodeSandbox export path reads it correctly (locate the
   consuming code — likely under `apps/web/app/(studio)/` or a publish/draft server action) and
   add graceful-degradation handling if not already present (matching the pattern used for
   other optional integrations like R2 in `ops/r2-client.mjs`).
4. Update `process/context/all-context.md` Environment and Configuration section once live.
