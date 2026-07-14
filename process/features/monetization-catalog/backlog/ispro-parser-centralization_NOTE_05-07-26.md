# Backlog: Centralize IsPro frontmatter parsing (M-1, Phase 19 security review)

Date: 2026-07-05
Severity: MEDIUM (no live exploit — all current registry files use well-formed lowercase `IsPro: true|false`)
Source: Phase 19 post-hoc security review (commit 7ad466e scope)

## Gap

Three parsers disagree on what counts as a Pro entry:

| Parser | Behavior on `IsPro: True` (capital) |
|---|---|
| `scripts/validate-registry.mjs:95-99` | ACCEPTS as valid Pro (case-insensitive `.toLowerCase()`) |
| `ops/github-ingest.mjs:341` + `ops/upload-seed-entries.mjs:22` (`/^IsPro:\s*true\b/m`) | NOT Pro → **uploads raw markdown to public R2 bucket** |
| `apps/web/lib/registry.ts:112` (`/^IsPro:\s*(true|false)\s*$/m`) | NOT matched → `isPro` silently `false` → **page paywall doesn't lock either** |

Also bypassed by: `IsPro: "true"` (quoted), `IsPro : true` (space before colon).

Exploit path: future author/tool writes `IsPro: True` → CI green (validator accepts) → uploaded
unprotected to public CDN AND unlocked in app. Exactly the threat class commit `90fb7ed` closed.

## Fix

1. One shared helper (e.g. `ops/lib/parse-is-pro.mjs`) used by all 4 consumers
   (validate-registry.mjs, github-ingest.mjs, upload-seed-entries.mjs, apps/web/lib/registry.ts) —
   single regex, case-insensitive, trim, quote-tolerant.
2. Interim hardening: upload guards → `/^IsPro:\s*['"]?true['"]?\s*$/im`.
3. Consider fail-closed upload guard: skip unless explicitly clean `IsPro: false`.
4. Tests: cross-parser consistency fixtures (`True`, `TRUE`, `"true"`, `IsPro :`, CRLF).
