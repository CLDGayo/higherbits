import { afterEach, describe, expect, it, vi } from "vitest"
import { fetchFileTextContent } from "../fetchFileTextContent"

describe("fetchFileTextContent", () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    "/* compiled Tailwind / CSS */\n.ghl-component-wrapper{width:100%}",
    "// component source starts with a comment\nexport default function Component() {}",
  ])("returns inline source %s instead of treating it as a URL", async (source) => {
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)

    await expect(fetchFileTextContent(source)).resolves.toEqual({ data: source, error: null })
    expect(fetch).not.toHaveBeenCalled()
  })

  it.each(["/auto-index/component.css", "//cdn.example.com/component.css"])("still fetches asset URL %s", async (url) => {
    const fetch = vi.fn().mockResolvedValue(new Response("asset content"))
    vi.stubGlobal("fetch", fetch)

    await expect(fetchFileTextContent(url)).resolves.toEqual({
      data: "asset content",
      error: null,
    })
    expect(fetch).toHaveBeenCalledWith(url, {
      next: { revalidate: 3600 },
    })
  })
})
