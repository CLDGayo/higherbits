import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createHigherBitsMcpServer } from "./server.js";

export { handleSearch, handleSource } from "./server.js";

const API_KEY = process.env.API_KEY;
const server: Server = createHigherBitsMcpServer(API_KEY ?? "");

async function checkApiKey(): Promise<void> {
  try {
    const response = await fetch("https://higherbits.dev/api/magic/check", {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data: unknown = await response.json();
    const valid =
      typeof data === "object" &&
      data !== null &&
      "success" in data &&
      data.success === true;
    if (!response.ok || !valid) {
      console.error("API Key validation failed.");
      process.exit(1);
    }
  } catch {
    console.error("Failed to connect to HigherBits API to check API key.");
    process.exit(1);
  }
}

async function main(): Promise<void> {
  if (!API_KEY) {
    console.error("API_KEY environment variable is required.");
    process.exit(1);
  }

  await checkApiKey();
  const transport = new StdioServerTransport();
  await server.connect(transport);

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
  main().catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  });
}
