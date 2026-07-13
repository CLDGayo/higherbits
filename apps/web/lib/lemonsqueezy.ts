import { supabaseWithAdminAccess } from "@/lib/supabase"
import { Database } from "@/types/supabase"
import { lemonSqueezySetup } from "@lemonsqueezy/lemonsqueezy.js"

type Plan = Database["public"]["Tables"]["plans"]["Row"]

export function configureLemonSqueezy() {
  const apiKey = process.env.LEMON_SQUEEZY_API_KEY
  if (!apiKey) {
    console.warn("LEMON_SQUEEZY_API_KEY is not set")
    return
  }
  lemonSqueezySetup({
    apiKey,
    onError: (error) => console.error("Lemon Squeezy API Error:", error),
  })
}

// Cache for plans
let plansCache: Plan[] | null = null
let lastCacheTime = 0
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Fetches all plans from the plans table in Supabase
export async function getAllPlans(forceRefresh = false): Promise<Plan[]> {
  const currentTime = Date.now()

  if (
    !forceRefresh &&
    plansCache !== null &&
    currentTime - lastCacheTime < CACHE_TTL
  ) {
    return plansCache
  }

  const environment = "live"
  const { data, error } = await supabaseWithAdminAccess
    .from("plans")
    .select("*")
    .eq("env", environment)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching plans:", error)
    throw new Error(`Failed to fetch plans: ${error.message}`)
  }

  plansCache = data || []
  lastCacheTime = currentTime

  return plansCache
}

export async function getPlanByLemonSqueezyVariantId(variantId: string): Promise<Plan> {
  try {
    const plans = await getAllPlans()
    const cachedPlan = plans.find(
      (plan) => plan.lemon_squeezy_variant_id === variantId,
    )

    if (cachedPlan) {
      return cachedPlan
    }

    const { data, error } = await supabaseWithAdminAccess
      .from("plans")
      .select("*")
      .eq("lemon_squeezy_variant_id", variantId)
      .single()

    if (error) {
      console.error("Error fetching plan by variant ID:", error)
      throw new Error(`No plan found with variant ID: ${variantId}`)
    }

    return data
  } catch (error) {
    console.error("Error in getPlanByLemonSqueezyVariantId:", error)
    throw new Error(`Failed to find plan with variant ID: ${variantId}`)
  }
}

export async function getIdBySubscriptionPlanDetails(
  type: string,
  period: string,
  version: 1 | 2,
): Promise<string> {
  const plans = await getAllPlans()
  const environment = "live"

  const plan = plans.find(
    (p) =>
      p.type === type &&
      p.period === period &&
      p.env === environment &&
      p.version === version,
  )

  if (!plan) {
    throw new Error(`No plan found for type: ${type} and period: ${period}`)
  }

  if (!plan.lemon_squeezy_variant_id) {
    throw new Error(
      `Plan found but has no Lemon Squeezy variant ID for type: ${type} and period: ${period}`,
    )
  }

  return plan.lemon_squeezy_variant_id
}
