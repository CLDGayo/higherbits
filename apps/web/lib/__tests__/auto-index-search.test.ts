import { beforeEach, expect, it, vi } from "vitest"

const fixture = vi.hoisted(() => ({ rows: new Map<string, any[]>(), failure: "", approved: new Set<number>([10]) }))
vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: {
  rpc: async (_name: string, args: { p_component_ids: number[] }) => ({
    data: fixture.failure === "approval" ? null : [...fixture.approved].filter(id => args.p_component_ids.includes(id)),
    error: fixture.failure === "approval" ? {} : null,
  }),
  from(table: string) {
  const filters: Record<string, unknown> = {}
  const query = {
    select: () => query,
    in: (key: string, values: unknown[]) => { filters[key] = values; return query },
    eq: (key: string, value: unknown) => { filters[key] = value; return query },
    then: (resolve: (result: unknown) => void) => {
      const data = (fixture.rows.get(table) ?? []).filter(row => Object.entries(filters).every(([key, value]) =>
        key === "component.is_public" ? row.component?.is_public === value : Array.isArray(value) ? value.includes(row[key]) : row[key] === value))
      return Promise.resolve({ data: fixture.failure === table ? null : data, error: fixture.failure === table ? {} : null }).then(resolve)
    },
  }
  return query
} } }))
import { visibleSearchDemos } from "../api/server/auto-index-search"

beforeEach(() => {
  fixture.failure = ""
  fixture.approved = new Set([10])
  fixture.rows = new Map(Object.entries({
    demos: [
      { id: 1, component_id: 10, component: { registry: "auto-index", is_public: true } },
      { id: 2, component_id: 20, component: { registry: "auto-index", is_public: true } },
      { id: 3, component_id: 30, component: { registry: "ui", is_public: true } },
      { id: 4, component_id: 40, component: { registry: "auto-index", is_public: true } },
    ],
    auto_index_publications: [
      { component_id: 10, source_id: 4, delisted_at: null },
      { component_id: 20, source_id: 4, delisted_at: "2026-09-29T00:00:00Z" },
      { component_id: 40, source_id: 4, delisted_at: null, superseded_at: "2026-09-30T00:00:00Z" },
    ],
    auto_index_sources: [{ id: 4, opted_out: false }],
  }))
})

it("E-SEARCH: batch admission preserves approved auto-index and ordinary creator hits", async () => {
  const visible = await visibleSearchDemos([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }])
  expect(visible.map(row => row.id)).toEqual([1, 3])
  expect((await visibleSearchDemos([{ id: 1 }, { id: 3 }])).map(row => row.id)).toEqual([1, 3])
})

it("E-SEARCH: unreviewed, missing, and failed provenance lookups hide only auto-index hits", async () => {
  fixture.approved.clear()
  expect((await visibleSearchDemos([{ id: 1 }, { id: 3 }])).map(row => row.id)).toEqual([3])
  fixture.approved.add(10)
  fixture.failure = "approval"
  expect((await visibleSearchDemos([{ id: 1 }, { id: 3 }])).map(row => row.id)).toEqual([3])
})
