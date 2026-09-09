/**
 * Audit blocker B2 (code half): paid component source must not reach
 * non-purchasers through the component detail page's props.
 *
 * Two directions are pinned here, and BOTH matter:
 *
 *  (a) hasPurchased === false  -> tailwindConfig / globalCss / registryDependencies
 *      are handed to <ComponentPage> as "" / "" / {}, and component.registry_url
 *      is blanked in the !hasPurchased mutation block.
 *
 *  (b) A FREE component fetched by an ANONYMOUS caller must still be fully
 *      populated. hasUserComponentAccess(null, freeComponent) returns true, so
 *      the gates above take their populated branch. A "fix" that gated on
 *      userId / sign-in state instead of hasPurchased would deny every
 *      logged-out visitor every free component — the regression class already
 *      documented in component-access-invariant.test.ts. Case (b) fails loudly
 *      if that is reintroduced.
 *
 * The gates live inline in a server component (app/[username]/[component_slug]/
 * page.tsx), which cannot be unit-rendered without an RSC harness, so the gate
 * expressions are pinned against the shipped source text. The access decision
 * they key on is exercised for real.
 */
import fs from "node:fs"
import path from "node:path"
import { beforeEach, describe, expect, it, vi } from "vitest"

const isComponentPaid = vi.fn()
const getPurchasesWithBundles = vi.fn(async (_userId: string) => [] as unknown[])
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

const PAGE_PATH = path.join(
  __dirname,
  "../../../../app/[username]/[component_slug]/page.tsx",
)
const pageSource = fs.readFileSync(PAGE_PATH, "utf-8")

const normalized = pageSource.replace(/\s+/g, " ")

describe("B2 prop gating — paid source never reaches non-purchasers", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    planFindUnique.mockResolvedValue(null as never)
    bundlesFindMany.mockResolvedValue([] as never)
    getPurchasesWithBundles.mockResolvedValue([] as never)
  })

  it("(a) blanks tailwindConfig, globalCss and registryDependencies when hasPurchased is false", () => {
    expect(normalized).toContain(
      'tailwindConfig={hasPurchased ? (tailwindConfigResult?.data as string) : ""}',
    )
    expect(normalized).toContain(
      'globalCss={hasPurchased ? (globalCssResult?.data as string) : ""}',
    )
    expect(normalized).toContain(
      "registryDependencies={hasPurchased ? registryDependenciesFiles : {}}",
    )
  })

  it("(a) blanks component.registry_url inside the !hasPurchased block", () => {
    const block = normalized.match(/if \(!hasPurchased\) \{(.*?)\}/)
    expect(block, "the !hasPurchased mutation block must still exist").toBeTruthy()
    expect(block![1]).toContain('component.registry_url = ""')
    expect(block![1]).toContain('component.code = ""')
  })

  it("(b) a FREE component is granted to an ANONYMOUS caller, so the gates stay populated", async () => {
    isComponentPaid.mockResolvedValue(false as never)
    const hasUserComponentAccess = await load()

    const hasPurchased = await hasUserComponentAccess(null, 1)
    expect(
      hasPurchased,
      "free components must remain accessible to logged-out visitors",
    ).toBe(true)

    // With hasPurchased === true every gate takes its populated branch.
    const gated = {
      tailwindConfig: hasPurchased ? "tailwind.config contents" : "",
      globalCss: hasPurchased ? "globals.css contents" : "",
      registryDependencies: hasPurchased ? { "a.tsx": "code" } : {},
    }
    expect(gated.tailwindConfig).toBe("tailwind.config contents")
    expect(gated.globalCss).toBe("globals.css contents")
    expect(gated.registryDependencies).toEqual({ "a.tsx": "code" })
  })

  it("(b) the gates key on hasPurchased, never on userId or sign-in state", () => {
    for (const prop of ["tailwindConfig=", "globalCss=", "registryDependencies="]) {
      const idx = normalized.indexOf(prop)
      expect(idx, `${prop} must exist in page.tsx`).toBeGreaterThan(-1)
      const expr = normalized.slice(idx, idx + 90)
      expect(expr).toContain("hasPurchased ?")
      expect(expr).not.toContain("userId")
    }
    // The !hasPurchased blanking block must not be re-keyed either.
    expect(normalized).not.toContain("if (!userId) { component.code")
  })

  it("(c) compiledCss and tailwind4IndexCss remain UNGATED (deliberate non-goal)", () => {
    expect(normalized).toContain(
      "compiledCss={compiledCssResult?.data as string}",
    )
    expect(normalized).toContain(
      "tailwind4IndexCss={indexCssResult?.data as string}",
    )
  })
})
