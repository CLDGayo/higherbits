# HigherBits MCP HTTP Facade — Implementation Plan — 17-10-26

**Date**: 17-10-26  
**Current status**: VALIDATE accepted CONDITIONAL per authoritative V6; the user's later resume request explicitly authorizes continuing EXECUTE within that contract. AC6 remains conditional and AC8 remains unproven.
**Complexity**: COMPLEX, single implementation stream (not a phase program).  
**Selected approach:** Add a request-scoped Streamable HTTP facade to the verified HigherBits MCP package, reuse its two tools and existing first-party identity/search/source routes, support API-key Bearer identity only, and keep this facade explicitly legacy-only: MCP SDK 1.29.0 with the `2025-11-25` protocol.

> **Resume checkpoint (2026-10-22):** The authoritative V6 plan in the primary workspace records VALIDATE as **accepted CONDITIONAL, 0 FAILs**. The user's later request to resume and finish the MCP work explicitly authorizes continuing EXECUTE within that contract. This checkpoint supersedes the older `Pending VALIDATE` and “EXECUTE is not authorized” status below for this resumed task; the historical plan content is retained. AC6 stays conditional and does not establish deployed quota/concurrency behavior. AC8 remains unproven until the isolated actual Next/Clerk route E2E, including SSE cancellation, passes. Preserve the existing dirty implementation in this candidate; no production, deployment, package publication, or live-provider work is authorized.

## Overview

At verified source SHA ebd6f6a6e7f8c6879e6b9aacc76be74cf8f7fe00, packages/ai exposes a stdio MCP server with search_higherbits_components and get_higherbits_component_source. The package tests cover tool handlers, but not a real MCP client handshake/list/call over HTTP. This plan adds that transport without claiming parity for unsupported capability categories.

The selected plan, SPEC, and research report were supplied as the authoritative planning inputs from the primary workspace; the plan file was absent from the pinned source tree. They are carried into this isolated checkout as the one authorized plan artifact. No primary application/source changes are used as the implementation baseline. All future implementation must remain at the verified SHA in an isolated checkout.

## Goals and Scope

- Offer the two verified tools through /api/higherbits-mcp using the pinned MCP SDK Streamable HTTP transport.
- Expose the SDK's GET, POST, and DELETE route methods while preserving its method-specific status, headers, and body.
- Preserve tool names, input contracts, API-key Bearer identity, search/source separation, source admission, response limits, notices, and retry identity.
- Prove SDK initialize, tools/list, and tools/call with a real SDK Client and local Request/Response transport; keep this distinct from synthetic route-adapter tests.
- Build and export `@higherbits-dev/cli/http` as a distinct package subpath; prove the emitted HTTP entry imports without starting or importing the stdio CLI.
- Exercise the actual Next route's GET, POST, and DELETE exports, response metadata, SSE stream, and cancellation after implementation. These behaviors are unproven at the pinned baseline.
- Support API-key Bearer identity only. Session-only identity is unsupported; a Clerk session present at the facade boundary may only reject a mismatch and is never fallback identity.
- Pin protocol behavior to the existing MCP SDK v1.29.0 and legacy protocol version `2025-11-25`; test normal legacy initialize/list/call only. Modern `2026-07-28` client interoperability is unverified and deferred; do not add a second SDK version, claim modern support, negotiate modern clients down, or opportunistically upgrade the SDK.
- Keep generation, inspiration, logo search, bookmarks, teams, profile, themes, and templates unadvertised until HigherBits-owned data and access contracts are verified.
- Do not deploy, call live providers, probe 21st.dev, access production data, or modify the primary checkout.

## Architecture and Data Flow

1. A legacy MCP client sends SDK-supported GET, POST, or DELETE requests to `/api/higherbits-mcp` with `Authorization: Bearer <API_KEY>`. The API key is the sole identity. Before MCP tool dispatch, the facade rejects a missing or invalid Bearer credential, an `x-api-key`-only request, cookie/session-only identity, and—only when a Clerk session is present at the Next facade boundary—a Bearer identity that conflicts with the Clerk identity. Clerk is never a fallback identity. Query-string keys and identity in tool arguments are not accepted.
2. The Next route delegates GET, POST, and DELETE to the SDK handler. It creates a fresh MCP Server and stateless WebStandardStreamableHTTPServerTransport per request, adds no session registry or cross-request server state, and returns the SDK response without rewriting its status, headers, or body. The implemented route must be exercised through Next after the pinned-baseline route-absence gap is closed.
3. Shared tool registration in `packages/ai` dispatches search only to `/api/search` and source retrieval only to `/api/mcp/component-source`. The web adapter invokes only those fixed first-party handlers. The only caller header forwarded is `Authorization`; `Cookie`, `Origin`, `Host`, `Forwarded`, every `X-Forwarded-*` header, and all other caller headers are excluded. Internal URLs are fixed and never derived from request headers.
4. API-key identity is resolved through the existing first-party API-key path. If a Clerk session is present at the Next facade boundary, use it only to reject an identity mismatch; never use Clerk as fallback identity. The baseline `copyIdentity()` mismatch rejection is HTTP 401; the actual route must preserve and test that rejection before protected tool dispatch. Never forward Cookie to downstream handlers. Clerk session and cookie identity alone remain unsupported. Do not synthesize, trust, or forward Origin/Host to bypass an identity or origin check. If safe mismatch comparison before dispatch cannot be implemented and tested without forwarding cookies or weakening API-key-only auth, stop and return to VALIDATE; do not weaken the boundary.
5. `/api/search` remains metadata-only and does not consume source-copy allowance. Preserve its `notice` field only when present; do not synthesize an empty notice. `/api/mcp/component-source` remains authoritative for source identity, dependency preparation, the 2 MiB response cap, and admission. Preserve its `notice` field only when present. Any denial returns no protected source.
6. MCP success results retain the established one-text-content-block result shape; source success serializes the first-party result object without dropping fields. Errors use `isError: true` and retain the exact first-party error code and metadata in the text payload. The `copy_limit_reached`, `grant_rate_limited`, and `replay_limit_reached` denials remain distinct; `retryAfter` is retained unchanged when supplied for `grant_rate_limited`. Denials are never retried. Search validates its pinned query schema; source rejects unsupported fields and invalid types before dispatch.
7. This facade is legacy-only: use the existing MCP SDK `1.29.0` with its `2025-11-25` initialize/list/call flow and test that flow. The modern `2026-07-28` era uses `server/discover` and per-request `_meta`; it is not an initialize-version offer and must not be described as negotiating down. Official TypeScript SDK v2 documentation describes auto-mode discovery followed by legacy fallback, but that documents client behavior only: HigherBits has not verified modern-client interoperability, so classify it as not verified/deferred. Do not add a second SDK version, hand-roll modern behavior, upgrade the SDK, or claim modern support or a particular modern-only failure/status.
8. Feasibility boundary at the pinned baseline: SDK `Request`/`Response` initialize/list/call passed only with stubbed downstream handlers. The Next route probe is INCONCLUSIVE because `apps/web/app/api/higherbits-mcp/route.ts` is absent at pinned HEAD. `copyIdentity()` rejects a mismatched Bearer/Clerk identity with 401. No actual Next auth, cookie, cancellation, or SSE behavior has been tested. These remain post-implementation gates, not current proof.

The SDK Client protocol test uses injected dispatch functions and local Request/Response objects, never a live HigherBits service. Synthetic route-adapter tests use mocked first-party handlers. These gates do not prove actual Next route runtime, Clerk context, browser cookies, or live stream/SSE behavior.

## Touchpoints

All implementation changes below are future work in the isolated checkout at the verified SHA. None is authorized by this PLAN update.

- packages/ai/src/index.ts — preserve the stdio entry point while moving shared tool registration/dispatch to a reusable server module.
- packages/ai/src/server.ts — new shared server/tool registration with an injected first-party API dispatcher.
- packages/ai/src/http.ts — new stateless Streamable HTTP handler using the SDK WebStandardStreamableHTTPServerTransport.
- packages/ai/package.json and packages/ai/tsup.config.ts — build `dist/http.js` and its declaration output, export `./http`, and retain the existing root/CLI entry.
- apps/web/package.json and pnpm-lock.yaml — add the workspace dependency on @higherbits-dev/cli; add a direct SDK dev dependency only if required by web test imports.
- apps/web/app/api/higherbits-mcp/route.ts — new thin Next route exporting GET, POST, and DELETE; enforce API-key Bearer identity and delegate to the package subpath using the fixed allowlisted route-handler adapter.
- packages/ai/__tests__/index.test.ts — extend the package suite with SDK Client/HTTP transport proof, protocol negotiation, stdio regression, exact tool descriptions/schemas, conditional notice, and denial/retry cases.
- apps/web/app/api/higherbits-mcp/__tests__/streamable-http.test.ts — new route-adapter tests with mocked first-party handlers; do not modify or overwrite any primary-checkout route test.
- apps/web/app/api/higherbits-mcp/__tests__/route.integration.test.ts — new integration tests importing the actual Next route exports and invoking GET/POST/DELETE with local Request/Response objects.
- apps/web/e2e/higherbits-mcp-http.spec.ts — new local Next runtime gate for actual route response metadata, SSE framing, stream cancellation, and no external service calls.
- Existing dependencies, not planned edits: apps/web/app/api/magic/check/route.ts, apps/web/app/api/search/route.ts, apps/web/app/api/mcp/component-source/route.ts, apps/web/lib/api/server/copy-identity.ts, copy-source.ts, and copy-admission.ts.

The pinned packages/ai manifest names @higherbits-dev/cli, uses vitest run, and depends on @modelcontextprotocol/sdk. Preserve the existing SDK major/version range; do not add a second SDK version.

## Public Contracts

- Endpoint: /api/higherbits-mcp implements the pinned SDK's GET, POST, and DELETE method surface. It is not POST-only. The Next route delegates each method to the SDK handler and preserves the SDK's status, headers, and body.
- Advertised tools: exactly search_higherbits_components and get_higherbits_component_source until additional first-party contracts are proven.
- Identity: `Authorization: Bearer <API_KEY>` is the sole supported facade identity. Reject missing/invalid Bearer, `x-api-key`-only, query-key, tool-argument identity, and cookie/session-only identity. If a Clerk session is present at the Next facade boundary, it may only reject a mismatch; it must never provide fallback identity. The baseline mismatch response is HTTP 401, which the actual route must preserve and test before protected dispatch. Forward only `Authorization`; never forward `Cookie`, `Origin`, `Host`, `Forwarded`, or any `X-Forwarded-*` header.
- Search schema: preserve the pinned CLI contract—an object with required string `query`; do not add stricter additional-property rules or other new constraints. Missing/non-string query fails before dispatch. Successful output is one MCP text content block containing metadata only; preserve the upstream `notice` field only when present. Search never returns source or consumes source-copy allowance.
- Source schema: one object with required safe-integer `componentId`, optional safe-integer `demoId`, optional UUID `requestId`, and `additionalProperties: false`. Reject `userId`, entitlement fields, invalid types/IDs/UUIDs, and all unknown fields before dispatch. Successful output is one MCP text content block containing the serialized first-party source result, including files, dependencies, and `notice` only when supplied. Denial output has `isError: true`, preserves the first-party error code/metadata, and contains no protected source.
- Tool descriptions and schemas are shared between HTTP and stdio. Preserve tool names and accepted input contracts; descriptions must not assert unverified quota amounts, grant behavior, replay guarantees, or retry safety.
- HTTP response preservation: for GET, POST, and DELETE, preserve the SDK handler's status, headers, and body byte-for-byte at the Next route boundary, including content type and SSE event framing. Do not wrap or normalize SDK responses.
- Preserve the distinct first-party 429 denial codes copy_limit_reached, grant_rate_limited with retryAfter, and replay_limit_reached. Return each as a distinct MCP error and retain retryAfter for grant_rate_limited. No denial may include protected source or trigger a retry.
- Retry only one transient network exception and reuse the exact request UUID/body. Do not retry non-OK HTTP responses, authorization failures, entitlement denials, quota denials, or replay denials.
- Keep API-key validation and copy/source authorization server-side. Clerk may only be consulted at the facade boundary to reject a mismatch when a session is present; it is never fallback identity, and no cookie is forwarded downstream. Do not claim actual Next stream, cookie, or Clerk behavior from SDK Request/Response tests.
- No API key in URL/query, caller-selected upstream URL, caller-derived internal destination, or identity sourced from tool arguments.

## Blast Radius

- packages/ai: shared handler registration, CLI compatibility, package exports/build, SDK transport, and package tests.
- apps/web: one API route, workspace dependency/lockfile, and route-adapter tests.
- Existing /api/search, /api/mcp/component-source, identity, source preparation, and admission contracts are dependencies, not planned edits.
- No UI, schema, database, quota RPC, or deployment changes are in scope. If any required proof depends on changing those surfaces, stop for revised scope and approval.
- New work is limited to the package HTTP entry, its exports/build, the new MCP Next route, and the named tests. Existing `/api/higherbits-mcp/check` and `/api/higherbits-mcp/use` routes and compatibility tests remain outside the rollback set.

## Security Review

Plan-level STRIDE review of the proposed flow:

- Spoofing/elevation: API key is the sole identity; reject missing/invalid Bearer, `x-api-key`-only, session/cookie-only, and tool-argument identity. If Clerk session exists at the facade boundary, use it only to reject a mismatch (baseline mismatch response 401), never as fallback identity. Reject before protected dispatch and never forward Cookie.
- Tampering/SSRF: validate tool schemas and IDs; dispatch only to fixed first-party handlers; forward `Authorization` only; never forward `Cookie`, `Origin`, `Host`, `Forwarded`, or `X-Forwarded-*`; never create a destination from caller-controlled headers.
- Information disclosure: search returns metadata and its notice only; source is returned only on allowed admission; all denial results omit protected source.
- Denial of service: preserve source caps and existing admission boundaries; do not retry 429 denials; cap transient retry at one attempt with the same UUID.
- Repudiation/state: preserve request UUIDs and do not claim quota, concurrency, idempotency, or grant semantics that have not been verified.
- Clerk context: API key remains the sole identity; a present Clerk session is only a mismatch check, never a fallback. Session-only requests are rejected and Cookie is never forwarded. The baseline helper rejects a mismatch with 401, but actual Next Clerk/cookie behavior is unverified; prove the comparison and rejection through deterministic local fixtures after the route exists. If safe comparison before dispatch cannot be implemented and tested without forwarding Cookie or weakening auth, stop and return to VALIDATE. Do not fabricate Origin/Host or widen the facade to session auth.
- Next transport: direct SDK Request/Response tests do not prove Next route dispatch, status/header/body preservation, SSE framing, cancellation, Clerk context, or cookie behavior. Require the actual-route integration and local Next runtime gates before completion.
- Protocol boundary: SDK 1.29.0 is used only for the legacy `2025-11-25` flow; prove normal legacy initialize/list/call. Modern `2026-07-28` uses `server/discover` and per-request `_meta`, not an initialize request. The official SDK v2 auto-mode fallback documentation is not evidence that HigherBits interoperability works; modern-client interoperability remains unverified/deferred, with no failure shape or HTTP status claimed.

## Risk Predictions and Scenarios

**Prediction: CAUTION.** The API-key-only design is bounded, but the Next/Clerk/streaming boundary remains unproven and must not be described as validated.

- Architect: route-method and package-export mismatch can leave a built package that works in tests but cannot be imported by the web app. Require build output, export resolution, and CLI-import-isolation checks before web tests.
- Security: accepting a Clerk cookie or forwarding caller Origin/Host can bypass or misapply same-origin checks. Support only the API-key Bearer path and assert that no caller-controlled origin/host/cookie reaches internal dispatch.
- Performance: retries can double-spend source admission if the UUID changes. Retry one transient transport exception only, with an identical body and UUID.
- UX: collapsing all 429 responses into one generic error loses the reason and retry timing. Keep the three denial codes distinct and preserve retryAfter.
- Devil's advocate: a route test that only constructs Request/Response objects can be mistaken for a Next streaming proof. Label each evidence boundary and keep actual Next/Clerk/cookie/stream claims unproven.

High-risk scenarios to cover:

1. A valid API-key Bearer request reaches only allowlisted handlers. Missing/invalid Bearer, `x-api-key`-only, and cookie/session-only requests reject before protected dispatch. When Clerk session exists at the facade boundary, it can only reject a mismatch (baseline mismatch rejection is 401), never supply fallback identity; no Cookie reaches downstream handlers.
2. No caller `Cookie`, `Origin`, `Host`, `Forwarded`, or `X-Forwarded-*` header reaches internal dispatch, and no internal destination is derived from them.
3. `copy_limit_reached`, `grant_rate_limited` with its original `retryAfter`, and `replay_limit_reached` remain distinct; each denial is marked as an MCP error, includes no protected source, and causes exactly one source request.
4. Search/source results preserve the exact first-party payload fields and conditional `notice`; missing notice remains absent. Search preserves the pinned required-string `query` schema; source rejects extra properties and invalid types before dispatch.
5. A transient network exception retries exactly once with byte-identical serialized body and UUID; non-OK responses, all denials, and invalid credentials never retry.
6. SDK Client initialize/list/call succeeds in local Request/Response transport with stubbed downstream handlers. This does not prove Next route runtime, Clerk/cookie behavior, cancellation, or SSE.
7. The actual Next route integration exercises GET/POST/DELETE and checks exact SDK status, headers, and body. A separate local Next runtime test checks SSE framing and cancellation; neither gate may be inferred from the SDK-only test.
8. The package HTTP subpath builds and resolves without importing or starting the stdio CLI; stdio tool listing, descriptions, schemas, and invocation remain compatible.
9. The existing SDK `1.29.0` completes normal legacy `2025-11-25` initialize/list/call. Modern `2026-07-28` interoperability (`server/discover` and per-request `_meta`) is not verified and deferred; the official SDK v2 auto-mode fallback documentation does not prove HigherBits compatibility. Do not model modern behavior as initialize negotiation or claim downgrade.
10. Repeated/concurrent admission behavior remains unprobed under the user's explicit choice; no quota, grant, concurrency, idempotency, or retry-safety guarantee is asserted.

## Acceptance Criteria

- **AC1 — proven by: G-AC1-SDK-HTTP, G-NEXT-ROUTE-INTEGRATION, G-NEXT-STREAM-SSE, G-PACKAGE-EXPORT, and G-STDIO-REGRESSION; strategy: Hybrid.** The existing SDK v1.29.0 Client completes legacy `2025-11-25` initialize, tools/list, and callTool for both advertised tools through local Request/Response handling. The actual Next route exposes GET/POST/DELETE and preserves status, headers, and body; the local Next runtime gate proves SSE framing and cancellation. Modern-client interoperability is not verified and is deferred; SDK-only proof is insufficient for route completion.
- **AC2 — proven by: G-AC2-SEARCH and G-TOOL-SCHEMA-DESCRIPTIONS; strategy: Fully-Automated.** Valid search returns metadata and preserves `notice` only when present; missing/non-string query and no-match results are clear; source dispatch is not called and no source allowance is consumed.
- **AC3 — proven by: G-AC3-SOURCE, G-API-KEY-IDENTITY, and G-TOOL-SCHEMA-DESCRIPTIONS; strategy: Fully-Automated.** Allowed retrieval returns source, required dependencies, and conditional `notice`. Denied retrieval preserves the exact denial code/metadata and returns no protected source. Existing API-key identity, preparation, dependency closure, cap, and admission remain authoritative.
- **AC4 — proven by: G-AC4-ERROR-RETRY, G-API-KEY-IDENTITY, and G-NEXT-ROUTE-INTEGRATION; strategy: Fully-Automated.** Tests distinguish `copy_limit_reached`, `grant_rate_limited` with unchanged `retryAfter`, and `replay_limit_reached`; denials are not retried and contain no protected source. Only one transient network exception retries, with the same UUID/body. Missing/invalid Bearer, `x-api-key`-only, cookie/session-only, a present Clerk-session mismatch, and malformed arguments fail before protected dispatch; Clerk is never fallback identity and no Cookie is forwarded.
- **AC5 — proven by: G-AC5-CAPABILITY-LIST and G-TOOL-SCHEMA-DESCRIPTIONS; strategy: Fully-Automated.** HTTP and stdio advertise the same two supported HigherBits actions, descriptions, and schemas. No generation, inspiration, logo, bookmark, team, profile, theme, or template capability is added without its own first-party data/access contract and separately approved scope.
- **AC6 — proven by: G-AC6-HYBRID-ADMISSION; strategy: Hybrid.** User-approved conditional known gap: the user explicitly chose to leave AC6 unprobed. Do not claim verified quota, grant, concurrency, idempotency, retry, or deployed database semantics. Keep this gate CONDITIONAL and NOT PASSABLE until its prerequisites are met. Record the future test-building backlog target as process/features/higherbits-ai/backlog/higherbits-mcp-ac6-admission-proof_NOTE_18-10-26.md; do not create it in this plan-only update. Minimum prerequisites: authoritative RPC/function and grant source at the chosen revision; an isolated disposable local database fixture with no production data; deterministic sequential-replay and concurrent-admission scenarios; assertions for the exact denial codes and retryAfter; and separate authorization before any live/deployed probe.
- **AC7 — proven by: G-AC7-ACCESSIBILITY; strategy: Agent-Probe.** Not triggered unless this implementation changes a setup/account screen. If no such screen changes, record not triggered with the scoped diff. If one changes, complete keyboard, focus, announcement, and screen-reader probing before claiming AC7.

## Implementation Checklist

1. Confirm or recreate the managed isolated checkout at `ebd6f6a6e7f8c6879e6b9aacc76be74cf8f7fe00`. The current checkout path is `/Users/clarencelloydgayo/.codex/worktrees/higherbits-ai-plan-p1-p7/HigherBits.dev`, detached at that SHA. Verify the SHA before implementation; do not use the primary checkout.
2. Extract shared tool schemas, descriptions, and handlers into `packages/ai/src/server.ts` behind an injected first-party dispatcher; retain stdio startup, API-key validation, tool behavior, and root entry compatibility in `packages/ai/src/index.ts`.
3. Add `packages/ai/src/http.ts` with the pinned SDK stateless Streamable HTTP handler. Create fresh server/transport instances per request; expose GET/POST/DELETE without adding session state.
4. Update `packages/ai/package.json` and `packages/ai/tsup.config.ts` so the build emits `dist/http.js` and declaration output, exports `./http`, and retains the root/CLI export. Assert importing `@higherbits-dev/cli/http` does not import or start `src/index.ts`, validate an API key, or connect stdio.
5. Confirm the lockfile resolves `@modelcontextprotocol/sdk` to exactly `1.29.0`. Keep the facade legacy-only at `2025-11-25`; add no SDK or protocol upgrade and no modern-protocol claim.
6. Add the `apps/web` workspace dependency and lockfile update, then add `apps/web/app/api/higherbits-mcp/route.ts`. Require valid `Authorization: Bearer` as the sole identity; reject missing/invalid Bearer, `x-api-key`-only, and cookie/session-only requests before protected tool dispatch. If a Clerk session is present at the facade boundary, use it only to reject a Bearer identity mismatch, never as fallback identity; preserve/test the baseline mismatch 401. Forward only Authorization; exclude Cookie, Origin, Host, Forwarded, and every X-Forwarded-* header. If safe mismatch comparison cannot be implemented and tested without forwarding cookies or weakening auth, stop and return to VALIDATE.
7. Extend `packages/ai/__tests__/index.test.ts` with the existing SDK v1.29.0 Client and StreamableHTTPClientTransport round trip through local Request/Response handling with stubbed dispatch. Assert normal legacy `2025-11-25` initialize, exactly two tools, descriptions, exact schemas, and both callTool results. Do not add a second SDK version, use a live service, or rely only on InMemoryTransport. Record modern `2026-07-28` client interoperability as unverified/deferred; the official SDK v2 auto-mode fallback documentation is background only, not a HigherBits test result.
8. Add `apps/web/app/api/higherbits-mcp/__tests__/streamable-http.test.ts` for the route adapter and `route.integration.test.ts` for the actual route exports. Cover GET/POST/DELETE delegation; exact SDK status/header/body preservation; allowlisted handlers and fixed destinations; API-key-only identity; missing/invalid Bearer, `x-api-key`-only and cookie/session-only rejection; Clerk session absent/present with matching/mismatching identity (session only rejects mismatch, never fallback); no Cookie or other forbidden header forwarding; and rejection before protected dispatch. Stop if the safe mismatch check cannot be implemented/tested.
9. Extend package tests for conditional notice preservation, exact success/error result shapes, pinned search/source schema constraints, metadata/source separation, the three distinct 429 codes, unchanged `retryAfter`, denial source absence, no denial retry, and one transient retry with the identical UUID/body. Add a stdio regression proving the CLI command still starts only through its existing entry and continues to advertise and call the same tools.
10. Add `apps/web/e2e/higherbits-mcp-http.spec.ts` as the actual local Next runtime gate. With a local-only deterministic dispatcher and no live service/database, exercise GET/POST/DELETE and assert status, headers, and body; exercise an MCP SSE response, consume its event framing, then cancel the stream and assert clean termination. Include valid Bearer, missing/invalid Bearer, cookie/session-only, and mismatched Clerk identity scenarios; denial responses must contain no protected source.
11. Run and require G-PACKAGE-EXPORT before web tests: verify `dist/http.js` and declarations exist, `./http` resolves from the web workspace, and import isolation does not start stdio. Run package build as a standalone command: `corepack pnpm --filter @higherbits-dev/cli build`.
12. Run package tests as a standalone command: `corepack pnpm --filter @higherbits-dev/cli test`.
13. Run web tests as a standalone command after package build/export/import-isolation and package tests: `corepack pnpm --filter web test`. Run the local Next SSE gate separately with `corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-http.spec.ts`. Do not combine commands with a shell pipe.
14. Before the local Next runtime gate, provide a format-valid test Clerk publishable key required by the Next test server, use only deterministic local/test credentials, and stub every downstream call so no provider, production database, or deployed service is contacted. Record cancellation/SSE evidence from that server; Vitest or SDK Request/Response results alone do not satisfy this gate.
15. Keep AC6 conditional and unprobed; leave AC7 not triggered unless a setup/account screen changes. If implementation requires session auth, caller-derived/forwarded headers, cookie forwarding, edits to existing admission/RPC contracts, or other out-of-scope files, stop and return to VALIDATE.

## Dependencies and Compatibility

- The verified source SHA and package manifests are the only application-code baseline. The primary checkout is not a baseline and must remain untouched.
- `@higherbits-dev/cli` already depends on `@modelcontextprotocol/sdk`; the pinned lock resolution must remain exactly `1.29.0`. The web app must import the declared HTTP subpath rather than relying on transitive dependency visibility.
- Protocol policy: this facade supports only the existing MCP SDK `1.29.0` / legacy `2025-11-25` initialize flow. Test normal legacy initialize/list/call. Modern `2026-07-28` uses `server/discover` and per-request `_meta`; HigherBits interoperability is unverified and deferred, not a required gate or supported claim.
- Official protocol references: [MCP 2026-07-28 protocol-era announcement](https://blog.modelcontextprotocol.io/posts/2026-07-28/) describes modern discovery and per-request metadata; [TypeScript SDK v1 documentation](https://ts.sdk.modelcontextprotocol.io/) identifies v1 as the legacy line through `2025-11-25`; [TypeScript SDK v2 protocol-version guidance](https://ts.sdk.modelcontextprotocol.io/v2/protocol-versions) documents modern auto-mode discovery and legacy fallback. The v2 documentation describes client behavior only and does not verify HigherBits interoperability.
- Keep the existing stdio command, tool names, argument schemas, API paths, response/error semantics, and source cap compatible. Add HTTP as an additional transport. Both transports use the same tool descriptions and schemas; descriptions make no unverified quota, grant, replay, or retry-safety claims.
- Do not remove or alter `/api/higherbits-mcp/check`, `/api/higherbits-mcp/use`, their compatibility tests, `/api/magic/check`, or `/api/magic/use` as part of this facade.
- Search and source remain separate operations with separate admission semantics. Existing first-party search/source routes remain authoritative.
- No migration is planned. If package exports, the API-key path, or adapter tests require changes outside the listed touchpoints, stop for plan revision.
- The distinct 429 codes named by AC4 are contract assertions, not permission to edit shared database/RPC behavior. If they are absent at the pinned first-party boundary, stop and return the discrepancy for scope review.

## Failure Modes and Rollback

- **HTTP export imports CLI side effects:** G-PACKAGE-EXPORT fails before web tests. Roll back only the new HTTP entry, export/build changes, web dependency/route, and their new tests; preserve the stdio entry and behavior.
- **SDK method/transport mismatch:** the SDK Client, actual Next route, or SSE/cancellation gate fails. Do not ship based on SDK-only or synthetic adapter proof; retain the old package entry and return to plan review if the pinned SDK contract differs.
- **Identity/source bypass or source leak:** fail AC3/AC4 immediately. Roll back the route adapter and package facade together. Do not change copy admission to make the gate pass.
- **Origin/Host/session dependency:** if the adapter requires caller-derived or forwarded Origin/Host, forwarding cookies, Clerk as fallback/session identity, or any non-Bearer identity path, stop. If the required mismatch-only Clerk comparison cannot be safely implemented/tested at the facade boundary, stop and return to VALIDATE. No auth weakening is authorized.
- **429 codes are conflated or retried:** fail G-AC4. Preserve the existing first-party boundary; do not modify RPC/database behavior in this scope.
- **Workspace build/resolution failure:** roll back package exports/build metadata, web dependency/lockfile, route adapter, and associated tests as one coherent HTTP-facade change unit.
- **File-scoped rollback boundary:** revert only the HTTP facade files introduced by this plan: shared server refactor as needed, `packages/ai/src/http.ts`, package build/export metadata, `apps/web/package.json`, the associated lockfile delta, the new `/api/higherbits-mcp` root route, and the new tests. Preserve `packages/ai/src/index.ts` stdio startup/compatibility, `/api/higherbits-mcp/check` and `/use`, `/api/magic/check` and `/use`, and all existing compatibility tests. Do not use a whole-worktree reset or revert unrelated hunks in shared files.
- **Checkout recovery and integration:** keep the managed worktree at the verified SHA and preserve its snapshot if a session is interrupted. On recovery, restore/reattach the managed worktree or create a fresh isolated worktree at the same SHA, then verify HEAD before resuming. Review the isolated diff before any integration. No primary-checkout reset, stash, cherry-pick, backport, or deployment is authorized. A future backport requires separate user authorization and a reviewed selective patch; do not merge or cherry-pick this work implicitly.

## Verification Evidence

Baseline evidence boundary: SDK `Request`/`Response` initialize/list/call passed only with stubbed downstream handlers; the Next route probe is INCONCLUSIVE because the route is absent at pinned HEAD; `copyIdentity()` rejects mismatched Bearer/Clerk identity with 401; no actual Next auth, cookie, cancellation, or SSE behavior has been tested. Do not describe any route/Clerk/cookie/stream behavior as proven at baseline.

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| G-AC1-SDK-HTTP: existing SDK v1.29.0 Client completes legacy `2025-11-25` initialize → tools/list → callTool over local Request/Response; both tools return valid results | Fully-Automated | AC1 |
| G-AC2-SEARCH: valid/invalid/no-match inputs; metadata-only response; preserve notice when present; source dispatcher not called | Fully-Automated | AC2 |
| G-AC3-SOURCE: allowed source/dependency/notice response and denied response without protected source | Fully-Automated | AC3 |
| G-AC4-ERROR-RETRY: distinct copy_limit_reached, grant_rate_limited/retryAfter, replay_limit_reached; no retry on denial; one transient retry with same UUID/body | Fully-Automated | AC4 |
| G-AC5-CAPABILITY-LIST: exact two-tool inventory; unsupported categories absent | Fully-Automated | AC5 |
| G-TOOL-SCHEMA-DESCRIPTIONS: HTTP and stdio expose identical tool names, descriptions, required fields, and types; preserve the pinned search schema and strict source schema; no unverified quota/grant/replay/retry guarantees appear | Fully-Automated | AC1, AC2, AC3, AC5 |
| G-API-KEY-IDENTITY: valid Bearer is sole identity; missing/invalid Bearer, `x-api-key`-only, and cookie/session-only reject before protected dispatch; present Clerk session only rejects mismatch (baseline 401), never supplies fallback identity; no Cookie or other forbidden header is forwarded | Fully-Automated | AC3, AC4 |
| G-ROUTE-ADAPTER: synthetic GET/POST/DELETE delegation; exact SDK status/headers/body preserved; only allowlisted handlers called; does not substitute for actual Next route proof | Fully-Automated | AC1, AC2, AC3, AC4 |
| G-NEXT-ROUTE-INTEGRATION: invoke actual imported Next GET/POST/DELETE exports; assert method-specific SDK status, headers, and body plus auth rejection ordering | Hybrid | AC1, AC4 |
| G-NEXT-STREAM-SSE: run the implemented route in the local Next runtime; assert SSE content type/framing and clean client cancellation/stream termination | Hybrid | AC1 |
| G-STDIO-REGRESSION: CLI entry still validates API_KEY and connects stdio only when started; same tools, descriptions, schemas, and call behavior remain available | Fully-Automated | AC1, AC5 |
| G-PACKAGE-EXPORT: build emits HTTP JS/declarations; `./http` resolves; importing it does not execute stdio or CLI startup | Fully-Automated | AC1 |
| G-AC6-HYBRID-ADMISSION: safe local authoritative replay/concurrency proof; remains conditional until prerequisites exist | Hybrid | AC6 |
| G-AC7-ACCESSIBILITY: scope check; if setup/account UI changes, keyboard/focus/announcement/screen-reader probe | Agent-Probe | AC7 |

### Post-Implementation Next Route Gate Prerequisites

- `apps/web/app/api/higherbits-mcp/route.ts` exists at the pinned implementation checkout and exports GET, POST, and DELETE; the test imports this actual module rather than testing only a synthetic adapter.
- The Vitest integration uses local Request/Response objects, deterministic Clerk `auth()` fixtures, and a stubbed first-party dispatcher. It covers missing/invalid Bearer, `x-api-key`-only, cookie/session-only, no Clerk session, present matching Clerk session, present mismatched Clerk session (preserve baseline 401), rejection before protected dispatch, and the exact no-forward header list. Assert Cookie is never forwarded in every case. No real API key, production data, or live service is used.
- The local Next runtime gate runs against the actual route with a format-valid test `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` required by the web test server. Every upstream call is stubbed or injected locally. No production Clerk key, provider, deployed endpoint, or production database is contacted.
- GET/POST/DELETE assertions capture exact status, headers, and body from the SDK response. The SSE case negotiates an event-stream response, verifies the event framing and content type, aborts the client stream, and verifies server-side termination. This gate is distinct from the SDK Request/Response test and the route-adapter unit test.
- If the required local Next server, deterministic dispatcher, valid test-format Clerk key, or cancellation-capable harness is unavailable, mark G-NEXT-STREAM-SSE CONDITIONAL and do not claim AC1 complete. Do not replace it with an SDK-only or synthetic adapter pass.

Required future command order; execute each on its own, never as a shell pipeline:

1. corepack pnpm --filter @higherbits-dev/cli build
2. corepack pnpm --filter @higherbits-dev/cli test
3. corepack pnpm --filter web test
4. corepack pnpm --filter web exec playwright test e2e/higherbits-mcp-http.spec.ts

Before command 3, verify G-PACKAGE-EXPORT from command 1 and its package test. The local Next runtime gate in command 4 requires the prerequisites above. These gates are sequential. No test, build, service start, provider request, database operation, or deployment is performed during this PLAN update.

## Test Infra Improvement Notes

- The pinned test context at process/context/tests/all-tests.md describes Vitest in apps/web and a node --test smoke test in packages/db, but omits packages/ai. The pinned packages/ai/package.json supplies the exact package commands: corepack pnpm --filter @higherbits-dev/cli build and corepack pnpm --filter @higherbits-dev/cli test. The web test command is corepack pnpm --filter web test.
- Context routing was followed from process/context/all-context.md to process/context/tests/all-tests.md; that test router has no deeper package/AI test guide.
- `packages/ai` is omitted from `process/context/tests/all-tests.md`. Record this omission for a separate, explicitly authorized UPDATE PROCESS/context-maintenance task; do not edit any context document in this plan update. Run `vc-audit-context` only in that separately authorized task.
- AC6's local database/admission test infrastructure is a user-approved conditional known gap. Its intended backlog target and minimum prerequisites are recorded under AC6; no backlog artifact is written in this plan-only scope.
- At baseline, the SDK lifecycle was exercised only with stubbed downstream handlers; the Next route probe was INCONCLUSIVE because the route was absent; `copyIdentity()` returned 401 for mismatched Bearer/Clerk identity; no actual Next auth, cookie, cancellation, or SSE behavior was tested. The post-implementation gates and prerequisites above are mandatory.
- Synthetic route tests do not prove actual Next/Clerk/stream/cookie behavior. Clerk session identity is unsupported; do not infer it from API-key or Request/Response tests.

## Phase Completion Rules

- Completion requires AC1–AC5, G-ROUTE-ADAPTER, G-NEXT-ROUTE-INTEGRATION, G-NEXT-STREAM-SSE, G-STDIO-REGRESSION, and G-PACKAGE-EXPORT to pass. G-PACKAGE-EXPORT is a hard completion gate and cannot be waived by a package test pass.
- AC7 is not triggered when no setup/account screen changes; if such a screen changes, its Agent-Probe must pass before completion.
- AC6 remains CONDITIONAL and NOT PASSABLE under the user's explicit choice. A conditional known gap is not evidence of quota, grant, concurrency, idempotency, retry, or deployed database semantics.
- Baseline feasibility remains bounded: SDK initialize/list/call passed only with stubbed downstream handlers; the Next route probe is INCONCLUSIVE because the route is absent at pinned HEAD; `copyIdentity()` rejects mismatched Bearer/Clerk identity with 401; actual Next auth/cookie/cancellation/SSE behavior has not been tested. Do not claim any of those runtime behaviors until their named post-implementation gates pass.
- Do not claim actual Next stream/SSE, Clerk context, or cookie behavior from SDK Request/Response or synthetic adapter evidence. Clerk may only reject a mismatch when present; if this cannot be proven safely, stop rather than weaken auth.
- VALIDATE must approve the scope and evidence contract before EXECUTE. EXECUTE also requires explicit user authorization.
- Any need to alter shared copy-admission contracts, schema/database behavior, UI, or deployment requires stopping for revised plan and approval.

## Validate Contract

**Accepted CONDITIONAL in authoritative V6 (0 FAILs).** The local plan text below predates that decision. Its accepted conditions remain binding: keep AC6 conditional; do not claim actual Next/Clerk identity, cookie, SSE, or cancellation behavior until the isolated actual-route E2E passes; preserve API-key-only identity and the listed package/stdio contracts. The latest user instruction supplies the separate EXECUTE authorization required by V6.

## Resume and Execution Handoff

- **Selected plan:** /Users/clarencelloydgayo/.codex/worktrees/higherbits-ai-plan-p1-p7/HigherBits.dev/process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/higherbits-mcp-parity_PLAN_17-10-26.md.
- **Next phase:** Continue EXECUTE under the explicit user authorization in the resumed task, constrained by the accepted CONDITIONAL contract.
- **Pinned baseline:** ebd6f6a6e7f8c6879e6b9aacc76be74cf8f7fe00.
- **Isolated checkout:** /Users/clarencelloydgayo/.codex/worktrees/higherbits-ai-plan-p1-p7/HigherBits.dev; detached HEAD at the pinned SHA; no branch created. Verify the path and SHA before resuming. The authoritative plan/SPEC/research inputs were read from the user-designated task folder; no primary application/source changes were used as baseline.
- **Context Envelope (canonical order):** feature higherbits-ai → phase PLAN → session-goal apply final plan corrections in staging and integrate the revised artifact into the isolated candidate; no source edits/builds/app tests → branch detached at ebd6f6a6e7f8c6879e6b9aacc76be74cf8f7fe00 → worktree /Users/clarencelloydgayo/.codex/worktrees/higherbits-ai-plan-p1-p7/HigherBits.dev → context-group planning, tests → blast-radius-packages packages/ai, apps/web, pnpm-lock.yaml → active-plan /Users/clarencelloydgayo/.codex/worktrees/higherbits-ai-plan-p1-p7/HigherBits.dev/process/features/higherbits-ai/active/higherbits-mcp-parity_17-10-26/higherbits-mcp-parity_PLAN_17-10-26.md → test-runner corepack pnpm --filter @higherbits-dev/cli test | corepack pnpm --filter web test | corepack pnpm --filter web exec playwright test (display only; execute sequentially) → validate-contract pending VALIDATE; no contract authored.
- **Staging provenance:** /private/tmp/higherbits-mcp-plan-revision/higherbits-mcp-parity_PLAN_17-10-26.md. This is not the authoritative active plan; integrate the revised artifact into the selected isolated candidate path above.
- **Known feasibility boundary:** SDK initialize/list/call passed only through local Request/Response handling with stubbed downstream handlers. The Next route probe is INCONCLUSIVE because `apps/web/app/api/higherbits-mcp/route.ts` is absent at pinned HEAD. `copyIdentity()` rejects mismatched Bearer/Clerk identity with 401. No actual Next auth, cookie, cancellation, or SSE behavior has been tested.
- **Known gaps:** `docs/01-architecture-and-stack.md` remains absent at the pinned source; `packages/ai` is missing from the test-context router and requires a separate authorized UPDATE PROCESS task; AC6 remains user-approved conditional/unprobed; session/cookie identity remains unsupported; actual Next auth/cookie/cancellation/SSE behavior is unproven until its post-implementation gates pass; no live provider or production claim is allowed.
- **Recovery/integration:** preserve or restore this managed isolated worktree and verify the pinned SHA. Do not reset, stash, cherry-pick, or backport to the primary checkout. A future selective backport requires separate explicit approval.

**Next Step:** Finish the authorized local MCP implementation and evidence-backed checks. AC8 still needs the actual isolated Next/Clerk route E2E; if the authorized test-only fixture is unavailable, retain AC8 as conditional and report the exact missing fixture. Keep AC6 conditional and do not perform production, deployment, publication, or live-provider actions.
