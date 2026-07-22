import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { FREE_USAGE_LIMIT } from "@/lib/config/subscription-plans"

export async function POST(request: NextRequest) {
  try {
    // Get API key from query parameters or headers
    const { searchParams } = new URL(request.url)
    const apiKey =
      searchParams.get("apikey") || request.headers.get("x-api-key")

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "Missing API key" },
        { status: 401 },
      )
    }

    // Rate Limiting: 60 requests per minute per key to prevent abuse
    const { data: isAllowed, error: rateLimitError } = await supabaseWithAdminAccess
      .rpc("check_rate_limit", {
        p_user_id: apiKey, // Using apiKey as the identifier for rate limiting
        p_endpoint: "magic_use",
        p_limit: 60,
        p_window_seconds: 60,
      })

    if (rateLimitError) {
      console.error("Rate limit check failed:", rateLimitError)
    } else if (isAllowed === false) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      )
    }

    try {
      // Check API key in api_keys table
      const { data: apiKeyData, error: apiKeyError } =
        await supabaseWithAdminAccess
          .from("api_keys")
          .select("*")
          .eq("key", apiKey)
          .eq("is_active", true)
          .single()

      // If key is not found or inactive
      if (apiKeyError || !apiKeyData) {
        return NextResponse.json(
          { success: false, error: "Invalid or inactive API key" },
          { status: 401 },
        )
      }

      const userId = apiKeyData.user_id

      // Atomically increment usage
      const { data: rpcData, error: rpcError } = await supabaseWithAdminAccess
        .rpc("increment_api_usage", {
          p_user_id: userId,
          p_limit: FREE_USAGE_LIMIT,
        })

      if (rpcError) {
        console.error("RPC Error:", rpcError)
        return NextResponse.json(
          { success: false, error: "Failed to update usage" },
          { status: 500 },
        )
      }

      if (!rpcData || !rpcData.success) {
        return NextResponse.json(
          {
            success: false,
            error: rpcData?.error || "Usage limit exceeded",
            usage: rpcData?.usage || 0,
            limit: rpcData?.limit || FREE_USAGE_LIMIT,
            remaining: 0,
          },
          { status: 403 },
        )
      }

      // Update last_used_at for API key in the background
      supabaseWithAdminAccess
        .from("api_keys")
        .update({
          last_used_at: new Date().toISOString(),
          requests_count: (apiKeyData.requests_count || 0) + 1,
        })
        .eq("id", apiKeyData.id)
        .then(({ error }) => {
          if (error) console.error("Failed to update api_key stats:", error)
        })

      // Return successful response
      return NextResponse.json({
        success: true,
        message: "API key is valid and usage updated",
        usage: rpcData.usage,
        limit: rpcData.limit,
        remaining: rpcData.remaining,
      })
    } catch (error) {
      console.error("Supabase operation error:", error)
      return NextResponse.json(
        { success: false, error: "Database operation failed" },
        { status: 500 },
      )
    }
  } catch (error) {
    console.error("Error in magic/use endpoint:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    )
  }
}
