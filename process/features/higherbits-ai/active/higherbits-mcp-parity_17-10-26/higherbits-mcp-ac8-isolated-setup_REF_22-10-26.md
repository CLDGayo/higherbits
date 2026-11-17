# AC8 isolated actual-route test setup (22-10-26)

## Purpose and current gate

Prepare the smallest non-production fixture for `G-NEXT-STREAM-SSE` and the actual Next/Clerk MCP route test. The authoritative V6 VALIDATE decision is accepted CONDITIONAL. AC8 remains unproven until the real local Next runtime test observes server-side stream termination; AC6 remains separately CONDITIONAL. No credentials, database, browser session, service, or test run were created by this note.

## What exists

| Resource | Current evidence | Usable for AC8 now? |
| --- | --- | --- |
| Actual MCP route and Playwright spec | `apps/web/app/api/higherbits-mcp/route.ts` and `apps/web/e2e/higherbits-mcp-http.spec.ts` exist in the dirty isolated worktree. The `admin` project is configured only when `HIGHERBITS_E2E_ADMIN_STATE` points to an existing absolute file. | Code exists; fixture gate is absent. |
| Supabase schema/config | Repository migrations and `supabase/config.toml` exist. That config uses project ID `21st`, API port 54321, and DB port 54322. `supabase/seed.sql` does not supply MCP test users or API keys. A separate disposable AC8 project now exists at `/tmp/hb-mcp-ac8-20261022`, project ID `hb-mcp-ac8-isolated-20261022`, API port 54521, DB port 54522. Its minimal identity migration created `users` and `api_keys`; both tables were verified empty. | Dedicated local identity backend is started; no test identities or keys exist yet. |
| Historical disposable AC6 fixture | `/tmp/higherbits-mcp-ac6-goal-20261019-v2` exists, but its recorded API/auth configuration was disabled and it was built for admission tests. | Do not treat as an AC8 fixture or mutate it by assumption. |
| Local tooling | `supabase` and `docker` executable paths were found. Initial sandboxed probes failed at the telemetry path and OrbStack socket. After explicit user approval for isolated setup, narrow escalated checks confirmed CLI 2.118.0 and Docker 29.8.2; the new project was started and its four containers/ports and empty tables were verified. | Local fixture tooling works under the approved narrow access; do not infer access to other projects. |
| Clerk account | The user clarified that the existing Cozy Downloads app serves HigherBits. After the user chose a separate test app, `HigherBits MCP AC8 Isolated Test` was created as a new Clerk development app, ID `app_3L2vg3RGSjblKvIWgbAdfFbqV9B`, with email login only. Its new instance is `ins_3L2vg5sEiWzFXsjIjbh6ku4JGd1` and currently has no users. Its test keys were copied directly into private `/tmp/hb-mcp-ac8-20261022/clerk.env`, and a private combined `/tmp/hb-mcp-ac8-20261022/next.env` was prepared; only variable names and test prefixes were checked. | App and local config exist; test user and signed-in Playwright state are still missing. |
| Credentials and session | Prior presence-only check found no MCP E2E API keys, test Clerk key, loopback Supabase URL, service-role key, admin storage-state path/file, or Clerk test login variables in the current process/worktree. | Missing or unverified; no values were read. |

The payments test database has not been inspected or modified. It is excluded from this setup until its isolation and schema compatibility are separately verified and reuse is explicitly approved.

## Minimum isolated resources to provision or identify

1. **Dedicated disposable local Supabase instance:** `/tmp/hb-mcp-ac8-20261022` is started with its own project ID and ports 54521/54522. Its only app-specific schema is the minimal `users` and `api_keys` identity fixture, and both tables are empty. Before inserting data, verify the runtime URL is loopback, use only this project, and keep its generated service-role key outside chat/repository. Never redirect to the `21st`, payments, or AC6 instance.
2. **Isolated Clerk test project/account:** test publishable key beginning `pk_test_`, corresponding test server configuration, and a disposable signed-in account. Use no production user or copied personal browser session. If a Clerk project or account must be created, obtain one consolidated setup authorization first.
3. **Two fixture identities and API keys:** create test-prefixed keys in the dedicated database, one owned by the signed-in Clerk identity and one owned by a different synthetic identity. Record only variable names and nonsecret identity labels in the test manifest; do not print key material. Confirm API key storage/validation matches the current migrations before insertion.
4. **Admin Playwright state:** generate an absolute, ignored, test-only storage-state file for the isolated Clerk account and set `HIGHERBITS_E2E_ADMIN_STATE` to that path. The existing setup flow requires an account or saved session; it does not provision one.
5. **Loopback Next server and observation:** use a loopback `PLAYWRIGHT_BASE_URL` and the actual `admin` Playwright project. Add a test-only server-side cancellation/close observation to the real Next route harness; the present spec proves only client-side `AbortError`. Assert the server stream terminates after client disconnect, not merely that the client stopped reading.

## Test-only configuration contract

Set `HIGHERBITS_MCP_E2E_LOCAL_FIXTURE=1` only after all isolation checks pass. The existing spec also needs `HIGHERBITS_MCP_E2E_API_KEY`, `HIGHERBITS_MCP_E2E_MISMATCH_API_KEY`, `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `HIGHERBITS_E2E_ADMIN_STATE`, and loopback `PLAYWRIGHT_BASE_URL`. The app/test setup additionally needs its matching Clerk server configuration and the local Supabase service-role setting. Put secret values only in an ignored local environment or approved secret store; share paths or variable names, never values.

## Verification order and stop conditions

1. Verify the dedicated database and Clerk project/account are test-only; inspect identifiers and URL hosts without printing secrets. Stop if ownership, isolation, or compatibility is uncertain.
2. Provision test fixture records and storage state only after approval for any new credentials/account and database setup. Preserve the payments and AC6 fixtures.
3. Add observable server-side termination evidence to the actual Next route test. Keep the synthetic disconnect test as limited supporting evidence.
4. Follow the plan's ordered package build, package test, web test, and actual-route Playwright commands. Report each current result separately; historical route/package passes are not reruns.
5. Keep AC8 CONDITIONAL if the actual Next/Clerk route or server-side termination cannot be demonstrated. Do not use a production provider, production database, deployment, or personal session to fill the gap.

## Single decision needed before provisioning

The user approved a new isolated setup and specifically chose a separate Clerk test app. The dedicated local Supabase project is running with empty identity tables, and the separate Clerk development app is created with no users. The browser credential policy requires the user to enter and submit the new test account password personally. The Clerk user form is open for handoff. After the user creates it, obtain only its nonsecret user ID for the local fixture; keep its password out of chat. Then prepare the two local API keys and Playwright storage state. No payments or production database use is approved.
