---
name: plan:security-hardening
description: "Security-hardening pass on billing/auth/creator surfaces — rate limits, webhook payment_status guard, spoofable-key fix, Connect account reuse"
date: 01-07-26
feature: monetization-catalog
---

# Security Hardening — Billing / Auth / Creator Surfaces

**Date**: 01-07-26
**Status**: COMPLETE — EVL confirmed green, archived at UPDATE PROCESS (01-07-26). Committed as `9a3593d`.
**Complexity**: SIMPLE (4 independent, well-scoped fixes; no new architecture; no phase program)

**HIGH-RISK CLASS FLAGGED:** This plan touches billing (Stripe checkout, webhooks, Connect payouts)
and auth (Clerk userId / publicMetadata) surfaces. VALIDATE MUST run the security dimension
(STRIDE-lite scan) per `process/development-protocols/orchestration.md` §High-Risk Execution
Handoff and `vc-security`.

## Overview

RESEARCH identified 4 confirmed security gaps across the billing/creator-payout surface:

1. **F1** — `submitComponent` server action has zero rate limiting (unbounded privileged GitHub API use).
2. **F4** — Stripe webhook grants Pro without checking `session.payment_status`.
3. **F5** — 4 routes key their rate limiter on client-spoofable `x-forwarded-for`.
4. **F6** — Stripe Connect `POST` always creates a new Express account, never reusing an existing one.

All 4 are small, independent, additive changes to existing files. No schema change, no new
dependency, no new runtime surface — extending the existing `checkRateLimit` / Stripe / Clerk
patterns already in the codebase.

## Goals

- Close the 4 confirmed gaps without breaking any of the 2 existing test suites that couple to
  the touched code (`webhook.test.ts`, `checkout.test.ts`).
- Add missing test coverage for `submitComponent` (previously untested) and Connect account reuse.
- Keep every fix inside its existing file — no new abstraction layer, no refactor of
  `checkRateLimit`'s existing signature (only an additive named export).

## Scope

In scope: the 4 fixes below, their exact touchpoints, and the paired test updates/additions.
Out of scope (explicit backlog notes below): Stripe-side account-validity re-check via
`accounts.retrieve` for F6, and abandoned/in-progress Connect accounts with no Clerk metadata record.

---

## Touchpoints

| File | Change |
|---|---|
| `apps/web/lib/rate-limit.ts` | Add new named export `checkSubmitRateLimit` — dedicated Upstash `Ratelimit` instance, 5 requests / 60 min (3600s) sliding window, distinct `prefix` so it doesn't share state with the existing 10/60s limiter. |
| `apps/web/app/actions/submit-component.ts` | After the `auth()` / `userId` guard, call `checkSubmitRateLimit(\`submit:${userId}\`)`; throw a user-facing rate-limit error on failure, before any Octokit call. |
| `apps/web/app/api/webhooks/stripe/route.ts` | In `case "checkout.session.completed"` (~L90-106): gate `grantProIdempotent` calls behind an explicit `payment_status` allow-list per mode (see F4 below). |
| `apps/web/app/api/checkout/route.ts` (~L25-26) | Rate-limit key: `checkout:${userId}` (drop IP segment). |
| `apps/web/app/api/connect/route.ts` (~L12, ~L30-38) | Rate-limit key: `connect:${userId}`. Before `stripe.accounts.create`, read `clerkClient().users.getUser(userId).publicMetadata.stripeConnectAccountId`; if present, skip create and build a fresh `accountLinks.create` for that existing `account.id`. |
| `apps/web/app/api/connect/dashboard/route.ts` (~L12) | Rate-limit key: `connect-dashboard:${userId}`. |
| `apps/web/app/api/connect/return/route.ts` (~L12) | Rate-limit key: `connect-return:${userId}`. |

## Public Contracts

- No public API request/response shape changes. `checkRateLimit(ip)` signature is UNCHANGED
  (existing callers/mocks — e.g. `checkout.test.ts`'s wholesale mock of the module — remain valid).
- New export `checkSubmitRateLimit(key: string): Promise<{ success: boolean }>` added to
  `apps/web/lib/rate-limit.ts` — purely additive, no removal.
- Webhook behavior change (externally observable): a `checkout.session.completed` event with
  `payment_status !== "paid"` (one-time) or `"unpaid"` (subscription) no longer grants Pro. This is
  a deliberate security tightening — document in the phase report as a behavior change for anyone
  watching webhook logs.
- Connect `POST /api/connect` behavior change: a user who already completed onboarding (has
  `stripeConnectAccountId` in `publicMetadata`) gets a fresh onboarding link for their EXISTING
  account instead of a brand-new Express account. Response shape (303 redirect to accountLink.url)
  is unchanged.

## Blast Radius

- **Files modified:** 7 (listed under Touchpoints).
- **Files added:** 2 new test files.
- **Files updated (tests):** 2 (`webhook.test.ts`, `checkout.test.ts`).
- **Packages touched:** `apps/web` only (single package) — but risk class is HIGH (billing + auth +
  identity + secrets/trust-boundary: privileged `GITHUB_TOKEN`, Stripe secret key, Clerk
  `publicMetadata` writes).
- **Risk class:** billing/credits (F4, F6), auth/identity (F1, F5), secrets/trust-boundary (F1 uses
  privileged `GITHUB_TOKEN`).

## Security Notes (STRIDE-lite, pre-VALIDATE)

- **F1 (Denial of Service / Elevation of Privilege via API abuse):** unbounded calls drive a
  privileged token's GitHub API rate limit to exhaustion and can flood a repo with junk PRs. Fixed by
  per-user rate limit before any Octokit call.
- **F4 (Tampering / grant-without-payment):** a webhook event alone (if forged past signature
  verification, or a Stripe edge case with an unpaid session) should never be sufficient to grant
  Pro — payment_status is the authoritative "money actually moved" signal.
- **F5 (Spoofing):** `x-forwarded-for` is client-controllable on many platforms including Vercel
  unless explicitly trusted at the edge; keying on it lets an attacker bypass per-IP throttling.
  Since every one of these 4 routes already resolves an authenticated `userId` via `auth()` before
  the rate-limit check, keying on `userId` alone removes the spoofing vector with no loss of
  per-caller granularity.
- **F6 (Resource exhaustion / orphaned Stripe objects):** creating a new Express account on every
  POST leaks Stripe Connect accounts and can create ambiguity about which account is "the" payout
  destination for a user. Reuse via stored `publicMetadata.stripeConnectAccountId` closes this.

---

## Implementation Checklist

1. **`apps/web/lib/rate-limit.ts`** — add `checkSubmitRateLimit`:
   - New `Ratelimit` instance: `Ratelimit.slidingWindow(5, "3600 s")`, `prefix: "ratelimit:submit"`
     (distinct prefix so it never collides with the existing 10/60s limiter's Redis keys).
   - New exported function `checkSubmitRateLimit(key: string): Promise<{ success: boolean }>`
     mirroring the existing `checkRateLimit` shape.
   - Do NOT modify the existing `checkRateLimit` export or its `Ratelimit` instance.

2. **`apps/web/app/actions/submit-component.ts`** — enforce rate limit:
   - Import `checkSubmitRateLimit` from `@/lib/rate-limit`.
   - Immediately after the `if (!userId) { throw new Error("Unauthorized"); }` block, call
     `const { success: rateLimitOk } = await checkSubmitRateLimit(\`submit:${userId}\`);` then
     `if (!rateLimitOk) { throw new Error("Too many submissions — please try again later"); }`.
   - This must run BEFORE `submitSchema.safeParse` and BEFORE any Octokit/`clerkClient` call, so a
     rate-limited user never triggers privileged GitHub API usage.
   - **VALIDATE confirmation:** `submit-component.ts` never imports `next/headers` and never reads
     any IP — it only uses `auth()`. No `next/headers` mocking is required in the paired test file.

3. **`apps/web/app/api/webhooks/stripe/route.ts`** — payment_status guard in
   `case "checkout.session.completed"`:
   - Read `const paymentStatus = session.payment_status;` before branching on `session.mode`.
   - `mode === "subscription"` branch: only call `grantProIdempotent` when
     `paymentStatus === "paid" || paymentStatus === "no_payment_required"`; otherwise fall through
     to `break` (ack, no grant, no error — matches existing idempotent no-op pattern).
   - `mode === "payment"` branch: only call `grantProIdempotent` when `paymentStatus === "paid"`
     (strict — no `no_payment_required` allowance for one-time lifetime purchases); otherwise
     `break`.
   - Do NOT special-case `undefined`/missing `payment_status` — it falls through to "no grant"
     naturally via the strict allow-list (do not add an `??` default that widens the allow-list).

4. **`apps/web/app/api/checkout/route.ts`** — key fix:
   - Line ~25-26: remove the `const ip = ...` line and change the rate-limit call to
     `checkRateLimit(\`checkout:${userId}\`)`.

5. **`apps/web/app/api/connect/route.ts`** — key fix + account reuse:
   - Line ~12: change to `checkRateLimit(\`connect:${userId}\`)` (drop ip).
   - Before the `stripe.accounts.create` call: import `clerkClient` from `@clerk/nextjs/server`
     — **use a static top-of-file import** (matching this file's existing static `auth` import
     style, NOT the dynamic `await import(...)` pattern used in `connect/return/route.ts`; both
     work identically under the established `vi.mock("@clerk/nextjs/server", ...)` test convention,
     static import is the VALIDATE-recommended choice for consistency with this file's own style —
     see V2 Layer 2 CONCERN below), fetch `const user = await client.users.getUser(userId);`, read
     `const existingAccountId = (user.publicMetadata as { stripeConnectAccountId?: string })?.stripeConnectAccountId;`.
   - If `existingAccountId` is truthy: skip `stripe.accounts.create`; build the `accountLink` with
     `account: existingAccountId` directly (same `accountLinks.create` call, same `refresh_url`/
     `return_url`/`type: "account_onboarding"`).
   - If falsy: keep the existing `stripe.accounts.create` + `accountLinks.create` path unchanged.
   - **Backlog note (explicit, do NOT implement):** re-checking Stripe-side account validity via
     `stripe.accounts.retrieve(existingAccountId)` before reuse, and handling abandoned/
     in-progress accounts with no Clerk metadata record, are OUT OF SCOPE for this plan. Write a
     one-line backlog artifact at
     `process/features/monetization-catalog/backlog/connect-account-revalidation_NOTE_01-07-26.md`
     during EXECUTE (or note in phase report if execute-agent defers file creation to
     UPDATE PROCESS).

6. **`apps/web/app/api/connect/dashboard/route.ts`** — key fix:
   - Line ~12: change to `checkRateLimit(\`connect-dashboard:${userId}\`)` (drop ip).

7. **`apps/web/app/api/connect/return/route.ts`** — key fix:
   - Line ~12: change to `checkRateLimit(\`connect-return:${userId}\`)` (drop ip).

8. **`apps/web/__tests__/webhook.test.ts`** — update + extend:
   - Update the existing subscription `checkout.session.completed` test fixture
     (~L54-79) to include `payment_status: "paid"` in the session object.
   - Update the existing payment (one-time) `checkout.session.completed` test fixture
     (~L80+) to include `payment_status: "paid"`.
   - Add new test: `mode: "payment"`, `payment_status: "unpaid"` → assert
     `mockUpdateUserMetadata` / `mockClerkClient` grant path is NOT called (no Pro granted).
   - Add new test: `mode: "subscription"`, `payment_status: "no_payment_required"` → assert grant
     IS called (trial / 100%-off coupon case).
   - Add new test: `mode: "subscription"`, `payment_status: "unpaid"` → assert grant NOT called.

9. **`apps/web/__tests__/checkout.test.ts`** — upgrade key-arg assertion:
   - Existing 9 tests already mock `checkRateLimit` wholesale (`vi.fn(async () => ({ success: true }))`)
     — this remains valid after the F5 key change (mock doesn't care about the key argument).
   - Upgrade at least 1 existing test (or add 1 new test) to assert the exact key passed to the
     mocked `checkRateLimit` is `checkout:${userId}` (no `ip` or colon-delimited ip segment) — proves
     F5 is actually applied here, not just non-breaking.

10. **New file `apps/web/__tests__/submit-component.test.ts`**:
    - No `next/headers` mock needed — VALIDATE confirmed `submit-component.ts` never imports
      `headers()` (checklist item 2 note).
    - Mock `@clerk/nextjs/server` (`auth()` returns `{ userId: "user_test" }`, `clerkClient()` per
      existing pattern in `webhook.test.ts`).
    - Mock `@/lib/rate-limit` (`checkSubmitRateLimit: vi.fn()`).
    - Mock `@octokit/rest` (`Octokit` class with `.rest.git.getRef`, `.rest.git.createRef`,
      `.rest.repos.createOrUpdateFileContents`, `.rest.pulls.create` — the 4 calls per the RESEARCH
      finding — as no-op mocks). This is a NEW mock target not used in any existing test file —
      follow the same `vi.mock("stripe", () => ({ default: vi.fn(function () {...}) }))` factory
      pattern already established for Stripe, applied to `@octokit/rest`'s `Octokit` class.
    - Test 1: rate limit exceeded (`checkSubmitRateLimit` returns `{ success: false }`) → assert
      Octokit methods are NEVER called and the action throws/rejects.
    - Test 2: rate limit ok + valid input → assert the full PR-creation flow runs and
      `checkSubmitRateLimit` was called with key `submit:user_test`.
    - Test 3: unauthenticated (`auth()` returns `{ userId: null }`) → assert `Unauthorized` thrown
      before rate-limit check.

11. **New file `apps/web/__tests__/connect.test.ts`**:
    - Mock `@clerk/nextjs/server` (`auth()` → `{ userId: "user_test" }`; `clerkClient()` →
      `users.getUser` returning `publicMetadata` controllable per-test).
    - Mock `stripe` (`accounts.create`, `accountLinks.create` as `vi.fn()`).
    - Mock `@/lib/rate-limit` (`checkRateLimit: vi.fn(async () => ({ success: true }))`).
    - Test 1: `publicMetadata.stripeConnectAccountId` present → assert `stripe.accounts.create` is
      NOT called; assert `accountLinks.create` IS called with `account: <existing id>`.
    - Test 2: `publicMetadata` empty/absent → assert `stripe.accounts.create` IS called (existing
      behavior preserved); assert `accountLinks.create` uses the newly created account's id.
    - Test 3: rate limit exceeded → assert 429 returned, no Stripe calls made.

---

## Phase Completion Rules

- This plan has a single phase (no phase-program split). It is complete when all 8 Acceptance
  Criteria pass their paired Verification Evidence gates and the plan's validate-contract shows
  `Gate: PASS` (or an explicitly accepted CONDITIONAL).
- Code-only completion (all checklist items applied, tests not yet run) is `CODE DONE`, not
  `VERIFIED`. `VERIFIED` requires the full `corepack pnpm --filter web test` + `tsc --noEmit` run
  to be green.

## Acceptance Criteria

| # | Criterion | proven by | strategy |
|---|---|---|---|
| AC1 | `submitComponent` rejects the 6th call within an hour from the same user with no GitHub API call made | `submit-component.test.ts` Test 1 | Fully-Automated |
| AC2 | Stripe webhook does NOT grant Pro for `payment_status: "unpaid"` on either mode | `webhook.test.ts` new unpaid-mode tests | Fully-Automated |
| AC3 | Stripe webhook DOES grant Pro for `payment_status: "no_payment_required"` on subscription mode | `webhook.test.ts` new no_payment_required test | Fully-Automated |
| AC4 | All 4 routes (checkout, connect, connect/dashboard, connect/return) key rate limiting on `userId` only, no ip segment | `checkout.test.ts` key-arg assertion + code review of the 4 files | Fully-Automated + Agent-Probe (code review confirms all 4 files) |
| AC5 | Connect POST reuses an existing Stripe account when `stripeConnectAccountId` is present in publicMetadata | `connect.test.ts` Test 1 | Fully-Automated |
| AC6 | Connect POST still creates a new account when no existing account is on record (no regression) | `connect.test.ts` Test 2 | Fully-Automated |
| AC7 | Existing 16 tests (5 checkout-mock unrelated + 9 checkout + 7 webhook — actual count: 9 checkout, 7 webhook per repo context) still pass after all changes | `corepack pnpm --filter web test` full run | Fully-Automated |
| AC8 | Typecheck passes with no new `any`/type errors introduced | `corepack pnpm --filter web exec tsc --noEmit` | Fully-Automated |

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `corepack pnpm --filter web test` (full suite, incl. 2 new files) | Fully-Automated | AC1, AC2, AC3, AC5, AC6, AC7 |
| `corepack pnpm --filter web exec tsc --noEmit` | Fully-Automated | AC8 |
| Grep audit: `grep -n "x-forwarded-for" apps/web/app/api/checkout/route.ts apps/web/app/api/connect/route.ts apps/web/app/api/connect/dashboard/route.ts apps/web/app/api/connect/return/route.ts` returns 0 matches | Fully-Automated | AC4 |
| Manual code review of webhook payment_status allow-list (strict `paid`-only for one-time, `paid`/`no_payment_required` for subscription, no `undefined` widening) | Agent-Probe | AC2, AC3 |
| Manual review: `checkSubmitRateLimit` uses a distinct Redis prefix from `checkRateLimit` (no shared-state collision) | Agent-Probe | AC1 |

## Test Infra Improvement Notes

- `process/context/tests/all-tests.md` line 25 states "checkout.test.ts (5 tests)" — this is stale;
  the actual file has 9 tests (confirmed by VALIDATE reading the file directly). Not a plan defect;
  recommend a context-doc refresh in UPDATE PROCESS.

---

## Dependencies, Risks, Integration Notes

- **Dependency:** none new — reuses `@upstash/ratelimit`, `@clerk/nextjs/server`, `stripe`, all
  already installed in `apps/web`.
- **Risk — F4 webhook fixture coupling:** the 2 existing `webhook.test.ts` fixtures currently omit
  `payment_status`; if EXECUTE forgets to update BOTH before adding the guard, those 2 existing
  tests will start failing (this is expected and intentional — they must be updated in the same
  commit as the guard, not left red).
- **Risk — F1 ordering:** the rate-limit check MUST run before Octokit calls, not just before the
  return value — a naive "check but continue" bug would defeat the whole fix. Explicit checklist
  item 2 makes this the first statement after the auth guard.
- **Integration note — F6 reuse path:** `connect/return/route.ts` is the ONLY writer of
  `publicMetadata.stripeConnectAccountId` (confirmed via RESEARCH, ~L46-51, and re-confirmed during
  VALIDATE by reading the file directly), and only writes it after `account.details_submitted` is
  true. This means F6's reuse check in `connect/route.ts` will correctly no-op (fall to create-new)
  for any user who started but never completed onboarding — this is the accepted, documented
  backlog gap (item 5's backlog note), not a bug.
- **Backwards compatibility:** all 4 changes are additive/tightening — no existing legitimate flow
  (paid subscription, paid lifetime purchase, authenticated rate-limited requests, completed Connect
  onboarding) changes behavior. Only previously-exploitable/previously-unbounded paths change.
- **Rollback:** each of the 4 fixes is independently revertible (separate files, no shared new
  abstraction). If any single fix causes a regression, `git revert` on that file's hunk is safe
  without affecting the other 3.

## Validate Contract

Status: PASS
Date: 01-07-26
date: 2026-07-01
generated-by: outer-pvl

Parallel strategy: parallel-subagents (used for the V2 fan-out: 4 Layer 1 dimension agents + 5
Layer 2 section agents)
Rationale: Score 3/7 (S2 auth/billing surface, S6 high-risk class, S7 9 blast-radius files) —
MEDIUM band. No cross-agent coordination needed (each dimension/section reads independently), so
parallel subagents fit better than an agent team; single-package scope and no phase-program
classification rule out workflow/sequential escalation.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC1 | submitComponent rejects 6th call/hour from same user, no GitHub API call made | Fully-Automated | `apps/web/__tests__/submit-component.test.ts` Test 1 (rate-limit-exceeded case) via `corepack pnpm --filter web test` | A |
| AC2 | Webhook does NOT grant Pro when payment_status is "unpaid" (either mode) | Fully-Automated | `apps/web/__tests__/webhook.test.ts` new unpaid-mode tests via `corepack pnpm --filter web test` | A |
| AC3 | Webhook DOES grant Pro when payment_status is "no_payment_required" (subscription) | Fully-Automated | `apps/web/__tests__/webhook.test.ts` new no_payment_required test via `corepack pnpm --filter web test` | A |
| AC4 | All 4 routes key rate limiting on userId only (no ip segment) | Fully-Automated | `grep -n "x-forwarded-for" apps/web/app/api/checkout/route.ts apps/web/app/api/connect/route.ts apps/web/app/api/connect/dashboard/route.ts apps/web/app/api/connect/return/route.ts` returns 0 matches + `checkout.test.ts` key-arg assertion | A |
| AC5 | Connect POST reuses existing Stripe account when publicMetadata.stripeConnectAccountId present | Fully-Automated | `apps/web/__tests__/connect.test.ts` Test 1 via `corepack pnpm --filter web test` | A |
| AC6 | Connect POST still creates new account when no existing account on record (no regression) | Fully-Automated | `apps/web/__tests__/connect.test.ts` Test 2 via `corepack pnpm --filter web test` | A |
| AC7 | All 16 existing tests (9 checkout, 7 webhook) still pass after all changes | Fully-Automated | `corepack pnpm --filter web test` (full suite) | A |
| AC8 | Typecheck passes, no new `any`/type errors | Fully-Automated | `corepack pnpm --filter web exec tsc --noEmit` | A |

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan
- D — backlog test-building stub (named residual; keep-active; continue)

C-4 reconciliation: all 8 rows use Fully-Automated. No Known-Gap rows — every developed behavior in
this plan's blast radius has a Fully-Automated proving test. The 2 Agent-Probe entries from the
plan's own Verification Evidence table (payment_status allow-list manual review, Redis-prefix
manual review) are supplementary human/agent judgment layers on top of AC2/AC3/AC1's automated
proof, not substitutes — they are not separate criterion rows here because they do not gate a
distinct behavior; they are folded into AC1–AC3's Fully-Automated rows above.

Legacy line form (retained so existing validate-contract consumers still parse):
- F1 (submitComponent rate limit): Fully-automated: `corepack pnpm --filter web test` (submit-component.test.ts Test 1)
- F4 (webhook payment_status guard): Fully-automated: `corepack pnpm --filter web test` (webhook.test.ts new tests) | Agent-probe: manual review of allow-list strictness
- F5 (spoofable rate-limit key, 4 routes): Fully-automated: grep audit (0 matches) + `checkout.test.ts` key-arg assertion
- F6 (Connect account reuse): Fully-automated: `corepack pnpm --filter web test` (connect.test.ts Tests 1-2)
- Typecheck: Fully-automated: `corepack pnpm --filter web exec tsc --noEmit`

Dimension findings:
- Infra fit: PASS — all 9 touchpoint/new-test files confirmed to exist or be correctly placed; new `Ratelimit.slidingWindow(5, "3600 s")` call matches the existing `@upstash/ratelimit` API shape already in use; new `prefix: "ratelimit:submit"` confirmed distinct from existing `prefix: "ratelimit"` (no Redis key collision).
- Test coverage: PASS — vitest config (`environment: "node"`, `include: **/__tests__/**/*.test.{ts,tsx}`) auto-picks-up the 2 new test files with no config change; all 8 ACs map to Fully-Automated gates; 1 non-blocking context-doc-drift note recorded (all-tests.md test-count is stale, not a plan defect).
- Breaking changes: PASS — `checkRateLimit(ip: string)` signature confirmed UNCHANGED by reading `rate-limit.ts`; `checkout.test.ts`'s wholesale `@/lib/rate-limit` mock confirmed not to inspect the key argument today, so the F5 key-value change is non-breaking; `checkSubmitRateLimit` is a purely additive new export.
- Security surface: PASS (STRIDE-lite via vc-security) — F1 (DoS/EoP via unbounded privileged GitHub API use), F4 (Tampering — grant-without-payment), F5 (Spoofing — client-controllable x-forwarded-for), F6 (resource exhaustion — orphaned Connect accounts) all confirmed as real, currently-unfixed gaps in the read source; all 4 fixes verified correctly scoped and deny-by-default (F4's allow-list excludes `undefined`/`unpaid` by construction, not by special-casing); webhook signature verification already gates all webhook access — F4 is defense-in-depth, not a replacement; no new vulnerability introduced by any fix; 1 accepted backlog residual (F6 Stripe-side account-validity re-check, explicitly deferred and documented in the plan).
- F1 feasibility: PASS — exact insertion point confirmed at `submit-component.ts:20-24`; confirmed no `next/headers` import exists today, resolving the plan's own hedge (item 10) — no header mocking needed.
- F4 feasibility: PASS — exact `case "checkout.session.completed"` block confirmed at lines 90-106; both existing webhook.test.ts fixtures (lines 54-78, 80-96) confirmed to omit `payment_status` today, matching the plan's required fixture-update step; idempotency guard confirmed orthogonal/compatible with the new gate.
- F5 feasibility: PASS — exact `x-forwarded-for` lines confirmed in all 4 route files; `userId` confirmed resolved via `auth()` before the rate-limit call in all 4 files; `checkout.test.ts`'s wholesale mock confirmed to not assert on the key argument today (checklist item 9 correctly requires adding that assertion).
- F6 feasibility: PASS with 1 non-blocking CONCERN — reuse-path logic confirmed correct and `connect/return/route.ts:41-51` confirmed as the sole writer of the metadata key; CONCERN: plan's wording said "dynamic import" but `connect/route.ts` currently uses static imports (matching `auth`) — resolved via explicit execute-agent instruction (E1 below) to use a static import for style consistency; either works functionally and under existing mock conventions.
- Test-files feasibility: PASS — new `submit-component.test.ts` requires a NEW mock target (`@octokit/rest`) not seen in existing test files; confirmed the 4 exact Octokit methods used (`.rest.git.getRef`, `.rest.git.createRef`, `.rest.repos.createOrUpdateFileContents`, `.rest.pulls.create`) from reading `submit-component.ts:90-127`; mitigated via execute-agent instruction (E2 below).

Open gaps: none blocking. 1 accepted backlog residual already documented in the plan itself (F6 Stripe-side account-validity re-check — see Implementation Checklist item 5's explicit backlog note) — this is a pre-existing plan decision, not a VALIDATE-discovered gap, and requires no additional Open Gaps entry.

What this coverage does NOT prove:
- `corepack pnpm --filter web test` (all AC1/AC2/AC3/AC5/AC6/AC7 rows): does not prove behavior under
  a live Redis instance (Upstash `Ratelimit` is not mocked at the network layer in the same way
  Stripe/Clerk are — confirm during EXECUTE whether `redis.ts` needs a test-time stub; if
  `checkSubmitRateLimit`/`checkRateLimit` are exercised through mocks of `@/lib/rate-limit` itself in
  the new test files, as planned, this is a non-issue — but the underlying `Ratelimit.slidingWindow`
  behavior against real Redis latency/network partition is never verified by these unit tests). Also
  does not prove behavior under concurrent/racing requests (sliding-window correctness under load is
  untested).
- `corepack pnpm --filter web exec tsc --noEmit` (AC8): proves type-level correctness only: does not
  prove runtime correctness of any of the 4 fixes.
- Grep audit (AC4): proves the string `x-forwarded-for` is absent from the 4 files; does not prove no
  OTHER spoofable header (e.g. `x-real-ip`, `cf-connecting-ip`) is introduced as a replacement — none
  are planned, but the grep does not defend against a future regression using a different header name.
- Manual/Agent-Probe reviews (payment_status allow-list, Redis-prefix distinctness): judgment-based,
  not mechanically re-verifiable in CI; a future refactor could silently reintroduce the gap without
  a red test, since these are one-time code-review confirmations, not standing automated checks.
- F6 Stripe-side account validity: explicitly out of scope (documented backlog residual) — reused
  accounts are never re-verified against Stripe's live `charges_enabled`/`payouts_enabled` state by
  any gate in this plan.
(Required until C3 is implemented — temporary C3 mitigation)

Execute-Agent Instructions:

| # | Instruction | Trigger condition |
|---|---|---|
| E1 | Import `clerkClient` in `apps/web/app/api/connect/route.ts` using a static top-of-file import (matching this file's existing static `auth` import), not the dynamic `await import(...)` pattern seen in `connect/return/route.ts`. Both work under the existing `vi.mock` test convention; static import matches this file's own style. | Checklist item 5 |
| E2 | Mock `@octokit/rest`'s `Octokit` class in `submit-component.test.ts` using the same `vi.mock("stripe", () => ({ default: vi.fn(function () {...}) }))` factory-function pattern already established for Stripe, applied to the 4 exact methods used: `.rest.git.getRef`, `.rest.git.createRef`, `.rest.repos.createOrUpdateFileContents`, `.rest.pulls.create`. | Checklist item 10 |
| E3 | Confirm no `next/headers` import exists in `submit-component.ts` before writing `submit-component.test.ts` — VALIDATE confirmed it does not; skip any header mocking. | Checklist items 2, 10 |

Gate: PASS (no FAILs, no unresolved CONCERNs — 1 minor CONCERN resolved via E1 execute-agent instruction, not a plan blocker)
Accepted by: N/A — Gate is PASS, not CONDITIONAL; no concerns require explicit user acceptance.

## Autonomous Goal Block

SESSION GOAL: Close 4 confirmed security gaps in billing/auth/creator-payout surfaces (submitComponent rate limit, webhook payment_status guard, spoofable rate-limit key fix across 4 routes, Stripe Connect account reuse) without breaking the 16 existing tests.
Charter + umbrella plan: N/A — single plan (no phase program; SIMPLE complexity)
Autonomy: standard /goal autonomous execution rules (CONDITIONAL → proceed with accepted gaps; BLOCKED → backlog + continue with remaining fixes; irreversible/outward-facing actions without explicit contract instruction → hard stop). This plan's Gate is PASS, so no CONDITIONAL handling is needed.
Hard stop conditions / safety constraints:
- Do NOT modify `checkRateLimit`'s existing signature — only an additive named export (`checkSubmitRateLimit`) is allowed.
- Do NOT special-case `undefined`/missing `payment_status` in the webhook guard — no `??` default that widens the allow-list.
- Do NOT implement F6's Stripe-side account-validity re-check (`accounts.retrieve`) — explicitly out of scope; write the backlog note instead.
- The rate-limit check in `submitComponent` MUST run before any Octokit call — never after.
- Both existing `webhook.test.ts` fixtures MUST be updated with `payment_status: "paid"` in the SAME commit as the guard — do not leave them red.
Next phase: EXECUTE — `process/features/monetization-catalog/active/security-hardening_01-07-26/security-hardening_PLAN_01-07-26.md`
Validate contract: inline in plan (see `## Validate Contract` above)
Execute start: `corepack pnpm --filter web test` (fully-auto, all 8 ACs) | `corepack pnpm --filter web exec tsc --noEmit` (fully-auto, AC8) | agent-probe: manual review of webhook payment_status allow-list + Redis-prefix distinctness | high-risk pack: recommended (billing/auth/secrets surface) but not blocking per `vc-risk-evidence-pack` manual-first, opt-in contract

## Resume and Execution Handoff

1. **Selected plan file path:** `process/features/monetization-catalog/active/security-hardening_01-07-26/security-hardening_PLAN_01-07-26.md`
2. **Last completed phase or step:** VALIDATE — validate-contract written, Gate: PASS. No EXECUTE work has started.
3. **Validate-contract status:** written, Gate: PASS (01-07-26).
4. **Supporting context files loaded during RESEARCH/PLAN/VALIDATE:** `process/context/all-context.md`,
   `process/context/tests/all-tests.md`, `process/development-protocols/implementation-standards.md`,
   `process/development-protocols/plan-lifecycle.md`, `process/development-protocols/orchestration.md`,
   `.claude/skills/vc-security/SKILL.md`.
5. **Next step for a fresh agent picking up mid-execution:** validate-contract is complete (Gate: PASS)
   — proceed directly to `ENTER EXECUTE MODE` with this plan path. Spawn `vc-execute-agent` (opus).

---

**Next instruction:** Validate-contract written, Gate: PASS. Say **"ENTER EXECUTE MODE"** to proceed
to implementation.

---

## Current Execution State (UPDATE PROCESS — 01-07-26)

- **Commit:** `9a3593d` — `fix(web): harden billing/auth surfaces (rate-limit, payment_status, unspoofable keys, connect reuse)` — 13 files.
- **EVL confirmation:** plan-scoped 28/28 tests pass; AC4 grep audit 0 matches; touched-file typecheck clean.
- **Known gaps:** (1) F6 Stripe-side account revalidation deferred — backlog note `process/features/monetization-catalog/backlog/connect-account-revalidation_NOTE_01-07-26.md`; (2) 6 pre-existing test failures + 1 pre-existing tsc error, baseline-confirmed, outside plan scope — tracked in a new backlog note `process/features/monetization-catalog/backlog/preexisting-test-failures_NOTE_01-07-26.md`.
- **SPEC:** no dedicated SPEC for this plan (SIMPLE complexity, single-plan — not a phase-program inner loop). All 8 Acceptance Criteria in this plan scored **met** — see AC1-AC8 table above, all Fully-Automated, all passing.
- **Archived:** moved from `active/` to `completed/` during this UPDATE PROCESS pass.
