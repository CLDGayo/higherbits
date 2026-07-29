import { describe, it, expect, vi, beforeEach } from "vitest"

/**
 * Phase 05 (supabase-interconnect) — EVL fix cycle 1.
 *
 * `GET /api/stripe/get-invoices` is a FIFTH writer to `users_to_plans`: when the
 * row has no `meta.stripe_customer_id`, it searches Stripe by email and
 * backfills the id it finds. On a Lemon-Squeezy-owned row that plants a Stripe
 * ownership marker, flipping the row to "ambiguous" — which the guard
 * auto-allows, so a stale Stripe `customer.subscription.deleted` can then
 * deactivate a paying LS subscriber.
 *
 * Assertions target the MOCKED `users_to_plans` write (its arguments or its
 * absence). HTTP status is never asserted as proof of billing correctness.
 */

type Row = Record<string, any>

const updateCalls: { table: string; payload: Row }[] = []
let tableData: Record<string, Row | null> = {}

function chain(table: string): any {
  const result = async () => ({ data: tableData[table] ?? null, error: null })
  const eqNode: any = { single: result, maybeSingle: result, eq: () => eqNode }
  return {
    select: () => ({ eq: () => eqNode }),
    update: (payload: Row) => {
      updateCalls.push({ table, payload })
      return { eq: async () => ({ error: null, data: null }) }
    },
  }
}

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: { from: (table: string) => chain(table) },
}))

const USER_ID = "user_123"
const EMAIL = "paying.customer@example.com"

vi.mock("@clerk/nextjs/server", () => ({
  auth: async () => ({ userId: USER_ID }),
  currentUser: async () => ({
    emailAddresses: [{ emailAddress: EMAIL }],
  }),
}))

/**
 * A Stripe customer IS discoverable by this user's email — an abandoned
 * checkout or an old trial. Without this the test would pass for the wrong
 * reason (early `{ invoices: [] }` return before the write ever runs).
 */
const stripeCustomersList = vi.fn(async () => ({
  data: [{ id: "cus_stale_stripe_1", metadata: { userId: USER_ID } }],
}))
const stripeInvoicesList = vi.fn(async () => ({ data: [] }))

vi.mock("@/lib/stripe", () => {
  const instance = {
    customers: { list: (...a: any[]) => stripeCustomersList(...(a as [])) },
    invoices: { list: (...a: any[]) => stripeInvoicesList(...(a as [])) },
  }
  return { default: instance, stripeV1: instance, stripeV2: instance }
})

import { GET } from "../route"

/** A healthy post-fix Lemon Squeezy row: active, LS id set, meta nulled. */
const ACTIVE_LEMON_ROW: Row = {
  id: 1,
  user_id: USER_ID,
  status: "active",
  meta: null,
  lemon_squeezy_subscription_id: "ls_sub_1",
  plans: { id: 1, version: 2, price: 10, type: "pro" },
}

/** Same shape, but owned by nobody — the backfill is legitimate here. */
const UNOWNED_ROW: Row = {
  ...ACTIVE_LEMON_ROW,
  lemon_squeezy_subscription_id: null,
}

function usersToPlansWrites() {
  return updateCalls.filter((c) => c.table === "users_to_plans")
}

beforeEach(() => {
  updateCalls.length = 0
  tableData = { users_to_plans: null }
  stripeCustomersList.mockClear()
  stripeInvoicesList.mockClear()
})

describe("GET /api/stripe/get-invoices — must not plant a Stripe marker on a Lemon Squeezy row", () => {
  it("does NOT backfill meta.stripe_customer_id onto an active Lemon-Squeezy-owned row", async () => {
    tableData.users_to_plans = ACTIVE_LEMON_ROW

    await GET()

    // The Stripe customer WAS found (so the write path was genuinely reached)…
    expect(stripeCustomersList).toHaveBeenCalled()
    // …but the row was left untouched.
    expect(usersToPlansWrites()).toHaveLength(0)
  })

  it("still returns the invoice list (the backfill is a cache, not a requirement)", async () => {
    tableData.users_to_plans = ACTIVE_LEMON_ROW

    await GET()

    expect(stripeInvoicesList).toHaveBeenCalledWith(
      expect.objectContaining({ customer: "cus_stale_stripe_1" }),
    )
  })

  it("DOES still backfill on a row with no provider marker (no false blocking)", async () => {
    tableData.users_to_plans = UNOWNED_ROW

    await GET()

    const write = usersToPlansWrites()[0]
    expect(write).toBeDefined()
    expect(write!.payload.meta).toMatchObject({
      stripe_customer_id: "cus_stale_stripe_1",
    })
  })
})
