import { beforeEach, describe, expect, it, vi } from "vitest"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js"
import {
  checkApiKey,
  createServer,
  handleSearch,
  handleSource,
} from "../src/index.js"

const globalFetch = vi.fn()
global.fetch = globalFetch

async function withMcp<T>(run: (client: Client) => Promise<T>) {
  const server = createServer("test-key")
  const client = new Client({ name: "protocol-test", version: "1.0.0" })
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair()
  await Promise.all([
    server.connect(serverTransport),
    client.connect(clientTransport),
  ])
  try {
    return await run(client)
  } finally {
    await client.close()
    await server.close()
  }
}

describe("HigherBits MCP protocol", () => {
  beforeEach(() => vi.resetAllMocks())

  it("advertises HigherBits catalogue search and source tools", async () => {
    const tools = await withMcp(async (client) => client.listTools())
    expect(tools.tools.map(({ name }) => name)).toEqual([
      "get_higherbits_component_source",
      "search_higherbits_components",
    ])
    expect(
      tools.tools.find(({ name }) => name === "search_higherbits_components")
        ?.description,
    ).toContain("metadata only")
  })

  it("searches metadata only and never leaks embedded source or dependency data", async () => {
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            id: 12,
            name: "Button",
            component_data: {
              description: "A button",
              code: "SECRET_SOURCE",
              install_command: "SECRET_COMMAND",
              dependencies: { code: "SECRET_DEP" },
            },
          },
        ],
      }),
    })

    const result = await withMcp((client) =>
      client.callTool({
        name: "search_higherbits_components",
        arguments: { query: "button" },
      }),
    )
    expect(globalFetch).toHaveBeenCalledTimes(1)
    expect(globalFetch.mock.calls[0][0]).toBe(
      "https://higherbits.dev/api/search",
    )
    expect(globalFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-key",
    )
    expect(result.isError).not.toBe(true)
    expect(JSON.stringify(result)).toContain("Button")
    expect(JSON.stringify(result)).not.toContain("SECRET")
  })

  it("retrieves authorized source and preserves its attribution notice", async () => {
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        componentId: 12,
        files: [
          { path: "button.tsx", content: "export const Button = () => null" },
        ],
        dependencies: [],
        notice:
          "Copyright the original author. Licensed under MIT; retain this notice.",
      }),
    })

    const result = await withMcp((client) =>
      client.callTool({
        name: "get_higherbits_component_source",
        arguments: { componentId: 12 },
      }),
    )
    expect(globalFetch.mock.calls[0][0]).toBe(
      "https://higherbits.dev/api/mcp/component-source",
    )
    expect(globalFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-key",
    )
    expect(result.isError).not.toBe(true)
    expect(JSON.stringify(result)).toContain("retain this notice")
    expect(JSON.stringify(result)).toContain("button.tsx")
  })

  it("surfaces auth denial and copy quota without retrying", async () => {
    globalFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
    })
    const denied = await withMcp((client) =>
      client.callTool({
        name: "search_higherbits_components",
        arguments: { query: "button" },
      }),
    )
    expect(denied.isError).toBe(true)

    globalFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: "Too Many Requests",
    })
    const quota = await withMcp((client) =>
      client.callTool({
        name: "get_higherbits_component_source",
        arguments: { componentId: 12 },
      }),
    )
    expect(quota.isError).toBe(true)
    expect(JSON.stringify(quota)).toContain("00:00 UTC")
    expect(globalFetch).toHaveBeenCalledTimes(2)
  })

  it("does not accept caller-supplied identity fields", async () => {
    await expect(
      handleSource({ componentId: 12, userId: "other" } as never, "test-key"),
    ).rejects.toThrow("Invalid arguments")
    expect(globalFetch).not.toHaveBeenCalled()
  })

  it("validates the API key with the HigherBits API and rejects inactive keys", async () => {
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    })
    await expect(checkApiKey("test-key")).resolves.toBeUndefined()
    expect(globalFetch.mock.calls[0][0]).toBe(
      "https://higherbits.dev/api/magic/check",
    )
    expect(globalFetch.mock.calls[0][1].headers.Authorization).toBe(
      "Bearer test-key",
    )

    globalFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ success: false }),
    })
    await expect(checkApiKey("invalid-key")).rejects.toThrow(
      "API key validation failed",
    )
    await expect(checkApiKey("")).rejects.toThrow(
      "API_KEY environment variable is required",
    )
    expect(globalFetch).toHaveBeenCalledTimes(2)
  })

  it("search returns an empty result message when no catalogue entry matches", async () => {
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    })
    const result = await handleSearch("unlisted component", "test-key")
    expect(result.content[0].text).toContain("No components found")
  })
})
