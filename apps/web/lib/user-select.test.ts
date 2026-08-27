import { readFileSync, readdirSync, statSync } from "node:fs"
import { join } from "node:path"

import { describe, expect, it } from "vitest"

import { PUBLIC_USER_COLUMNS } from "./user-select"

/**
 * Regression guard for the PII-in-RSC-payload defect.
 *
 * `users!<fk>(*)` hangs a full author row off a `demos`/`components` result.
 * Those results are passed as props into `"use client"` components, so React
 * serialises them into the RSC flight payload — which ships inside the HTML of
 * pages anonymous visitors can `curl`. Measured before the fix: `/{username}`
 * served a real user's `email`, `paypal_email`, `stripe_id` and `is_admin` to
 * logged-out visitors, and `/` staged 112 such records.
 *
 * An EMBED is always somebody else's row shown to a viewer, so `(*)` on one is
 * never legitimate — unlike a standalone `.from("users").select("*")`, which is
 * correct for an owner-scoped self-lookup and is deliberately not matched here.
 */
const PRIVATE_USER_COLUMNS = [
  "email",
  "paypal_email",
  "stripe_id",
  "is_admin",
  "role",
  "bundles_fee",
  "ref",
] as const

const ROOTS = ["app", "components", "lib"]
const EMBED_STAR = /users!\w+\s*\(\s*\*\s*\)/

function sourceFiles(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith(".")) continue // generated output, vcs, caches
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) sourceFiles(full, acc)
    else if (/\.(ts|tsx)$/.test(entry) && !full.includes("user-select.test"))
      acc.push(full)
  }
  return acc
}

describe("public user column allowlist", () => {
  it("excludes every private column", () => {
    const cols = PUBLIC_USER_COLUMNS.split(",").map((c) => c.trim())
    for (const col of PRIVATE_USER_COLUMNS) {
      expect(cols).not.toContain(col)
    }
  })

  it("never selects (*) on an embedded author row", () => {
    const offenders = ROOTS.flatMap((r) => sourceFiles(r)).filter((f) =>
      EMBED_STAR.test(readFileSync(f, "utf-8")),
    )
    expect(offenders).toEqual([])
  })
})
