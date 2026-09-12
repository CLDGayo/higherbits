import { describe, expect, it, vi } from "vitest"

import { getComponentWithDemo, getComponentWithDemoForOG } from "@/lib/queries"

const USER_ROW = { id: "user-1", username: "cozy_downloads" }
const COMPONENT_ROW = {
  id: 42,
  component_slug: "bento-blog-grid",
  user_id: "user-1",
  user: USER_ROW,
  tags: [],
}
const SUBMISSION_ROW = { id: 7, component_id: 42 }

type DemoRow = Record<string, unknown> | null

interface StubOptions {
  /** Row returned by the primary `.eq("demo_slug", …)` lookup. */
  primaryDemo: DemoRow
  /** Error returned by the primary lookup instead of a row. */
  primaryError?: { message: string } | null
  /** Row returned by the ordered fallback lookup. */
  fallbackDemo: DemoRow
}

/**
 * Minimal chainable Supabase stub. Both functions under test take `supabase`
 * as an injected parameter, so no module mocking is required.
 */
function makeSupabaseStub(opts: StubOptions) {
  const fallbackQuery = vi.fn()
  const orderArgs: unknown[][] = []
  const limitArgs: unknown[][] = []

  const from = (table: string) => {
    let ordered = false
    const builder: any = {
      select: () => builder,
      or: () => builder,
      eq: () => builder,
      order: (...args: unknown[]) => {
        ordered = true
        orderArgs.push(args)
        return builder
      },
      limit: (...args: unknown[]) => {
        limitArgs.push(args)
        return builder
      },
      maybeSingle: async () => {
        if (table === "users") return { data: USER_ROW, error: null }
        if (table === "components")
          return { data: COMPONENT_ROW, error: null }
        if (table === "submissions")
          return { data: SUBMISSION_ROW, error: null }
        if (table === "demos") {
          if (ordered) {
            fallbackQuery()
            return { data: opts.fallbackDemo, error: null }
          }
          return {
            data: opts.primaryDemo,
            error: opts.primaryError ?? null,
          }
        }
        throw new Error(`unexpected table: ${table}`)
      },
    }
    return builder
  }

  return {
    supabase: { from } as any,
    fallbackQuery,
    orderArgs,
    limitArgs,
  }
}

const demoRow = (demo_slug: string) => ({
  id: demo_slug === "default" ? 1 : 2,
  component_id: 42,
  demo_slug,
  demo_user: USER_ROW,
  tags: [],
})

for (const [label, fn] of [
  ["getComponentWithDemo", getComponentWithDemo],
  ["getComponentWithDemoForOG", getComponentWithDemoForOG],
] as const) {
  describe(`${label} — demo_slug fallback`, () => {
    it("falls back to first demo when default missing", async () => {
      const { supabase, fallbackQuery, orderArgs, limitArgs } =
        makeSupabaseStub({
          primaryDemo: null,
          fallbackDemo: demoRow("demo-one"),
        })

      const result: any = await fn(
        supabase,
        "cozy_downloads",
        "bento-blog-grid",
        "default",
      )

      expect(result.error).toBeNull()
      expect(result.data?.demo?.demo_slug).toBe("demo-one")
      expect(fallbackQuery).toHaveBeenCalled()
      expect(orderArgs[0]).toEqual(["id", { ascending: true }])
      expect(limitArgs[0]).toEqual([1])
    })

    it("does not fall back when default exists", async () => {
      const { supabase, fallbackQuery } = makeSupabaseStub({
        primaryDemo: demoRow("default"),
        fallbackDemo: demoRow("demo-one"),
      })

      const result: any = await fn(
        supabase,
        "cozy_downloads",
        "bento-blog-grid",
        "default",
      )

      expect(result.error).toBeNull()
      expect(result.data?.demo?.demo_slug).toBe("default")
      expect(fallbackQuery).not.toHaveBeenCalled()
    })
  })
}

describe("getComponentWithDemo — unchanged branches", () => {
  it("still errors when component has no demos at all", async () => {
    const { supabase } = makeSupabaseStub({
      primaryDemo: null,
      fallbackDemo: null,
    })

    const result: any = await getComponentWithDemo(
      supabase,
      "cozy_downloads",
      "bento-blog-grid",
      "default",
    )

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
  })

  it("still errors (via fallback miss) when the default lookup itself errored", async () => {
    const { supabase } = makeSupabaseStub({
      primaryDemo: null,
      primaryError: { message: "boom" },
      fallbackDemo: null,
    })

    const result: any = await getComponentWithDemo(
      supabase,
      "cozy_downloads",
      "bento-blog-grid",
      "default",
    )

    expect(result.data).toBeNull()
    expect(result.error).toBeInstanceOf(Error)
    expect(result.error.message).toBe("boom")
  })

  it("shouldRedirectToDefault unchanged for explicit demo_slug miss", async () => {
    const { supabase, fallbackQuery } = makeSupabaseStub({
      primaryDemo: null,
      fallbackDemo: demoRow("demo-one"),
    })

    const result: any = await getComponentWithDemo(
      supabase,
      "cozy_downloads",
      "bento-blog-grid",
      "demo-one",
    )

    expect(result.shouldRedirectToDefault).toBe(true)
    expect(result.data).toBeNull()
    expect(result.error).toBeNull()
    expect(fallbackQuery).not.toHaveBeenCalled()
  })
})
