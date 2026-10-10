import { expect, it, vi } from "vitest"

const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }))
vi.mock("@/lib/auto-index/reviewer-database", () => ({
  getAutoIndexReviewerDatabase: () => ({ $queryRaw: queryRaw }),
}))

import { POST } from "@/app/api/admin/auto-index/publish/route"

it("only permits the bearer route to finalize one previously reviewed decision ID", async () => {
  vi.stubEnv("AUTO_INDEX_INTERNAL_TOKEN", "internal-token-for-test")
  queryRaw.mockResolvedValueOnce([{ component_id: 88 }])

  const response = await POST(new Request("http://localhost/api/admin/auto-index/publish", {
    method: "POST",
    headers: { authorization: "Bearer internal-token-for-test", "content-type": "application/json" },
    body: JSON.stringify({ decisionId: "12" }),
  }))

  expect(response.status).toBe(200)
  expect(await response.json()).toEqual({ decisionId: "12", componentId: 88, status: "published" })
  expect(queryRaw).toHaveBeenCalledTimes(1)

  const forged = await POST(new Request("http://localhost/api/admin/auto-index/publish", {
    method: "POST",
    headers: { authorization: "Bearer internal-token-for-test", "content-type": "application/json" },
    body: JSON.stringify({ decisionId: "12", slug: "forged", outcome: "approved" }),
  }))
  expect(forged.status).toBe(400)
  expect(queryRaw).toHaveBeenCalledTimes(1)
})
