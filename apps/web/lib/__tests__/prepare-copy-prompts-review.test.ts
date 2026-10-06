import { beforeEach, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ auth: vi.fn(), prepare: vi.fn(), generate: vi.fn(), rpc: vi.fn() }))
vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }))
vi.mock("@/lib/api/server/copy-source", () => ({ prepareCopySource: mocks.prepare }))
vi.mock("@/lib/review-copy-prompts", () => ({ generateReviewCopyPrompts: mocks.generate }))
vi.mock("@/lib/ghl-generator", () => ({ computeGhlSourceFingerprint: () => "ghl-fingerprint" }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: { rpc: mocks.rpc } }))
import { POST } from "@/app/api/sandbox/prepare-copy-prompts-review/route"

const request = () => new Request("http://localhost/api/sandbox/prepare-copy-prompts-review", {
  method: "POST", body: JSON.stringify({ demoId: 2 }), headers: { "content-type": "application/json" },
})
beforeEach(() => {
  vi.clearAllMocks()
  mocks.auth.mockResolvedValue({ userId: "owner" })
  mocks.prepare.mockResolvedValue({ component: { registry: "ui" }, demo: { ghl_source_fingerprint: "ghl-fingerprint" }, source: { code: "code", demoCode: "demo" } })
  mocks.generate.mockResolvedValue({ prompts: { codex: "saved" }, fingerprint: "fingerprint" })
  mocks.rpc.mockResolvedValue({ data: true, error: null })
})

it("saves pre-generated prompts for the verified owner before review", async () => {
  const response = await POST(request())
  expect(response.status).toBe(200)
  expect(mocks.prepare).toHaveBeenCalledWith("owner", { demoId: 2 }, true)
  expect(mocks.rpc).toHaveBeenCalledWith("save_creator_review_copy_prompts", {
    p_user_id: "owner", p_demo_id: 2, p_source_fingerprint: "fingerprint",
    p_ghl_fingerprint: "ghl-fingerprint", p_prompts: { codex: "saved" },
  })
})

it("does not save when source changed or the free model fails", async () => {
  mocks.prepare.mockResolvedValueOnce({ component: { registry: "ui" }, demo: { ghl_source_fingerprint: "stale" }, source: { code: "code", demoCode: "demo" } })
  expect((await POST(request())).status).toBe(409)
  mocks.generate.mockRejectedValueOnce(new Error("quota"))
  expect((await POST(request())).status).toBe(503)
  expect(mocks.rpc).not.toHaveBeenCalled()
})
