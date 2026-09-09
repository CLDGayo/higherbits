/**
 * The URL -> key mapping is what decides whether a read is signed. If it stops
 * recognising the private prefix, reads silently fall back to an unsigned fetch
 * and the paywall quietly stops working once the CDN starts refusing `src/`.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))

const CDN = "https://cdn.example.com"

const load = async () => {
  vi.resetModules()
  process.env.NEXT_PUBLIC_CDN_URL = CDN
  return import("../r2-read")
}

describe("r2-read URL mapping", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("maps a CDN URL back to its bucket key", async () => {
    const { cdnUrlToKey } = await load()
    expect(cdnUrlToKey(`${CDN}/src/alice/my-card/code.tsx`)).toBe(
      "src/alice/my-card/code.tsx",
    )
  })

  it("returns null for a URL from another origin", async () => {
    const { cdnUrlToKey } = await load()
    expect(cdnUrlToKey("https://elsewhere.example/src/a/b.tsx")).toBeNull()
  })

  it("returns null when the URL is exactly the CDN root", async () => {
    const { cdnUrlToKey } = await load()
    expect(cdnUrlToKey(`${CDN}/`)).toBeNull()
  })

  it("treats only the source prefix as private", async () => {
    const { isPrivateSourceKey } = await load()
    expect(isPrivateSourceKey("src/alice/my-card/code.tsx")).toBe(true)
    // these must stay publicly readable — previews and bundles are iframe/img srcs
    expect(isPrivateSourceKey("alice/my-card/preview.png")).toBe(false)
    expect(isPrivateSourceKey("bundled/123.html")).toBe(false)
  })

  it("round-trips: a key the publish flow writes is one the reader signs", async () => {
    const { isPrivateSourceKey, cdnUrlToKey } = await load()
    const { sourceKey } = await import("../r2-paths")

    // exactly the shapes the four publish flows produce
    for (const raw of [
      "alice/my-card/code.tsx",
      "alice/my-card/hero/code.demo.tsx",
      "alice/my-card/tailwind.config.js",
      "alice/my-card/globals.css",
      "user_2abc/my-card/code.1757000000000.tsx",
    ]) {
      const key = sourceKey(raw)
      expect(isPrivateSourceKey(key)).toBe(true)
      expect(cdnUrlToKey(`${CDN}/${key}`)).toBe(key)
    }
  })

  it("sourceKey does not double-prefix", async () => {
    const { sourceKey } = await import("../r2-paths")
    expect(sourceKey(sourceKey("a/b/code.tsx"))).toBe("src/a/b/code.tsx")
  })
})
