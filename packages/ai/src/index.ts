import { randomUUID } from "node:crypto"
import { Server } from "@modelcontextprotocol/sdk/server/index.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js"

const API_KEY = process.env.API_KEY

export async function checkApiKey(apiKey: string) {
  if (!apiKey) throw new Error("API_KEY environment variable is required.")

  const response = await fetch("https://higherbits.dev/api/magic/check", {
    headers: { Authorization: `Bearer ${apiKey}` },
  }).catch(() => {
    throw new Error("Failed to connect to HigherBits API to check the API key.")
  })
  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.success) {
    throw new Error(
      "API key validation failed. Sign in to HigherBits AI and create an active API key.",
    )
  }
}

export async function handleSearch(query: string, apiKey: string) {
  const searchRes = await fetch("https://higherbits.dev/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ search: query, per_page: 3 }),
  })

  if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.statusText}`)

  const searchData = await searchRes.json()
  const results = searchData.results || []
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text" as const,
          text: `No components found matching '${query}' on HigherBits.dev.`,
        },
      ],
    }
  }

  const formattedResults = results
    .map((result: any) => {
      return `Component: ${result.name || result.component_data?.name}
Description: ${result.component_data?.description || "No description"}
Component ID: ${result.component_id || result.component_data?.id || result.id}
Use get_higherbits_component_source to retrieve authorized source and its attribution notice.`
    })
    .join("\n---\n\n")

  return {
    content: [
      {
        type: "text" as const,
        text: `Found the following components in HigherBits AI:\n\n${formattedResults}`,
      },
    ],
  }
}

export async function handleSource(
  args: { componentId: number; demoId?: number; requestId?: string },
  apiKey: string,
) {
  if (
    !args ||
    Object.keys(args).some(
      (key) => !["componentId", "demoId", "requestId"].includes(key),
    ) ||
    !Number.isSafeInteger(args.componentId) ||
    args.componentId < 1 ||
    (args.demoId !== undefined &&
      (!Number.isSafeInteger(args.demoId) || args.demoId < 1)) ||
    (args.requestId !== undefined &&
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        args.requestId,
      ))
  ) {
    throw new Error("Invalid arguments for source retrieval")
  }

  const options = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      ...args,
      requestId: args.requestId || randomUUID(),
    }),
  }
  // A lost response may already have spent the action: retry with the same idempotency key.
  const response = await fetch(
    "https://higherbits.dev/api/mcp/component-source",
    options,
  ).catch(() =>
    fetch("https://higherbits.dev/api/mcp/component-source", options),
  )
  if (!response.ok) {
    const messages: Record<number, string> = {
      401: "Sign in with a valid API key.",
      403: "Source access denied.",
      429: "Copy allowance or retry limit reached. Free copies reset at 00:00 UTC; upgrade at https://higherbits.dev/pricing.",
      503: "Source service unavailable; try again later.",
    }
    throw new Error(
      messages[response.status] ||
        `Source request failed (${response.status}).`,
    )
  }
  return {
    content: [
      { type: "text" as const, text: JSON.stringify(await response.json()) },
    ],
  }
}

export function createServer(apiKey: string) {
  const server = new Server(
    { name: "higherbits-mcp", version: "1.0.0" },
    { capabilities: { tools: {} } },
  )

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "get_higherbits_component_source",
        description:
          "Retrieve authorized component source and its attribution notice from HigherBits AI. Source copies count toward your account's copy allowance. Reuse the same requestId when retrying a timed-out request.",
        inputSchema: {
          type: "object",
          properties: {
            componentId: { type: "integer", minimum: 1 },
            demoId: { type: "integer", minimum: 1 },
            requestId: { type: "string", format: "uuid" },
          },
          required: ["componentId"],
          additionalProperties: false,
        },
      },
      {
        name: "search_higherbits_components",
        description:
          "Search the HigherBits AI component catalogue. Returns matching component metadata only; use get_higherbits_component_source to retrieve source, subject to your account's copy allowance.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              minLength: 1,
              maxLength: 2000,
              description:
                "Search terms such as 'animated button' or 'pricing card'.",
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
    ],
  }))

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "get_higherbits_component_source") {
      try {
        return await handleSource(request.params.arguments as any, apiKey)
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text:
                error instanceof Error
                  ? error.message
                  : "Source request failed",
            },
          ],
          isError: true,
        }
      }
    }

    if (request.params.name === "search_higherbits_components") {
      try {
        const query = (request.params.arguments as any)?.query
        if (typeof query !== "string" || !query.trim() || query.length > 2000) {
          throw new Error(
            "Invalid arguments: query must be a non-empty string of at most 2000 characters",
          )
        }
        return await handleSearch(query, apiKey)
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error executing search_higherbits_components: ${error instanceof Error ? error.message : "Search failed"}`,
            },
          ],
          isError: true,
        }
      }
    }

    throw new Error("Tool not found")
  })

  return server
}

async function main() {
  if (!API_KEY) throw new Error("API_KEY environment variable is required.")
  await checkApiKey(API_KEY)

  const server = createServer(API_KEY)
  await server.connect(new StdioServerTransport())

  const shutdown = async () => {
    await server.close()
    process.exit(0)
  }
  process.on("SIGINT", shutdown)
  process.on("SIGTERM", shutdown)
}

if (process.env.NODE_ENV !== "test") {
  main().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
