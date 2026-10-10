import { supabaseWithAdminAccess } from "@/lib/supabase"
import { checkIsAdmin } from "@/lib/admin"
import { auth } from "@clerk/nextjs/server"
import { createClient } from "@supabase/supabase-js"
import { addDays, format } from "date-fns"
import { NextRequest, NextResponse } from "next/server"
import { currentApprovedAutoIndexComponentIds } from "@/lib/api/server/auto-index-admission"
import type { Database } from "@/types/supabase"

type PayoutRate = {
  active_from: string
  active_till: string | null
  activity_type: string
  created_at: string
  id: number
  price: number
  user_id: string | null
}

const getPayoutRatesByDates = (
  payoutRates: PayoutRate[],
  activityType: string,
  userId: string,
  dates: string[],
): Map<string, number> => {
  if (dates.length === 0) {
    return new Map()
  }

  let userRatesStack: PayoutRate[] = []
  let globalRatesStack: PayoutRate[] = []
  let rates: Map<string, number> = new Map()
  const MAX_DATE = "9999-99-99"

  enum DateType {
    RATE_TILL,
    RATE_FROM,
    DATE,
  }

  let allDates: (
    | {
        date: string
        type: DateType.DATE
        rate: PayoutRate | null
      }
    | {
        date: string
        type: DateType.RATE_FROM | DateType.RATE_TILL
        rate: PayoutRate
      }
  )[] = dates.map((date) => ({
    date: date,
    type: DateType.DATE,
    rate: null,
  }))

  for (const rate of payoutRates) {
    if (
      (rate.user_id !== null && rate.user_id !== userId) ||
      rate.activity_type !== activityType
    ) {
      continue
    }
    allDates.push({
      date: rate.active_from,
      type: DateType.RATE_FROM,
      rate: rate,
    })
    allDates.push({
      date: rate.active_till
        ? format(addDays(new Date(rate.active_till), 1), "yyyy-MM-dd") // Because active_till is the last day of that rate
        : MAX_DATE,
      type: DateType.RATE_TILL,
      rate: rate,
    })
  }

  // VERY FUCKING IMPORTANT SORTING
  allDates.sort((a, b) => {
    if (a.date === b.date) {
      if (a.type === DateType.RATE_FROM && b.type === DateType.RATE_FROM) {
        return a.rate.created_at.localeCompare(b.rate.created_at)
      }
      return a.type - b.type
    }
    return a.date.localeCompare(b.date)
  })

  for (const date of allDates) {
    if (date.type === DateType.RATE_FROM) {
      if (date.rate?.user_id) {
        userRatesStack.push(date.rate)
      } else {
        globalRatesStack.push(date.rate)
      }
    } else if (date.type === DateType.RATE_TILL) {
      if (date.rate?.user_id) {
        userRatesStack = userRatesStack.filter(
          (rate) => rate.id !== date.rate.id,
        )
      } else {
        globalRatesStack = globalRatesStack.filter(
          (rate) => rate.id !== date.rate.id,
        )
      }
    } else if (date.type === DateType.DATE) {
      rates.set(
        date.date,
        userRatesStack[userRatesStack.length - 1]?.price ??
          globalRatesStack[globalRatesStack.length - 1]?.price ??
          0,
      )
    }
  }

  return rates
}

export async function GET(request: NextRequest) {
  try {
    const { userId, getToken } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let targetUserId = request.nextUrl.searchParams.get("user_id") ?? userId

    const { isAdmin, error: isAdminError } = await checkIsAdmin(userId)
    if (isAdminError) {
      console.error("Error checking is admin:", isAdminError)
      return NextResponse.json(
        { error: "Failed to check is admin" },
        { status: 500 },
      )
    }

    if (!isAdmin && userId !== targetUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY
    const supabaseJwt = await getToken({ template: "supabase" })
    if (!supabaseUrl || !supabaseAnonKey || !supabaseJwt) {
      console.error("Missing authenticated Supabase context for author statistics")
      return NextResponse.json(
        { error: "Author statistics are temporarily unavailable" },
        { status: 503 },
      )
    }

    // This owner/admin-scoped RPC must see the requester's verified Clerk JWT.
    // Never call it with the service-role client: doing so drops the caller
    // identity that the database uses to authorize the requested author.
    const callerSupabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${supabaseJwt}` } },
    })
    const { data: payoutStats, error: payoutError } =
      await callerSupabase.rpc("get_daily_user_earnings_v2", {
        p_user_id: targetUserId,
      })

    if (payoutError) {
      console.error("Error fetching author payout stats:", payoutError)
      return NextResponse.json(
        { error: "Failed to fetch author statistics" },
        { status: 500 },
      )
    }

    const { data: payoutRates, error: payoutRatesError } =
      await supabaseWithAdminAccess
        .from("payout_rates")
        .select("*")
        .or(`user_id.is.null, user_id.eq.${targetUserId}`)

    if (payoutRatesError) {
      console.error("Error fetching payout rates:", payoutRatesError)
      return NextResponse.json(
        { error: "Failed to fetch payout rates" },
        { status: 500 },
      )
    }

    const viewsPayoutRatesByDate = getPayoutRatesByDates(
      payoutRates,
      "component_view",
      targetUserId,
      payoutStats.map((v) => v.date),
    )

    const payoutStatsExpanded = payoutStats.map((v) => {
      const rate = viewsPayoutRatesByDate.get(v.date) ?? 0
      return {
        ...v,
        total_earnings: v.views * rate,
        view_price: isAdmin ? rate : undefined,
      }
    })

    const { data: payouts, error: payoutsError } = await supabaseWithAdminAccess
      .from("author_payouts")
      .select(
        "id, period_start, period_end, total_amount, paypal_email, status, transaction_id, created_at, processed_at",
      )
      .eq("author_id", targetUserId)

    if (payoutsError) {
      console.error("Error fetching author payouts:", payoutsError)
      return NextResponse.json(
        { error: "Failed to fetch author payouts" },
        { status: 500 },
      )
    }

    const publicComponents: Array<{ id: number; registry: string | null }> = []
    let lastComponentId: number | null = null
    for (;;) {
      let query = supabaseWithAdminAccess
        .from("components")
        .select("id, registry")
        .eq("user_id", targetUserId)
        .eq("is_public", true)
        .order("id", { ascending: true })
        .limit(1000)
      if (lastComponentId !== null) query = query.gt("id", lastComponentId)
      const { data, error } = await query
      if (error) {
        console.error("Error counting published components:", error)
        return NextResponse.json({ error: "Failed to count published components" }, { status: 500 })
      }
      const rows = data ?? []
      publicComponents.push(...rows)
      if (rows.length < 1000) break
      lastComponentId = rows.at(-1)?.id ?? lastComponentId
    }
    const indexedIds = publicComponents
      .filter(({ registry }) => registry === "auto-index")
      .map(({ id }) => id)
    const admittedIds = await currentApprovedAutoIndexComponentIds(indexedIds)
    const publishedComponentsCount = publicComponents.filter(
      ({ id, registry }) => registry !== "auto-index" || admittedIds.has(id),
    ).length

    const responseData = {
      published_components: publishedComponentsCount,
      payoutStats: payoutStatsExpanded,
      payouts,
    }

    return NextResponse.json(responseData)
  } catch (error) {
    console.error("Author stats error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
