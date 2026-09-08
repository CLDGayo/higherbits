import { describe, expect, it } from "vitest"

import {
  formatTemplateCount,
  formatTemplatePrice,
  templateMatchesSearch,
} from "@/lib/utils/template-display"

describe("formatTemplatePrice", () => {
  it("shows a real price to two decimals", () => {
    expect(formatTemplatePrice(12)).toBe("$12.00")
    expect(formatTemplatePrice(12.5)).toBe("$12.50")
    expect(formatTemplatePrice(1299.99)).toBe("$1299.99")
  })

  it("shows zero as Free rather than $0.00", () => {
    // 0 is the column default, so this is the common case for a free
    // template - "$0.00" reads as a broken price rather than a deliberate one.
    expect(formatTemplatePrice(0)).toBe("Free")
  })

  it("never renders a negative price", () => {
    expect(formatTemplatePrice(-5)).toBe("Free")
  })

  it("survives a non-finite value instead of printing $NaN", () => {
    expect(formatTemplatePrice(NaN)).toBe("Free")
    expect(formatTemplatePrice(Infinity)).toBe("Free")
  })

  it("rounds to two places", () => {
    expect(formatTemplatePrice(9.999)).toBe("$10.00")
  })
})

describe("formatTemplateCount", () => {
  it("separates thousands with spaces, matching the components table", () => {
    expect(formatTemplateCount(1000)).toBe("1 000")
    expect(formatTemplateCount(1234567)).toBe("1 234 567")
  })

  it("leaves small numbers alone", () => {
    expect(formatTemplateCount(0)).toBe("0")
    expect(formatTemplateCount(42)).toBe("42")
  })

  it("treats null and undefined as zero", () => {
    // downloads_count and likes_count are both nullable Int in the schema.
    expect(formatTemplateCount(null)).toBe("0")
    expect(formatTemplateCount(undefined)).toBe("0")
  })
})

describe("templateMatchesSearch", () => {
  const template = {
    name: "Startup Landing",
    description: "A marketing page for SaaS",
    template_slug: "startup-landing",
  }

  it("matches an empty query", () => {
    expect(templateMatchesSearch(template, "")).toBe(true)
    expect(templateMatchesSearch(template, "   ")).toBe(true)
  })

  it("matches name, description and slug, case-insensitively", () => {
    expect(templateMatchesSearch(template, "STARTUP")).toBe(true)
    expect(templateMatchesSearch(template, "saas")).toBe(true)
    expect(templateMatchesSearch(template, "startup-land")).toBe(true)
  })

  it("rejects a non-match", () => {
    expect(templateMatchesSearch(template, "dashboard")).toBe(false)
  })

  it("survives a template with no description", () => {
    // description is nullable.
    expect(
      templateMatchesSearch(
        { name: "Bare", description: null, template_slug: "bare" },
        "bare",
      ),
    ).toBe(true)
    expect(
      templateMatchesSearch(
        { name: null, description: null, template_slug: null },
        "x",
      ),
    ).toBe(false)
  })
})
