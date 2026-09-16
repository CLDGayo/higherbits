import { NextRequest, NextResponse } from "next/server"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import {
  codesandboxSdk,
  DEFAULT_HIBERNATION_TIMEOUT,
} from "@/lib/codesandbox-sdk"

export const maxDuration = 300

/**
 * GET /api/cron/reap-sandboxes
 *
 * The backstop for CodeSandbox credit burn. Every client-side guard
 * (visibility gate, idle cutoff, hibernate-on-leave) depends on a browser
 * behaving. A crashed tab, a stuck websocket, or a VM started by anything
 * other than the studio UI still bills with nothing in the browser to stop it.
 * This route does not depend on any tab being open.
 *
 * DECISION RULE. CodeSandbox's own SandboxInfo carries no "running since" or
 * uptime field — createdAt/updatedAt describe the CSB-side record, not an
 * active session — so "hibernate anything running longer than N minutes" is
 * not answerable from list() alone. Instead the source of truth is OUR OWN
 * sandboxes.updated_at, which is now a real activity signal: /api/sandbox/touch
 * refreshes it every 5 minutes from an active, visible, non-idle studio tab,
 * and /api/sandbox/connect refreshes it on every start().
 *
 * TWO ACTIONS, AND ONLY TWO:
 *  - inside the grace window  -> updateHibernationTimeout(id, current policy).
 *    Cheap normalisation: list() cannot report a VM's configured timeout, so
 *    this runs unconditionally on live VMs to pull any legacy long timeout
 *    down to the current default. No effect on connectivity.
 *  - past the grace window, or running with no sandboxes row claiming it
 *    -> hibernate(id).
 *
 * shutdown(id) is NEVER called from this automatic path. hibernate pauses and
 * preserves the VM filesystem; /api/sandbox/connect's start() resumes it, and
 * use-sandbox.ts's reconnect logic does that automatically. shutdown destroys.
 * A false-positive hibernate costs the user a few seconds of reconnect UI; a
 * false-positive shutdown would cost them their work. Reserved for manual
 * escalation only.
 */

const DEFAULT_MAX_RUNTIME_MINUTES = 30
/** Bound on pages walked per run, so a pagination bug cannot loop forever. */
const MAX_PAGES = 20
const PAGE_SIZE = 50

function resolveMaxRuntimeMinutes(): number {
  const parsed = Number.parseInt(
    process.env.CSB_REAPER_MAX_RUNTIME_MINUTES ?? "",
    10,
  )
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : DEFAULT_MAX_RUNTIME_MINUTES
}

/**
 * sandboxes.updated_at is a Postgres `timestamp` (no time zone) holding a UTC
 * instant, so PostgREST returns it without a trailing Z. Passed straight to
 * Date.parse it would be read as LOCAL time and skew the age calculation by
 * the host's UTC offset — which on a non-UTC host would either reap live
 * sessions or never reap dead ones. Normalise explicitly.
 */
function parseTimestampUtc(value: unknown): number | null {
  if (typeof value !== "string" || value.length === 0) return null
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(value)
  const parsed = Date.parse(hasZone ? value : `${value}Z`)
  return Number.isNaN(parsed) ? null : parsed
}

type RunningVm = { id: string }

async function listAllRunning(): Promise<RunningVm[]> {
  const found: RunningVm[] = []
  let page: number | null = 1

  for (let i = 0; i < MAX_PAGES && page !== null; i++) {
    const response = await codesandboxSdk.sandbox.list({
      status: "running",
      pagination: { page, pageSize: PAGE_SIZE },
    })
    for (const sandbox of response.sandboxes ?? []) {
      found.push({ id: sandbox.id })
    }
    // Trust nextPage, not hasMore alone: a truthy hasMore with a null nextPage
    // would otherwise re-request page 1 forever.
    page = response.pagination?.nextPage ?? null
  }

  return found
}

type Decision = {
  codesandboxId: string
  action: "hibernate" | "tighten"
  reason: "stale" | "unclaimed" | "active"
  idleMinutes: number | null
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const authHeader = req.headers.get("Authorization")
  // Fails closed, mirroring gen-usage-embeddings: an unset CRON_SECRET rejects
  // every request rather than matching the literal string "Bearer undefined".
  const expectedCronSecret = process.env.CRON_SECRET
  if (!expectedCronSecret || authHeader !== `Bearer ${expectedCronSecret}`) {
    if (!expectedCronSecret) {
      console.error(
        "[sandbox-reaper] CRON_SECRET is not set — rejecting all requests. " +
          "The sandbox reaper will not run until CRON_SECRET is configured on the host.",
      )
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "true"
  const maxRuntimeMinutes = resolveMaxRuntimeMinutes()

  let running: RunningVm[]
  try {
    running = await listAllRunning()
  } catch (error) {
    console.error("[sandbox-reaper] failed to list running sandboxes:", error)
    return NextResponse.json(
      { error: "Failed to list running sandboxes" },
      { status: 502 },
    )
  }

  if (running.length === 0) {
    console.log("[sandbox-reaper] run complete:", {
      dryRun,
      inspected: 0,
      hibernated: 0,
      tightened: 0,
      failures: 0,
      maxRuntimeMinutes,
    })
    return NextResponse.json({
      dryRun,
      inspected: 0,
      hibernated: 0,
      tightened: 0,
      failures: 0,
      maxRuntimeMinutes,
      decisions: [],
    })
  }

  const { data: rows, error: dbError } = await supabaseWithAdminAccess
    .from("sandboxes")
    .select("id, codesandbox_id, updated_at")
    .in(
      "codesandbox_id",
      running.map((vm) => vm.id),
    )

  if (dbError) {
    // Fail closed on a DB error rather than treating every running VM as
    // "unclaimed" and hibernating the entire workspace.
    console.error("[sandbox-reaper] failed to read sandbox rows:", dbError)
    return NextResponse.json(
      { error: "Failed to read sandbox rows" },
      { status: 500 },
    )
  }

  const lastActivityByCsbId = new Map<string, number | null>()
  for (const row of rows ?? []) {
    lastActivityByCsbId.set(
      String(row.codesandbox_id),
      parseTimestampUtc(row.updated_at),
    )
  }

  const now = Date.now()
  const decisions: Decision[] = running.map((vm) => {
    if (!lastActivityByCsbId.has(vm.id)) {
      // Running, but no row in our own table claims it — nothing here will
      // ever refresh an activity signal for it, so it can only bill forever.
      return {
        codesandboxId: vm.id,
        action: "hibernate",
        reason: "unclaimed",
        idleMinutes: null,
      }
    }

    const lastActivity = lastActivityByCsbId.get(vm.id) ?? null
    if (lastActivity === null) {
      return {
        codesandboxId: vm.id,
        action: "hibernate",
        reason: "unclaimed",
        idleMinutes: null,
      }
    }

    const idleMinutes = (now - lastActivity) / 60_000
    if (idleMinutes > maxRuntimeMinutes) {
      return {
        codesandboxId: vm.id,
        action: "hibernate",
        reason: "stale",
        idleMinutes,
      }
    }
    return {
      codesandboxId: vm.id,
      action: "tighten",
      reason: "active",
      idleMinutes,
    }
  })

  if (dryRun) {
    // Short-circuits before any SDK mutation, so "a dry run changes nothing"
    // is structurally enforced rather than merely intended.
    console.log("[sandbox-reaper] dry run:", {
      inspected: running.length,
      wouldHibernate: decisions.filter((d) => d.action === "hibernate").length,
      wouldTighten: decisions.filter((d) => d.action === "tighten").length,
      maxRuntimeMinutes,
    })
    return NextResponse.json({
      dryRun: true,
      inspected: running.length,
      wouldHibernate: decisions.filter((d) => d.action === "hibernate").length,
      wouldTighten: decisions.filter((d) => d.action === "tighten").length,
      maxRuntimeMinutes,
      decisions,
    })
  }

  let hibernated = 0
  let tightened = 0
  let failures = 0
  const hibernatedDetail: Array<{ id: string; reason: string; idleMinutes: number | null }> = []

  for (const decision of decisions) {
    try {
      if (decision.action === "hibernate") {
        await codesandboxSdk.sandbox.hibernate(decision.codesandboxId)
        hibernated++
        hibernatedDetail.push({
          id: decision.codesandboxId,
          reason: decision.reason,
          idleMinutes:
            decision.idleMinutes === null
              ? null
              : Math.round(decision.idleMinutes),
        })
      } else {
        await codesandboxSdk.sandbox.updateHibernationTimeout(
          decision.codesandboxId,
          DEFAULT_HIBERNATION_TIMEOUT,
        )
        tightened++
      }
    } catch (error) {
      // One bad VM must not abort the sweep — the rest still need reaping.
      failures++
      console.error(
        `[sandbox-reaper] ${decision.action} failed for ${decision.codesandboxId}:`,
        error,
      )
    }
  }

  console.log("[sandbox-reaper] run complete:", {
    dryRun: false,
    inspected: running.length,
    hibernated,
    tightened,
    failures,
    maxRuntimeMinutes,
    hibernatedDetail,
  })

  return NextResponse.json({
    dryRun: false,
    inspected: running.length,
    hibernated,
    tightened,
    failures,
    maxRuntimeMinutes,
    hibernatedDetail,
  })
}
