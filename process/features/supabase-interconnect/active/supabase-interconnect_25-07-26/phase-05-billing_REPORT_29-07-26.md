---
phase: phase-05-billing
date: 2026-07-29
status: COMPLETE_WITH_GAPS
feature: supabase-interconnect
plan: process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_PLAN_25-07-26.md
---

# Phase 05 — Billing Unification: EXECUTE report

**TL;DR** — All Step A–E checklist items are implemented. A new shared guard
(`apps/web/lib/billing-provider-guard.ts`) is wired into all **four**
`users_to_plans` writers; the billing page's Cancel button is now provider-aware
with a fail-safe (never silently falls through to Stripe); `lib/stripe.ts` is
lazy-init. Both Exit Gate gates pass on their documented delta criteria: **vitest
110/111** (baseline 81/82 — +29 tests, zero new failures) and **scoped tsc
unchanged** at exactly the 3 known foreign errors, with zero errors in any new or
edited file. Three additive out-of-blast-radius file edits are documented as
deviations. Status is COMPLETE_WITH_GAPS, not COMPLETE, because two things are
genuinely unproven: **no live provider or live-database verification was possible**,
and **Stripe webhook v1's live/dead status remains undetermined**.

---

## What Was Done

### The guard — `apps/web/lib/billing-provider-guard.ts` (new)

Pure module, no I/O, importable from both server routes and the client.

**Provider derivation.** `users_to_plans` has no `provider` column, so ownership
is derived from the two existing signals confirmed by RESEARCH:

| Provider | Signal |
|---|---|
| Stripe | `meta.stripe_customer_id` **or** `meta.stripe_subscription_id` (inside the `meta` JSON blob) |
| Lemon Squeezy | the top-level `lemon_squeezy_subscription_id` column |

`deriveBillingProvider(row)` returns `"stripe" | "lemonsqueezy" | "none" |
`"ambiguous"`. `"ambiguous"` means both markers are present — a legacy row
written before this phase's mutual-clearing fix.

**Definition of "active".** Exactly `status === "active"`. This is not a guess:
`"active"` and `"inactive"` are the only two literals written anywhere in the
three webhook routes — no `"canceled"` literal exists in the code. A row that is
not exactly `"active"` is treated as not-actively-owned, so a legitimate provider
switch onto a cancelled row proceeds.

**Decision rule — `evaluateBillingWrite(existingRow, incomingProvider)`.** It
blocks exactly ONE case and allows everything else:

| Existing row | Decision |
|---|---|
| absent | allow (insert) |
| no markers | allow |
| both markers (`ambiguous`) | allow, and log — the write self-repairs the row by clearing the loser |
| same provider | **allow** (renewal — must never be blocked) |
| other provider, `status !== "active"` | **allow** (legitimate switch) |
| other provider, `status === "active"` | **SKIP + log** |

This bias is deliberate. Wrongly blocking a renewal silently cuts off a paying
customer, which is worse than the conflict the guard prevents — so every
ambiguous case resolves to allow.

**Mutual clearing — `clearingPatchFor(provider)`.** Returns
`{ lemon_squeezy_subscription_id: null }` for an incoming Stripe write and
`{ meta: null }` for an incoming Lemon Squeezy write. Merged into the *same*
update/insert that establishes the new owner, so the two markers become mutually
exclusive by construction rather than by runtime tie-breaking. This closes the
residual-marker gap PVL found.

### Wiring into all four writers

| Writer | What was done |
|---|---|
| `app/api/stripe/webhook/v2/route.ts` | Guard added at the **top** of `handleSubscriptionCreatedOrUpdate`, before *any* write — including the `cancel_at_period_end` meta pre-update, which would otherwise have written to a Lemon-Squeezy-owned row. `handleSubscriptionDeleted` guarded separately. All 3 ownership-establishing writes carry the clearing patch. |
| `app/api/stripe/webhook/v1/route.ts` | Identical treatment (**B0: guarded defensively**, not assumed dead). |
| `app/api/lemonsqueezy/webhook/route.ts` | Guard on the create/update branch and on the cancel/expire branch. Both `return` a 200 no-op **before** the unconditional Clerk `publicMetadata.isPro` sync, so a skipped DB write cannot desync Clerk. The cancel branch previously did a blind update with no row read — it now reads the row first in order to guard it. |
| `app/api/subscription/stripe-cron/route.ts` | **B0b: option (a) chosen.** An explicit `deriveBillingProvider(subscription) === "lemonsqueezy"` skip before its `status: "inactive"` writes. |

**On B0b:** option (b)'s reasoning (that after the mutual-clearing fix an LS row
has `meta = null` and so falls out at the pre-existing `if (!periodEnd) continue`)
was independently confirmed correct by reading the code. I still chose option (a)
because an explicit guard does not depend on that indirect precondition continuing
to hold. Both mechanisms are now in place.

### `apps/web/lib/stripe.ts` — narrow lazy-init fix (D1)

**Before:** module-scope `if (!key) throw` plus
`export const stripeV1 = new Stripe(key)`, which threw at **import** time and
broke build-time page-data collection.

**After:** `stripeV1` / `stripeV2` are `Proxy` objects that construct the real
`Stripe` instance on first property access, behind a new exported
`paymentsNotConfigured()` matching the pattern the four checkout routes already
use. The throw still happens with the same message — on first *use* rather than
on import. Behaviour when the keys are set is unchanged.

**The fallback Proxy was NOT touched**, as instructed — `createFallbackProxy` and
the default `stripe` export are byte-identical. It keeps working because it reads
`primary[prop]` lazily.

### Provider-aware cancel (A3, A4)

- **New `apps/web/app/api/lemonsqueezy/cancel/route.ts`.** Auth-gated identically
  to the Stripe route (`await auth()` → 401). The subscription id is looked up
  server-side from the session's `userId` and is **never accepted from the request
  body**. It also re-derives the provider server-side and returns 404 on a
  Stripe-owned row, so a mis-routed client cannot trigger a wrong-provider
  cancellation. The DB row is updated by the webhook, not by this route.
- **`page.client.tsx`** `handleCancelSubscription` now calls
  `cancelEndpointFor(deriveProviderFromPlanInfo(subscription))`. A `null` endpoint
  shows a "No active subscription found" error toast — it never falls through to
  Stripe, which is the exact bug this phase exists to fix.

**Invoices are deferred** per plan item A4. `fetchInvoices()` still calls
`/api/stripe/get-invoices` unconditionally. Confirmed still open; backlog note
written at `process/features/supabase-interconnect/backlog/lemonsqueezy-invoices-branch_NOTE_29-07-26.md`.

### `.env.example` (E1)

Six variable names added with empty values and explanatory comments:
`STRIPE_SECRET_KEY_V1`, `STRIPE_SECRET_KEY_V2`, `STRIPE_WEBHOOK_SECRET_V1`,
`STRIPE_WEBHOOK_SECRET_V2`, `LEMON_SQUEEZY_WEBHOOK_SECRET`, `LEMON_SQUEEZY_API_KEY`.
**No secret value was read, printed, or written at any point in this phase.**

---

## Plan Deviations

Three files outside the declared Blast Radius were edited. All additive, all
within the billing surface, none a hard-stop class (no schema change, no auth
change, no breaking public-contract change). Also recorded in the plan's
`## Deviations` section and the blast-radius registry.

1. **`apps/web/app/settings/billing/page.tsx`** — added
   `lemon_squeezy_subscription_id` to the `users_to_plans` select and to the
   `PlanInfo` it passes down.
   **Why it was unavoidable:** the client had no Lemon Squeezy marker to branch
   on. `page.tsx` is the sole supplier of `subscription` to `page.client.tsx`,
   the file the plan *did* name. A3 cannot be implemented without it.
   **Side effect:** this also fixes a pre-existing dead reference at
   `page.client.tsx:242`, which read `subscription?.lemon_squeezy_subscription_id`
   on the upgrade path when that field was never populated by either supplier.
2. **`apps/web/hooks/use-subscription.ts`** — added `stripe_subscription_id?:
   string` to the `PlanInfo` interface. Type-only, additive.
3. **`apps/web/lib/billing-provider-guard.ts`** gained two client-facing exports
   beyond B1's server-side guard (`deriveProviderFromPlanInfo`,
   `cancelEndpointFor`) so provider derivation has one source of truth across
   server and client rather than being duplicated inline in the page.

`apps/web/lib/lemonsqueezy.ts` was listed in the Blast Radius but was read and
**not modified** — the guard lives in its own module instead, per B1.

---

## Test Gate Outcomes

### Baselines re-measured at session start (both matched the contract exactly)

- vitest: **81 passed / 1 failed (82 total, 21 files)** — the 1 failure is the
  documented pre-existing `lib/registry.test.ts` one.
- scoped tsc: **exactly 3** `TS2786` errors in `page.client.tsx` at lines 61, 539,
  570.

### After

```
corepack pnpm --filter web test
  Test Files  1 failed | 22 passed (23)
       Tests  1 failed | 110 passed (111)
```
**+29 tests, zero new failures.** The single failure is the same pre-existing
`lib/registry.test.ts` one (unrelated to billing; not touched, per instruction).

```
corepack pnpm --filter web exec tsc --noEmit 2>&1 | grep -E "settings/billing/page.client|lemonsqueezy|stripe/webhook|lib/stripe\.ts|billing-provider-guard"
app/settings/billing/page.client.tsx(65,6): error TS2786: 'Button' cannot be used as a JSX component.
app/settings/billing/page.client.tsx(556,16): error TS2786: 'Button' cannot be used as a JSX component.
app/settings/billing/page.client.tsx(587,18): error TS2786: 'Button' cannot be used as a JSX component.
```
Still exactly the 3 known foreign errors, same type, same file — line numbers
shifted (61→65, 539→556, 570→587) only because I added lines above them.
**Zero errors in any new or edited file**, verified by a separate grep across the
full error list for `billing-provider-guard`, `api/lemonsqueezy`, `api/stripe`,
`stripe-cron`, `lib/stripe`, `use-subscription`, and both new test files.
Repo-wide total: 1163 errors, of which **1121 are the foreign `TS2786`
duplicate-React-types baseline**. Gate **PASSES** on the delta criterion.

I did not capture a pre-change repo-wide *total*, so the delta claim rests on the
per-file scoped check — which is what the contract specifies.

### Tests added (29 across 3 files)

| File | Tests | What it proves |
|---|---|---|
| `apps/web/lib/__tests__/billing-provider-guard.test.ts` (new) | 15 | Derivation from each marker, both-marker ambiguity, empty-string rejection, the exact-`"active"` rule, every allow/block branch of the decision, the clearing patch, and (**AC10**) the fixture→endpoint mapping for Stripe / LS / neither. |
| `apps/web/app/api/stripe/webhook/__tests__/mutual-exclusion.test.ts` (new, authored from scratch — no prior Stripe webhook coverage existed) | 8 | All four required AC11 cases against **v2**, plus block-and-allow against **v1**. |
| `apps/web/app/api/lemonsqueezy/__tests__/webhook.test.ts` (extended) | +6 | The same four cases from the Lemon Squeezy side, plus the Clerk-desync assertion. |

**Every webhook assertion targets the mocked `users_to_plans` write call's
arguments or its absence — never an HTTP status.** The mock chain shape matches
what each route actually calls (`.maybeSingle()` for LS, and the Stripe routes'
own lookups), not a copy-paste of the LS test's chain.

**The block/allow pair is non-vacuous.** CASE 2a (blocked) and CASE 3 (allowed)
use *identical fixtures differing only in `status`*, and CASE 3 does produce a
write. So the absence of a write in CASE 2a is attributable to the guard, not to
an early error or a broken mock. This was the specific way this test suite could
have been fake-green, so it is checked explicitly.

The four required cases, mapped:

1. **Same-provider renewal ALLOWED** — both routes. This is the one that catches
   a buggy derivation wrongly cutting off a paying customer.
2. **Cross-provider blocked in BOTH directions** — Stripe blocks an active LS
   row; LS blocks an active Stripe row. Also covered on both *deactivation*
   paths (`subscription.deleted` / `subscription_cancelled`).
3. **Canceled-row provider switch ALLOWED** — both directions.
4. **Losing marker nulled in the SAME write** — asserted on the write arguments
   (`lemon_squeezy_subscription_id === null` on the Stripe side; `meta === null`
   on the LS side), on both the update and insert paths.

---

## What This Does NOT Prove

Stated plainly, because mocked billing tests are easy to over-trust.

- **No live provider verification of any kind.** No Stripe or Lemon Squeezy API
  call was made. The tests prove in-process logic against a mocked Supabase
  client; they say nothing about real webhook delivery semantics — out-of-order
  delivery, at-least-once redelivery, or two genuinely concurrent events from
  both providers landing in the same request window. The guard is a
  read-then-write with no transaction or row lock, so a true simultaneous
  cross-provider race is **not** excluded by this design. Given
  `users_to_plans` has 0 live rows and one provider is effectively unused, the
  practical risk today is negligible — but it is a real property of the
  implementation, not something the tests cover.
- **No live database connection was made.** Wiring correctness is proven;
  data-presence is not. This matches the SPEC's Cross-Cutting Requirement.
- **The live Lemon Squeezy cancel call is untested** (AC10 Agent-Probe row).
  No test account, no credentials, and live calls are forbidden for this phase.
  **Known Gap**, accepted per the SPEC's own Known Gaps section.
- **AC10's routing test is PARTIAL.** It proves the decision function
  (`cancelEndpointFor(deriveProviderFromPlanInfo(fixture))`) returns the right
  endpoint per provider fixture, and that `page.client.tsx` calls exactly that
  function. It does **not** drive the real button through React Testing Library.
  The Cancel action is reached via PricingTable → select "free" → confirmation
  dialog → `onConfirm`, which would need a brittle multi-component render to
  exercise; I judged a fragile click-through worse than an honest partial. The
  untested link is the button wiring, not the routing decision.
- **The `stripe-cron` guard has no dedicated test.** The skip is a two-line
  branch over a real derivation function that is itself well covered, but the
  route-level behaviour is unasserted.
- **`ambiguous` rows route to Stripe on cancel.** A legacy row carrying both
  markers picks the Stripe endpoint. Both cancel routes re-verify ownership
  server-side and 404 rather than acting on the wrong subscription, so a wrong
  guess is non-destructive — but it is a guess.
- **The lazy-init change moves failure later in the lifecycle.** A missing key
  now surfaces on first use instead of at import. That is the intended fix, but
  it means a misconfigured deploy fails at request time rather than at boot.

---

## Unresolved: Stripe webhook v1 (B0)

**I could not determine whether the v1 webhook is live.** Being explicit rather
than assuming:

- Whether `STRIPE_WEBHOOK_SECRET_V1` is set in the production environment is not
  discoverable from this repo.
- Whether a Stripe Dashboard endpoint still points at `/api/stripe/webhook/v1`
  requires Dashboard access I do not have.
- A local shell env-presence check would only describe my own shell, which proves
  nothing about the gayo-vps deployment — so I did not run one and did not treat
  its result as evidence either way.

**Decision: guarded defensively**, per the plan's stated default. v1 receives
exactly the same guard and clearing patch as v2 and is covered by two tests. If
v1 is dead, the guard is harmless dead code; if it is live, AC11 holds for it. A
wrong "it's dead" assumption would have left AC11 unproven, which is the worse
error.

**To close this properly** someone with Dashboard access should check the
registered webhook endpoints and, if v1 is confirmed dead, delete the route
outright rather than leaving two near-duplicate webhook implementations.

---

## Test Infra Gaps Found

1. **No Stripe webhook coverage existed at all** before this phase — confirmed on
   disk. The new `mutual-exclusion.test.ts` is the first. `process/context/tests/all-tests.md`
   references a Stripe `apps/web/__tests__/webhook.test.ts` (10 tests) that does
   not exist on disk — part of the broader test-baseline documentation drift
   already flagged in `all-context.md`. Not fixed here (out of scope).
2. **vitest emits a large `tsconfig-paths` error block on every run**, from
   stray `tmp/shadcn-ui/ui-main/templates/**/tsconfig.json` files with
   unresolvable `extends`. Pre-existing, non-fatal, but it buries real output.
   Fix would be adding `tmp/**` to the vitest `exclude` or `ignoreConfigErrors`.
3. **No RTL harness for `BillingSettingsClient`.** The cancel flow is only
   reachable through several nested components, so there is no cheap way to
   assert the button→endpoint path end to end. See the AC10 partial above.
4. **The repo-wide `tsc` baseline (~1160 foreign errors) makes any tsc gate a
   manual delta comparison.** Pre-existing and documented, but it means a real
   new error in an unwatched file could hide in the noise.

---

## Follow-up Stubs Created

- `process/features/supabase-interconnect/backlog/lemonsqueezy-invoices-branch_NOTE_29-07-26.md`
  — deferred LS invoices route + branch (A4 deferral).

Pre-existing, still open, referenced by the plan:
- `process/features/supabase-interconnect/backlog/stripe-fallback-proxy-version-mixing_NOTE_29-07-26.md`
  (explicitly out of scope; the fallback Proxy was left untouched as instructed)
- `process/features/supabase-interconnect/backlog/billing-guard-observability-gap_NOTE_29-07-26.md`
  (the guard logs conflicts with `console.warn` and has no alerting — accepted as
  this phase's mechanism)

---

## Closeout Packet

- **Selected plan:** `process/features/supabase-interconnect/active/supabase-interconnect_25-07-26/phase-05-billing_PLAN_25-07-26.md`
- **Finished:** Steps A1–A4 (invoices deferred by plan decision), B0, B0b, B1,
  B2, B3, C1, C2, C3 (documented as Known Gap), D1, E1. High-risk evidence pack
  written to `harness/phase-05/` (all 5 artifacts).
- **Verified:** vitest 110/111 and scoped tsc delta — both green on their
  documented criteria, both re-measured this session.
- **Unverified:** every live-provider and live-database behaviour; the
  button-wiring half of AC10; the cron route at route level; Stripe webhook v1's
  production liveness.
- **Remaining:** EVL confirmation run (orchestrator-owned), then UPDATE PROCESS.
  Not committed — the working tree has ~147 pre-existing dirty entries from
  concurrent user work and nothing was staged, stashed, or reverted.
- **Closeout classification:** `Keep in active/testing` — code-complete, but the
  high-risk evidence pack's `mustStopBeforeFinalize: true` stands and the review
  decision is a self-review, not an independent human one.

---

## Forward Preview

**Test infra found.** Vitest with a `node` default environment and per-file
`/** @vitest-environment jsdom */` opt-in. Route tests mock `@/lib/supabase`
with a chainable `from()` stub — note the chain shape differs per route
(`.maybeSingle()` vs `.single()`), so mocks cannot be copied between them.
`apps/web/lib/__tests__/` did not exist before this phase.

**Blast radius changes.** Phase 5 additionally claimed
`apps/web/app/settings/billing/page.tsx` and `apps/web/hooks/use-subscription.ts`
(both additive). It did **not** create
`apps/web/app/api/lemonsqueezy/invoices/route.ts` and did **not** modify
`apps/web/lib/lemonsqueezy.ts`. Registry updated; no overlap with Phase 4.

**Commands to stay green.**
```bash
corepack pnpm --filter web test          # expect 110/111 — 1 known registry.test.ts failure
corepack pnpm --filter web exec tsc --noEmit 2>&1 | grep -E "settings/billing/page.client|lemonsqueezy|stripe/webhook|lib/stripe\.ts|billing-provider-guard"
# expect exactly 3 TS2786 lines in page.client.tsx and nothing else
```

**Dependency changes.** None. No package was added, and `package.json` /
`pnpm-lock.yaml` were not touched.

**For Phase 6 (schema source of truth):** `users_to_plans.lemon_squeezy_subscription_id`
is real and current in `apps/web/types/supabase.ts`; the `users_to_plans` model in
`apps/web/prisma/schema.prisma` is **stale** and lacks the column. This phase's
code depends on the types.ts shape. Do not "correct" it toward the Prisma schema
during the regen.

---

## EVL Fix Cycle 1

**TL;DR.** Closed a fifth, previously-unnoticed writer to `users_to_plans`
(`GET /api/stripe/get-invoices`) that could plant a Stripe ownership marker on a
Lemon-Squeezy-owned row during an ordinary billing-page load. Also moved one
`users` write below the guard so a guard skip is a clean no-op. 3 new tests;
113/114 passing (was 110/111); zero `tsc` errors in every touched file.

### The defect (CRITICAL, found by independent adversarial review)

`apps/web/app/api/stripe/get-invoices/route.ts` had no reference to the guard and
performed an unguarded `users_to_plans` update backfilling
`meta.stripe_customer_id`. It is reachable on a normal page load:
`app/settings/billing/page.client.tsx` calls `fetchInvoices()` in a mount-time
`useEffect` whenever `subscription && currentPlanId !== "free"` — i.e. for
**paying** users specifically.

Failure chain: a healthy post-fix LS row (`status: "active"`,
`lemon_squeezy_subscription_id` set, `meta: null`) has no `stripe_customer_id`,
so the route searched Stripe by email, found any stale customer (abandoned
checkout, old trial), and wrote its id into `meta`. `hasStripeMarker()` then
returns true alongside the LS marker → `deriveBillingProvider` = `"ambiguous"` →
guard rule 3 auto-allows **any** subsequent write → a stale Stripe
`customer.subscription.deleted` sets `status: "inactive"`, cutting off a paying
customer. That is precisely the harm this phase exists to prevent.

The plan named this file (line 88) only as a place `meta.stripe_customer_id` is
written; its write path was never evaluated against the guard's invariant.

### Corrected framing — what the guard's blast radius actually is

The phase scoped the guard to "routes that write `status`". The correct scope is
**any writer of the fields `deriveBillingProvider` reads** — i.e. `meta`
(`stripe_customer_id` / `stripe_subscription_id`) and
`lemon_squeezy_subscription_id`. A write that touches only `meta` changes row
ownership just as decisively as one that touches `status`, and does so silently.
Future work that adds a `meta` writer must apply the guard. This is the single
most important durable lesson from the phase.

### Fix 1 — get-invoices (shape (b), skip-on-LS-marker)

Chose the reviewer's option (b) over routing through `guardBillingWrite`, for
three reasons:

1. **`guardBillingWrite` is the wrong tool here.** It blocks only *active*
   cross-provider rows. An **inactive** LS row would be allowed through, and the
   backfill would still make it ambiguous.
2. **Rule 3 would force a destructive side effect.** Any write establishing a new
   owner must merge `clearingPatchFor`, which would null
   `lemon_squeezy_subscription_id` — an irreversible ownership change performed
   by a read-only invoice fetch. Unacceptable.
3. **The backfill is a cache, not a requirement.** `customerId` is already
   resolved locally and used for `invoices.list`; skipping the persist costs one
   extra Stripe customer lookup on the next load and nothing else. The route is
   also slated for deprecation per the plan's A4 decision, so the minimal
   intervention is the right one.

Implementation: guard the write with `hasLemonSqueezyMarker(userPlanData)`
(imported from `@/lib/billing-provider-guard`), log a `[billing-provider-guard]
SKIPPED` line, and leave the invoice list path untouched.

```diff
+import { hasLemonSqueezyMarker } from "@/lib/billing-provider-guard"
...
+      const lemonOwned = hasLemonSqueezyMarker(userPlanData)
+      if (lemonOwned) {
+        console.warn(
+          `[billing-provider-guard] SKIPPED stripe_customer_id backfill from stripe/get-invoices for user ${userId}: row carries a Lemon Squeezy marker`,
+        )
+      }
+
-      if (userPlanData && customerId) {
+      if (userPlanData && customerId && !lemonOwned) {
```

`hasLemonSqueezyMarker` (not `deriveBillingProvider === "lemonsqueezy"`) is the
predicate because it is status-independent and also covers the already-ambiguous
legacy row — in every case the invariant holds: **a row carrying a Lemon Squeezy
marker never acquires a Stripe marker as a side effect of reading invoices.**

### Fix 2 — lemonsqueezy/webhook write ordering (MEDIUM)

Moved the `users.lemon_squeezy_customer_id` update from before the guard
evaluation to after it, so a guard skip leaves no LS residue on `users`. Pure
reordering — no logic change.

```diff
-      // Ensure user has lemon_squeezy_customer_id
-      await supabaseWithAdminAccess
-        .from("users")
-        .update({ lemon_squeezy_customer_id: customerId })
-        .eq("id", userId)
-
       // Fetch plan to know usage limit
...
       if (guard.skip) { return ... }
+
+      // Ensure user has lemon_squeezy_customer_id.
+      // Deliberately AFTER the guard: a guard skip must be a clean no-op.
+      await supabaseWithAdminAccess
+        .from("users")
+        .update({ lemon_squeezy_customer_id: customerId })
+        .eq("id", userId)
```

The `subscription_cancelled` branch was already correctly ordered and is unchanged.

### New test

`apps/web/app/api/stripe/get-invoices/__tests__/no-lemon-pollution.test.ts` — 3
cases, all asserting on the **mocked write call arguments or their absence**, never
on HTTP status.

| Case | Proves |
|---|---|
| does NOT backfill onto an active LS row | `usersToPlansWrites()` is empty **and** `stripeCustomersList` was called — the write path was genuinely reached, so the test cannot pass for the wrong reason |
| still returns the invoice list | `invoices.list` still receives `customer: "cus_stale_stripe_1"` — skipping the persist did not break the feature |
| DOES backfill on an unowned row | no false blocking: a row with no LS marker still gets `meta.stripe_customer_id` |

Fixture realism was the key design point. The row is exactly a healthy post-fix LS
row (`status: "active"`, `lemon_squeezy_subscription_id: "ls_sub_1"`, `meta: null`)
and a Stripe customer **is** discoverable by email. Without that second condition
the route would return `{ invoices: [] }` early and the assertion would pass
vacuously. The mock chain uses `.single()` (not `.maybeSingle()`) to match this
route, per the Phase 5 Forward Preview note.

### Gate results

```
corepack pnpm --filter web test
  Test Files  1 failed | 23 passed (24)
       Tests  1 failed | 113 passed (114)
```
Baseline was 110/111. Now **113/114** — +3 tests, all new ones passing. The sole
failure remains `lib/registry.test.ts` (pre-existing, unrelated, unchanged).

```
corepack pnpm --filter web exec tsc --noEmit   # full project, no file list
  errors total: 1165
  grep -E "get-invoices|lemonsqueezy/webhook|billing-provider-guard\.ts"  ->  NONE (clean)
```
**Zero errors in any touched file**, including the new test. The 3 pre-existing
foreign `TS2786 'Button'` errors in `settings/billing/page.client.tsx` persist
unchanged (lines 65 / 556 / 587 this run). Repo-wide count reads 1165 vs the
~1163 baseline; the delta cannot originate here since all four touched paths are
error-free, and the working tree carries ~147 concurrent user edits. Foreign.

### Scope discipline

Untouched as instructed: the `lib/stripe.ts` fallback Proxy (backlogged), the LS
invoices route (deferred per A4), the other four writers (independently verified
correct), and anything in Phase 6. No files staged, committed, or reverted; no
`package.json` / `pnpm-lock.yaml` change; no live Stripe, Lemon Squeezy, or
Supabase call.

---

## Closeout Finalization (UPDATE PROCESS, 29-07-26)

**`mustStopBeforeFinalize` is CLEARED.** Basis: the evidence pack's own
`review-decision.json` disclosed itself as a self-review and left the flag set;
that disclosure is what triggered an independent adversarial review this same
session. That independent review found one CRITICAL defect (the fifth,
unguarded `get-invoices` writer) and one MEDIUM defect (LS webhook write
ordering). Both were fixed in EVL Fix Cycle 1 above, and the fix was
independently re-confirmed: 3 new tests added and green (113/114 total, the
sole failure being the pre-existing unrelated `lib/registry.test.ts` case),
zero `tsc` errors in every touched path, and a second read of the corrected
code confirming the invariant now holds (a row carrying a Lemon Squeezy marker
never acquires a Stripe marker as a side effect of reading invoices).

This satisfies the high-risk evidence pack's stop condition: an independent
(non-self) review ran, found real defects, and those defects were closed and
re-verified. It does **not** mean every open item is resolved — see `## What
This Does NOT Prove` above, which stands unchanged. The remaining gaps
(no live-provider verification, no live-DB verification, AC10 button-wiring
partial, Stripe webhook v1 liveness undetermined, the `get-invoices` backfill
shape itself) are genuine Known Gaps carried to backlog and to Phase 6/future
work, not defects blocking finalize.

**Closeout classification (final): `Keep in active/testing`** — consistent
with how Phases 1-3 were left open. Code is complete and independently
verified; what remains outstanding is either (a) impossible to prove without
live provider credentials/DB access this program forbids using, or (b) a
named, scoped follow-up (the A4 invoices branch, the get-invoices backfill
removal, Stripe webhook v1 dead-code confirmation) — not agent work remaining
on this phase.
