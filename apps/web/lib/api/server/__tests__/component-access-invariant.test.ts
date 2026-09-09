/**
 * Pins the invariant that makes the /api/bundle ownership fix necessary.
 *
 * hasUserComponentAccess returns TRUE for an anonymous caller on a FREE
 * component. That is correct and deliberate — three read paths depend on it so
 * that logged-out visitors can view free components:
 *   app/[username]/[component_slug]/page.tsx
 *   app/@modal/(...)[username]/[component_slug]/[demo_slug]/page.tsx
 *   app/api/r/[username]/[component_slug]/route.ts
 *
 * It is also a trap. It reads like an authorization check, so it was used to
 * gate the rebuild-and-persist path in /api/bundle, which overwrites the
 * bundle_html_url every visitor sees — letting an anonymous caller replace the
 * shared preview of any free demo.
 *
 * The fix belongs at that caller (an explicit isOwner check), NOT here:
 * reordering the !userId check above the !isPaid check would close the bundle
 * hole and simultaneously deny every logged-out visitor every free component.
 *
 * If a future refactor "tidies" that ordering, the first case below fails and
 * says why.
 */
import { beforeEach, describe, expect, it, vi } from "vitest"

const isComponentPaid = vi.fn()
const getPurchasesWithBundles = vi.fn(async () => [])
const planFindUnique = vi.fn(async () => null)
const bundlesFindMany = vi.fn(async () => [])

vi.mock("server-only", () => ({}))
vi.mock("../bundle_purchases", () => ({
  isComponentPaid: (id: number) => isComponentPaid(id),
  getPurchasesWithBundles: (uid: string) => getPurchasesWithBundles(uid),
}))
vi.mock("../../../prisma", () => ({
  default: {
    users_to_plans: { findUnique: () => planFindUnique() },
    bundles: { findMany: () => bundlesFindMany() },
  },
}))

const load = async () => (await import("../components")).hasUserComponentAccess

describe("hasUserComponentAccess — load-bearing invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    planFindUnique.mockResolvedValue(null as never)
    bundlesFindMany.mockResolvedValue([] as never)
    getPurchasesWithBundles.mockResolvedValue([] as never)
  })

  it("grants an ANONYMOUS caller access to a FREE component (do not reorder)", async () => {
    isComponentPaid.mockResolvedValue(false as never)
    const hasUserComponentAccess = await load()

    await expect(hasUserComponentAccess(null, 1)).resolves.toBe(true)
  })

  it("denies an anonymous caller a PAID component", async () => {
    isComponentPaid.mockResolvedValue(true as never)
    const hasUserComponentAccess = await load()

    await expect(hasUserComponentAccess(null, 1)).resolves.toBe(false)
  })

  it("denies a signed-in user with no plan and no purchase a PAID component", async () => {
    isComponentPaid.mockResolvedValue(true as never)
    const hasUserComponentAccess = await load()

    await expect(hasUserComponentAccess("user_1", 1)).resolves.toBe(false)
  })
})
