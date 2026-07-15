import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "higherbits-ai",
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
    const res = await fetch(`https://higherbits.dev/api/magic/check?apikey=${API_KEY}`);
    const data = await res.json();
    if (!res.ok || !data.success) {
      console.error(`API Key validation failed: ${data.error || res.statusText}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("Failed to connect to HigherBits API to check API key.", error);
    process.exit(1);
  }
}

// ... server setup and handleSearch logic remain the same, but the server listener logic needs wrapping

// 2. Register tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "search_higherbits_components",
        description: "Searches the HigherBits.dev component library for UI components. Use this to find React/Tailwind/Framer Motion components matching the user's needs.",
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
  // Consume usage limit
  const usageRes = await fetch(`https://higherbits.dev/api/magic/use?apikey=${apiKey}`, {
    method: "POST"
  });
  if (!usageRes.ok) {
    const usageData = await usageRes.json();
    throw new Error(`Failed to authorize usage: ${usageData.error || usageRes.statusText}`);
  }

  // Search components
  const searchRes = await fetch("https://higherbits.dev/api/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
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
Install Command: ${r.component_data?.install_command || "N/A"}

Code:
\`\`\`tsx
${r.component_data?.code || "N/A"}
\`\`\`
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

// 3. Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
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
