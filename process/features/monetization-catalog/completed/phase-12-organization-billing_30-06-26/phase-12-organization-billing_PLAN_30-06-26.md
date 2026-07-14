# Phase 12 PLAN: Organization Billing (Team Seats)

Date: 30-06-26
Status: ✅ COMPLETE
Complexity: COMPLEX

## Phase Completion Rules
- All checklist items complete
- Test tiers implemented
- Verification gates pass
- Security scan run on modified code

## Overview, Goals, Scope
**Goal:** Implement team/organization billing with seat-based subscriptions using Clerk Organizations and Stripe.
**Scope:** Seat quantity is determined automatically by Clerk organization membership count. Clerk webhooks sync membership changes to Stripe subscription quantity.
Out of Scope: Manual seat management UI.

## Chosen Approach
Clerk Webhook Seat Sync — Seat quantity is determined automatically by the Clerk organization membership count, and Clerk webhooks are used to sync membership changes to the Stripe subscription quantity.

## Touchpoints
- `apps/web/app/api/webhooks/clerk/route.ts` (create — handle Clerk webhooks)
- `apps/web/app/api/checkout/route.ts` (modify — support org checkout)
- `apps/web/lib/stripe.ts` (modify — add seat sync utility logic)

## Public Contracts
- Clerk Webhook endpoint: `POST /api/webhooks/clerk` (consumes `organizationMembership.created`, `organizationMembership.deleted`, `organizationMembership.updated`)
- Stripe Checkout endpoint: `GET/POST /api/checkout` (extended to accept `orgId` parameter)

## Blast Radius
- High-risk class: Billing (Stripe), Auth (Clerk).
- Files: `apps/web/app/api/webhooks/clerk/route.ts`, `apps/web/app/api/checkout/route.ts`, `apps/web/lib/stripe.ts`.

## Dependencies, Risks, Integration Notes
- **Dependencies:** `svix` (for webhook verification), `stripe`, `@clerk/nextjs`.
- **Risks:** 
  - Coupling Clerk webhooks to Stripe requires robust error handling.
  - Performance: Bulk invites could hit Stripe API rate limits.
  - UX: If a Stripe payment fails when adding a seat (e.g., prorated charge fails), the new user needs a clear error state or grace period.
- **Integration Notes:** Webhooks must strictly filter the Clerk events so we only increment the Stripe quantity for accepted members.

## Data Flow, Failure Modes
- **Flow:** Clerk `organizationMembership.created` event -> `svix` verification -> fetch Stripe subscription ID via `metadata.clerkOrgId` -> `stripe.subscriptions.update` (quantity increment).
- **Failure Modes:**
  - Clerk webhook signature invalid (returns 400 Bad Request).
  - Stripe API rate limit exceeded (returns 503/429 - debounce or log for retry).
  - Stripe payment failure on prorated charge (Stripe handles via email, logged in our system).

## Security (STRIDE Scan Findings)
- **Spoofing:** Webhook endpoints verify Clerk signatures using `svix` to prevent spoofed membership changes.
- **Tampering:** Stripe API keys and calls must be securely handled server-side.
- **Repudiation:** Idempotency keys should be used on Stripe API updates to handle duplicate webhook events from Clerk safely.
- **Information Disclosure:** `CLERK_WEBHOOK_SECRET` must be securely stored in env.

## Acceptance Criteria
- [x] AC-12.1: Checkout route accepts `orgId` and creates a Stripe subscription with `metadata.clerkOrgId`. `proven by: Checkout creates org subscription`, `strategy: Fully-Automated`
- [x] AC-12.2: Clerk webhook `organizationMembership.created` correctly increments the Stripe subscription quantity. `proven by: Clerk webhook increments seats`, `strategy: Fully-Automated`
- [x] AC-12.3: Clerk webhook `organizationMembership.deleted` correctly decrements the Stripe subscription quantity. `proven by: Clerk webhook decrements seats`, `strategy: Fully-Automated`
- [x] AC-12.4: Webhook endpoint strictly verifies Clerk signatures using `svix` and `CLERK_WEBHOOK_SECRET`. `proven by: Invalid webhook signature rejected`, `strategy: Fully-Automated`
- [x] AC-12.5: Idempotent processing ensures duplicate Clerk events do not result in incorrect seat counts. `proven by: Duplicate webhook handled safely`, `strategy: Hybrid`

## Verification Evidence
| Gate / Scenario | Strategy | Proves SPEC criterion |
| --- | --- | --- |
| Checkout creates org subscription | Fully-Automated | AC-12.1 |
| Clerk webhook increments seats | Fully-Automated | AC-12.2 |
| Clerk webhook decrements seats | Fully-Automated | AC-12.3 |
| Invalid webhook signature rejected | Fully-Automated | AC-12.4 |
| Duplicate webhook handled safely | Hybrid | AC-12.5 |

## Implementation Checklist
1. [x] Install `svix` package in `apps/web` if not present (`corepack pnpm --filter web add svix`).
2. [x] Add `CLERK_WEBHOOK_SECRET` to `.env.example`.
3. [x] Modify `apps/web/app/api/checkout/route.ts` to accept `orgId` parameter and attach `metadata.clerkOrgId` to Stripe Subscriptions.
4. [x] Create `apps/web/app/api/webhooks/clerk/route.ts` and set up `svix` signature verification.
5. [x] Implement `syncStripeSubscriptionQuantity` utility in `apps/web/lib/stripe.ts` to query subscription by `orgId` and update quantity.
6. [x] Add handler for `organizationMembership.created` in the webhook to increment seats (only for accepted members).
7. [x] Add handler for `organizationMembership.deleted` in the webhook to decrement seats.
8. [x] Add unit tests for the Clerk webhook handler using mocked `svix` and `stripe`.
9. [x] Add unit tests for the checkout route modifications.

## Phase Loop Progress
- [x] 7. UPDATE PROCESS — archived; context updated; committed

## Validate Contract

Status: PASS
Date: 30-06-26
date: 2026-06-30
generated-by: outer-pvl

Parallel strategy: sequential
Rationale: 2 signals (Auth and Billing); Sequential recommended for implementation due to 3-file shared blast radius.

Test gates (C3 5-column table — ADDITIVE; existing consumers still parse the legacy line form below it):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| AC-12.1 | Checkout creates org subscription | Fully-Automated | Checkout route test with mock Stripe | A |
| AC-12.2 | Clerk webhook increments seats | Fully-Automated | Webhook handler test with mock Stripe | A |
| AC-12.3 | Clerk webhook decrements seats | Fully-Automated | Webhook handler test with mock Stripe | A |
| AC-12.4 | Invalid webhook signature rejected | Fully-Automated | Webhook handler test with mock Svix | A |
| AC-12.5 | Duplicate webhook handled safely | Hybrid | Idempotency test (automated test + manual verify) | A |

Failing stubs:
- AC-12.1: `test("should Checkout route test with mock Stripe", () => { throw new Error("NOT IMPLEMENTED — TDD stub: Checkout route test with mock Stripe") })`
- AC-12.2: `test("should Webhook handler test with mock Stripe", () => { throw new Error("NOT IMPLEMENTED — TDD stub: Webhook handler test with mock Stripe") })`
- AC-12.3: `test("should Webhook handler test with mock Stripe", () => { throw new Error("NOT IMPLEMENTED — TDD stub: Webhook handler test with mock Stripe") })`
- AC-12.4: `test("should Webhook handler test with mock Svix", () => { throw new Error("NOT IMPLEMENTED — TDD stub: Webhook handler test with mock Svix") })`

Legacy line form (retained so existing validate-contract consumers still parse):
- AC-12.1: Fully-automated: Checkout route test with mock Stripe
- AC-12.2: Fully-automated: Webhook handler test with mock Stripe
- AC-12.3: Fully-automated: Webhook handler test with mock Stripe
- AC-12.4: Fully-automated: Webhook handler test with mock Svix
- AC-12.5: hybrid: Idempotency test (automated test + manual verify) + precondition

Dimension findings:
- Infra fit: PASS — Standard Next.js API routes; no container or proxy modifications required.
- Test coverage: PASS — Realistic coverage plan with 4 Fully-Automated unit tests and 1 Hybrid check.
- Breaking changes: PASS — Webhook endpoint is new; checkout endpoint safely extends existing logic.
- Security surface: PASS — Requires svix signature verification and Stripe idempotency keys correctly.

Open gaps: none

What This Coverage Does NOT Prove:
- AC-12.1: Does not prove that the org actually exists in Clerk, relies on metadata.
- AC-12.2: Does not prove Stripe handles the specific prorated charge safely (handled asynchronously).
- AC-12.3: Does not prove that Stripe won't error if quantity falls below 1.
- AC-12.4: Does not prove that svix secret is valid in prod environment, only tests the signature verification logic.
- AC-12.5: Does not prove that the system can handle extreme burst concurrency gracefully.

Gate: PASS
Accepted by: user

## Test Infra Improvement Notes
(none identified yet)

## Resume and Execution Handoff
1. Selected plan file path: process/features/monetization-catalog/active/phase-12-organization-billing_30-06-26/phase-12-organization-billing_PLAN_30-06-26.md
2. Last completed phase or step: PLAN
3. Validate-contract status: pending
4. Supporting context files loaded: process/context/all-context.md, process/context/tests/all-tests.md
5. Next step for a fresh agent picking up mid-execution: Run VALIDATE mode.
