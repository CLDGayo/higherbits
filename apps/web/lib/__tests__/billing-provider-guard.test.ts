import { describe, it, expect } from "vitest"
import {
  deriveBillingProvider,
  deriveProviderFromPlanInfo,
  evaluateBillingWrite,
  clearingPatchFor,
  cancelEndpointFor,
  isActiveRow,
} from "../billing-provider-guard"

const stripeRow = {
  status: "active",
  meta: { stripe_customer_id: "cus_1", stripe_subscription_id: "sub_1" },
  lemon_squeezy_subscription_id: null,
}
const lemonRow = {
  status: "active",
  meta: null,
  lemon_squeezy_subscription_id: "ls_1",
}

describe("deriveBillingProvider", () => {
  it("reads Stripe identity out of the meta blob", () => {
    expect(deriveBillingProvider(stripeRow)).toBe("stripe")
    expect(
      deriveBillingProvider({ meta: { stripe_customer_id: "cus_1" } }),
    ).toBe("stripe")
  })

  it("reads Lemon Squeezy identity from the top-level column", () => {
    expect(deriveBillingProvider(lemonRow)).toBe("lemonsqueezy")
  })

  it("returns none for a row with no markers, and for a null row", () => {
    expect(deriveBillingProvider({ status: "active", meta: {} })).toBe("none")
    expect(deriveBillingProvider(null)).toBe("none")
  })

  it("returns ambiguous when both markers are present (legacy residue)", () => {
    expect(
      deriveBillingProvider({
        ...stripeRow,
        lemon_squeezy_subscription_id: "ls_1",
      }),
    ).toBe("ambiguous")
  })

  it("ignores empty-string markers", () => {
    expect(
      deriveBillingProvider({ meta: {}, lemon_squeezy_subscription_id: "  " }),
    ).toBe("none")
  })
})

describe("isActiveRow", () => {
  it("is true only for the exact literal 'active'", () => {
    expect(isActiveRow({ status: "active" })).toBe(true)
    expect(isActiveRow({ status: "inactive" })).toBe(false)
    expect(isActiveRow({ status: null })).toBe(false)
    expect(isActiveRow(null)).toBe(false)
  })
})

describe("evaluateBillingWrite", () => {
  it("blocks cross-provider writes in BOTH directions when the row is active", () => {
    expect(evaluateBillingWrite(lemonRow, "stripe").skip).toBe(true)
    expect(evaluateBillingWrite(stripeRow, "lemonsqueezy").skip).toBe(true)
  })

  it("never blocks a same-provider renewal", () => {
    expect(evaluateBillingWrite(stripeRow, "stripe").skip).toBe(false)
    expect(evaluateBillingWrite(lemonRow, "lemonsqueezy").skip).toBe(false)
  })

  it("allows a switch onto a non-active row (legitimate provider change)", () => {
    expect(
      evaluateBillingWrite({ ...lemonRow, status: "inactive" }, "stripe").skip,
    ).toBe(false)
    expect(
      evaluateBillingWrite({ ...stripeRow, status: "inactive" }, "lemonsqueezy")
        .skip,
    ).toBe(false)
  })

  it("allows writes to unmarked, ambiguous, and absent rows (never block on doubt)", () => {
    expect(evaluateBillingWrite(null, "stripe").skip).toBe(false)
    expect(evaluateBillingWrite({ status: "active" }, "stripe").skip).toBe(false)
    expect(
      evaluateBillingWrite(
        { ...stripeRow, lemon_squeezy_subscription_id: "ls_1" },
        "stripe",
      ).skip,
    ).toBe(false)
  })
})

describe("clearingPatchFor", () => {
  it("nulls the losing provider's marker", () => {
    expect(clearingPatchFor("stripe")).toEqual({
      lemon_squeezy_subscription_id: null,
    })
    expect(clearingPatchFor("lemonsqueezy")).toEqual({ meta: null })
  })
})

describe("AC10 — cancel routing per provider fixture", () => {
  // C1: Stripe-provider fixture -> Stripe cancel path.
  it("routes a Stripe-provider plan to the Stripe cancel endpoint", () => {
    const fixture = { stripe_subscription_id: "sub_1" }
    expect(cancelEndpointFor(deriveProviderFromPlanInfo(fixture))).toBe(
      "/api/stripe/cancel-subscription",
    )
  })

  // C2: Lemon-Squeezy-provider fixture -> LS cancel path.
  it("routes a Lemon Squeezy plan to the Lemon Squeezy cancel endpoint", () => {
    const fixture = { lemon_squeezy_subscription_id: "ls_1" }
    expect(cancelEndpointFor(deriveProviderFromPlanInfo(fixture))).toBe(
      "/api/lemonsqueezy/cancel",
    )
  })

  // Fail-safe: no markers must NOT silently fall through to Stripe.
  it("returns no endpoint when neither provider marker is present", () => {
    expect(cancelEndpointFor(deriveProviderFromPlanInfo({}))).toBeNull()
    expect(cancelEndpointFor(deriveProviderFromPlanInfo(null))).toBeNull()
  })
})

describe("deriveProviderFromPlanInfo (client-side, flattened shape)", () => {
  it("maps the billing page's PlanInfo to a provider", () => {
    expect(
      deriveProviderFromPlanInfo({ stripe_subscription_id: "sub_1" }),
    ).toBe("stripe")
    expect(
      deriveProviderFromPlanInfo({ lemon_squeezy_subscription_id: "ls_1" }),
    ).toBe("lemonsqueezy")
    expect(deriveProviderFromPlanInfo({})).toBe("none")
    expect(deriveProviderFromPlanInfo(null)).toBe("none")
    expect(
      deriveProviderFromPlanInfo({
        stripe_subscription_id: "sub_1",
        lemon_squeezy_subscription_id: "ls_1",
      }),
    ).toBe("ambiguous")
  })
})
