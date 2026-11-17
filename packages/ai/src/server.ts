import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type CallToolResult,
} from "@modelcontextprotocol/sdk/types.js";

const API_ORIGIN = "https://higherbits.dev";
const SOURCE_REASONS = new Set([
  "copy_limit_reached",
  "grant_rate_limited",
  "replay_limit_reached",
]);
const SOURCE_MESSAGES: Record<number, string> = {
  401: "Sign in with a valid API key.",
  403: "Source access denied.",
  429: "Copy allowance or retry limit reached. Free copies reset at 00:00 UTC; upgrade at https://higherbits.dev/pricing.",
  503: "Source service unavailable; try again later.",
};

export type HigherBitsApiPath =
  | "/api/search"
  | "/api/mcp/component-source";

export type HigherBitsApiRequest = {
  path: HigherBitsApiPath;
  method: "POST";
  apiKey: string;
  body: string;
};

export type HigherBitsApiDispatcher = (
  request: HigherBitsApiRequest,
) => Promise<Response>;

class HigherBitsNetworkError extends Error {
  constructor(error: TypeError) {
    super(error.message);
    this.name = "HigherBitsNetworkError";
  }
}

type SourceArguments = {
  componentId: number;
  demoId?: number;
  requestId?: string;
};

type ErrorDetails = {
  reason?: string;
  retryAfter?: string | number;
};

class HigherBitsToolError extends Error {
  constructor(
    message: string,
    readonly details?: ErrorDetails,
  ) {
    super(message);
    this.name = "HigherBitsToolError";
  }
}

const SEARCH_TOOL = {
  name: "search_higherbits_components",
  description:
    "Search HigherBits component metadata. Retrieve source separately with get_higherbits_component_source.",
  inputSchema: {
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
  },
} as const;

const SOURCE_TOOL = {
  name: "get_higherbits_component_source",
  description: "Retrieve authorized source and its attribution notice.",
  inputSchema: {
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
  },
} as const;

const DEFAULT_DISPATCHER: HigherBitsApiDispatcher = async ({
  path,
  method,
  apiKey,
  body,
}) => {
  const request = new Request(new URL(path, API_ORIGIN), {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body,
  });

  try {
    return await fetch(request);
  } catch (error) {
    if (error instanceof TypeError) throw new HigherBitsNetworkError(error);
    throw error;
  }
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function exactKeys(value: Record<string, unknown>, allowed: string[]): boolean {
  return Object.keys(value).every((key) => allowed.includes(key));
}

function parseSearchQuery(value: unknown): string {
  if (
    !isRecord(value) ||
    !exactKeys(value, ["query"]) ||
    typeof value.query !== "string" ||
    !value.query.trim() ||
    value.query.length > 2000
  ) {
    throw new Error("Invalid arguments: query must be a string");
  }
  return value.query;
}

function parseSourceArguments(value: unknown): SourceArguments {
  if (!isRecord(value) || !exactKeys(value, ["componentId", "demoId", "requestId"])) {
    throw new Error("Invalid arguments for source retrieval");
  }

  const { componentId, demoId, requestId } = value;
  if (
    typeof componentId !== "number" ||
    !Number.isSafeInteger(componentId) ||
    (demoId !== undefined &&
      (typeof demoId !== "number" || !Number.isSafeInteger(demoId))) ||
    (requestId !== undefined &&
      (typeof requestId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          requestId,
        )))
  ) {
    throw new Error("Invalid arguments for source retrieval");
  }

  return {
    componentId,
    ...(demoId === undefined ? {} : { demoId }),
    ...(requestId === undefined ? {} : { requestId }),
  };
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function formatResult(value: unknown): string {
  if (!isRecord(value)) return "";
  const componentData = isRecord(value.component_data)
    ? value.component_data
    : {};
  const name =
    asString(value.name) ?? asString(componentData.name) ?? "Unknown component";
  const description =
    asString(componentData.description) ?? "No description";
  const id = value.component_id ?? componentData.id ?? value.id;
  return `Component: ${name}\nDescription: ${description}\nComponent ID: ${String(id ?? "Unknown")}\nUse get_higherbits_component_source to retrieve source.\n`;
}

function noticeResult(data: Record<string, unknown>): Pick<CallToolResult, "structuredContent"> {
  return Object.hasOwn(data, "notice")
    ? { structuredContent: { notice: data.notice } }
    : {};
}

async function parseErrorDetails(response: Response): Promise<ErrorDetails | undefined> {
  try {
    const body: unknown = await response.clone().json();
    if (!isRecord(body)) return undefined;
    const reason =
      typeof body.error === "string" && SOURCE_REASONS.has(body.error)
        ? body.error
        : undefined;
    const retryAfter =
      typeof body.retryAfter === "string" || typeof body.retryAfter === "number"
        ? body.retryAfter
        : undefined;
    return reason || retryAfter !== undefined
      ? { ...(reason ? { reason } : {}), ...(retryAfter !== undefined ? { retryAfter } : {}) }
      : undefined;
  } catch {
    return undefined;
  }
}

function isTransientNetworkFailure(error: unknown): boolean {
  return error instanceof HigherBitsNetworkError;
}

export async function handleSearch(
  query: string,
  apiKey: string,
  dispatcher: HigherBitsApiDispatcher = DEFAULT_DISPATCHER,
): Promise<CallToolResult> {
  const validatedQuery = parseSearchQuery({ query });
  const response = await dispatcher({
    path: "/api/search",
    method: "POST",
    apiKey,
    body: JSON.stringify({ search: validatedQuery, per_page: 3 }),
  });

  if (!response.ok) throw new Error(`Search failed: ${response.statusText}`);

  const data: unknown = await response.json();
  if (!isRecord(data)) throw new Error("Search failed: invalid response");
  const results = Array.isArray(data.results) ? data.results : [];
  const formatted = results.map(formatResult).filter(Boolean).join("\n---\n\n");

  return {
    content: [
      {
        type: "text",
        text: formatted
          ? `Found the following components on HigherBits.dev:\n\n${formatted}`
          : `No components found matching '${validatedQuery}' on HigherBits.dev.`,
      },
    ],
    ...noticeResult(data),
  };
}

export async function handleSource(
  args: unknown,
  apiKey: string,
  dispatcher: HigherBitsApiDispatcher = DEFAULT_DISPATCHER,
): Promise<CallToolResult> {
  const validatedArgs = parseSourceArguments(args);
  const requestBody = JSON.stringify({
    ...validatedArgs,
    requestId: validatedArgs.requestId ?? randomUUID(),
  });
  const dispatchRequest: HigherBitsApiRequest = {
    path: "/api/mcp/component-source",
    method: "POST",
    apiKey,
    body: requestBody,
  };

  let response: Response;
  try {
    response = await dispatcher(dispatchRequest);
  } catch (error) {
    if (!isTransientNetworkFailure(error)) throw error;
    response = await dispatcher(dispatchRequest);
  }

  if (!response.ok) {
    const details = await parseErrorDetails(response);
    const message = SOURCE_MESSAGES[response.status] ?? `Source request failed (${response.status}).`;
    throw new HigherBitsToolError(message, details);
  }

  return {
    content: [{ type: "text", text: JSON.stringify(await response.json()) }],
  };
}

function toErrorResult(
  error: unknown,
  toolName: string,
  prefixToolName = true,
): CallToolResult {
  const message = error instanceof Error ? error.message : "Request failed";
  const details = error instanceof HigherBitsToolError ? error.details : undefined;
  return {
    content: [
      {
        type: "text",
        text: prefixToolName ? `Error executing ${toolName}: ${message}` : message,
      },
    ],
    isError: true,
    ...(details?.reason
      ? {
          structuredContent: {
            error: details.reason,
            ...(details.retryAfter === undefined
              ? {}
              : { retryAfter: details.retryAfter }),
          },
        }
      : {}),
  };
}

export function createHigherBitsMcpServer(
  apiKey: string,
  dispatcher: HigherBitsApiDispatcher = DEFAULT_DISPATCHER,
): Server {
  const server = new Server(
    { name: "@higherbits-dev/cli", version: "1.0.0" },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [SOURCE_TOOL, SEARCH_TOOL],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === SOURCE_TOOL.name) {
      try {
        return await handleSource(request.params.arguments, apiKey, dispatcher);
      } catch (error) {
        return toErrorResult(error, SOURCE_TOOL.name, false);
      }
    }

    if (request.params.name === SEARCH_TOOL.name) {
      try {
        const query = parseSearchQuery(request.params.arguments);
        return await handleSearch(query, apiKey, dispatcher);
      } catch (error) {
        return toErrorResult(error, SEARCH_TOOL.name);
      }
    }

    throw new Error("Tool not found");
  });

  return server;
}
