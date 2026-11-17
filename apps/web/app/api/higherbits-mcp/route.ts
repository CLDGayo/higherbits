import {
  handleStreamableHttpRequest,
  type HigherBitsApiDispatcher,
  type HigherBitsApiRequest,
} from "@higherbits-dev/cli/http";
import { GET as checkApiKey } from "@/app/api/higherbits-mcp/check/route";
import { POST as searchComponents } from "@/app/api/search/route";
import { POST as getComponentSource } from "@/app/api/mcp/component-source/route";
import {
  CopyError,
  copyErrorResponse,
} from "@/lib/api/server/copy-admission";

const CHECK_URL = "https://higherbits.dev/api/magic/check";
const SEARCH_URL = "https://higherbits.dev/api/search";
const SOURCE_URL = "https://higherbits.dev/api/mcp/component-source";
const QUERY_IDENTITY_KEYS = new Set([
  "api_key",
  "apikey",
  "key",
  "user_id",
  "userid",
]);

function bearerApiKey(request: Request): string {
  const authorization = request.headers.get("authorization");
  const apiKey = authorization?.match(/^Bearer (\S+)$/)?.[1];
  if (
    !apiKey ||
    apiKey.length > 512 ||
    request.headers.has("x-api-key") ||
    [...new URL(request.url).searchParams.keys()].some((key) =>
      QUERY_IDENTITY_KEYS.has(key.toLowerCase()),
    )
  ) {
    throw new CopyError(401, "invalid_identity");
  }
  return apiKey;
}

function createInternalRequest(
  url: string,
  request: HigherBitsApiRequest,
): Request {
  return new Request(url, {
    method: request.method,
    headers: {
      Authorization: `Bearer ${request.apiKey}`,
      "Content-Type": "application/json",
    },
    body: request.body,
  });
}

const dispatchFirstPartyRoute: HigherBitsApiDispatcher = async (request) => {
  switch (request.path) {
    case "/api/search":
      return searchComponents(createInternalRequest(SEARCH_URL, request));
    case "/api/mcp/component-source":
      return getComponentSource(createInternalRequest(SOURCE_URL, request));
  }
};

async function handle(request: Request): Promise<Response> {
  let apiKey: string;
  try {
    apiKey = bearerApiKey(request);
  } catch (error) {
    return copyErrorResponse(error);
  }

  const identityResponse = await checkApiKey(
    new Request(CHECK_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
  );
  if (!identityResponse.ok) return identityResponse;

  return handleStreamableHttpRequest(
    request,
    apiKey,
    dispatchFirstPartyRoute,
  );
}

export const GET = handle;
export const POST = handle;
export const DELETE = handle;
