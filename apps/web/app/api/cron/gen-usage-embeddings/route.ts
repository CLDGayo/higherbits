import { supabaseWithAdminAccess } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 600

/**
 * Default number of missing items processed per run.
 * At ~5s/item (network + edge-function overhead) 20 items is ~100s, well inside
 * `maxDuration = 600`, while bounding paid-API spend per run.
 * Override with the `EMBEDDING_CRON_BATCH_CAP` env var.
 */
const DEFAULT_BATCH_CAP = 20

function resolveBatchCap(): number {
  const parsed = Number.parseInt(process.env.EMBEDDING_CRON_BATCH_CAP ?? "", 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_BATCH_CAP
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  // Validate the request has the correct authorization header
  const authHeader = req.headers.get("Authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = supabaseWithAdminAccess

  const { data: missingItems, error } = await supabase.rpc(
    "get_missing_usage_embedding_items",
  )

  if (error) {
    console.error("Error fetching missing items:", error)
    return NextResponse.json(
      { error: "Failed to fetch missing items", details: error.message },
      { status: 500 },
    )
  }

  // Cap the batch. This applies unconditionally (not gated behind any query
  // param). Items skipped by the cap are NOT dropped: get_missing_usage_embedding_items()
  // recomputes missing items from current DB state on every call, so they are picked
  // up automatically on the next scheduled run.
  const cap = resolveBatchCap()
  const allMissing = missingItems ?? []
  const items = allMissing.slice(0, cap)

  // Opt-in dry run: report what WOULD be processed and return before the loop, so
  // the "no functions.invoke call" guarantee is structurally enforced.
  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true"
  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      // Capped — what THIS run would process.
      wouldProcess: items.length,
      // Uncapped backlog depth. Without this an operator cannot tell whether the
      // hourly cap is keeping up with the backlog or falling behind, since
      // `wouldProcess` saturates at the cap.
      totalMissing: allMissing.length,
      cap,
      items,
    })
  }

  // Generate embeddings for missing items
  for (const item of items) {
    console.log("Generating embeddings for item:", item)
    const { data, error } = await supabase.functions.invoke(
      "generate-embeddings",
      {
        body: {
          type: item.item_type,
          id: item.item_id,
        },
      },
    )

    console.log("Response:", data)

    if (error) {
      console.error("Error generating embeddings:", error)
      return NextResponse.json(
        { error: "Failed to generate embeddings", details: error.message },
        { status: 500 },
      )
    }
  }

  return NextResponse.json(items)
}
