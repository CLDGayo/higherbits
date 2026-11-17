import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE, GET, POST } from "../route";

const mocks = vi.hoisted(() => ({
  copyIdentity: vi.fn(),
  search: vi.fn(),
  source: vi.fn(),
}));

vi.mock("@/lib/api/server/copy-identity", () => ({
  copyIdentity: mocks.copyIdentity,
}));
vi.mock("@/app/api/search/route", () => ({ POST: mocks.search }));
vi.mock("@/app/api/mcp/component-source/route", () => ({ POST: mocks.source }));

type RpcResponse = {
  result?: {
    protocolVersion?: string;
    tools?: Array<{ name: string }>;
    isError?: boolean;
    content?: Array<{ text?: string }>;
  };
};

function eventMessage(body: string): RpcResponse {
  const line = body.split("\n").find((item) => item.startsWith("data: "));
  if (!line) throw new Error("Expected an MCP event data line");
  return JSON.parse(line.slice("data: ".length)) as RpcResponse;
}

describe("HigherBits MCP HTTP route protocol integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.copyIdentity.mockResolvedValue("deterministic-test-user");
    mocks.search.mockResolvedValue(
      Response.json({
        results: [
          {
            id: 12,
            name: "Button",
            component_data: { description: "A test button" },
          },
        ],
      }),
    );
    mocks.source.mockResolvedValue(
      Response.json({
        componentId: 12,
        files: [{ path: "button.tsx", content: "export default Button" }],
        dependencies: [{ name: "react" }],
        notice: "Test attribution",
      }),
    );
  });

  it("discovers and calls both tools through the actual route exports", async () => {
    const endpoint = "http://app.local/api/higherbits-mcp";
    async function sendRpc(id: number, method: string, params = {}) {
      const response = await POST(
        new Request(endpoint, {
          method: "POST",
          headers: {
            Authorization: "Bearer test-api-key",
            Accept: "application/json, text/event-stream",
            "Content-Type": "application/json",
            ...(id === 1 ? {} : { "MCP-Protocol-Version": "2025-11-25" }),
          },
          body: JSON.stringify({ jsonrpc: "2.0", id, method, params }),
        }),
      );
      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("text/event-stream");
      return eventMessage(await response.text());
    }

    const initialized = await sendRpc(1, "initialize", {
      protocolVersion: "2025-11-25",
      capabilities: {},
      clientInfo: { name: "higherbits-route-test", version: "1.0.0" },
    });
    expect(initialized.result).toMatchObject({ protocolVersion: "2025-11-25" });

    const listed = await sendRpc(2, "tools/list");
    expect(listed.result?.tools?.map(({ name }) => name).sort()).toEqual([
      "get_higherbits_component_source",
      "search_higherbits_components",
    ]);

    const search = await sendRpc(3, "tools/call", {
      name: "search_higherbits_components",
      arguments: { query: "button" },
    });
    expect(search.result?.isError).not.toBe(true);
    expect(search.result?.content?.[0]?.text).toContain("A test button");

    const source = await sendRpc(4, "tools/call", {
      name: "get_higherbits_component_source",
      arguments: { componentId: 12 },
    });
    expect(source.result?.isError).not.toBe(true);
    expect(source.result?.content?.[0]?.text).toContain("export default Button");
    expect(source.result?.content?.[0]?.text).toContain("Test attribution");

    expect(mocks.copyIdentity).toHaveBeenCalled();
    expect(mocks.search).toHaveBeenCalledTimes(1);
    expect(mocks.source).toHaveBeenCalledTimes(1);
  });

  it("opens a cancellable stateless SSE stream and handles DELETE", async () => {
    const endpoint = "http://app.local/api/higherbits-mcp";
    const stream = await GET(
      new Request(endpoint, {
        method: "GET",
        headers: {
          Authorization: "Bearer test-api-key",
          Accept: "text/event-stream",
        },
      }),
    );
    expect(stream.status).toBe(200);
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    expect(reader).toBeDefined();
    await reader!.cancel();

    const deleted = await DELETE(
      new Request(endpoint, {
        method: "DELETE",
        headers: { Authorization: "Bearer test-api-key" },
      }),
    );
    expect(deleted.status).toBe(200);
    expect(mocks.copyIdentity).toHaveBeenCalledTimes(2);
  });
});
