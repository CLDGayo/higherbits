import { describe, expect, it, vi } from "vitest"

// The hook reaches for a server action at module load; the pure transform under
// test does not, but the import graph still has to resolve.
vi.mock("@/lib/api/artifacts", () => ({
  isArtifactSlugAvailableAction: vi.fn(async () => true),
}))
vi.mock("@/lib/clerk", () => ({ useClerkSupabaseClient: () => ({}) }))

import { makeSlugFromName } from "../use-artifact-slug"

describe("makeSlugFromName reused for artifacts", () => {
  it("lowercases and hyphenates a display name", () => {
    expect(makeSlugFromName("Midnight Blue")).toBe("midnight-blue")
  })

  it("splits camelCase, which is why it is reused rather than rewritten", () => {
    expect(makeSlugFromName("MidnightBlue")).toBe("midnight-blue")
  })

  it("collapses punctuation and runs of separators", () => {
    expect(makeSlugFromName("Sunset  ///  Glow!!")).toBe("sunset-glow")
  })

  it("trims leading and trailing separators", () => {
    expect(makeSlugFromName("  -- Neon --  ")).toBe("neon")
  })

  it("produces a slug the table's constraint pattern accepts", () => {
    const pattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
    for (const name of [
      "Midnight Blue",
      "MidnightBlue",
      "Sunset  ///  Glow!!",
      "theme 2",
    ]) {
      expect(makeSlugFromName(name)).toMatch(pattern)
    }
  })

  it("returns empty for a name with nothing sluggable, rather than a stray hyphen", () => {
    // The hook treats "" as idle rather than invalid, so this must not come
    // back as "-" or the field would report an error the user cannot act on.
    expect(makeSlugFromName("!!!")).toBe("")
  })
})
