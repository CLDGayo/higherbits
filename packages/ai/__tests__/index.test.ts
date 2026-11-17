import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  handleSearch,
  handleSource,
  type HigherBitsApiDispatcher,
  type HigherBitsApiRequest,
} from "../src/server.js";
import {
  handleSearch as cliHandleSearch,
  handleSource as cliHandleSource,
} from "../src/index.js";
import { handleStreamableHttpRequest } from "../src/http.js";

const globalFetch = vi.fn<typeof fetch>();
global.fetch = globalFetch;

async function withMcpClient<T>(
  dispatcher: HigherBitsApiDispatcher,
  run: (client: Client) => Promise<T>,
): Promise<T> {
  const client = new Client({ name: "higherbits-test-client", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(
    new URL("http://higherbits.local/api/higherbits-mcp"),
    {
      requestInit: { headers: { Authorization: "Bearer test-api-key" } },
      fetch: (url, init) =>
        handleStreamableHttpRequest(
          new Request(url, init),
          "test-api-key",
          dispatcher,
        ),
    },
  );

  await client.connect(transport);
  try {
    return await run(client);
  } finally {
    await client.close();
  }
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("HigherBits MCP source boundary", () => {
  beforeEach(() => vi.resetAllMocks());

  it("retains the CLI handler exports", () => {
    expect(cliHandleSearch).toBe(handleSearch);
    expect(cliHandleSource).toBe(handleSource);
  });

  it("search is one metadata request and never formats source", async () => {
    globalFetch.mockResolvedValueOnce(
      jsonResponse({
        results: [
          {
            id: 12,
            name: "Button",
            component_data: {
              description: "A button",
              code: "SECRET_SOURCE",
              install_command: "SECRET_COMMAND",
              dependencies: { code: "SECRET_DEPENDENCY" },
            },
          },
        ],
      }),
    );

    const result = await handleSearch("button", "test-key");

    expect(globalFetch).toHaveBeenCalledTimes(1);
    expect(globalFetch.mock.calls[0][0]).toBeInstanceOf(Request);
    expect((globalFetch.mock.calls[0][0] as Request).url).toBe(
      "https://higherbits.dev/api/search",
    );
    expect(result.content[0].text).toContain("Button");
    expect(result.content[0].text).not.toContain("SECRET");
  });

  it("source retry preserves its UUID and Bearer identity", async () => {
    globalFetch.mockRejectedValueOnce(new TypeError("network"));
    globalFetch.mockResolvedValueOnce(
      jsonResponse({
        componentId: 12,
        files: [{ path: "button.tsx", content: "source" }],
        dependencies: [],
      }),
    );

    await handleSource({ componentId: 12 }, "test-key");

    expect(globalFetch).toHaveBeenCalledTimes(2);
    const firstRequest = globalFetch.mock.calls[0][0] as Request;
    expect(firstRequest.headers.get("authorization")).toBe("Bearer test-key");
    const firstBody = await firstRequest.clone().text();
    expect(JSON.parse(firstBody).requestId).toMatch(
      /^[0-9a-f-]{36}$/,
    );
    expect(await (globalFetch.mock.calls[1][0] as Request).clone().text()).toBe(
      firstBody,
    );
  });

  it("quota denial keeps the CLI message and is never retried", async () => {
    globalFetch.mockResolvedValueOnce(
      jsonResponse({ error: "copy_limit_reached" }, 429),
    );

    await expect(handleSource({ componentId: 12 }, "test-key")).rejects.toThrow(
      "Copy allowance or retry limit reached. Free copies reset at 00:00 UTC; upgrade at https://higherbits.dev/pricing.",
    );
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });

  it("rejects identity overrides before any request", async () => {
    await expect(
      handleSource({ componentId: 12, userId: "other" }, "test-key"),
    ).rejects.toThrow("Invalid arguments");
    expect(globalFetch).not.toHaveBeenCalled();
  });
});

describe("HigherBits MCP HTTP facade", () => {
  it("G-AC1-SDK-HTTP — completes initialize, tools/list, and both tool calls over Streamable HTTP", async () => {
    const requests: HigherBitsApiRequest[] = [];
    const dispatcher: HigherBitsApiDispatcher = async (request) => {
      requests.push(request);
      if (request.path === "/api/search") {
        return jsonResponse({
          results: [
            {
              id: 12,
              name: "Button",
              component_data: { description: "A sample button" },
            },
          ],
        });
      }
      return jsonResponse({
        componentId: 12,
        files: [{ path: "button.tsx", content: "export default Button" }],
        dependencies: [{ name: "react" }],
      });
    };

    await withMcpClient(dispatcher, async (client) => {
      const listed = await client.listTools();
      expect(listed.tools.map((tool) => tool.name).sort()).toEqual([
        "get_higherbits_component_source",
        "search_higherbits_components",
      ]);

      const search = await client.callTool({
        name: "search_higherbits_components",
        arguments: { query: "button" },
      });
      expect(search.isError).not.toBe(true);
      expect(search.content[0]).toMatchObject({ type: "text" });
      expect(search.content[0].text).toContain("Button");

      const source = await client.callTool({
        name: "get_higherbits_component_source",
        arguments: { componentId: 12 },
      });
      expect(source.isError).not.toBe(true);
      expect(source.content[0].text).toContain("export default Button");
      expect(requests.map((request) => request.path)).toEqual([
        "/api/search",
        "/api/mcp/component-source",
      ]);
    });
  });

  it("G-AC2-SEARCH — returns metadata and notice only for valid searches", async () => {
    const dispatched: HigherBitsApiRequest[] = [];
    const dispatcher: HigherBitsApiDispatcher = async (request) => {
      dispatched.push(request);
      return jsonResponse({
        notice: "Metadata notice",
        results: [
          {
            name: "Card",
            id: 24,
            component_data: {
              description: "A card",
              code: "PROTECTED_SOURCE",
              dependencies: { code: "PROTECTED_DEPENDENCY" },
            },
          },
        ],
      });
    };

    const result = await handleSearch("card", "test-api-key", dispatcher);
    expect(result.content[0].text).toContain("Card");
    expect(result.content[0].text).not.toContain("PROTECTED");
    expect(result.structuredContent).toEqual({ notice: "Metadata notice" });
    expect(dispatched).toHaveLength(1);
    expect(dispatched[0].path).toBe("/api/search");
    expect(JSON.parse(dispatched[0].body)).toEqual({ search: "card", per_page: 3 });

    await expect(
      handleSearch("  ", "test-api-key", dispatcher),
    ).rejects.toThrow("Invalid arguments");
    expect(dispatched).toHaveLength(1);

    const emptyDispatcher: HigherBitsApiDispatcher = async () =>
      jsonResponse({ results: [] });
    const empty = await handleSearch("missing", "test-api-key", emptyDispatcher);
    expect(empty.content[0].text).toContain("No components found");
    expect(empty.structuredContent).toBeUndefined();
  });

  it("G-AC3-SOURCE — returns allowed source and keeps denials source-free", async () => {
    const allowedDispatcher: HigherBitsApiDispatcher = async () =>
      jsonResponse({
        componentId: 12,
        files: [{ path: "button.tsx", content: "authorized source" }],
        dependencies: [{ name: "react" }],
        notice: "Attribution notice",
      });
    const allowed = await handleSource(
      { componentId: 12 },
      "test-api-key",
      allowedDispatcher,
    );
    expect(allowed.content[0].text).toContain("authorized source");
    expect(allowed.content[0].text).toContain("react");
    expect(allowed.content[0].text).toContain("Attribution notice");

    const deniedDispatcher: HigherBitsApiDispatcher = async () =>
      jsonResponse({
        error: "copy_limit_reached",
        files: [{ path: "secret.tsx", content: "PROTECTED_SOURCE_SENTINEL" }],
      }, 429);
    await withMcpClient(deniedDispatcher, async (client) => {
      const denied = await client.callTool({
        name: "get_higherbits_component_source",
        arguments: { componentId: 12 },
      });
      expect(denied.isError).toBe(true);
      expect(denied.content[0].text).toBe(
        "Copy allowance or retry limit reached. Free copies reset at 00:00 UTC; upgrade at https://higherbits.dev/pricing.",
      );
      expect(denied.content[0].text).not.toContain("authorized source");
      expect(denied.structuredContent).toEqual({ error: "copy_limit_reached" });
    });
  });

  it("G-AC4-ERROR-RETRY — validates IDs, preserves CLI text, maps 429 reasons, and retries once with the same UUID", async () => {
    const requestId = "c5e5f8c8-4263-4d2b-9ab8-2a45b0b182fe";
    globalFetch.mockRejectedValueOnce(new TypeError("temporary network failure"));
    globalFetch.mockResolvedValueOnce(
      jsonResponse({ files: [{ path: "x.tsx", content: "ok" }] }),
    );
    await handleSource(
      {
        componentId: Number.MAX_SAFE_INTEGER,
        requestId,
      },
      "test-api-key",
    );
    expect(globalFetch).toHaveBeenCalledTimes(2);
    const firstBody = await (globalFetch.mock.calls[0][0] as Request)
      .clone()
      .text();
    expect(JSON.parse(firstBody).requestId).toBe(requestId);
    expect(await (globalFetch.mock.calls[1][0] as Request).clone().text()).toBe(
      firstBody,
    );

    for (const invalid of [
      { componentId: Number.MAX_SAFE_INTEGER + 1 },
      { componentId: 1, demoId: Number.MIN_SAFE_INTEGER - 1 },
      { componentId: 1, requestId: "not-a-uuid" },
      { componentId: 1, userId: "test-user" },
    ]) {
      const invalidDispatcher: HigherBitsApiDispatcher = vi.fn();
      await expect(
        handleSource(invalid, "test-api-key", invalidDispatcher),
      ).rejects.toThrow("Invalid arguments");
      expect(invalidDispatcher).not.toHaveBeenCalled();
    }

    const nonTransientDispatcher: HigherBitsApiDispatcher = vi.fn(async () => {
      throw new Error("application failure");
    });
    await expect(
      handleSource({ componentId: 1 }, "test-api-key", nonTransientDispatcher),
    ).rejects.toThrow("application failure");
    expect(nonTransientDispatcher).toHaveBeenCalledTimes(1);

    const inProcessTypeErrorDispatcher: HigherBitsApiDispatcher = vi.fn(async () => {
      throw new TypeError("in-process route handler failure");
    });
    await expect(
      handleSource(
        { componentId: 1, requestId: "c5e5f8c8-4263-4d2b-9ab8-2a45b0b182fe" },
        "test-api-key",
        inProcessTypeErrorDispatcher,
      ),
    ).rejects.toThrow("in-process route handler failure");
    expect(inProcessTypeErrorDispatcher).toHaveBeenCalledTimes(1);

    for (const error of [
      "copy_limit_reached",
      "grant_rate_limited",
      "replay_limit_reached",
    ]) {
      let denialCalls = 0;
      const deniedDispatcher: HigherBitsApiDispatcher = async () => {
        denialCalls += 1;
        return jsonResponse({
          error,
          retryAfter: 17,
          files: [{ path: "secret.tsx", content: "PROTECTED_SOURCE_SENTINEL" }],
        }, 429);
      };
      await withMcpClient(deniedDispatcher, async (client) => {
        const denied = await client.callTool({
          name: "get_higherbits_component_source",
          arguments: { componentId: 1 },
        });
        expect(denied.isError).toBe(true);
        expect(denied.content[0].text).toContain(
          "Copy allowance or retry limit reached. Free copies reset at 00:00 UTC; upgrade at https://higherbits.dev/pricing.",
        );
        expect(denied.structuredContent).toEqual({ error, retryAfter: 17 });
        expect(denied.content[0].text).not.toContain("PROTECTED_SOURCE_SENTINEL");
        expect(denialCalls).toBe(1);
      });
    }
  });

  it("G-AC5-CAPABILITY-LIST — advertises exactly two strict tool schemas", async () => {
    const dispatcher: HigherBitsApiDispatcher = async () =>
      jsonResponse({ results: [] });
    await withMcpClient(dispatcher, async (client) => {
      const { tools } = await client.listTools();
      expect(tools.map((tool) => tool.name).sort()).toEqual([
        "get_higherbits_component_source",
        "search_higherbits_components",
      ]);
      const search = tools.find(
        (tool) => tool.name === "search_higherbits_components",
      );
      const source = tools.find(
        (tool) => tool.name === "get_higherbits_component_source",
      );
      expect(search?.inputSchema).toEqual({
        type: "object",
        properties: {
          query: {
            type: "string",
            minLength: 1,
            maxLength: 2000,
            description: "The search query (e.g., 'animated button', 'pricing card').",
          },
        },
        required: ["query"],
        additionalProperties: false,
      });
      expect(source?.inputSchema).toMatchObject({
        type: "object",
        properties: {
          componentId: {
            type: "integer",
            minimum: Number.MIN_SAFE_INTEGER,
            maximum: Number.MAX_SAFE_INTEGER,
          },
          demoId: {
            type: "integer",
            minimum: Number.MIN_SAFE_INTEGER,
            maximum: Number.MAX_SAFE_INTEGER,
          },
          requestId: { type: "string", format: "uuid" },
        },
        required: ["componentId"],
        additionalProperties: false,
      });
      expect(search?.description).not.toMatch(/daily|quota|allowance|retry guarantee/i);
      expect(source?.description).not.toMatch(/daily|quota|allowance|retry guarantee/i);
    });
  });
});
