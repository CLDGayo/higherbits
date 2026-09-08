import { readFileSync } from "fs"
import { join } from "path"
import { describe, expect, it } from "vitest"

import {
  countByTab,
  filterByTab,
  matchesSearch,
  resolveStatus,
  statusLabel,
  statusPillClass,
} from "../ui/component-status"
import { transformDemoResult } from "@/lib/utils/transformData"

const row = (submission_status: string | null | undefined) => ({
  submission_status,
})

describe("resolveStatus", () => {
  it("passes through every database enum member", () => {
    for (const status of ["on_review", "featured", "posted", "rejected"]) {
      expect(resolveStatus(row(status))).toBe(status)
    }
  })

  it("passes through the JS-synthesized draft sentinel", () => {
    expect(resolveStatus(row("draft"))).toBe("draft")
  })

  it("reports a missing submission as 'none', never 'featured'", () => {
    // The regression this whole module exists to prevent: the list RPC LEFT
    // JOINs submissions, so a never-submitted component arrives NULL. It used
    // to render as a green "Featured" pill to its owner.
    expect(resolveStatus(row(null))).toBe("none")
    expect(resolveStatus(row(undefined))).toBe("none")
    expect(resolveStatus(row(""))).toBe("none")
    expect(resolveStatus({})).toBe("none")
  })

  it("does not swallow an enum member added ahead of this file", () => {
    expect(resolveStatus(row("withdrawn"))).toBe("withdrawn")
    expect(statusLabel("withdrawn")).toBe("Withdrawn")
    expect(statusPillClass("withdrawn")).toBe(statusPillClass("none"))
  })
})

describe("statusLabel", () => {
  it("renames rejected to the creator-facing wording", () => {
    expect(statusLabel("rejected")).toBe("Needs changes")
  })

  it("labels the absence of a submission honestly", () => {
    expect(statusLabel("none")).toBe("No submission")
  })

  it("keeps posted reading as Published", () => {
    expect(statusLabel("posted")).toBe("Published")
  })
})

describe("tab predicates", () => {
  const rows = [
    row("on_review"),
    row("on_review"),
    row("rejected"),
    row("draft"),
    row("featured"),
    row("posted"),
    row(null), // never submitted
  ]

  it("All is a true no-op filter", () => {
    expect(filterByTab(rows, "all")).toHaveLength(rows.length)
  })

  it("In review matches on_review only", () => {
    expect(filterByTab(rows, "in_review")).toEqual([
      row("on_review"),
      row("on_review"),
    ])
  })

  it("Needs changes matches rejected only", () => {
    expect(filterByTab(rows, "needs_changes")).toEqual([row("rejected")])
  })

  it("Drafts matches the synthesized draft sentinel only", () => {
    expect(filterByTab(rows, "drafts")).toEqual([row("draft")])
  })

  it("never routes a never-submitted row into a moderation tab", () => {
    for (const tab of ["in_review", "needs_changes", "drafts"] as const) {
      expect(filterByTab([row(null)], tab)).toHaveLength(0)
    }
    expect(filterByTab([row(null)], "all")).toHaveLength(1)
  })
})

describe("countByTab", () => {
  it("counts every tab in one pass", () => {
    const counts = countByTab([
      row("on_review"),
      row("on_review"),
      row("rejected"),
      row("draft"),
      row("featured"),
      row("posted"),
      row(null),
    ])

    expect(counts).toEqual({
      all: 7,
      in_review: 2,
      needs_changes: 1,
      drafts: 1,
    })
  })

  it("returns zeroes for an empty account rather than throwing", () => {
    expect(countByTab([])).toEqual({
      all: 0,
      in_review: 0,
      needs_changes: 0,
      drafts: 0,
    })
  })

  it("All legitimately exceeds the sum of the other tabs", () => {
    // featured/posted rows have no tab of their own. This is correct, and it is
    // the arithmetic most likely to be misread as a bug.
    const counts = countByTab([row("featured"), row("posted"), row("draft")])
    expect(counts.all).toBe(3)
    expect(counts.in_review + counts.needs_changes + counts.drafts).toBe(1)
  })

  it("counts demos, not components, when one component has several demos", () => {
    // `submissions` is keyed component_id @unique while the list RPC returns one
    // row per demo, so N demos of one component contribute N identical statuses.
    const counts = countByTab([
      row("on_review"),
      row("on_review"),
      row("on_review"),
    ])
    expect(counts.in_review).toBe(3)
  })
})

describe("matchesSearch", () => {
  const demo = {
    name: "Animated demo",
    component: { name: "Gradient Button", component_slug: "gradient-button" },
  }

  it("matches an empty query", () => {
    expect(matchesSearch(demo, "")).toBe(true)
    expect(matchesSearch(demo, "   ")).toBe(true)
  })

  it("matches component name, demo name and slug, case-insensitively", () => {
    expect(matchesSearch(demo, "gradient")).toBe(true)
    expect(matchesSearch(demo, "ANIMATED")).toBe(true)
    expect(matchesSearch(demo, "gradient-but")).toBe(true)
  })

  it("rejects a non-match", () => {
    expect(matchesSearch(demo, "carousel")).toBe(false)
  })

  it("survives a draft row with no component", () => {
    expect(matchesSearch({ name: "Untitled", component: null }, "unti")).toBe(
      true,
    )
    expect(matchesSearch({ name: null, component: null }, "x")).toBe(false)
  })
})

describe("the 'featured' fallback is gone", () => {
  it("transformDemoResult preserves a null submission_status", () => {
    const transformed = transformDemoResult({
      id: 1,
      name: "demo",
      component_data: { id: 7 },
      // submission_status deliberately absent - the LEFT JOIN miss
    })

    expect(transformed.submission_status).toBeNull()
    expect(resolveStatus(transformed)).toBe("none")
  })

  it("neither layer reintroduces the default", () => {
    // The coercion used to be applied twice - once in the transform and again
    // in the table's own accessor and cell. Both must stay gone or the honest
    // status silently reverts.
    const sources = [
      "lib/utils/transformData.ts",
      "components/features/studio/ui/components-table.tsx",
    ]

    for (const relative of sources) {
      const source = readFileSync(
        join(process.cwd(), relative),
        "utf8",
      )
      expect(source, `${relative} reintroduced the fallback`).not.toMatch(
        /\|\|\s*"featured"/,
      )
    }
  })
})
