/**
 * Pins the invariant that makes the /api/bundle ownership fix necessary.
 *
 * hasUserComponentAccess returns TRUE for an anonymous caller on a FREE
 * component. That is correct and deliberate — page read paths depend on it so
 * that logged-out visitors can view free components:
 *   app/[username]/[component_slug]/page.tsx
 *   app/@modal/(...)[username]/[component_slug]/[demo_slug]/page.tsx
 * The registry convenience export separately requires a Phase B copy grant;
 * this entitlement helper alone is not its caller-authentication boundary.
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
const getPurchasesWithBundles = vi.fn(async (_userId: string) => [] as unknown[])
const planFindUnique = vi.fn(async () => null)
const bundlesFindMany = vi.fn(async () => [])
const componentFindUnique = vi.fn(async () => null)
const componentUpdate = vi.fn()
const demoFindMany = vi.fn()
const demoUpdate = vi.fn()

vi.mock("server-only", () => ({}))
vi.mock("../bundle_purchases", () => ({
  isComponentPaid: (id: number) => isComponentPaid(id),
  getPurchasesWithBundles: (uid: string) => getPurchasesWithBundles(uid),
}))
vi.mock("../../../prisma", () => ({
  default: {
    components: { findUnique: () => componentFindUnique(), update: () => componentUpdate() },
    demos: { findMany: () => demoFindMany(), update: () => demoUpdate() },
    users_to_plans: { findUnique: () => planFindUnique() },
    bundles: { findMany: () => bundlesFindMany() },
  },
}))
vi.mock("@/lib/admin", () => ({
  checkIsAdmin: vi.fn(async () => ({ isAdmin: false, error: null })),
}))

const load = async () => (await import("../components")).hasUserComponentAccess

describe("hasUserComponentAccess — load-bearing invariants", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    componentFindUnique.mockResolvedValue(null as never)
    planFindUnique.mockResolvedValue(null as never)
    bundlesFindMany.mockResolvedValue([] as never)
    getPurchasesWithBundles.mockResolvedValue([] as never)
  })

  it("grants an ANONYMOUS caller access to a FREE component (do not reorder)", async () => {
    isComponentPaid.mockResolvedValue(false as never)
    const hasUserComponentAccess = await load()

    await expect(hasUserComponentAccess(null, 1)).resolves.toBe(true)
  })

  it("rejects generic transfer of an auto-indexed component before changing demos", async () => {
    componentFindUnique.mockResolvedValueOnce({ registry: "auto-index" } as never)
    const { transferOwnership } = await import("../components")
    await expect(transferOwnership(41, "user_creator")).rejects.toThrow("verified creator claim")
    expect(componentUpdate).not.toHaveBeenCalled()
    expect(demoUpdate).not.toHaveBeenCalled()
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
