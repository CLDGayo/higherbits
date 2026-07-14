---
name: note:phase-19-r2-seed-upload
description: Backlog — live R2 upload of Phase 19 seed registry files deferred to manual run; Agent-Probe Local Build Checkpoint also pending
date: 05-07-26
feature: monetization-catalog
---

# Phase 19 — Deferred: Live R2 Seed Upload + Local Build Checkpoint

**Priority:** LOW (non-blocking — Phase 19 is VERIFIED COMPLETE on all automated gates; these are manual follow-ups)

## Problem

Two Phase 19 items were deliberately not run during EXECUTE/EVL:

1. **Live R2 seed upload.** `ops/upload-seed-entries.mjs` (new, Phase 19) is unit-tested against a
   mocked `uploadToR2` (`ops/__tests__/upload-seed-entries.test.mjs`, 2/2 passing) but was never
   executed against the real Cloudflare R2 bucket. The 4 new seed registry files
   (`themes__cozy-daylight.md`, `themes__lofi-dusk.md`, `themes__paper-cafe.md`,
   `templates__cozy-landing.md`) exist on disk and pass `validate-registry.mjs`, but have not been
   pushed to R2/CDN.
2. **Agent-Probe Local Build Checkpoint (PE.1).** Manual dev-server browse of `/templates` and
   `/themes`, opening one template + one theme detail page, and confirming the Pro theme
   (Lofi Dusk) stays locked for an anonymous/non-Pro user — was deferred per autopilot's
   manual-first-only stance on this Agent-Probe step.

## Root cause

Autopilot execution hard-locks live/manual-first steps (no live network writes, no
interactive dev-server browsing) — both items require a human or a follow-up session with browser
access / real R2 credentials.

## Fix options

1. **Run `node ops/upload-seed-entries.mjs`** with real `R2_*` env vars set (see
   `process/context/all-context.md` Env vars list). The IsPro-skip guard auto-skips
   `themes__lofi-dusk.md` and `templates__cozy-landing.md` (both `IsPro: true`) — only
   `themes__cozy-daylight.md` and `themes__paper-cafe.md` will actually upload. Confirm via the
   script's per-file log output (`SKIPPED ...` vs upload success).
2. **Run the Local Build Checkpoint manually:** `corepack pnpm --filter web dev` →
   `http://localhost:3000/templates` and `/themes` → open one entry of each → confirm ThemeDetail
   renders swatches + install snippet (no raw HTML injection) → view Lofi Dusk anonymously and
   confirm source/install-snippet stays locked.

Both can be done in a single short manual session; neither blocks Phase 20 planning.
