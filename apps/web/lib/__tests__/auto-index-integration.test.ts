import { beforeEach, expect, it, vi } from "vitest"

const fixture = vi.hoisted(() => ({
  hits: [{ id: 901 }, { id: 902 }, { id: 903 }, { id: 904 }],
  demos: [
    { id: 901, component_id: 91, name: "approved fixture", preview_url: "https://example.invalid/preview", component: { registry: "auto-index", is_public: true, name: "approved fixture", description: "synthetic", component_slug: "approved-fixture" } },
    { id: 902, component_id: 92, name: "delisted fixture", preview_url: "https://example.invalid/preview", component: { registry: "auto-index", is_public: true, name: "delisted fixture", description: "synthetic", component_slug: "delisted-fixture" } },
    { id: 903, component_id: 93, name: "creator fixture", preview_url: "https://example.invalid/preview", component: { registry: "creator", is_public: true, name: "creator fixture", description: "synthetic", component_slug: "creator-fixture" } },
    { id: 904, component_id: 94, name: "superseded fixture", preview_url: "https://example.invalid/preview", component: { registry: "auto-index", is_public: true, name: "superseded fixture", description: "synthetic", component_slug: "superseded-fixture" } },
  ],
  publications: [
    { component_id: 91, source_id: 41, delisted_at: null, superseded_at: null },
    { component_id: 92, source_id: 41, delisted_at: "2026-09-29T00:00:00Z", superseded_at: null },
    { component_id: 94, source_id: 41, delisted_at: null, superseded_at: "2026-09-30T00:00:00Z" },
  ],
  sources: [{ id: 41, opted_out: false }],
  failureTable: "",
  invoke: vi.fn(),
}))

vi.mock("@/lib/supabase", () => ({ supabaseWithAdminAccess: {
  functions: { invoke: fixture.invoke },
  from(table: string) {
    const filters: Record<string, unknown> = {}
    const query = {
      select: () => query,
      in: (key: string, values: unknown[]) => { filters[key] = values; return query },
      eq: (key: string, value: unknown) => { filters[key] = value; return query },
      then(resolve: (result: unknown) => void) {
        const rows = table === "demos" ? fixture.demos : table === "auto_index_publications" ? fixture.publications : fixture.sources
        const data = rows.filter(row => {
          const record = row as Record<string, unknown> & { component?: { is_public?: boolean } }
          return Object.entries(filters).every(([key, value]) =>
            key === "component.is_public" ? record.component?.is_public === value : Array.isArray(value) ? value.includes(record[key]) : record[key] === value)
        })
        const failed = fixture.failureTable === table
        return Promise.resolve({ data: failed ? null : data, error: failed ? { message: "PRIVATE_FIXTURE_DATABASE_BODY" } : null }).then(resolve)
      },
    }
    return query
  },
} }))
vi.mock("@/lib/api/server/copy-identity", () => ({ copyIdentity: vi.fn().mockResolvedValue("fixture-user") }))

import { POST as search } from "@/app/api/search/route"
import { POST as magicSearch } from "@/app/api/magic-search/route"
import { POST as mcpSearch } from "@/app/api/search-mcp/route"

beforeEach(() => {
  fixture.failureTable = ""
  fixture.invoke.mockReset().mockResolvedValue({ data: fixture.hits, error: null })
})

const request = (path: string) => new Request(`http://localhost${path}`, {
  method: "POST",
  headers: { "content-type": "application/json", authorization: "Bearer fixture-key" },
  body: JSON.stringify({ search: "synthetic query", per_page: 10 }),
})

it.each([
  ["E-SEARCH /api/search", search, "ai-search-oai", "/api/search"],
  ["E-SEARCH /api/magic-search", magicSearch, "search-embeddings", "/api/magic-search"],
  ["E-SEARCH /api/search-mcp", mcpSearch, "ai-search-oai", "/api/search-mcp"],
] as const)("%s keeps approved and creator hits, drops stale delisted hits", async (_name, handler, functionName, path) => {
  const response = await handler(request(path))
  expect(response.status).toBe(200)
  expect(await response.json()).toMatchObject({ results: [
    { id: 901, component_id: 91 },
    { id: 903, component_id: 93 },
  ], metadata: { pagination: { total: 2 } } })
  expect(fixture.invoke).toHaveBeenCalledWith(functionName, { body: {
    search: "synthetic query", match_threshold: 0.33, limit: 10, userMessage: "",
  } })
})

it.each([search, magicSearch, mcpSearch])("E24: search upstream and database failures redact private bodies", async handler => {
  fixture.invoke.mockResolvedValueOnce({ data: null, error: { message: "PRIVATE_FIXTURE_UPSTREAM_BODY" } })
  const upstreamFailure = await handler(request("/api/search"))
  expect(upstreamFailure.status).toBe(503)
  expect(await upstreamFailure.text()).not.toContain("PRIVATE_FIXTURE_UPSTREAM_BODY")

  fixture.failureTable = "auto_index_publications"
  const databaseFailure = await handler(request("/api/search"))
  expect(databaseFailure.status).toBe(503)
  expect(await databaseFailure.text()).not.toContain("PRIVATE_FIXTURE_DATABASE_BODY")
})
