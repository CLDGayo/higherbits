import { describe, it, expect } from "vitest"
import { readFileSync } from "node:fs"
import { join } from "node:path"

// Phase 04 (supabase-interconnect) Step C1 / Execute-Agent Instruction E3.
// `/public-dashboard` and `/import-old` are intentionally absent from the main nav.
// This turns SPEC AC9's "regression check" language into a literal mechanical check:
// if someone strips the marker comment, this fails rather than silently drifting.
const MARKER = "INTENTIONALLY-UNLINKED INTERNAL ROUTE"

const ORPHAN_ROUTES = [
  "public-dashboard/page.tsx",
  "import-old/page.tsx",
] as const

describe("intentionally-unlinked internal routes stay documented", () => {
  it.each(ORPHAN_ROUTES)("%s carries the orphan-route marker comment", (rel) => {
    const source = readFileSync(join(__dirname, "..", rel), "utf8")
    expect(source).toContain(MARKER)
  })
})
