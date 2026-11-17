import { beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE as facadeDelete, GET as facadeGet, POST as facadePost } from "../route";

const mocks = vi.hoisted(() => ({
  copyIdentity: vi.fn(),
  handleStreamableHttpRequest: vi.fn(),
  search: vi.fn(),
  source: vi.fn(),
}));

vi.mock("@higherbits-dev/cli/http", () => ({
  handleStreamableHttpRequest: mocks.handleStreamableHttpRequest,
}));
vi.mock("@/lib/api/server/copy-identity", () => ({
  copyIdentity: mocks.copyIdentity,
}));
vi.mock("@/app/api/search/route", () => ({ POST: mocks.search }));
vi.mock("@/app/api/mcp/component-source/route", () => ({ POST: mocks.source }));

function headerNames(headers: Headers): string[] {
  const names: string[] = [];
  headers.forEach((_value, name) => names.push(name));
  return names.sort();
}

describe("HigherBits MCP route adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.copyIdentity.mockResolvedValue("deterministic-test-user");
    mocks.search.mockImplementation(async (request: Request) => {
      expect(request.url).toBe("https://higherbits.dev/api/search");
      expect(headerNames(request.headers)).toEqual([
        "authorization",
        "content-type",
      ]);
      return Response.json({ results: [{ name: "Button" }] });
    });
    mocks.source.mockImplementation(async (request: Request) => {
      expect(request.url).toBe("https://higherbits.dev/api/mcp/component-source");
      expect(headerNames(request.headers)).toEqual([
        "authorization",
        "content-type",
      ]);
      return Response.json({ error: "copy_limit_reached" }, { status: 429 });
    });
    mocks.handleStreamableHttpRequest.mockImplementation(
      async (_request: Request, apiKey: string, dispatch: (request: {
        path: string;
        method: "POST";
        apiKey: string;
        body: string;
      }) => Promise<Response>) => {
        await dispatch({
          path: "/api/search",
          method: "POST",
          apiKey,
          body: JSON.stringify({ search: "button", per_page: 3 }),
        });
        return new Response("exact SDK response", {
          status: 202,
          headers: { "Content-Type": "application/vnd.mcp+json", "X-Sdk": "kept" },
        });
      },
    );
  });

  it("G-ROUTE-ADAPTER — delegates GET, POST, and DELETE without changing SDK responses", async () => {
    const handlers = [
      ["GET", facadeGet],
      ["POST", facadePost],
      ["DELETE", facadeDelete],
    ] as const;

    for (const [method, handler] of handlers) {
      mocks.handleStreamableHttpRequest.mockResolvedValueOnce(
        new Response(`sdk-${method}`, {
          status: 202,
          headers: { "Content-Type": "text/event-stream", "X-Sdk-Method": method },
        }),
      );
      const response = await handler(
        new Request("https://app.local/api/higherbits-mcp", {
          method,
          headers: { Authorization: "Bearer test-api-key" },
        }),
      );
      expect(response.status).toBe(202);
      expect(response.headers.get("content-type")).toBe("text/event-stream");
      expect(response.headers.get("x-sdk-method")).toBe(method);
      expect(await response.text()).toBe(`sdk-${method}`);
    }

    expect(mocks.handleStreamableHttpRequest).toHaveBeenCalledTimes(3);
    expect(mocks.copyIdentity).toHaveBeenCalledTimes(3);
  });

  it("G-ROUTE-ADAPTER — rejects alternate identity before fixed-handler dispatch", async () => {
    const invalidRequests = [
      new Request("https://app.local/api/higherbits-mcp"),
      new Request("https://app.local/api/higherbits-mcp", {
        headers: { Cookie: "clerk-session=session-only" },
      }),
      new Request("https://app.local/api/higherbits-mcp", {
        headers: { Authorization: "Basic not-bearer" },
      }),
      new Request("https://app.local/api/higherbits-mcp", {
        headers: { "x-api-key": "not-bearer" },
      }),
      new Request("https://app.local/api/higherbits-mcp?userId=other", {
        headers: { Authorization: "Bearer test-api-key" },
      }),
      new Request("https://app.local/api/higherbits-mcp?apiKey=not-allowed", {
        headers: { Authorization: "Bearer test-api-key" },
      }),
    ];

    for (const request of invalidRequests) {
      const response = await facadePost(request);
      expect(response.status).toBe(401);
    }
    expect(mocks.copyIdentity).not.toHaveBeenCalled();
    expect(mocks.handleStreamableHttpRequest).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();
    expect(mocks.source).not.toHaveBeenCalled();

    mocks.copyIdentity.mockRejectedValueOnce(
      new (await import("@/lib/api/server/copy-admission")).CopyError(
        401,
        "conflicting_identity",
      ),
    );
    const mismatch = await facadePost(
      new Request("https://app.local/api/higherbits-mcp", {
        headers: { Authorization: "Bearer test-api-key", Cookie: "clerk-session=other" },
      }),
    );
    expect(mismatch.status).toBe(401);
    expect(mocks.handleStreamableHttpRequest).not.toHaveBeenCalled();
    expect(mocks.search).not.toHaveBeenCalled();

    const request = new Request(
      "https://app.local/api/higherbits-mcp?trace=untrusted",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer test-api-key",
          Cookie: "clerk-session=matched",
          Origin: "https://attacker.example",
          Host: "attacker.example",
          Forwarded: "host=attacker.example",
          "X-Forwarded-Host": "attacker.example",
        },
      },
    );
    mocks.handleStreamableHttpRequest.mockImplementationOnce(
      async (_request: Request, apiKey: string, dispatch: (input: {
        path: string;
        method: "POST";
        apiKey: string;
        body: string;
      }) => Promise<Response>) => {
        const downstream = await dispatch({
          path: "/api/search",
          method: "POST",
          apiKey,
          body: JSON.stringify({ search: "button", per_page: 3 }),
        });
        expect(await downstream.json()).toEqual({ results: [{ name: "Button" }] });
        return new Response("exact SDK response", {
          status: 202,
          headers: { "Content-Type": "application/vnd.mcp+json", "X-Sdk": "kept" },
        });
      },
    );
    const response = await facadePost(request);
    expect(response.status).toBe(202);
    expect(response.headers.get("content-type")).toBe("application/vnd.mcp+json");
    expect(response.headers.get("x-sdk")).toBe("kept");
    expect(await response.text()).toBe("exact SDK response");
    expect(mocks.search).toHaveBeenCalledTimes(1);
    expect(mocks.source).not.toHaveBeenCalled();
    expect(mocks.copyIdentity).toHaveBeenCalledTimes(2);
    const identityRequest = mocks.copyIdentity.mock.calls[1]?.[0];
    expect(identityRequest).toBeInstanceOf(Request);
    if (!(identityRequest instanceof Request)) throw new Error("Missing identity request");
    expect(headerNames(identityRequest.headers)).toEqual(["authorization"]);
    expect(identityRequest.url).toBe("https://higherbits.dev/api/magic/check");

    mocks.handleStreamableHttpRequest.mockImplementationOnce(
      async (_request: Request, apiKey: string, dispatch: (input: {
        path: string;
        method: "POST";
        apiKey: string;
        body: string;
      }) => Promise<Response>) =>
        dispatch({
          path: "/api/mcp/component-source",
          method: "POST",
          apiKey,
          body: JSON.stringify({ componentId: 12 }),
        }),
    );
    const denied = await facadePost(
      new Request("https://app.local/api/higherbits-mcp", {
        method: "POST",
        headers: { Authorization: "Bearer test-api-key" },
      }),
    );
    expect(denied.status).toBe(429);
    const deniedBody = await denied.text();
    expect(deniedBody).toContain("copy_limit_reached");
    expect(deniedBody).not.toContain("protected source");
    expect(mocks.source).toHaveBeenCalledTimes(1);
    expect(mocks.handleStreamableHttpRequest).toHaveBeenCalledTimes(2);
  });
});
