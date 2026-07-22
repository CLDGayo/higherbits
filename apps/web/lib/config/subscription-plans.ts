/**
 * Subscription plans configuration
 * This file contains all information about subscription plans, including limits, features, and pricing
 */

import { PlanType, PlanPrice, PlanFeature, PricingPlan } from "@/types/global"

export type { PlanType }

// Plan limits and basic information
export interface PlanLimits {
  generationsPerMonth: number
  displayName: string
  name: string
  description: string
  features: string[]
  monthlyPrice?: number
  yearlyPrice?: number
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
  free: {
    generationsPerMonth: 5,
    displayName: "Free",
    name: "Free",
    description: "Perfect for trying out",
    features: [
      "5 code copies per day",
      "5 prompt copies per day",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Community support",
    ],
  },
  pro: {
    generationsPerMonth: 999999,
    displayName: "Pro",
    name: "Pro",
    description: "For professional developers",
    features: [
      "Unlimited code copies",
      "Unlimited prompt copies",
      "Pro-only components",
      "Unlimited UI Inspirations",
      "Unlimited SVG Logo Search",
      "Priority support",
    ],
    monthlyPrice: 6,
    yearlyPrice: 48,
  },
}

export interface Plan {
  name: string
  type: PlanType
  price: PlanPrice
  buttonText: string
  buttonHref?: string
  disabled?: boolean
  popular?: boolean
}

export const COMPARISON_PLANS: Plan[] = [
  {
    name: PLAN_LIMITS.free.displayName,
    type: "free",
    price: {
      monthly: 0,
      yearly: 0,
    },
    buttonText: "Current Plan",
    disabled: true,
  },
  {
    name: PLAN_LIMITS.pro.displayName,
    type: "pro",
    price: {
      monthly: PLAN_LIMITS.pro.monthlyPrice || 6,
      yearly: PLAN_LIMITS.pro.yearlyPrice || 48,
    },
    popular: true,
    buttonText: "Upgrade to Pro",
    buttonHref: "/upgrade",
  },
]

export interface ComparisonFeature {
  name: string
  section: string
  values: Record<PlanType, string>
}

export const FREE_USAGE_LIMIT = 5

export const COMPARISON_FEATURES: ComparisonFeature[] = [
  {
    name: "Code Copies",
    section: "Usage",
    values: {
      free: "5 per day",
      pro: "Unlimited",
    },
  },
  {
    name: "Prompt Copies",
    section: "Usage",
    values: {
      free: "5 per day",
      pro: "Unlimited",
    },
  },
  {
    name: "Pro Components",
    section: "HigherBits.dev",
    values: {
      free: "Not available",
      pro: "Full access",
    },
  },
  {
    name: "UI Inspirations",
    section: "Magic MCP",
    values: {
      free: "Unlimited",
      pro: "Unlimited",
    },
  },
  {
    name: "SVG Logo Search",
    section: "Magic MCP",
    values: {
      free: "Unlimited",
      pro: "Unlimited",
    },
  },
  {
    name: "Support Type",
    section: "Support",
    values: {
      free: "Community",
      pro: "Priority",
    },
  },
]

export const PLAN_FEATURES: PlanFeature[] = [
  {
    name: "Code Copies",
    included: "free",
    category: "Usage",
    valueByPlan: {
      free: "5 per day",
      pro: "Unlimited",
    },
  },
  {
    name: "Prompt Copies",
    included: "free",
    category: "Usage",
    valueByPlan: {
      free: "5 per day",
      pro: "Unlimited",
    },
  },
  {
    name: "Pro Components",
    included: "pro",
    category: "HigherBits.dev",
    valueByPlan: {
      free: "Not available",
      pro: "Full access",
    },
  },
  {
    name: "UI Inspirations",
    included: "free",
    category: "Magic MCP",
    valueByPlan: {
      free: "Unlimited",
      pro: "Unlimited",
    },
  },
  {
    name: "SVG Logo Search",
    included: "free",
    category: "Magic MCP",
    valueByPlan: {
      free: "Unlimited",
      pro: "Unlimited",
    },
  },
  {
    name: "Support Type",
    included: "free",
    category: "Support",
    valueByPlan: {
      free: "Community",
      pro: "Priority",
    },
  },
]

export const PRICING_PLANS: PricingPlan[] = [
  {
    name: PLAN_LIMITS.free.displayName,
    level: "free",
    price: { monthly: 0, yearly: 0 },
  },
  {
    name: PLAN_LIMITS.pro.displayName,
    level: "pro",
    price: {
      monthly: PLAN_LIMITS.pro.monthlyPrice || 6,
      yearly: PLAN_LIMITS.pro.yearlyPrice || 48,
    },
    popular: true,
  },
]

/**
 * Helper functions
 */

export function getGenerationLimit(planType: PlanType): number {
  return (
    PLAN_LIMITS[planType]?.generationsPerMonth ||
    PLAN_LIMITS.free.generationsPerMonth
  )
}

export function getPlanInfo(planType: PlanType): PlanLimits {
  return PLAN_LIMITS[planType] || PLAN_LIMITS.free
}

export interface PricingCardPlan {
  name: string
  type: PlanType
  description: string
  monthlyPrice?: number
  yearlyPrice?: number
  features: string[]
  buttonText: string
  href: string
  isFeatured?: boolean
  price?: Record<string, number | string>
  cta?: string
  popular?: boolean
  highlighted?: boolean
}

export function getPricingCardPlans(options?: {
  standardButtonText?: string
  proButtonText?: string
  href?: string
  standardCheckoutLink?: string
  proCheckoutLink?: string
}): PricingCardPlan[] {
  const {
    standardButtonText = "Join waitlist",
    href = "#checkout",
    standardCheckoutLink,
  } = options || {}

  return [
    {
      name: PLAN_LIMITS.pro.displayName,
      type: "pro",
      description: PLAN_LIMITS.pro.description,
      monthlyPrice: PLAN_LIMITS.pro.monthlyPrice,
      yearlyPrice: PLAN_LIMITS.pro.yearlyPrice,
      features: PLAN_LIMITS.pro.features,
      buttonText: standardButtonText,
      href: standardCheckoutLink || href,
      price: {
        monthly: PLAN_LIMITS.pro.monthlyPrice || 0,
        yearly: PLAN_LIMITS.pro.yearlyPrice || 0,
      },
      cta: standardButtonText,
      popular: true,
    },
  ]
}
