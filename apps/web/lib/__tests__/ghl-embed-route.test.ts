import { beforeEach, expect, it, vi } from "vitest"

const state = vi.hoisted(() => ({ public: true, status: "posted" }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: {
  from(table: string) {
    const data = table === "demos"
      ? { component_id: 7, ghl_html_content: '<div>Earth<script>const sun = 0;</script></div>' }
      : table === "components" ? { is_public: state.public, registry: "ui" }
      : { status: state.status }
    const query = { select: () => query, eq: () => query, maybeSingle: async () => ({ data, error: null }) }
    return query
  },
} }))

import { GET } from "@/app/api/ghl-embed/[demoId]/route"

beforeEach(() => { state.public = true; state.status = "posted" })

it("serves approved runtime code only in an isolated frame and applies controls", async () => {
  const token = Buffer.from(JSON.stringify({ sun: 25 })).toString("base64url")
  const response = await GET(new Request(`https://higherbits.dev/api/ghl-embed/8?controls=${token}`),
    { params: Promise.resolve({ demoId: "8" }) })
  expect(response.status).toBe(200)
  expect(response.headers.get("content-security-policy")).toBe("sandbox allow-scripts; frame-ancestors https:")
  expect(await response.text()).toContain("const sun = 25")
})

it("does not expose private or unreviewed demos", async () => {
  state.public = false
  expect((await GET(new Request("https://higherbits.dev/api/ghl-embed/8"),
    { params: Promise.resolve({ demoId: "8" }) })).status).toBe(404)
  state.public = true; state.status = "on_review"
  expect((await GET(new Request("https://higherbits.dev/api/ghl-embed/8"),
    { params: Promise.resolve({ demoId: "8" }) })).status).toBe(404)
})

it("rejects nested control values that could become executable source", async () => {
  const token = Buffer.from(JSON.stringify({ sun: ["0;fetch('https://evil.invalid')//"] })).toString("base64url")
  const response = await GET(new Request(`https://higherbits.dev/api/ghl-embed/8?controls=${token}`),
    { params: Promise.resolve({ demoId: "8" }) })
  expect(response.status).toBe(400)
})
