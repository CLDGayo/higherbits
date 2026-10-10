import { beforeEach, describe, expect, it, vi } from "vitest"

const fixture = vi.hoisted(() => ({
  tables: {} as Record<string, Array<Record<string, any>>>,
  failedTables: new Set<string>(),
  approvedIds: new Set<number>(),
  rpcFails: false,
}))

vi.mock("@/lib/supabase", () => ({
  supabaseWithAdminAccess: {
    rpc: async (_name: string, args: { p_component_ids: number[] }) => ({
      data: fixture.rpcFails
        ? null
        : [...fixture.approvedIds].filter((id) => args.p_component_ids.includes(id)),
      error: fixture.rpcFails ? new Error("unavailable") : null,
    }),
    from(table: string) {
      const filters: Array<[string, unknown, "in" | "eq"]> = []
      const result = (single = false) => {
        if (fixture.failedTables.has(table)) return { data: null, error: new Error("unavailable") }
        const rows = (fixture.tables[table] ?? []).filter((row) => filters.every(([key, value, op]) =>
          op === "in" ? (value as unknown[]).includes(row[key]) : row[key] === value,
        ))
        return { data: single ? rows[0] ?? null : rows, error: null }
      }
      const query: any = {
        select: () => query,
        in: (key: string, values: unknown[]) => { filters.push([key, values, "in"]); return query },
        eq: (key: string, value: unknown) => { filters.push([key, value, "eq"]); return query },
        maybeSingle: async () => result(true),
        then: (resolve: (value: unknown) => unknown, reject: (error: unknown) => unknown) =>
          Promise.resolve(result()).then(resolve, reject),
      }
      return query
    },
  },
}))

import { getPublicCategoryPreviews, getPublicCollectionDemos } from "../public-catalogue"

const collectionId = "123e4567-e89b-42d3-a456-426614174000"

beforeEach(() => {
  fixture.failedTables.clear()
  fixture.rpcFails = false
  fixture.approvedIds = new Set([101])
  fixture.tables = {
    collections: [{ id: collectionId, is_public: true }],
    components_to_collections: [
      { collection_id: collectionId, component_id: 101 },
      { collection_id: collectionId, component_id: 102 },
      { collection_id: collectionId, component_id: 103 },
    ],
    components: [
      { id: 101, registry: "auto-index", is_public: true },
      { id: 102, registry: "auto-index", is_public: true },
      { id: 103, registry: "community", is_public: true },
    ],
    demos: [
      { id: 1, component_id: 101, preview_url: "approved.png", video_url: null, bookmarks_count: 2, created_at: "2026-01-01", component_data: { likes_count: 3, downloads_count: 1 } },
      { id: 2, component_id: 102, preview_url: "pending.png", video_url: null, bookmarks_count: 5, created_at: "2026-01-02", component_data: { likes_count: 9, downloads_count: 8 } },
      { id: 3, component_id: 103, preview_url: "community.png", video_url: null, bookmarks_count: 1, created_at: "2026-01-03", component_data: { likes_count: 1, downloads_count: 1 } },
    ],
  }
})

describe("public catalogue readers", () => {
  it("returns only public category previews with current auto-index approval", async () => {
    await expect(getPublicCategoryPreviews([1, 2, 3, 0, "4"])).resolves.toEqual([
      { demo_id: 1, preview_url: "approved.png", video_url: null },
      { demo_id: 3, preview_url: "community.png", video_url: null },
    ])
  })

  it("fails closed when the approval lookup or the underlying rows fail", async () => {
    fixture.rpcFails = true
    await expect(getPublicCategoryPreviews([1, 2, 3])).resolves.toEqual([
      { demo_id: 3, preview_url: "community.png", video_url: null },
    ])
    fixture.rpcFails = false
    fixture.failedTables.add("components")
    await expect(getPublicCategoryPreviews([1, 2, 3])).resolves.toEqual([])
  })

  it("limits collections to public, approved rows and validates their identifier", async () => {
    const result = await getPublicCollectionDemos(collectionId, "likes")
    expect(result.data.map((demo) => demo.id)).toEqual([1, 3])
    expect(result.total_count).toBe(2)
    await expect(getPublicCollectionDemos("not-a-uuid", "likes")).resolves.toEqual({ data: [], total_count: 0 })
  })

  it("hides private collections and fails closed on collection read errors", async () => {
    fixture.tables.collections = [{ id: collectionId, is_public: false }]
    await expect(getPublicCollectionDemos(collectionId, "date")).resolves.toEqual({ data: [], total_count: 0 })
    fixture.tables.collections = [{ id: collectionId, is_public: true }]
    fixture.failedTables.add("components_to_collections")
    await expect(getPublicCollectionDemos(collectionId, "date")).resolves.toEqual({ data: [], total_count: 0 })
  })
})
