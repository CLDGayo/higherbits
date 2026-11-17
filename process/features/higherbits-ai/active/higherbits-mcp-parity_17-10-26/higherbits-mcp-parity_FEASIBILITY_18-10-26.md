---
slug: higherbits-mcp-parity
date: 2026-10-18
verdict: VIABLE
originating-phase: pvl
---

TL;DR: The pinned SDK completes initialize, tools/list, and both tool calls with a fresh stateless server transport per local HTTP request. GET opens SSE; DELETE closes only its own transport.

## Hypothesis

The lockfile-pinned `@modelcontextprotocol/sdk` 1.29.0 can run a stateless Streamable HTTP handler with a real SDK Client over local Request/Response dispatch, completing initialize, tools/list, and tool calls; GET and DELETE behavior can be characterized.

## Mechanism Under Test

`WebStandardStreamableHTTPServerTransport` with `sessionIdGenerator: undefined`, driven by the SDK `Client` and `StreamableHTTPClientTransport`, with each local fetch request dispatched to a newly constructed SDK `Server` and server transport.

## Probe Family

`1 — Local process / Node script`.

## Probe Cost Class

`cheap-local`. The safety gate was met: Node 22.22.2 used the already-installed local SDK 1.29.0; no external network, service, provider, database, or container was used. The target worktree has no `node_modules`, so the installed copy was resolved from the primary checkout's pnpm store. The target worktree lock resolves `^1.0.4` to `1.29.0(zod@3.25.76)`.

## Probe Method

- Ran an inline `node --input-type=module` script from `packages/ai`; no scratch file or repository source was written.
- Created an SDK server with stub handlers named `search_higherbits_components` and `get_higherbits_component_source`, plus `WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined })`.
- Configured the real SDK `StreamableHTTPClientTransport` with a local `fetch` function. For every incoming `Request`, the function created a fresh SDK server and transport, called `handleRequest(request)`, and returned its `Response`.
- Connected a real SDK `Client`; completed `connect`, `listTools`, and `callTool` for both stub tools. Then sent direct GET and DELETE requests to fresh stateless transports and checked whether DELETE on a separate fresh transport closed an already-open GET stream.
- No Next.js route, HigherBits tool implementation, build, test suite, server, or live integration was run.
- The requested Graphify query was attempted first but yielded no result; its search stalled in trigram-index construction and was interrupted. The traceback ended in `_trigram_candidates` / `_get_trigram_index` with `KeyboardInterrupt`.

## Evidence Captured

Lockfile evidence: `pnpm-lock.yaml` records `specifier: ^1.0.4` and `version: 1.29.0(zod@3.25.76)`. The imported local package reported `@modelcontextprotocol/sdk` version `1.29.0`.

Actual inline probe output (stub tool results; no HigherBits business logic):

```json
{
  "sdk": { "name": "@modelcontextprotocol/sdk", "version": "1.29.0" },
  "client": {
    "result": {
      "listed": ["search_higherbits_components", "get_higherbits_component_source"],
      "calls": [
        { "name": "search_higherbits_components", "content": [{ "type": "text", "text": "stub:search_higherbits_components" }] },
        { "name": "get_higherbits_component_source", "content": [{ "type": "text", "text": "stub:get_higherbits_component_source" }] }
      ]
    },
    "http": [
      { "method": "POST", "status": 200, "contentType": "text/event-stream", "sessionId": null },
      { "method": "POST", "status": 202, "contentType": null, "sessionId": null },
      { "method": "GET", "status": 200, "contentType": "text/event-stream", "sessionId": null },
      { "method": "POST", "status": 200, "contentType": "text/event-stream", "sessionId": null },
      { "method": "POST", "status": 200, "contentType": "text/event-stream", "sessionId": null },
      { "method": "POST", "status": 200, "contentType": "text/event-stream", "sessionId": null }
    ]
  },
  "direct": {
    "GET": {
      "status": 200,
      "headers": {
        "cache-control": "no-cache, no-transform",
        "connection": "keep-alive",
        "content-type": "text/event-stream"
      },
      "body": "<open stream>"
    },
    "DELETE": { "status": 200, "headers": {}, "body": "<empty>" }
  },
  "separateRequestDelete": {
    "deleteStatus": 200,
    "getStreamPendingBeforeDelete": true,
    "getStreamStillPendingAfterDelete": true
  }
}
```

The SDK implementation in the installed 1.29.0 `server/webStandardStreamableHttp.js` confirms that `handleDeleteRequest` closes its own transport and returns an empty 200 response; `validateSession` skips session validation when `sessionIdGenerator` is undefined (lines 567–588). The separate-transport stream-lifetime result above is empirical.

## Verdict

VIABLE

## Resulting Design Constraint

- **What this licenses:** The plan may use the locked SDK 1.29.0 stateless Web Standard transport and a real SDK Client for initialize, tools/list, and tool calls with fresh server/transport instances per request. Both planned tool names passed protocol-level stub calls.
- **What this forbids:** Do not treat GET as a finite response: it opens a 200 `text/event-stream` that remains open. Do not claim DELETE on a fresh stateless request terminates a GET stream owned by another transport; the observed stream stayed open. Do not infer actual Next.js streaming, cancellation, or HigherBits handler behavior from this probe.
- **What remains uncertain (known-gap):** Next.js route handling and propagation of client disconnect/cancellation remain untested. The probe does not validate real tool handlers, authentication, or server-initiated event delivery. Any implementation exposing GET/DELETE must preserve SDK responses and account for their per-transport stream lifetime.
