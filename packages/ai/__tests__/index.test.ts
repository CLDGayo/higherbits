import { describe, it, expect, vi, beforeEach } from "vitest";
import { handleSearch } from "../src/index.js";

// Mock fetch globally
const globalFetch = vi.fn();
global.fetch = globalFetch;

describe("HigherBits AI MCP Core", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("should return formatted results on successful search", async () => {
    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    globalFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          {
            name: "TestButton",
            component_data: {
              name: "TestButton",
              description: "A test button",
              install_command: "npx add test-button",
              code: "export const TestButton = () => <button>Test</button>;",
            },
          },
        ],
      }),
    } as Response);

    const result = await handleSearch("button", "test-api-key");
    
    expect(result.content[0].text).toContain("Found the following components");
    expect(result.content[0].text).toContain("TestButton");
    expect(globalFetch).toHaveBeenCalledTimes(2);
  });

  it("should throw an error if usage authorization fails", async () => {
    globalFetch.mockResolvedValueOnce({
      ok: false,
      statusText: "Forbidden",
      json: async () => ({ error: "Usage limit exceeded" }),
    } as Response);

    await expect(handleSearch("button", "test-api-key")).rejects.toThrow("Failed to authorize usage: Usage limit exceeded");
    expect(globalFetch).toHaveBeenCalledTimes(1);
  });
});
