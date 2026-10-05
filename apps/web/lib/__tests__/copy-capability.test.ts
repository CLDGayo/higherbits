import { expect, it, vi } from "vitest"
const query = vi.hoisted(() => ({ from: vi.fn() }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: query }))
vi.mock("../api/server/copy-source", () => ({}))
import { readCopyCapability } from "../api/server/copy-capability"
it("rejects anonymous and malformed capabilities before touching storage", async () => {
  for (const token of [null, "", "Bearer key", "../../source", "a".repeat(44)]) await expect(readCopyCapability(token)).rejects.toMatchObject({ status: 401 })
  expect(query.from).not.toHaveBeenCalled()
})
