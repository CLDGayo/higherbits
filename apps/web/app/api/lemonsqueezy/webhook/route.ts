import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import crypto from "crypto"
import { getPlanByLemonSqueezyVariantId } from "@/lib/lemonsqueezy"
import { clerkClient } from "@clerk/nextjs/server"
import {
  guardBillingWrite,
  clearingPatchFor,
} from "@/lib/billing-provider-guard"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-signature") || ""
    const secret = process.env.LEMON_SQUEEZY_WEBHOOK_SECRET

    if (!secret) {
      return new NextResponse("Webhook secret not configured", { status: 500 })
    }

    const hmac = crypto.createHmac("sha256", secret)
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8")
    const signatureBuffer = Buffer.from(signature, "utf8")

    if (digest.length !== signatureBuffer.length || !crypto.timingSafeEqual(digest, signatureBuffer)) {
      return new NextResponse("Invalid signature", { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const eventName = payload.meta.event_name
    const obj = payload.data.attributes

    const userId = payload.meta.custom_data?.user_id
    if (!userId) {
      console.warn("No user_id found in custom_data", payload)
      return new NextResponse("Missing user_id", { status: 200 })
    }

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      const variantId = obj.variant_id.toString()
      const subscriptionId = payload.data.id.toString()
      const customerId = obj.customer_id.toString()

      // Fetch plan to know usage limit
      let plan
      try {
        plan = await getPlanByLemonSqueezyVariantId(variantId)
      } catch (e) {
        console.error("Unknown variant ID:", variantId)
        return new NextResponse("Unknown variant ID", { status: 200 })
      }

      const status = obj.status === "active" || obj.status === "past_due" ? "active" : "inactive"

      // Check if user already has a plan
      const { data: existingUserPlan } = await supabaseWithAdminAccess
        .from("users_to_plans")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      // Mutual exclusion: never overwrite a row actively owned by Stripe.
      // Must return BEFORE the unconditional Clerk sync below, or Clerk's
      // isPro claim desynchronizes from the (unwritten) DB row.
      const guard = guardBillingWrite(existingUserPlan, "lemonsqueezy", {
        userId,
        source: "lemonsqueezy/webhook",
      })
      if (guard.skip) {
        return new NextResponse("Skipped: cross-provider conflict", {
          status: 200,
        })
      }

      // Ensure user has lemon_squeezy_customer_id.
      // Deliberately AFTER the guard: a guard skip must be a clean no-op, so a
      // cross-provider conflict leaves no Lemon Squeezy residue on `users`.
      await supabaseWithAdminAccess
        .from("users")
        .update({ lemon_squeezy_customer_id: customerId })
        .eq("id", userId)

      const usageLimit = plan.type === "pro_plus" ? null : 15 // Assuming pro has 15 limit or similar, replicate Stripe logic if needed

      if (existingUserPlan) {
        await supabaseWithAdminAccess
          .from("users_to_plans")
          .update({
            status,
            plan_id: plan.id,
            lemon_squeezy_subscription_id: subscriptionId,
            // Null the losing provider's marker in the SAME write.
            ...clearingPatchFor("lemonsqueezy"),
            updated_at: new Date().toISOString(),
            last_paid_at: new Date().toISOString(),
          })
          .eq("user_id", userId)
      } else {
        await supabaseWithAdminAccess.from("users_to_plans").insert({
          user_id: userId,
          plan_id: plan.id,
          status,
          lemon_squeezy_subscription_id: subscriptionId,
          ...clearingPatchFor("lemonsqueezy"),
          last_paid_at: new Date().toISOString(),
        })
        
        await supabaseWithAdminAccess.from("usages").upsert(
          {
            user_id: userId,
            limit: usageLimit,
            usage: 0,
          },
          { onConflict: "user_id" }
        )
      }

      // Sync Pro status to Clerk publicMetadata
      try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            isPro: status === "active",
          },
        })
      } catch (clerkErr) {
        console.error("Failed to sync Clerk publicMetadata for Lemon Squeezy subscription:", clerkErr)
      }
    } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      // Same mutual exclusion on the deactivation path: a Lemon Squeezy
      // cancellation must not deactivate a row actively owned by Stripe.
      const { data: existingUserPlan } = await supabaseWithAdminAccess
        .from("users_to_plans")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle()

      const guard = guardBillingWrite(existingUserPlan, "lemonsqueezy", {
        userId,
        source: "lemonsqueezy/webhook:cancel",
      })
      if (guard.skip) {
        return new NextResponse("Skipped: cross-provider conflict", {
          status: 200,
        })
      }

      await supabaseWithAdminAccess
        .from("users_to_plans")
        .update({
          status: "inactive",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userId)

      // Sync Pro status removal to Clerk publicMetadata
      try {
        const client = await clerkClient()
        await client.users.updateUserMetadata(userId, {
          publicMetadata: {
            isPro: false,
          },
        })
      } catch (clerkErr) {
        console.error("Failed to sync Clerk publicMetadata on cancellation:", clerkErr)
      }
    }

    return new NextResponse("Webhook processed", { status: 200 })
  } catch (error) {
    console.error("Lemon Squeezy Webhook Error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
