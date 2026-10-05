import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "@higherbits-dev/cli",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const API_KEY = process.env.API_KEY;

// 1. Initial check on startup
async function checkApiKey() {
  try {
    const res = await fetch("https://higherbits.dev/api/magic/check", { headers: { Authorization: `Bearer ${API_KEY}` } });
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error("API Key validation failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Failed to connect to HigherBits API to check API key.");
    process.exit(1);
  }
}

// ... server setup and handleSearch logic remain the same, but the server listener logic needs wrapping

// 2. Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      { name: "get_higherbits_component_source", description: "Retrieve authorized source and its attribution notice. Uses one shared daily copy; retry with the same requestId within two minutes.", inputSchema: { type: "object", properties: {componentId:{type:"integer"},demoId:{type:"integer"},requestId:{type:"string",format:"uuid"}},required:["componentId"],additionalProperties:false } },
      {
        name: "search_higherbits_components",
        description: "Search component metadata without using the daily copy allowance. Retrieve source separately with get_higherbits_component_source.",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query (e.g., 'animated button', 'pricing card').",
            },
          },
          required: ["query"],
        },
      },
    ],
  };
});

export async function handleSearch(query: string, apiKey: string) {
  // Search components
  const searchRes = await fetch("https://higherbits.dev/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ search: query, per_page: 3 }),
  });

  if (!searchRes.ok) {
    throw new Error(`Search failed: ${searchRes.statusText}`);
  }

  const searchData = await searchRes.json();
  
  const results = searchData.results || [];
  if (results.length === 0) {
    return {
      content: [
        {
          type: "text",
          text: `No components found matching '${query}' on HigherBits.dev.`,
        },
      ],
    };
  }

  const formattedResults = results.map((r: any) => {
    return `Component: ${r.name || r.component_data?.name}
Description: ${r.component_data?.description || "No description"}
Component ID: ${r.component_id || r.component_data?.id || r.id}
Use get_higherbits_component_source to retrieve source (shared daily copy allowance).
`;
  }).join("\n---\n\n");

  return {
    content: [
      {
        type: "text",
        text: `Found the following components on HigherBits.dev:\n\n${formattedResults}`,
      },
    ],
  };
}

export async function handleSource(args: { componentId: number; demoId?: number; requestId?: string }, apiKey: string) {
  if (!args || Object.keys(args).some(key => !["componentId", "demoId", "requestId"].includes(key)) ||
      !Number.isSafeInteger(args.componentId) || (args.demoId !== undefined && !Number.isSafeInteger(args.demoId)) ||
      (args.requestId !== undefined && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(args.requestId))) {
    throw new Error("Invalid arguments for source retrieval");
  }
  const options = { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ ...args, requestId: args.requestId || randomUUID() }) };
  // A lost response may already have spent the action: reuse exactly this UUID once.
  const response = await fetch("https://higherbits.dev/api/mcp/component-source", options)
    .catch(() => fetch("https://higherbits.dev/api/mcp/component-source", options));
  if (!response.ok) {
    const messages: Record<number, string> = {401:"Sign in with a valid API key.",403:"Source access denied.",429:"Copy allowance or retry limit reached. Free copies reset at 00:00 UTC; upgrade at https://higherbits.dev/pricing.",503:"Source service unavailable; try again later."};
    throw new Error(messages[response.status] || `Source request failed (${response.status}).`);
  }
  return { content: [{ type: "text", text: JSON.stringify(await response.json()) }] };
}

// 3. Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_higherbits_component_source") {
    try { return await handleSource(request.params.arguments as any, API_KEY as string); }
    catch (error) { return {content:[{type:"text",text:error instanceof Error ? error.message : "Source request failed"}],isError:true}; }
  }
  if (request.params.name === "search_higherbits_components") {
    try {
      const query = (request.params.arguments as any).query;

      if (!query || typeof query !== "string") {
        throw new Error("Invalid arguments: query must be a string");
      }

      return await handleSearch(query, API_KEY as string);
    } catch (error: any) {
      return {
        content: [
          {
            type: "text",
            text: `Error executing search_higherbits_components: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error("Tool not found");
});

async function main() {
  if (!API_KEY) {
    console.error("API_KEY environment variable is required.");
    process.exit(1);
  }
  await checkApiKey();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Clean exit handlers
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });
  
  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });
}

if (process.env.NODE_ENV !== "test") {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
