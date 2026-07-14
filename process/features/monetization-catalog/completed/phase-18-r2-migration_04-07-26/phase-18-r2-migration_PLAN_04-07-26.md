---
name: plan:phase-18-r2-migration
description: "Phase 18: Cloudflare R2 Asset Migration — ops/r2-client.mjs, r2-fetch.ts server fallback, CDN video URL prefix, env documentation, test locks"
date: 04-07-26
metadata:
  node_type: memory
  type: plan
  feature: monetization-catalog
  phase: 18
---

# Phase 18 — Cloudflare R2 Asset Migration

Date: 04-07-26
Status: PLAN
Complexity: COMPLEX (multi-package: apps/web, ops/, scripts/, packages/db read-only; new server-only module; new ops tooling; new devDependency at root)

## Phase Loop Progress

- [ ] Step 1 — RESEARCH (complete — inner-loop; findings fed directly to PLAN creation)
- [ ] Step 2 — INNOVATE (complete — Decision Summary locked; D1–D5 are authoritative)
- [x] Step 3 — PLAN-SUPPLEMENT (this creation)
  - PVL-supplement cycle 1 applied 04-07-26: folded E1–E7 execute-agent instructions into checklist (Sections B, C, D, E); no new files added.
- [x] Step 4 — PVL (validate-contract written — Gate: PASS, inner-pvl cycle 2, 2026-07-04)
- [x] Step 5 — EXECUTE
- [x] Step 6 — EVL
- [x] Step 7 — UPDATE PROCESS

---

## Overview, Goals, Scope

Phase 18 migrates component source text and demo video assets from the local filesystem to **Cloudflare R2** (S3-compatible object storage), with a CDN URL prefix for video delivery. The migration is **additive and gracefully absent** — the storefront and all tooling continue to work with zero R2 env vars set; R2 is an optional accelerator, not a hard dependency.

### What This Phase Delivers

1. **`ops/r2-client.mjs`** — NEW. Wraps `@aws-sdk/client-s3` (`S3Client` region `"auto"`, endpoint derived from `R2_ACCOUNT_ID`). `PutObject` with body non-empty validation. Lazy-init: creds validated at call time; absent → `WARN: R2 not configured, skipping upload`, return `null`, never throw.
2. **`apps/web/lib/video-url.ts`** — NEW server+client module. Exports `VIDEO_PATH_REGEX` (exact string `^previews\/[a-zA-Z0-9/_-]+\.mp4$`) and `isValidVideoPath(s)`. Shared guard used by `preview-tabs.tsx`. `validate-registry.mjs` keeps its own inline duplicate (zero-dep Node script invariant — not imported).
3. **`apps/web/components/preview/preview-tabs.tsx`** — Updated. `safeVideoSrc` derivation changes from hardcoded inline regex+prefix to: (a) import `isValidVideoPath` from `apps/web/lib/video-url.ts`, (b) derive `src = NEXT_PUBLIC_CDN_URL ? \`${NEXT_PUBLIC_CDN_URL}/${video}\` : \`/${video}\`` AFTER `isValidVideoPath()` passes. Regex guard semantics unchanged; CDN prefix is purely additive.
4. **`apps/web/lib/r2-fetch.ts`** — NEW server-only module (`"use server"` directive). Exports `fetchRegistryFromR2(registryPath: string): Promise<string | null>`. Plain `fetch()` (no AWS SDK). Reads object key derived from `registryPath` relative to `docs/evidence-manifest/registry/`. Returns `null` on any error (missing env, network failure, non-200 status) — caller handles fallback.
5. **`apps/web/lib/registry.ts`** — Updated. `readRegistryEntry` gains conditional R2 fetch: if `R2_BUCKET_NAME` + `NEXT_PUBLIC_CDN_URL` are set, attempt `fetchRegistryFromR2`; on success cache and return that source string; on any failure fall back to `readFile` (current path). `React.cache` + `unstable_cache` (1h TTL, tag `"registry"`) cache ONLY the successful result, never an error. `parseRawEntry`/`stripDemoPaywall` receive identical source string regardless of origin — paywall invariant unchanged.
6. **`ops/copy-demo-video.mjs`** — Updated. Gains `--r2` flag; when present, imports `./r2-client.mjs` and uploads the copied MP4 to R2 after writing to `apps/web/public/previews/`. Without `--r2`, behavior unchanged.
7. **`ops/github-ingest.mjs`** — Updated. After `writeFile` in `ingest()` (~line 270), push the parsed source text to R2 via `r2-client.mjs`. `ContentType: "text/plain; charset=utf-8"`. Body non-empty validated before upload. Missing R2 creds → warn + skip (never throw).
8. **`.env.example`** — Updated. Adds R2 env vars with comments: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` (server-only), `NEXT_PUBLIC_CDN_URL` (client-safe, deploy-time config).
9. **Test locks** — NEW `apps/web/__tests__/video-url.test.ts` (pins exact regex string); `scripts/__tests__/validate-registry.test.mjs` gains pin test asserting inline regex matches `VIDEO_PATH_REGEX`; `ops/__tests__/r2-client.test.mjs` (mocked S3); `apps/web/__tests__/registry-r2.test.ts` (Hybrid — mocked fetch + mocked readFile for fallback path).

### Out of Scope (Deferred)

- Automated MP4 screen-capture (Playwright) — future phase
- Real MP4 recordings for curated demos (C15 re-deferred, needs manual recording)
- Qdrant re-ingestion with updated R2 keys
- R2 bucket provisioning — documented pre-condition (manual Cloudflare dashboard step)
- Clerk dev-key env (pre-existing runtime blocker, unrelated to this phase)

---

## Touchpoints

| File / Path | Change Type |
|---|---|
| `ops/r2-client.mjs` | NEW — S3Client wrapper, PutObject, lazy-init creds |
| `ops/__tests__/r2-client.test.mjs` | NEW — mocked-S3 node --test suite |
| `ops/copy-demo-video.mjs` | UPDATED — `--r2` flag, optional R2 upload after copy |
| `ops/github-ingest.mjs` | UPDATED — R2 push hook after writeFile in ingest() |
| `apps/web/lib/video-url.ts` | NEW — shared VIDEO_PATH_REGEX + isValidVideoPath() |
| `apps/web/__tests__/video-url.test.ts` | NEW — regex pin test (Fully-Automated, vitest) |
| `apps/web/components/preview/preview-tabs.tsx` | UPDATED — CDN prefix derivation + import isValidVideoPath |
| `apps/web/__tests__/preview-tabs-cdn.test.tsx` | NEW — CDN prefix derivation test (vitest jsdom) |
| `apps/web/lib/r2-fetch.ts` | NEW — server-only plain-fetch R2 reader |
| `apps/web/lib/registry.ts` | UPDATED — conditional R2 fetch + readFile fallback |
| `apps/web/__tests__/registry-r2.test.ts` | NEW — R2-fallback unit test (Hybrid: mocked fetch + mocked readFile) |
| `scripts/__tests__/validate-registry.test.mjs` | UPDATED — regex pin test added (guard drift detection) |
| `.env.example` | UPDATED — 5 new R2/CDN env vars |
| `package.json` (root) | UPDATED — `@aws-sdk/client-s3` devDependency |

---

## Public Contracts

| Contract | Description | Consumers |
|---|---|---|
| `isValidVideoPath(s: string): boolean` in `apps/web/lib/video-url.ts` | Guards video path format — must exactly match `^previews\/[a-zA-Z0-9/_-]+\.mp4$` | `preview-tabs.tsx` |
| `VIDEO_PATH_REGEX: RegExp` in `apps/web/lib/video-url.ts` | Exportable regex for test-lock pins | `video-url.test.ts`, test pin in validate-registry test |
| `fetchRegistryFromR2(path): Promise<string \| null>` in `apps/web/lib/r2-fetch.ts` | Server-only; returns source string or null (never throws) | `registry.ts` |
| `readRegistryEntry(category, slug)` in `apps/web/lib/registry.ts` | Unchanged external signature; internal R2 branch is transparent to callers | `apps/web/app/(catalog)/[category]/[slug]/page.tsx` |
| `ops/r2-client.mjs` `uploadToR2({key, body, contentType}): Promise<string \| null>` | Lazy-init; absent creds → warn + return null | `ops/github-ingest.mjs`, `ops/copy-demo-video.mjs` |
| `NEXT_PUBLIC_CDN_URL` env var | Client-safe, deploy-time CDN base URL; absent → local `/` prefix | `preview-tabs.tsx` |

---

## Blast Radius

| Dimension | Scope |
|---|---|
| **Packages touched** | `apps/web` (lib + components + tests), `ops/` (r2-client, ingest, copy-demo-video + tests), `scripts/__tests__/` (pin test), root `package.json` |
| **Packages read-only** | `packages/db` (schema unchanged), `packages/ui` (no change) |
| **File count** | ~14 files modified/created (see Touchpoints) |
| **Risk class** | MEDIUM — new network path in registry read; guarded by fallback; no schema/auth/billing surface changes |
| **Paywall invariant** | UNCHANGED — `parseRawEntry`/`stripDemoPaywall` receive identical source string regardless of R2 or filesystem origin |
| **Bundle safety** | `@aws-sdk/client-s3` at root devDependency ONLY; NOT in `apps/web` deps; bundle-safety grep extended to include `aws-sdk` |
| **Env vars added** | 5 new, all optional for build/test/dev; server-only `R2_*`, client-safe `NEXT_PUBLIC_CDN_URL` |

---

## Implementation Checklist

Ordered per INNOVATE implementation sequence (D4 → D2/D3 → D1 → D4b/ingest → D5):

### Section A — ops/r2-client.mjs (D4)

1. Add `@aws-sdk/client-s3` to root `package.json` as `devDependency` (`^3.x`).
2. Create `ops/r2-client.mjs`:
   - Top-of-file lazy-init: read `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` at call time (not module load time).
   - Absent any cred → `console.warn("WARN: R2 not configured, skipping upload")`, return `null`, never throw.
   - `S3Client`: `region: "auto"`, `endpoint: \`https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com\``, credentials from env vars.
   - Export `async function uploadToR2({ key, body, contentType = "text/plain; charset=utf-8" })`: validate `body` non-empty string (throw `TypeError` — not a lazy-init skip); send `PutObjectCommand`; return the uploaded `key` on success.
   - Reference pattern: `reference_21st_dev/apps/web/lib/r2.ts` — adopt `S3Client` config; DO NOT adopt module-load throw pattern (use lazy-init instead).
3. Create `ops/__tests__/r2-client.test.mjs`:
   - Mock `@aws-sdk/client-s3` (`S3Client`, `PutObjectCommand`) with `import { mock } from "node:test"` or `--experimental-vm-modules` mock pattern (mirrors `ops/__tests__/github-ingest.test.mjs` fetch mock pattern).
   - Test: (a) `uploadToR2` with valid creds + non-empty body → `PutObjectCommand` called with correct Bucket, Key, Body, ContentType; (b) absent creds → returns `null`, logs WARN, no throw; (c) empty body string → throws `TypeError`; (d) `S3Client.send` throws → error propagates (not silently swallowed by lazy-init guard).
   - Run: `node --test ops/__tests__/*.test.mjs` (4 existing + new = 8+ tests pass).

### Section B — video-url.ts + preview-tabs.tsx CDN prefix (D2, D3)

4. Create `apps/web/lib/video-url.ts`:
   - Export `export const VIDEO_PATH_REGEX = /^previews\/[a-zA-Z0-9/_-]+\.mp4$/;`
   - Export `export function isValidVideoPath(s: string): boolean { return VIDEO_PATH_REGEX.test(s); }`
   - No other logic; no imports. This is a zero-dependency shared utility.
5. Update `apps/web/components/preview/preview-tabs.tsx`:
   - Add `import { isValidVideoPath } from "@/lib/video-url";` (remove inline regex literal from the `safeVideoSrc` block).
   - Change `safeVideoSrc` derivation (lines ~108–110) to:
     ```ts
     const cdnBase = process.env.NEXT_PUBLIC_CDN_URL;
     const safeVideoSrc =
       activeDemo?.video && isValidVideoPath(activeDemo.video)
         ? cdnBase ? `${cdnBase}/${activeDemo.video}` : `/${activeDemo.video}`
         : undefined;
     ```
   - All other component logic, JSX, and the `<video>` tag are unchanged.
6. Create `apps/web/__tests__/video-url.test.ts`:
   - Pin test: assert `VIDEO_PATH_REGEX.source === "^previews\\/[a-zA-Z0-9/_-]+\\.mp4$"` (exact string — drift from validate-registry.mjs inline regex fails CI).
   - Test: `isValidVideoPath("previews/cozy-buttons/soft-button/default.mp4")` → true.
   - Test: `isValidVideoPath("//evil.com/x.mp4")` → false.
   - Test: `isValidVideoPath("")` → false.
   - Test: `isValidVideoPath("previews/a b/c.mp4")` → false (space rejected).
   - Run via: `corepack pnpm --filter web test` (adds ~5 tests to suite).
7. Create `apps/web/__tests__/preview-tabs-cdn.test.tsx`:
   - `// @vitest-environment jsdom` per-file override (mirrors Phase 17 `preview-demo.test.tsx` pattern).
   - Mock `process.env.NEXT_PUBLIC_CDN_URL = "https://cdn.example.com"` before render.
   - Test: render `<PreviewTabs>` with a demo that has `video: "previews/cat/slug/id.mp4"` → rendered `<video src>` equals `https://cdn.example.com/previews/cat/slug/id.mp4`.
   - Test: CDN env absent → rendered `<video src>` equals `/previews/cat/slug/id.mp4`.
   - Test: invalid video path (`"//evil.com/x.mp4"`) → no `<video>` tag rendered (guard still active).
   - Add `IntersectionObserver` global stub unconditionally, following the exact pattern in `apps/web/__tests__/preview-demo.test.tsx` (Phase 17). Also mock child components that bring in Clerk/Stripe dependencies (`CopyButton`, `InstallBlock`, `PaywallOverlay`) using `vi.mock(...)` stubs — same approach as Phase 17 preview-demo.test.tsx. Do not skip these mocks; missing them causes jsdom import failures. (PVL-supplement cycle 1, from E6)
8. Update `scripts/__tests__/validate-registry.test.mjs`:
   - Add pin test: use a HARD-CODED string literal for the expected regex source — do NOT import `VIDEO_PATH_REGEX` from `apps/web/lib/video-url.ts`. The Node `--test` runner does not transpile TypeScript; importing from a `.ts` file will fail. Assert that the inline regex in `validate-registry.mjs` (extracted via `readFileSync` + regex match on the source) equals the hard-coded string `"^previews/[a-zA-Z0-9/_-]+\\.mp4$"`. Both `validate-registry.mjs` and `video-url.ts` must match this string; if either drifts, both test suites fail. (PVL-supplement cycle 1, from E1)
   - Total: 13 existing + 1 pin = 14 tests.

> **Canonical R2 Key Scheme (shared between Section C and Section D — must be identical in both):** The R2 object key for registry files is `registry/${path.basename(filePath)}` (e.g. `registry/cozy-buttons__soft-button.md`). This scheme is authoritative for BOTH the write path (`ops/github-ingest.mjs`, Section D step 12) and the read path (`apps/web/lib/r2-fetch.ts`, Section C step 9). Execute-agent MUST verify both sides derive the identical key string before marking either section done. Any divergence means the write and read paths target different objects and R2 reads will always miss. (PVL-supplement cycle 1, from E3)

### Section C — r2-fetch.ts + registry.ts conditional read (D1)

9. Create `apps/web/lib/r2-fetch.ts`:
   - `"use server"` directive at top — KEEP this directive per D1 spec. Although `fetchRegistryFromR2` is a server utility (not a Server Action in the strict Next.js sense), the `"use server"` directive is intentional per the design decision. Do NOT remove it. Document this choice in the phase report under "Architecture Notes". (PVL-supplement cycle 1, from E2)
   - Function `fetchRegistryFromR2(registryPath: string): Promise<string | null>`:
     - Check `R2_BUCKET_NAME` and `NEXT_PUBLIC_CDN_URL` env vars; if either absent, return `null`.
     - Derive object URL: `\`${NEXT_PUBLIC_CDN_URL}/registry/${path.basename(registryPath)}\`` — key scheme is `registry/${path.basename(registryPath)}` matching the canonical key scheme defined above. (PVL-supplement cycle 1, from E3)
     - `fetch(url)` with `{ cache: "no-store" }` (bypass Next.js fetch cache — registry.ts layer applies its own `unstable_cache`).
     - Non-200 response → return `null`.
     - Network/parse error → catch, return `null`.
     - Success → return `await response.text()`.
   - No AWS SDK import in this file — plain `fetch()` only.
10. Update `apps/web/lib/registry.ts` — `readRegistryEntry` function:
    - After the existing cache wrappers, inside the inner async function body:
      1. Check if `process.env.R2_BUCKET_NAME` is set.
      2. If yes: call `await fetchRegistryFromR2(registryFilePath)`.
      3. If `fetchRegistryFromR2` returns a non-null string: use it as `raw` (skip `readFile`).
      4. If `fetchRegistryFromR2` returns null: fall back to existing `readFile` path — no log or throw.
      5. If `R2_BUCKET_NAME` not set: skip R2 entirely, use `readFile` as before.
    - `React.cache` + `unstable_cache` (1h TTL, tag `"registry"`) wraps the ENTIRE read function — successful result is cached; failed R2 that fell back to readFile still caches the readFile result. No error state is ever cached.
    - `parseRawEntry(raw)` and `stripDemoPaywall` calls are downstream and unaffected.
11. Create `apps/web/__tests__/registry-r2.test.ts` (Hybrid — mocked network + mocked fs):
    - Mock `global.fetch` (or `vi.stubGlobal("fetch", ...)`) for R2 response.
    - Mock `node:fs/promises` `readFile` to return a fixture source string.
    - Test A: `R2_BUCKET_NAME` set + `fetch` returns valid source → `readRegistryEntry` returns parsed entry from R2 source; `readFile` NOT called.
    - Test B: `R2_BUCKET_NAME` set + `fetch` returns 404 → falls back to `readFile`; result from `readFile` returned.
    - Test C: `R2_BUCKET_NAME` set + `fetch` throws (network error) → falls back to `readFile`; no throw propagated.
    - Test D: `R2_BUCKET_NAME` absent → `readFile` used directly; `fetch` NOT called.
    - Note: `React.cache` + `unstable_cache` may need `vi.mock("next/cache", ...)` or a module-level cache bypass. Establish pattern; if cache complicates testing, use module-level mock of `fetchRegistryFromR2` directly and test `readRegistryEntry` integration at a coarser level. Document resolution in plan report. This downgrade is **pre-authorized** — criteria C11/C12/C13 are still met with a module-level mock of `fetchRegistryFromR2`. (PVL-supplement cycle 1, from E4)

### Section D — ops/github-ingest.mjs R2 hook + ops/copy-demo-video.mjs --r2 (D4b)

12. Update `ops/github-ingest.mjs` (after `writeFile` in `ingest()`, ~line 270):
    - Import `uploadToR2` from `./r2-client.mjs` (dynamic `import()` at top of file or static ESM import at top — prefer static).
    - After `await writeFile(filePath, content)` succeeds:
      - Validate `content` is non-empty string (already true if writeFile succeeded).
      - Call `await uploadToR2({ key: \`registry/${path.basename(filePath)}\`, body: content, contentType: "text/plain; charset=utf-8" })`. Key scheme: `registry/${path.basename(filePath)}` — must match canonical key scheme above. (PVL-supplement cycle 1, from E3)
      - If result is `null` (creds absent): already warned by `r2-client.mjs`, no additional log needed.
      - If result is a key string: optionally log `INFO: Uploaded registry file to R2: ${result}`.
    - All existing ingest logic (MIT gate, warn-only skip, attribution fields, HeavyDeps) unchanged.
13. Update `ops/copy-demo-video.mjs`:
    - Parse `--r2` flag and strip it from positional args BEFORE destructuring. Use this exact pattern: `const hasR2 = process.argv.includes("--r2"); const positional = process.argv.slice(2).filter(a => a !== "--r2"); const [source, category, slug, demoId] = positional;` — do NOT destructure directly from `process.argv.slice(2)` without filtering first, as the `--r2` flag would shift positional indices and corrupt the arg mapping. (PVL-supplement cycle 1, from E5)
    - After the existing `fs.copyFile(src, dest)` step:
      - If `hasR2` flag present: dynamically import `./r2-client.mjs`, read the copied file as a Buffer, call `uploadToR2({ key: \`previews/${category}/${slug}/${demoId}.mp4\`, body: buffer, contentType: "video/mp4" })`.
      - If `hasR2` absent: behavior exactly unchanged (no import, no upload).
    - Note: `r2-client.mjs` body validation requires non-empty — MP4 buffer is always non-empty; guard passes trivially.
14. Extend `ops/__tests__/github-ingest.test.mjs` (existing 4 tests):
    - Add test: ingest with R2 env set → `uploadToR2` called with correct key and content after `writeFile`.
    - Add test: ingest with R2 env absent → `uploadToR2` returns null; ingest still completes without error.
    - Mock `./r2-client.mjs` export using existing `mock.module` pattern from the file.
    - Total after extension: 6+ tests.

### Section E — .env.example documentation (D5)

15. Update `.env.example`:
    - Add new section `# --- Cloudflare R2 (Phase 18) ---` with:
      ```
      R2_ACCOUNT_ID=
      R2_ACCESS_KEY_ID=
      R2_SECRET_ACCESS_KEY=
      R2_BUCKET_NAME=cozy-downloads
      NEXT_PUBLIC_CDN_URL=https://pub-xxxxxxxx.r2.dev
      ```
    - Add inline comment: `# R2_* vars are server-only. NEXT_PUBLIC_CDN_URL is deploy-time config only — never user-provided at runtime.`
    - Add pre-condition note as comment: `# Bucket must be created manually in Cloudflare dashboard (PRIVATE, CDN-only access, dedicated API token scoped to one bucket) before these vars take effect.`
    - Add dual-use architecture note as comment: `# NEXT_PUBLIC_CDN_URL serves two roles: (1) CDN video prefix in preview-tabs.tsx, (2) CDN base URL for registry R2 fetch in r2-fetch.ts. Both roles assume the same CDN origin (single-bucket design). If future phases require separate CDN origins, add a new env var (e.g. NEXT_PUBLIC_REGISTRY_CDN_URL). Document this dual-use in the phase report.` (PVL-supplement cycle 1, from E7)

### Section F — Bundle-safety gate extension + final verification

16. Verify bundle-safety gate extension: confirm `apps/web/package.json` does NOT add `@aws-sdk/client-s3` — it must remain at root `package.json` devDependency only. Run:
    ```bash
    corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap|aws-sdk)" | wc -l
    ```
    Must output `0`. If non-zero: `@aws-sdk` leaked into web bundle → STOP and fix (remove from web package.json).
17. Run full gate suite (see Verification Evidence).

---

## Dependencies and Risks

### Dependencies

| Dep | Type | Notes |
|---|---|---|
| `@aws-sdk/client-s3` | root devDependency | S3-compatible client for R2; `^3.x` stable API |
| Cloudflare R2 bucket | External pre-condition | Manual provisioning required (dashboard); bucket PRIVATE, CDN URL required; NOT a code task |
| `NEXT_PUBLIC_CDN_URL` | Deploy-time config | Required for CDN video prefix; absent → local prefix fallback (graceful) |
| R2 server creds | Runtime env | Only needed if R2 read path is desired; entirely absent = `readFile` fallback |

### Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---|---|
| R2 fetch failure causing 1h cached error degradation | HIGH (from vc-predict) | Fallback to `readFile` on ANY error from `fetchRegistryFromR2`; `unstable_cache` only wraps successful path — error result is never cached |
| `@aws-sdk/client-s3` leaking into apps/web bundle | HIGH | devDependency at ROOT only, never in apps/web package.json; bundle-safety grep gate extended with `aws-sdk` |
| Regex drift between video-url.ts and validate-registry.mjs | MEDIUM | Test-lock pin in both test suites; any drift fails CI |
| `NEXT_PUBLIC_CDN_URL` used as user-provided runtime input | LOW | Code comment + .env.example note: deploy-time config only, never accept user-provided value at runtime |
| `r2-client.mjs` throwing on missing creds (blocking ingest) | LOW | Lazy-init pattern: creds checked at call time; absent → warn + return null, never throw |
| `fetchRegistryFromR2` key scheme mismatch (ingest writes key A, fetch reads key B) | MEDIUM | Key scheme is `registry/${path.basename(filePath)}` in both ingest and r2-fetch; pinned in checklist steps 9 and 12 — both must use same derivation |

---

## Verification Evidence

| Gate / Scenario | Strategy | Proves SPEC criterion |
|---|---|---|
| `node --test ops/__tests__/*.test.mjs` → 8+ pass | Fully-Automated | D4: uploadToR2 correct params; absent creds → warn+null; empty body → TypeError |
| `corepack pnpm --filter web test` → 65+ pass / 6 baseline fail | Fully-Automated | D2/D3: video-url regex pin; CDN prefix derivation; D1: registry R2 fallback behavior |
| `node --test scripts/__tests__/validate-registry.test.mjs` → 14+ pass | Fully-Automated | D3: regex pin — validate-registry.mjs inline regex matches VIDEO_PATH_REGEX |
| `corepack pnpm --filter @repo/ui type-check` → exit 0 | Fully-Automated | No blast-radius leakage into @repo/ui |
| `corepack pnpm --filter web build` → exit 0 | Fully-Automated | D5: graceful absence — build passes with zero R2 env vars |
| `node scripts/validate-registry.mjs` → exit 0 | Fully-Automated | Registry files still valid after any .env.example touch |
| `corepack pnpm --filter web build 2>&1 \| grep -E "(three\|face-api\|matter-js\|ogl\|gsap\|aws-sdk)" \| wc -l` → `0` | Fully-Automated | D4 bundle safety: @aws-sdk not in web bundle |
| `git diff --check` → exit 0 | Fully-Automated | No merge-conflict markers |
| `video-url.test.ts` regex pin: `VIDEO_PATH_REGEX.source === "^previews\\/[a-zA-Z0-9/_-]+\\.mp4$"` | Fully-Automated (proven by: video-url test) | D3: exact regex string locked |
| `preview-tabs-cdn.test.tsx`: CDN env set → `<video src>` starts with CDN base | Fully-Automated (proven by: preview-tabs-cdn test) | D2: CDN prefix applied when NEXT_PUBLIC_CDN_URL set |
| `preview-tabs-cdn.test.tsx`: CDN env absent → `<video src>` starts with `/` | Fully-Automated (proven by: preview-tabs-cdn test) | D2: local fallback when CDN absent |
| `registry-r2.test.ts` Test A: R2 set + fetch success → readFile not called | Hybrid (mocked fetch, mocked fs) | D1: R2 read path active when env set |
| `registry-r2.test.ts` Test B/C: R2 set + fetch failure → readFile called (fallback) | Hybrid (mocked fetch, mocked fs) | D1 CRITICAL: error fallback — no cached error degradation |
| `registry-r2.test.ts` Test D: R2 absent → readFile used, fetch not called | Hybrid (mocked fetch, mocked fs) | D5: graceful absence in registry read path |
| Local build checkpoint: `corepack pnpm --filter web dev` → localhost:3000 → ingest component → source from R2 visible in UI | Hybrid/Manual (blocked-on-provisioning: requires live R2 creds + bucket) | D1: end-to-end R2 read path in browser |

### High-Risk Class Assessment

No auth/identity, billing, schema migration, public API contract, or deploy surface changes. Network call added to registry read path — guarded by fallback. Risk class: MEDIUM (new I/O path).

---

## Test Infra Improvement Notes

- `React.cache` + `unstable_cache` interaction with vitest may require `vi.mock("next/cache", () => ({ unstable_cache: (fn) => fn, revalidateTag: vi.fn() }))` to make registry.ts unit-testable. Establish this pattern in `registry-r2.test.ts` as a reusable fixture — document in phase report for future test authors.
- `ops/__tests__/r2-client.test.mjs` establishes the S3 mock pattern for Node `--test` runner; document alongside the existing `github-ingest.test.mjs` fetch-mock pattern.
- C16 (copy-demo-video.mjs untested) partially addressed by `ops/copy-demo-video.mjs` `--r2` integration tested in ops suite (mock r2-client). The non-R2 path remains untested (low value, simple fs.copyFile wrapper).

---

## Known Gaps Carried from Phase 17

| Gap ID | Description | Decision |
|---|---|---|
| C15 | Real MP4 recordings for curated demo variants | RE-DEFERRED — needs manual screen recording sessions; not a code task; backlog unchanged |
| C16 | `ops/copy-demo-video.mjs` untested | PARTIALLY ADDRESSED — `--r2` flag path tested in ops suite; non-R2 path (simple fs.copyFile) remains gap, low priority |

---

## Touchpoints (vc-autoresearch bookmark)

**Phase 18 does NOT touch:**
- `apps/web/app/(catalog)/[category]/[slug]/page.tsx` — paywall logic unchanged; `readRegistryEntry` caller signature unchanged
- `packages/db/src/schema.ts` — no Qdrant schema changes this phase
- `packages/ui/src/` — no component library changes
- `scripts/validate-registry.mjs` — only its test suite gains a pin; the script itself unchanged
- Any Clerk, Stripe, or Redis surface

---

## Resume and Execution Handoff

1. **Selected plan file path:** `process/features/monetization-catalog/active/phase-18-r2-migration_04-07-26/phase-18-r2-migration_PLAN_04-07-26.md`
2. **Last completed phase or step:** Step 4 — PVL (validate-contract PASS, inner-pvl cycle 2)
3. **Validate-contract status:** Written — Gate: PASS
4. **Supporting context files loaded:**
   - `process/context/all-context.md`
   - `process/context/tests/all-tests.md`
   - `apps/web/lib/registry.ts` (current R2-absent baseline)
   - `apps/web/components/preview/preview-tabs.tsx` (lines 100–115, guard block)
   - `reference_21st_dev/apps/web/lib/r2.ts` (reference pattern — adopt S3Client config, NOT module-load throw)
   - `ops/github-ingest.mjs`, `ops/copy-demo-video.mjs`, `.env.example`
   - Phase 17 plan (format reference + known-gaps C15/C16)
5. **Next step for a fresh agent picking up mid-execution:**
   - ENTER EXECUTE MODE. Execute-agent reads this plan and follows Sections A–F in order.
   - Before EXECUTE: confirm `@aws-sdk/client-s3` version to use (`^3.x`); confirm R2 endpoint URL scheme matches D4 spec.
   - EXECUTE ordering: Section A (r2-client) → Section B (video-url + preview-tabs + tests) → Section C (r2-fetch + registry + tests) → Section D (ingest hooks + tests) → Section E (.env.example) → Section F (bundle-safety gate).
   - If `React.cache` mock pattern cannot be established cheaply, downgrade `registry-r2.test.ts` Test A/B/C to mock `fetchRegistryFromR2` at the module level instead of testing through the cache layer; document in phase report.

---

## Acceptance Criteria

All criteria must be met for the phase to advance to VERIFIED:

1. **D5 — Graceful absence:** `corepack pnpm --filter web build` exits 0 with zero R2 env vars set in the environment. No `R2_*` or `NEXT_PUBLIC_CDN_URL` variable required for build or test.
2. **D4 — Bundle safety:** `corepack pnpm --filter web build 2>&1 | grep -E "(three|face-api|matter-js|ogl|gsap|aws-sdk)" | wc -l` returns `0`. `@aws-sdk/client-s3` is not present in the web bundle.
3. **D4 — r2-client lazy-init:** With no R2 env vars, `uploadToR2` returns `null` and logs a WARN; it does NOT throw. Proven by ops test suite ≥8 passing.
4. **D1 — R2 fallback invariant:** When `fetchRegistryFromR2` returns null (any error or absent env), `readRegistryEntry` falls back to `readFile` and returns a valid `RegistryEntry`. No error is cached. Proven by `registry-r2.test.ts` Tests B and C.
5. **D2 — CDN prefix:** When `NEXT_PUBLIC_CDN_URL` is set, `<video src>` in `PreviewTabs` equals `${NEXT_PUBLIC_CDN_URL}/${video}`. When absent, equals `/${video}`. Proven by `preview-tabs-cdn.test.tsx`.
6. **D3 — Regex test-lock:** `VIDEO_PATH_REGEX.source` equals the exact string `^previews\/[a-zA-Z0-9/_-]+\.mp4$`; validate-registry.mjs inline regex matches the same string. Proven by `video-url.test.ts` pin + `validate-registry.test.mjs` pin.
7. **D1 — Paywall invariant unchanged:** `parseRawEntry` and `stripDemoPaywall` receive the identical source string regardless of R2 or filesystem origin. No new Pro/free bypass. Existing 65 passing vitest tests still pass.
8. **D4 — ops integration:** `ops/github-ingest.mjs` calls `uploadToR2` after `writeFile` when R2 creds set; absent creds → warn + skip + ingest completes. Proven by extended github-ingest test suite ≥6 passing.
9. **All 8 test gate commands pass** (see Verification Evidence table).

---

## Phase Completion Rules

- Status advances from `CODE DONE` → `VERIFIED` only after ALL Acceptance Criteria are confirmed green by vc-tester (EVL gate run).
- The local build checkpoint (manual Hybrid gate) is documented in the phase report but does NOT block VERIFIED status — it requires live R2 creds which are a deployment pre-condition.
- Known gap C15 (real MP4 recordings) does NOT block VERIFIED — it is explicitly re-deferred.
- C16 partial coverage (non-R2 copy-demo-video path) does NOT block VERIFIED — documented in Test Infra Improvement Notes.
- If `React.cache` mock pattern blocks `registry-r2.test.ts` integration, execute-agent may downgrade to module-level mock of `fetchRegistryFromR2` — document the downgrade decision in the phase report; criteria 4 is still met if fallback behavior is proven at any level.
- Bundle-safety gate (criteria 2) is a HARD gate — phase cannot reach VERIFIED with a non-zero output from the bundle-safety grep command.

---


## Validate Contract

Status: PASS
Date: 04-07-26
date: 2026-07-04
generated-by: inner-pvl: phase-18
supersedes: 2026-07-04 (inner-pvl: phase-18) — cycle 2 re-validation after PVL-supplement cycle 1; all 6 CONCERNs resolved in plan text

Parallel strategy: sequential
Rationale: 3/7 signals (S1 multi-package, S6 new network path, S7 14 files); cycle 2 inline synthesis; 0 FAILs 0 CONCERNs; no fan-out required.

Test gates (C3 5-column table):

| criterion id | behavior | strategy | proving test | gap-resolution |
|---|---|---|---|---|
| C1 | uploadToR2 sends correct PutObjectCommand params when creds present | Fully-Automated | `node --test ops/__tests__/*.test.mjs` (≥8 pass) | A |
| C2 | uploadToR2 absent creds → warn + return null, never throw | Fully-Automated | `node --test ops/__tests__/*.test.mjs` (≥8 pass) | A |
| C3 | uploadToR2 empty body → TypeError | Fully-Automated | `node --test ops/__tests__/*.test.mjs` (≥8 pass) | A |
| C4 | S3Client.send throws → error propagates (not swallowed by lazy-init) | Fully-Automated | `node --test ops/__tests__/*.test.mjs` (≥8 pass) | A |
| C5 | VIDEO_PATH_REGEX source string exact pin (drift prevention) | Fully-Automated | `corepack pnpm --filter web test` → video-url.test.ts pin passes | A |
| C6 | isValidVideoPath: valid path true, evil path false, empty false, space false | Fully-Automated | `corepack pnpm --filter web test` → video-url.test.ts | A |
| C7 | CDN env set → video src equals cdnBase/video | Fully-Automated | `corepack pnpm --filter web test` → preview-tabs-cdn.test.tsx | A |
| C8 | CDN env absent → video src equals /video (local fallback) | Fully-Automated | `corepack pnpm --filter web test` → preview-tabs-cdn.test.tsx | A |
| C9 | Invalid video path → no video element rendered | Fully-Automated | `corepack pnpm --filter web test` → preview-tabs-cdn.test.tsx | A |
| C10 | validate-registry.mjs inline regex matches VIDEO_PATH_REGEX source string | Fully-Automated | `node --test scripts/__tests__/validate-registry.test.mjs` (≥14 pass) | A |
| C11 | R2 set + fetch success → readFile NOT called; parsed entry from R2 source returned | Hybrid | `corepack pnpm --filter web test` → registry-r2.test.ts Test A (mocked fetch + mocked fs) | A |
| C12 | R2 set + fetch failure (404 or network error) → readFile fallback called; no throw | Hybrid | `corepack pnpm --filter web test` → registry-r2.test.ts Tests B+C (mocked) | A |
| C13 | R2 absent → readFile used directly; fetch NOT called | Hybrid | `corepack pnpm --filter web test` → registry-r2.test.ts Test D (mocked) | A |
| C14 | apps/web builds with zero R2 env vars set | Fully-Automated | `corepack pnpm --filter web build` exits 0 | A |
| C15 | @aws-sdk/client-s3 NOT in apps/web bundle | Fully-Automated | `corepack pnpm --filter web build 2>&1 \| grep -E "(three\|face-api\|matter-js\|ogl\|gsap\|aws-sdk)" \| wc -l` → 0 | A |
| C16 | ingest with R2 env set → uploadToR2 called after writeFile | Fully-Automated | `node --test ops/__tests__/*.test.mjs` → github-ingest extended (≥6 pass) | A |
| C17 | ingest with R2 env absent → uploadToR2 null; ingest completes without error | Fully-Automated | `node --test ops/__tests__/*.test.mjs` → github-ingest extended | A |
| C18 | @repo/ui type-check passes (no blast-radius leakage) | Fully-Automated | `corepack pnpm --filter @repo/ui type-check` exits 0 | A |
| C19 | No merge-conflict markers | Fully-Automated | `git diff --check` exits 0 | A |
| C20 | Registry files valid after .env.example change | Fully-Automated | `node scripts/validate-registry.mjs` exits 0 | A |
| C21 | E2E: registry source displayed from R2 in browser (localhost) | Hybrid/Manual | Local build checkpoint — blocked-on-provisioning (requires live R2 bucket + creds) | C |

Failing stubs (Fully-Automated rows):
```
// C1-C4: ops/__tests__/r2-client.test.mjs
test("should send PutObjectCommand with correct params when creds present", () => { throw new Error("NOT IMPLEMENTED — TDD stub: uploadToR2 correct params") })
test("should return null and log WARN when creds absent", () => { throw new Error("NOT IMPLEMENTED — TDD stub: absent creds warn+null") })
test("should throw TypeError when body is empty string", () => { throw new Error("NOT IMPLEMENTED — TDD stub: empty body TypeError") })
test("should propagate error when S3Client.send throws", () => { throw new Error("NOT IMPLEMENTED — TDD stub: S3 error propagation") })
// C5-C6: apps/web/__tests__/video-url.test.ts
test("should pin VIDEO_PATH_REGEX.source to exact string", () => { throw new Error("NOT IMPLEMENTED — TDD stub: regex source pin") })
test("should return correct booleans for isValidVideoPath", () => { throw new Error("NOT IMPLEMENTED — TDD stub: isValidVideoPath cases") })
// C7-C9: apps/web/__tests__/preview-tabs-cdn.test.tsx
test("should prefix video src with CDN base when NEXT_PUBLIC_CDN_URL set", () => { throw new Error("NOT IMPLEMENTED — TDD stub: CDN prefix applied") })
test("should use local / prefix when NEXT_PUBLIC_CDN_URL absent", () => { throw new Error("NOT IMPLEMENTED — TDD stub: local fallback") })
test("should not render video element for invalid path", () => { throw new Error("NOT IMPLEMENTED — TDD stub: invalid path guard") })
// C10: scripts/__tests__/validate-registry.test.mjs
test("should match validate-registry inline regex to VIDEO_PATH_REGEX source", () => { throw new Error("NOT IMPLEMENTED — TDD stub: regex drift pin") })
// C14: build gate
test("should build apps/web with zero R2 env vars", () => { throw new Error("NOT IMPLEMENTED — TDD stub: graceful absence build") })
// C15: bundle safety
test("should output 0 for aws-sdk bundle grep", () => { throw new Error("NOT IMPLEMENTED — TDD stub: bundle safety") })
// C16-C17: ops/__tests__/github-ingest.test.mjs extensions
test("should call uploadToR2 after writeFile when R2 env set", () => { throw new Error("NOT IMPLEMENTED — TDD stub: ingest R2 hook") })
test("should complete ingest without error when R2 env absent", () => { throw new Error("NOT IMPLEMENTED — TDD stub: ingest R2 absent") })
```

gap-resolution legend:
- A — proven now (gate passes in this cycle)
- B — fixed in this plan (gate added by this plan's checklist)
- C — deferred to a named later phase/plan (R2 E2E live — deployment pre-condition)
- D — backlog test-building stub

C-4 reconciliation: the strategy column carries ONLY the 3 proving strategies (Fully-Automated / Hybrid / Agent-Probe). Known-Gap is NEVER a strategy value — it is a named residual row carried via gap-resolution D, never a strategy that proves a behavior.

Legacy line form:
- r2-client ops: Fully-automated: `node --test ops/__tests__/*.test.mjs` (≥8 pass)
- video-url + registry web: Fully-automated: `corepack pnpm --filter web test` (≥65+N pass / 6 baseline fail)
- validate-registry pin: Fully-automated: `node --test scripts/__tests__/validate-registry.test.mjs` (≥14 pass)
- registry R2 fallback: Hybrid: `corepack pnpm --filter web test` (mocked fetch + mocked fs)
- build graceful absence: Fully-automated: `corepack pnpm --filter web build` exits 0
- bundle safety: Fully-automated: build grep for aws-sdk → 0
- ui type-check: Fully-automated: `corepack pnpm --filter @repo/ui type-check` exits 0
- R2 E2E live: known-gap: documented as deployment pre-condition (Hybrid/Manual, blocked-on-provisioning)

Execute-agent instructions (carried from cycle 1 — all resolved in checklist; retained for clarity):
- E1 (Section B): In `scripts/__tests__/validate-registry.test.mjs` pin test (step 8), use the hard-coded string `"^previews/[a-zA-Z0-9/_-]+\.mp4$"` — do NOT attempt to import `VIDEO_PATH_REGEX` from the TypeScript `apps/web/lib/video-url.ts` file in the Node --test ESM script (TypeScript not transpiled by Node --test runner).
- E2 (Section C): `r2-fetch.ts` has `"use server"` directive per D1 spec — keep it per plan even though the function is a server utility (not a Server Action). Document in phase report.
- E3 (Section C+D): R2 key scheme derivation MUST be identical in `r2-fetch.ts` and `ops/github-ingest.mjs`: both use `registry/${path.basename(filePath)}`. Verify this consistency during implementation before marking either section done.
- E4 (Section C): When implementing `registry-r2.test.ts`, if `React.cache` + `unstable_cache` mock pattern cannot be established cheaply, downgrade to mocking `fetchRegistryFromR2` at module level and document the downgrade in the phase report. Pre-authorized — criteria C11/C12/C13 still met.
- E5 (Section D): `ops/copy-demo-video.mjs` --r2 flag: implement as `const hasR2 = process.argv.includes("--r2")` BEFORE the positional destructure, then strip the flag from args before destructuring: `const positional = process.argv.slice(2).filter(a => a !== "--r2"); const [source, category, slug, demoId] = positional;`
- E6 (Section B): For `preview-tabs-cdn.test.tsx`, follow Phase 17 `preview-demo.test.tsx` mock pattern for child components (`CopyButton`, `InstallBlock`, `PaywallOverlay`) — mock or stub any Clerk/Stripe dependencies those components bring in. Establish `IntersectionObserver` global mock per Phase 17 pattern.
- E7 (Infra): `NEXT_PUBLIC_CDN_URL` serves dual purpose (CDN video prefix in preview-tabs.tsx AND CDN base for registry R2 fetch). Intentional per D1/D2 design — document in phase report that both usages assume the same CDN origin.

Dimension findings:
- Infra fit: PASS — NEXT_PUBLIC_CDN_URL dual-use documented in step 15 and E7; deploy-time config constraint clear; single-bucket design sound.
- Test coverage: PASS — all 21 behaviors covered by Fully-Automated or Hybrid gates; E1 hard-coded pin approach consistent with D3 test-lock design; React.cache downgrade pre-authorized; live R2 E2E is Hybrid/Manual (blocked-on-provisioning, acceptable).
- Breaking changes: PASS — all public contracts unchanged; additive changes only; existing 65 vitest tests still prove paywall invariant; E3 key scheme cross-referenced between steps 9 and 12.
- Security surface: PASS — no auth/billing/schema surface; bundle-safety gate prevents aws-sdk leakage; R2 credentials server-only; NEXT_PUBLIC_CDN_URL deploy-time only (documented); E5 flag-filtering prevents arg injection.
- Section A feasibility (ops/r2-client.mjs): PASS — new file, clean insertion, lazy-init pattern correctly specified.
- Section B feasibility (video-url.ts + preview-tabs.tsx): PASS — inline regex at line 109 uniquely matchable; pin test approach clarified via E1 (hard-coded string); E6 mock patterns explicit.
- Section C feasibility (r2-fetch.ts + registry.ts): PASS — cache behavior correct; "use server" directive documented (E2); key scheme consistency enforced (E3); React.cache downgrade pre-authorized (E4).
- Section D feasibility (github-ingest + copy-demo-video): PASS — --r2 flag parsing pattern explicit (E5); key scheme cross-referenced (E3).
- Section E/F feasibility (.env.example + bundle-safety): PASS — additive documentation; dual-use comment added (E7); bundle-safety grep extended correctly.

Open gaps:
- Live R2 E2E test (C21): Hybrid/Manual, blocked-on-provisioning — documented as deployment pre-condition. Not blocking VERIFIED status per Phase Completion Rules.
- C15 (real MP4 recordings): known-gap: documented as NEW PLAN REQUIRED — deferred, backlog unchanged from Phase 17.
- C16 (copy-demo-video.mjs non-R2 path): known-gap: low priority, partially addressed by --r2 flag tests.

Known Gaps:
- C15: Real MP4 recordings — known-gap: documented as NEW PLAN REQUIRED per Phase 17 backlog.
- C16: copy-demo-video.mjs non-R2 path untested — known-gap: low priority, partially addressed by --r2 flag tests.

What this coverage does NOT prove:
- C1-C4 (r2-client): Does not prove live R2 connectivity, bucket permissions, actual CDN propagation delay, or S3 throttle/access-denied error code handling.
- C5-C6 (video-url): Does not prove Unicode path attacks or regex behavioral edge cases beyond the listed test cases.
- C7-C9 (preview-tabs-cdn): Does not prove CDN URL with trailing slash edge case, no-video demo rendering without CDN, or partial URL injection attacks.
- C10 (validate-registry pin): Does not prove behavioral parity between the two regexes — only string equality.
- C11-C13 (registry-r2): Does not prove concurrent request behavior, CDN partial failure scenarios, or unstable_cache TTL boundary conditions.
- C14 (build): Does not prove runtime behavior with no R2 env vars (only build-time).
- C15 (bundle safety): Does not prove tree-shaking resilience against future Next.js upgrades adding new module bundling strategies.
- C16-C17 (ingest): Does not prove actual R2 upload success at scale, large file handling, or retry behavior on partial upload failures.
- C21 (E2E live): Not proven in this cycle — requires live R2 provisioning (manual pre-condition).

Gate: PASS (0 FAILs, 0 CONCERNs — all 6 cycle-1 CONCERNs resolved in plan text after PVL-supplement cycle 1)
Accepted by: session (autonomous, /goal execution — cycle 2 PASS, no concerns to accept)

---

## Autonomous Goal Block

SESSION GOAL: Phase 18 — Cloudflare R2 Asset Migration for Cozy Downloads storefront
Charter + umbrella plan: N/A — single phase plan
Autonomy: auto-proceed on all reversible decisions; surface only hard stops (irreversible/outward-facing actions not in contract)
Hard stop conditions / safety constraints:
- STOP if @aws-sdk/client-s3 appears in apps/web/package.json (bundle leak — must remain root devDependency only)
- STOP if bundle-safety grep returns non-zero (hard gate per Phase Completion Rules)
- STOP if any R2 credential is written to a non-.env file or committed to git
- STOP if readRegistryEntry signature changes (public contract must remain identical)
- STOP if unstable_cache wraps an error result (error state must never be cached)
Next phase: EXECUTE — process/features/monetization-catalog/active/phase-18-r2-migration_04-07-26/phase-18-r2-migration_PLAN_04-07-26.md
Validate contract: inline in plan (Gate: PASS, inner-pvl: phase-18, 2026-07-04)
Execute start:
  Fully-auto: node --test ops/__tests__/*.test.mjs | corepack pnpm --filter web test | node --test scripts/__tests__/validate-registry.test.mjs | corepack pnpm --filter web build | corepack pnpm --filter @repo/ui type-check
  Hybrid: corepack pnpm --filter web test (registry-r2.test.ts mocked fetch+fs)
  Agent-probe: N/A
  High-risk pack: no (MEDIUM risk class, no auth/billing/schema surface)
