import { describe, it, expect } from "vitest"

// Phase 04 (supabase-interconnect) Step B1a / Execute-Agent Instruction E2.
// `/templates` no longer serves a body, so its SEO metadata moved onto the home
// route's `generateMetadata({ searchParams })` branch. These assertions prove the
// branch exists and that the default (no-tab) metadata is unaffected.
import { generateMetadata } from "../page"

const params = (tab?: string) => ({
  searchParams: Promise.resolve(tab ? { tab } : {}),
})

describe("home route generateMetadata", () => {
  it("returns the templates SEO metadata when tab=templates", async () => {
    const meta = await generateMetadata(params("templates"))

    expect(String(meta.title)).toContain("shadcn/ui Templates Collection")
    expect(meta.description).toContain("Collection of crafted website templates")
    expect(meta.openGraph?.title).toContain("shadcn/ui Templates Collection")
    expect(meta.keywords).toEqual(
      expect.arrayContaining(["website templates", "shadcn/ui templates"]),
    )
  })

  it("returns the default site metadata (with WebSite JSON-LD) when no tab is set", async () => {
    const meta = await generateMetadata(params())

    expect(String(meta.title)).not.toContain("Templates Collection")
    // JSON-LD is only emitted on the default branch.
    const jsonLd = meta.other?.["script:ld+json"]
    expect(typeof jsonLd).toBe("string")
    expect(JSON.parse(jsonLd as string)["@type"]).toBe("WebSite")
  })

  it("returns the default site metadata for an unrelated tab", async () => {
    const meta = await generateMetadata(params("components"))

    expect(String(meta.title)).not.toContain("Templates Collection")
    expect(meta.other?.["script:ld+json"]).toBeDefined()
  })
})
