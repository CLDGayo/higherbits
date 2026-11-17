import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import {
  createHigherBitsMcpServer,
  type HigherBitsApiDispatcher,
} from "./server.js";

export type { HigherBitsApiDispatcher, HigherBitsApiRequest } from "./server.js";

export async function handleStreamableHttpRequest(
  request: Request,
  apiKey: string,
  dispatcher?: HigherBitsApiDispatcher,
): Promise<Response> {
  const server = createHigherBitsMcpServer(apiKey, dispatcher);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  return transport.handleRequest(request);
}
