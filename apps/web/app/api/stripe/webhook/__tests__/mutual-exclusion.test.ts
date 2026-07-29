import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

/**
 * Phase 05 (supabase-interconnect) — dual-webhook mutual exclusion.
 *
 * Every assertion targets the MOCKED `users_to_plans` write call (its arguments
 * or its absence). HTTP status is deliberately never asserted as proof of
 * billing correctness: a webhook can return 200 while silently performing — or
 * silently skipping — the wrong write.
 */

// ---- mocked supabase ---------------------------------------------------

type Row = Record<string, any>

const updateCalls: { table: string; payload: Row }[] = []
const insertCalls: { table: string; payload: Row }[] = []
let tableData: Record<string, Row | null> = {}

function chain(table: string): any {
  const result = async () => ({ data: tableData[table] ?? null, error: null })
  const eqNode: any = {
    single: result,
    maybeSingle: result,
    eq: () => eqNode,
  }
  return {
    select: () => ({ eq: () => eqNode }),
    update: (payload: Row) => {
      updateCalls.push({ table, payload })
      return { eq: async () => ({ error: null, data: null }) }
    },
    insert: async (payload: Row) => {
      insertCalls.push({ table, payload })
      return { error: null, data: null }
    },
    upsert: () => ({ select: async () => ({ error: null, data: null }) }),
  }
}

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: { from: (table: string) => chain(table) },
}))

// ---- mocked stripe -----------------------------------------------------

let currentEvent: any = null

vi.mock("@/lib/stripe", () => {
  const webhooks = { constructEvent: () => currentEvent }
  return {
    default: {},
    stripeV1: { webhooks },
    stripeV2: { webhooks },
    getPlanByStripeId: vi.fn().mockResolvedValue({
      id: 1,
      type: "pro",
      period: "monthly",
      add_usage: 100,
      price: 10,
      stripe_plan_id: "price_1",
    }),
  }
})

import { POST as postV2 } from "../v2/route"
import { POST as postV1 } from "../v1/route"

// ---- fixtures ----------------------------------------------------------

const USER_ID = "user_123"

function subscriptionEvent(type: string) {
  return {
    type,
    data: {
      object: {
        id: "sub_stripe_1",
        customer: "cus_stripe_1",
        metadata: { userId: USER_ID },
        items: { data: [{ plan: { id: "price_1" } }] },
        current_period_end: 1893456000,
        cancel_at_period_end: false,
        cancel_at: null,
      },
    },
  }
}

function request() {
  return new NextRequest("http://localhost/api/stripe/webhook/v2", {
    method: "POST",
    body: "{}",
    headers: { "stripe-signature": "sig" },
  })
}

/** A row actively owned by Lemon Squeezy. */
const ACTIVE_LEMON_ROW: Row = {
  id: 1,
  user_id: USER_ID,
  status: "active",
  meta: null,
  lemon_squeezy_subscription_id: "ls_sub_1",
  plans: { id: 1, stripe_plan_id: "price_1", price: 10, type: "pro" },
}

/** The same row after the user cancelled Lemon Squeezy. */
const CANCELED_LEMON_ROW: Row = { ...ACTIVE_LEMON_ROW, status: "inactive" }

/** A row actively owned by Stripe. */
const ACTIVE_STRIPE_ROW: Row = {
  id: 1,
  user_id: USER_ID,
  status: "active",
  meta: {
    stripe_customer_id: "cus_stripe_1",
    stripe_subscription_id: "sub_stripe_1",
    period_end: "2030-01-01T00:00:00.000Z",
  },
  lemon_squeezy_subscription_id: null,
  plans: { id: 1, stripe_plan_id: "price_1", price: 10, type: "pro" },
}

function usersToPlansWrites() {
  return [...updateCalls, ...insertCalls].filter(
    (c) => c.table === "users_to_plans",
  )
}

beforeEach(() => {
  updateCalls.length = 0
  insertCalls.length = 0
  tableData = {
    usages: { limit: 100, usage: 3 },
    plans: { price: 10, type: "pro" },
    users_to_plans: null,
  }
  currentEvent = null
})

// ---- cases -------------------------------------------------------------

describe("Stripe webhook v2 — billing provider mutual exclusion", () => {
  it("CASE 1 — allows a same-provider renewal (must never block a paying customer)", async () => {
    tableData.users_to_plans = ACTIVE_STRIPE_ROW
    currentEvent = subscriptionEvent("customer.subscription.updated")

    await postV2(request())

    const writes = usersToPlansWrites()
    expect(writes.length).toBeGreaterThan(0)
    expect(writes.some((w) => w.payload.status === "active")).toBe(true)
  })

  it("CASE 2a — blocks a Stripe write onto a row actively owned by Lemon Squeezy", async () => {
    tableData.users_to_plans = ACTIVE_LEMON_ROW
    currentEvent = subscriptionEvent("customer.subscription.updated")

    await postV2(request())

    expect(usersToPlansWrites()).toHaveLength(0)
  })

  it("CASE 2a (delete path) — a Stripe cancellation cannot deactivate a Lemon-Squeezy-owned row", async () => {
    tableData.users_to_plans = ACTIVE_LEMON_ROW
    currentEvent = subscriptionEvent("customer.subscription.deleted")

    await postV2(request())

    expect(usersToPlansWrites()).toHaveLength(0)
  })

  it("CASE 3 — allows a provider switch when the existing Lemon Squeezy row is NOT active", async () => {
    tableData.users_to_plans = CANCELED_LEMON_ROW
    currentEvent = subscriptionEvent("customer.subscription.updated")

    await postV2(request())

    expect(usersToPlansWrites().length).toBeGreaterThan(0)
  })

  it("CASE 4 — the switch write nulls the losing provider's marker in the SAME write", async () => {
    tableData.users_to_plans = CANCELED_LEMON_ROW
    currentEvent = subscriptionEvent("customer.subscription.updated")

    await postV2(request())

    const write = usersToPlansWrites().find(
      (w) => w.payload.status === "active",
    )
    expect(write).toBeDefined()
    expect(write!.payload.lemon_squeezy_subscription_id).toBeNull()
    expect(write!.payload.meta).toMatchObject({
      stripe_subscription_id: "sub_stripe_1",
    })
  })

  it("inserts (new user) also carry the clearing patch", async () => {
    tableData.users_to_plans = null
    currentEvent = subscriptionEvent("customer.subscription.created")

    await postV2(request())

    const write = insertCalls.find((c) => c.table === "users_to_plans")
    expect(write).toBeDefined()
    expect(write!.payload.lemon_squeezy_subscription_id).toBeNull()
  })
})

describe("Stripe webhook v1 — same guard (B0: guarded defensively)", () => {
  it("blocks a v1 write onto a row actively owned by Lemon Squeezy", async () => {
    tableData.users_to_plans = ACTIVE_LEMON_ROW
    currentEvent = subscriptionEvent("customer.subscription.updated")

    await postV1(request())

    expect(usersToPlansWrites()).toHaveLength(0)
  })

  it("allows a v1 same-provider renewal", async () => {
    tableData.users_to_plans = ACTIVE_STRIPE_ROW
    currentEvent = subscriptionEvent("customer.subscription.updated")

    await postV1(request())

    expect(usersToPlansWrites().length).toBeGreaterThan(0)
  })
})
