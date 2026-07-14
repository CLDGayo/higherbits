---
phase: phase-1-billing-gate
date: 2026-06-28
status: COMPLETE_WITH_GAPS
feature: monetization-catalog
plan: process/features/monetization-catalog/active/21st-clone_27-06-26/phase-1-billing-gate_PLAN_27-06-26.md
---

# Phase 1 Report — Billing + Auth + Pro-gate Migration

**Program:** 21st-clone monetization-catalog
**Phase:** 1 of 4
**EVL result:** All automated gates green (16/16 tests pass)
**Known gaps:** AC-3 + AC-4 BLOCKED on live env keys (accepted)

---

## What Was Done

All Step A–E checklist items implemented. Specific changes:

- **apps/web/app/api/checkout/route.ts** — dual-mode billing (subscription + payment), `?mode=` query param validation with 400 on invalid/missing, Stripe Customer creation with `metadata.clerkUserId` for lifecycle event routing.
- **apps/web/app/api/webhooks/stripe/route.ts** — 7-event lifecycle (checkout.session.completed ×2 modes, customer.subscription.deleted, invoice.paid, invoice.payment_failed + 2 additional), idempotent (read-before-write via `clerkClient().users.getUser()`), Stripe-Signature verification retained, Events 3/4 resolve Clerk userId via `stripe.customers.retrieve(customerId).metadata.clerkUserId`.
- **apps/web/lib/tiers.ts** — DELETED. Hardcoded `PRO_SLUGS` Set removed entirely.
- **apps/web/lib/registry.ts** — IsPro frontmatter extractor added (regex at L63), `isPro?: boolean` added to `RegistryEntry` interface. Also `author?`, `sourceRepo?`, `licenseSpdx?` added.
- **apps/web/app/(catalog)/[category]/[slug]/page.tsx** — removed `import { isPro } from "@/lib/tiers"`, replaced `isPro(category, slug)` with `entry?.isPro === true`.
- **docs/evidence-manifest/registry/lofi-cards__lofi-card.md** — `IsPro: true` added to frontmatter.
- **docs/evidence-manifest/registry/cozy-buttons__pill-button.md** — `IsPro: true` added to frontmatter.
- **apps/web/package.json** — vitest `^1.6.0` + `@vitejs/plugin-react` devDeps added; `"test": "vitest run"` script added; `passWithNoTests: true` in vitest config.
- **apps/web/vitest.config.ts** — new file, `environment: "node"`, includes `**/__tests__/**/*.test.ts`.
- **apps/web/__tests__/checkout.test.ts** — 5 tests (dual mode, invalid mode, no mode, customer.create with clerkUserId metadata).
- **apps/web/__tests__/webhook.test.ts** — 7 tests (7-event lifecycle + idempotency + invalid Stripe-Signature).
- **apps/web/__tests__/registry.test.ts** — 4 tests (IsPro:true, IsPro:false, IsPro:absent→false default, existing fields unchanged).

---

## What Was Skipped/Deferred

- **AC-3 (runtime paywall smoke)** — BLOCKED on live Clerk + Stripe keys. Manual smoke test (fetch `/lofi-cards/lofi-card` without session, assert LOCKED_SOURCE in page source) deferred until `STRIPE_SECRET_KEY` + `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` + `CLERK_SECRET_KEY` set in `apps/web/.env.local`.
- **AC-4 (Pro-session unlock)** — BLOCKED on live Clerk keys and Clerk Dashboard session claim configuration (`publicMetadata` claim must be added in Clerk Dashboard → Sessions).
- **Local Build Checkpoint** (browser visual confirmation) — also BLOCKED on live Clerk dev keys. `clerkMiddleware()` in `apps/web/middleware.ts` attempts a handshake to the encoded frontend-API host from the publishable key. A format-valid placeholder key (e.g. `pk_test_Y2xlcmsuZXhhbXBsZS5jb20k`, decodes to `clerk.example.com`) unblocks the Next.js BUILD but breaks dev RUNTIME with `ERR_NAME_NOT_RESOLVED` on every page load. Real keys (`pk_test_/sk_test_` from a live Clerk app) are required for any localhost session-bearing route to work.

---

## Test Gate Outcomes

| Gate | Command | Result |
|---|---|---|
| Unit tests | `corepack pnpm --filter web test` | PASS — 16/16 (registry 4, checkout 5, webhook 7) |
| Build | `corepack pnpm --filter web build` | PASS — 13/13 pages; required format-valid placeholder Clerk key in `.env.local` |
| Web type-check | `corepack pnpm --filter web type-check` | PASS |
| UI type-check | `corepack pnpm --filter @repo/ui type-check` | PASS |
| grep: no tiers imports | `grep -r "from.*tiers" apps/web/ --include="*.ts" --include="*.tsx"` | PASS — no output |
| grep: no hardcoded Set | `grep -n "new Set" apps/web/lib/tiers.ts 2>/dev/null \|\| echo "PASS (file deleted)"` | PASS — file deleted |

All 6 automated/grep gates: GREEN.
AC-3 + AC-4 (runtime/session probes): BLOCKED on live env keys — accepted known-gaps per validate-contract.

---

## Plan Deviations

- Webhook handles 7 events total (not 5 as the plan title states). The plan body always described the 7-event set (checkout.session.completed appears twice for sub vs payment mode; `invoice.payment_failed` is event 5 in the plan's Step C2 but the aggregate count from the test suite is 7). No behavioral deviation — plan implementation spec was followed exactly.
- `apps/web/.env.local` now exists on disk (gitignored) with a format-valid placeholder Clerk publishable key. This was required to unblock the build gate. It is not committed. Real keys still needed for runtime.
- Build gate required an `.env.local` workaround — the plan noted env keys would be needed for smoke tests but did not anticipate the build needing a format-valid placeholder key. Added to known learnings.

---

## Test Infra Gaps Found

- **Clerk dev runtime requires real keys.** A format-valid placeholder key (decoding `clerk.example.com`) passes the Next.js build validation but triggers `ERR_NAME_NOT_RESOLVED` at runtime because `clerkMiddleware()` attempts a handshake to the encoded frontend-API host. This blocks localhost visual confirmation of any Clerk-gated route for ALL future phases while `clerkMiddleware()` is global. Build/CI pipelines are unaffected (they do not execute the middleware). Resolution: user must obtain real Clerk dev keys (`pk_test_/sk_test_`) from the Clerk dashboard and set them in `apps/web/.env.local`.
- Backlog NOTE: `process/features/monetization-catalog/backlog/` — "Clerk dev keys needed for localhost runtime checkpoint — Phase 1 Local Build Checkpoint cannot be visually confirmed until `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` are set with real Clerk app credentials."

---

## SPEC Achievement

Scores each SPEC acceptance criterion from `21st-clone_SPEC_27-06-26.md` against its Phase 1 proving strategy.

| AC | Criterion (Phase 1 scope) | Strategy | Result |
|---|---|---|---|
| AC-3 | Unauthenticated request sees no source | Agent-Probe (BLOCKED on live keys) | UNMET — known-gap |
| AC-4 | isPro session sees full source | Hybrid (BLOCKED on live Clerk keys) | UNMET — known-gap |
| AC-5 | Both billing modes at checkout | Fully-Automated (checkout.test.ts) | MET |
| AC-6 | Subscription checkout sets isPro + subId + customerId | Fully-Automated (webhook.test.ts Test 1) | MET |
| AC-7 | Lifetime checkout sets isPro, no subId | Fully-Automated (webhook.test.ts Test 2) | MET |
| AC-8 | subscription.deleted revokes Pro | Fully-Automated (webhook.test.ts Test 3) | MET |
| AC-9 | invoice.paid keeps Pro active + updates currentPeriodEnd | Fully-Automated (webhook.test.ts Test 4) | MET |
| AC-15 | isPro from registry, not hardcoded Set | Fully-Automated (grep + registry.test.ts) | MET |

**MET: 6/8 Phase 1 ACs (AC-5, AC-6, AC-7, AC-8, AC-9, AC-15)**
**UNMET: 2/8 (AC-3, AC-4) — known-gaps, BLOCKED on live env keys, accepted per validate-contract.**

### SPEC Gaps (backlog stubs for unmet criteria)

- **AC-3 backlog stub:** When real Clerk + Stripe dev keys are available, run manual smoke test: `curl http://localhost:3000/lofi-cards/lofi-card` (no session) → assert response HTML does not contain real source code but contains `LOCKED_SOURCE` placeholder. Document result in a follow-up phase report.
- **AC-4 backlog stub:** When real Clerk keys and Clerk Dashboard session claim are configured (`publicMetadata` claim added, test user's `publicMetadata.isPro = true`), run: sign in as Pro user → navigate to `/lofi-cards/lofi-card` → assert real `source` is present in the rendered output (not `LOCKED_SOURCE`). Document result.

---

## Closeout Packet

**1. Selected plan path:** `process/features/monetization-catalog/active/21st-clone_27-06-26/phase-1-billing-gate_PLAN_27-06-26.md`

**2. Closeout classification:** Keep in active/testing — implementation is complete, 6/8 automated ACs pass, but AC-3/AC-4 (runtime + session probes) remain unverified pending live Clerk env keys. Phase 1 is CODE DONE per the plan's terminology, not VERIFIED. Plan archival is deferred until the Local Build Checkpoint is confirmed (or until the user explicitly accepts the gap and advances to Phase 2).

**3. What was finished:** All Step A–E items: test runner installed, checkout dual-mode, webhook 7-event lifecycle, tiers.ts deleted, registry-driven isPro gate, vitest unit tests (16/16 passing), build green, type-checks green.

**4. Verified:** 16 unit tests, build gate, type-check gates, 2 grep gates — all pass. | Unverified: AC-3 (unauthenticated runtime paywall), AC-4 (Pro session unlock) — both require live Clerk + Stripe keys.

**4b. Validate-contract:** Present (inline in plan, `## Validate Contract` section). Gate: CONDITIONAL (FAILs resolved by supplement cycle; AC-3/AC-4 accepted as known-gaps).

**5. Cleanup done:** Phase report written (this file). | Still needed: tick Phase Loop Progress steps 5/6/7 in plan; update roadmap and umbrella tracker; capture placeholder-key-runtime learning in all-context.md.

**6. Next valid state:** `Keep plan active. Update roadmap/umbrella state to reflect Phase 1 CODE DONE. Advance to Phase 2 Step 0 (RESEARCH) — orchestrator may proceed; Phase 1 known-gaps are on record and accepted.`

**7. Commit checkpoint:** Process commit belongs after UPDATE PROCESS — the execution commit (`3ed6a40` + execute-agent completion) already happened. This step produces process artifacts only (report, plan ticks, roadmap update, context update).

**8. Regression status:** No previously verified phases existed (Phase 1 is first). No regression surface to check. Stated explicitly: first phase, no prior verified surfaces.

**9. SPEC achievement:** See SPEC Achievement section above. 6/8 Phase 1 ACs met by passing automated/grep gates. 2/8 unmet (AC-3, AC-4) — known-gap residuals with backlog stubs.

---

Drift score: MEDIUM (3 signals: 10+ files touched, 3+ memory-worthy observations including placeholder-key-runtime learning, validate-contract deviation accepted)
Recommend UPDATE PROCESS -- significant changes detected.

---

## Forward Preview

### Test Infra Found

- vitest `^1.6.0` now installed in `apps/web/devDependencies`; `apps/web/vitest.config.ts` present; test script `"vitest run"` in `apps/web/package.json`
- `apps/web/__tests__/` directory exists with 3 test files (16 tests total)
- Phase 2 can add test files here immediately; no test runner setup needed

### Blast Radius Changes

All planned Phase 1 files touched. No out-of-blast-radius changes. `apps/web/.env.local` created (gitignored — not a blast-radius file, not committed).

### Commands to Stay Green

Phase 2 must keep all of these passing:

```bash
corepack pnpm --filter web test          # 16+ tests
corepack pnpm --filter web build         # requires .env.local with format-valid Clerk key
corepack pnpm --filter web type-check
corepack pnpm --filter @repo/ui type-check
grep -r "from.*tiers" apps/web/ --include="*.ts" --include="*.tsx"   # no output
```

### Dependency Changes

- `apps/web` devDependencies: `vitest ^1.6.0`, `@vitejs/plugin-react ^4.0.0` added
- No production dependency changes
