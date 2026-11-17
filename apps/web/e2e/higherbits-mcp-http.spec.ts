import { expect, test } from "@playwright/test";

const endpointPath = "/api/higherbits-mcp";
const apiKey = process.env.HIGHERBITS_MCP_E2E_API_KEY;
const mismatchApiKey = process.env.HIGHERBITS_MCP_E2E_MISMATCH_API_KEY;

function isLoopbackUrl(value: string | undefined): boolean {
  if (!value) return false;
  try {
    return ["localhost", "127.0.0.1", "::1"].includes(new URL(value).hostname);
  } catch {
    return false;
  }
}

const localFixtureReady =
  process.env.HIGHERBITS_MCP_E2E_LOCAL_FIXTURE === "1" &&
  typeof apiKey === "string" &&
  apiKey.startsWith("test_") &&
  typeof mismatchApiKey === "string" &&
  mismatchApiKey.startsWith("test_") &&
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith("pk_test_") === true &&
  isLoopbackUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  isLoopbackUrl(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100") &&
  typeof process.env.HIGHERBITS_E2E_ADMIN_STATE === "string";

function eventMessage(body: string): Record<string, unknown> {
  const line = body.split("\n").find((item) => item.startsWith("data: "));
  if (!line) throw new Error("Expected an MCP event data line");
  return JSON.parse(line.slice("data: ".length)) as Record<string, unknown>;
}

test.describe("HigherBits MCP actual HTTP route", () => {
  test.skip(
    !localFixtureReady,
    "Requires a loopback Supabase fixture, test Clerk key, test API keys, and admin test storage state",
  );

  test("enforces Bearer identity and aborts an open stateless MCP SSE response", async (
    { context },
    testInfo,
  ) => {
    expect(testInfo.project.name).toBe("admin");
    const baseURL = String(testInfo.project.use.baseURL);
    const endpoint = new URL(endpointPath, baseURL).toString();

    const sessionOnly = await context.request.get(endpoint);
    expect(sessionOnly.status()).toBe(401);

    const invalidKey = await context.request.get(endpoint, {
      headers: { Authorization: "Bearer test_invalid_api_key" },
    });
    expect(invalidKey.status()).toBe(401);

    const mismatch = await context.request.get(endpoint, {
      headers: { Authorization: `Bearer ${mismatchApiKey}` },
    });
    expect(mismatch.status()).toBe(401);

    const initialized = await context.request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json, text/event-stream",
      },
      data: {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2025-11-25",
          capabilities: {},
          clientInfo: { name: "higherbits-mcp-http-e2e", version: "1.0.0" },
        },
      },
    });
    expect(initialized.status()).toBe(200);
    expect(initialized.headers()["content-type"]).toContain("text/event-stream");
    const initializedBody = await initialized.text();
    expect(initializedBody).toContain("event: message");
    const initializeMessage = eventMessage(initializedBody);
    expect(initializeMessage.result).toMatchObject({ protocolVersion: "2025-11-25" });

    const listed = await context.request.post(endpoint, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json, text/event-stream",
        "MCP-Protocol-Version": "2025-11-25",
      },
      data: { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} },
    });
    expect(listed.status()).toBe(200);
    const listMessage = eventMessage(await listed.text());
    expect(listMessage.result).toMatchObject({
      tools: expect.arrayContaining([
        expect.objectContaining({ name: "search_higherbits_components" }),
        expect.objectContaining({ name: "get_higherbits_component_source" }),
      ]),
    });

    const cookies = await context.cookies(baseURL);
    const cookieHeader = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
    const streamController = new AbortController();
    const stream = await fetch(endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "text/event-stream",
        ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      },
      signal: streamController.signal,
    });
    expect(stream.status).toBe(200);
    expect(stream.headers.get("content-type")).toContain("text/event-stream");
    const reader = stream.body?.getReader();
    expect(reader).toBeDefined();
    const pendingRead = reader!.read();
    streamController.abort();
    await expect(pendingRead).rejects.toMatchObject({ name: "AbortError" });

    const deleted = await context.request.delete(endpoint, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    expect(deleted.status()).toBe(200);
  });
});
