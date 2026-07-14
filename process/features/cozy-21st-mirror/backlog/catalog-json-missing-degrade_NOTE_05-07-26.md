---
name: report:catalog-json-missing-degrade-note
description: "Backlog note — catalog.ts silently degrades to empty catalog when public/catalog.json is missing"
date: 05-07-26
metadata:
  node_type: memory
  type: report
  feature: cozy-21st-mirror
  phase: phase-01
---

# Backlog Note — catalog.ts Missing catalog.json Degrade Path

**Discovered during:** cozy-21st-mirror Phase 1 RESEARCH (05-07-26)
**Status:** Deferred — out of Phase 1 scope

## Issue

`apps/web/lib/catalog.ts` silently degrades to an empty catalog when `public/catalog.json` has
never been generated (e.g. local dev before a prior build has run). There is no explicit error or
warning surfaced when this happens — the catalog just renders empty.

## Why deferred from Phase 1

`catalog.ts` is currently mid-refactor by an unrelated, uncommitted in-flight effort (the
QStash/`catalog.json` build pipeline — see `apps/web/app/api/webhooks/qstash/`,
`apps/web/public/catalog.json`, and `scripts/build-catalog.mjs` in the current git status). Phase 1
deliberately treats this as ambient state and does not modify `catalog.ts` to avoid reverting or
conflicting with that in-flight work.

## Recommended follow-up

Once the QStash/catalog.json pipeline effort lands, revisit `catalog.ts` to add an explicit
warning/log (or build-time assertion) when `catalog.json` is absent, so the empty-catalog
degrade mode is diagnosable rather than silent.
