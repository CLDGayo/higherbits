---
name: note:connect-account-revalidation
description: "Backlog — Stripe-side Connect account-validity re-check before reuse (F6 residual)"
date: 01-07-26
feature: monetization-catalog
---

# Backlog: Connect account re-validation before reuse (F6 residual)

Deferred from the security-hardening plan (01-07-26), Implementation Checklist item 5.

F6's account-reuse fix reuses `publicMetadata.stripeConnectAccountId` without re-checking
Stripe-side validity. Out of scope for that plan, tracked here:

- Re-check via `stripe.accounts.retrieve(existingAccountId)` before reuse (verify the account
  still exists and is usable — `charges_enabled` / `payouts_enabled`).
- Handle abandoned / in-progress Connect accounts that have no Clerk metadata record.

Note: `connect/return/route.ts` is the sole writer of `stripeConnectAccountId`, and only writes
it after `account.details_submitted` is true — so the reuse path correctly no-ops (falls to
create-new) for users who started but never finished onboarding. This residual only concerns
Stripe-side account validity for already-completed accounts.
