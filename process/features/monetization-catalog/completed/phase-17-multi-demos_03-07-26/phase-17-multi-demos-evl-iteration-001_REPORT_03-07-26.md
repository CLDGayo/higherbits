---
name: report:phase-17-multi-demos-evl-iteration-001
description: "EVL cycle 1 — security-scan findings fix (validate-registry Demos format constraints + video src guard)"
date: 03-07-26
metadata:
  node_type: memory
  type: report
  feature: monetization-catalog
  phase: phase-17-evl
---

# Phase 17 EVL — Iteration 001

## Trigger
EVL confirmation run: all 8 fully-automated gates PASS (vc-tester, independent). Security scan (program standing ritual, EVL leg 2): SECURITY GATE PASS — no new Critical/High — but 2 findings in blast radius:

| Severity | Location | Issue |
|---|---|---|
| Medium | `scripts/validate-registry.mjs:159` + `apps/web/components/preview/preview-tabs.tsx:153` | Demo `video` field unconstrained; `//evil.com/x.mp4` survives the `replace(/^\//,'')` + `/` prefix and becomes a protocol-relative external URL. Latent (registry operator-curated today; ingest does not pass demos) but elevates if github-ingest wires demos from external repos. |
| Low | `scripts/validate-registry.mjs:153` | Demo `id` lacks `/^[a-zA-Z0-9_-]+$/` constraint that `ops/copy-demo-video.mjs` already enforces — validator/helper inconsistency, no live exploit path. |

## Fix scope (this cycle)
1. `validate-registry.mjs`: `video` must match `/^previews\/[a-zA-Z0-9/_-]+\.mp4$/`; `id` must match `/^[a-zA-Z0-9_-]+$/`.
2. `preview-tabs.tsx`: defense-in-depth — render video only when path resolves under `/previews/`.
3. Extend `scripts/__tests__/validate-registry.test.mjs` with bad-video-path + bad-id cases.
4. Registry curated files already use `previews/...` placeholder paths — verify they pass the new constraint.

## Gates to re-confirm after fix
`node scripts/validate-registry.mjs` · `node --test scripts/__tests__/validate-registry.test.mjs` · `corepack pnpm --filter web test` (no new failures vs 6 baseline) · `corepack pnpm --filter web build` exit 0.
