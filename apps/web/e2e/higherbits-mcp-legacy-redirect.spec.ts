import { expect, test } from "@playwright/test"

test("legacy MCP page URLs permanently redirect to HigherBits MCP", async ({
  request,
}) => {
  const cases = [
    ["/magic?source=legacy", "/higherbits-mcp", "?source=legacy"],
    [
      "/magic/console?source=legacy",
      "/higherbits-mcp/console",
      "?source=legacy",
    ],
    [
      "/magic/get-started?source=legacy",
      "/higherbits-mcp/onboarding",
      "?source=legacy",
    ],
  ] as const

  for (const [path, expectedPath, expectedSearch] of cases) {
    const response = await request.get(path, { maxRedirects: 0 })
    const destination = new URL(response.headers().location!, response.url())

    expect(response.status()).toBe(308)
    expect(destination.pathname).toBe(expectedPath)
    expect(destination.search).toBe(expectedSearch)
  }
})

for (const [legacyPath, expectedPath] of [
  ["/magic", "/higherbits-mcp"],
  ["/magic/console", "/higherbits-mcp/console"],
  ["/magic/get-started", "/higherbits-mcp/onboarding"],
] as const) {
  test(`${legacyPath} preserves encoded values, repeated keys and all query parameters`, async ({ request }) => {
    const query = "?source=legacy&next=%2Fcomponents%3Ftab%3Dnew%26sort%3Dpopular&tag=ui%2Fforms&tag=buttons&label=caf%C3%A9%20%26%20tea&literal=%2B%25%3D&empty="
    const response = await request.get(`${legacyPath}${query}`, { maxRedirects: 0 })

    expect(response.status()).toBe(308)
    expect(response.headers().location).toBeTruthy()
    const destination = new URL(response.headers().location!, response.url())
    expect(destination.pathname).toBe(expectedPath)
    expect(destination.searchParams.toString()).toBe(new URLSearchParams(query).toString())
    expect([...destination.searchParams.entries()]).toEqual([
      ["source", "legacy"],
      ["next", "/components?tab=new&sort=popular"],
      ["tag", "ui/forms"],
      ["tag", "buttons"],
      ["label", "café & tea"],
      ["literal", "+%="],
      ["empty", ""],
    ])
  })
}
