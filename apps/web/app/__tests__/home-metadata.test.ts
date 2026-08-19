import { describe, it, expect } from "vitest"
import type { Metadata } from "next"

// Phase 04 (supabase-interconnect) Step B1a / Execute-Agent Instruction E2.
// `/templates` no longer serves a body, so its SEO metadata moved onto the home
// route's `generateMetadata({ searchParams })` branch. These assertions prove the
// branch exists and that the default (no-tab) metadata is unaffected.
import { generateMetadata } from "../page"

const params = (tab?: string) => ({
  searchParams: Promise.resolve(tab ? { tab } : {}),
})

// Both branches now set `title` as `{ absolute }` so the root layout's
// `%s | HigherBits.dev` template does not append the brand a second time.
// `String()` on that object yields "[object Object]", so unwrap it first.
const titleText = (title: Metadata["title"]) =>
  typeof title === "object" && title !== null && "absolute" in title
    ? String(title.absolute)
    : String(title)

describe("home route generateMetadata", () => {
  it("returns the templates SEO metadata when tab=templates", async () => {
    const meta = await generateMetadata(params("templates"))

    expect(titleText(meta.title)).toContain("shadcn/ui Templates Collection")
    expect(meta.description).toContain("Collection of crafted website templates")
    expect(meta.openGraph?.title).toContain("shadcn/ui Templates Collection")
    expect(meta.keywords).toEqual(
      expect.arrayContaining(["website templates", "shadcn/ui templates"]),
    )
    // Root layout template is `%s | HigherBits.dev`; `absolute` opts out of it,
    // so the brand must appear exactly once in the final title.
    expect(titleText(meta.title).match(/HigherBits\.dev/g)).toHaveLength(1)
  })

  it("returns the default site metadata (with WebSite JSON-LD) when no tab is set", async () => {
    const meta = await generateMetadata(params())

    expect(titleText(meta.title)).not.toContain("Templates Collection")
    // JSON-LD is no longer smuggled through `metadata.other` - that only ever
    // rendered `<meta name="script:ld+json">`, which no parser reads. It is now
    // emitted from the page body as a real <script type="application/ld+json">.
    expect(meta.other?.["script:ld+json"]).toBeUndefined()
  })

  it("returns the default site metadata for an unrelated tab", async () => {
    const meta = await generateMetadata(params("components"))

    expect(titleText(meta.title)).not.toContain("Templates Collection")
    expect(meta.other?.["script:ld+json"]).toBeUndefined()
  })
})
