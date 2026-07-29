---
name: note:lemonsqueezy-invoices-branch
description: "/settings/billing still fetches invoices from Stripe unconditionally; a Lemon Squeezy subscriber sees an empty/wrong payment history"
date: 29-07-26
metadata:
  node_type: memory
  type: note
  feature: supabase-interconnect
---

# Lemon Squeezy invoices branch (deferred from Phase 05)

**Status:** open, confirmed still open at Phase 05 EVL (29-07-26).

`apps/web/app/settings/billing/page.client.tsx` `fetchInvoices()` calls
`/api/stripe/get-invoices` unconditionally. Phase 05 made the **cancel** path
provider-aware but explicitly deferred invoices (plan item A4).

**Impact:** a Lemon Squeezy subscriber sees an empty or wrong payment history.
This is a display inconsistency, not a broken destructive action — which is why
it ranked below cancel.

**Work required:**
1. New `apps/web/app/api/lemonsqueezy/invoices/route.ts` (auth-gated identically
   to the Stripe route; LS SDK subscription-invoices listing).
2. Branch `fetchInvoices()` on `deriveProviderFromPlanInfo(subscription)`, reusing
   `apps/web/lib/billing-provider-guard.ts` exactly as the cancel path does.
3. A fixture test per provider, asserting the selected endpoint.

**Note:** the invoice shape returned by Lemon Squeezy differs from Stripe's
`Invoice` interface declared in `page.client.tsx` — a mapping layer is needed,
so this is not a one-line branch.
