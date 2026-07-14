---
name: report:phase-21-shadcn-registry
description: "Phase 21 — shadcn registry API Execution Report"
date: 05-07-26
metadata:
  node_type: memory
  type: report
  feature: monetization-catalog
  phase: 21
---

# Phase 21 Report

**Status:** ✅ VERIFIED
**Date:** 05-07-26

## Summary
The shadcn registry API was successfully implemented and secured, enabling developers to run `npx shadcn add` directly against our storefront.

## What Was Shipped
1. **API Endpoint (`/api/registry/[slug]/route.ts`)**:
   - Implemented dynamic route using `getCatalog()` and `readRegistryEntry()`.
   - Mapped internal Cozy schema to external shadcn `registry-item.json` schema.
   - Protected endpoint from brute-force using `@upstash/ratelimit`.

2. **Entitlement Checks (HMAC Signed Tokens)**:
   - CLI commands lack browser cookies, making `auth()` checks fail for Pro components.
   - Designed a stateless HMAC token system (`crypto.createHmac` + `process.env.CLERK_SECRET_KEY`) to safely authenticate CLI requests for Pro-tier assets.

3. **UI Updates (`page.tsx` & `<InstallBlock>`)**:
   - `page.tsx` generates the HMAC token server-side for authenticated Pro users.
   - `<InstallBlock>` surfaces the correct command based on tier (e.g. `npx shadcn add "http://localhost:3000/api/registry/soft-button?token=signature"`).

## Validation Evidence
- `vitest run` passed (87/87 tests). The broken CLI command test assertion was fixed.
- `tsc --noEmit` passed.
- `scripts/validate-registry.mjs` passed (20 tests).

## Blockers / Gaps
- None.

## Next Steps
- Advance to Phase 22: Usage metering.
