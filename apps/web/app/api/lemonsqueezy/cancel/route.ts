import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { configureLemonSqueezy } from "@/lib/lemonsqueezy"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { cancelSubscription } from "@lemonsqueezy/lemonsqueezy.js"
import { deriveBillingProvider } from "@/lib/billing-provider-guard"

// Mirrors the guard used by the other Lemon Squeezy routes.
function paymentsNotConfigured(): boolean {
  return !process.env.LEMON_SQUEEZY_API_KEY
}

const PAYMENTS_NOT_CONFIGURED_RESPONSE = {
  error: "payments_not_configured",
  message:
    "Subscription management is temporarily unavailable. Email support@higherbits.dev for help.",
} as const

export async function POST(_request: NextRequest) {
  try {
    if (paymentsNotConfigured()) {
      return NextResponse.json(PAYMENTS_NOT_CONFIGURED_RESPONSE, {
        status: 503,
      })
    }

    // Auth-gated identically to the existing Stripe cancel route.
    const authSession = await auth()
    const userId = authSession?.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: userPlan, error: userPlanError } =
      await supabaseWithAdminAccess
        .from("users_to_plans")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .maybeSingle()

    const subscriptionId = userPlan?.lemon_squeezy_subscription_id

    // Server-side provider re-check: never act on a Stripe-owned row even if
    // the client routed here by mistake.
    if (
      userPlanError ||
      !userPlan ||
      !subscriptionId ||
      deriveBillingProvider(userPlan) === "stripe"
    ) {
      return NextResponse.json(
        { error: "No active Lemon Squeezy subscription found" },
        { status: 404 },
      )
    }

    configureLemonSqueezy()

    const { error: cancelError } = await cancelSubscription(subscriptionId)

    if (cancelError) {
      console.error("Lemon Squeezy cancel error:", cancelError)
      return NextResponse.json(
        { error: cancelError.message || "Failed to cancel subscription" },
        { status: 500 },
      )
    }

    // The DB row is updated by the subscription_cancelled webhook, not here.
    return NextResponse.json({
      success: true,
      message: "Subscription successfully canceled",
    })
  } catch (error) {
    console.error("Error in lemonsqueezy/cancel:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    )
  }
}
