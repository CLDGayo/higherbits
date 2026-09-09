# Serving paid component source privately (audit blocker B2)

**Operator action required at the bottom.** Nothing in the shipped code prevents
public reads on its own.

## What the code now does

Component **source** is written under the `src/` prefix in the `components-code`
R2 bucket. Everything else keeps its existing public path, because the browser
loads those directly.

| Key | Public? | Why |
|---|---|---|
| `src/{owner}/{slug}/code.tsx` | no | paid source |
| `src/{owner}/{slug}/{demo}/code.demo.tsx` | no | paid source |
| `src/{owner}/{slug}/tailwind.config.js` | no | paid source |
| `src/{owner}/{slug}/globals.css` | no | paid source |
| `{owner}/{slug}/{demo}/preview.png` | yes | `<img>` src |
| `{owner}/{slug}/{demo}/video.mp4` | yes | `<video>` src |
| `bundled/{id}.html` | yes | `<iframe>` src |
| `{owner}/{slug}/registry.*.json` | yes | consumed by the CLI |

Reads go through `apps/web/lib/r2-read.ts` (`server-only`), which issues a
presigned GET for keys under `src/` and a plain fetch otherwise. Client
components that used to read source straight from the CDN now call
`POST /api/component-source`, which checks `hasUserComponentAccess` first.

**This works whether or not the CDN is already refusing `src/`.**
`component.code` stores a full URL per row, so components published before this
change keep resolving from their old public paths. No migration is needed for
the change to be safe.

## OPERATOR ACTION REQUIRED

`NEXT_PUBLIC_CDN_URL` is a custom domain bound to the bucket, so the block is a
Cloudflare rule, not a bucket policy.

1. **First**, on the current deploy, smoke-test the three surfaces that read
   source: a paid component detail page, the command menu's "generate prompt",
   and `/publish/demo`. All three must work. Doing this first makes any later
   failure attributable.
2. In Cloudflare, add a rule on the `NEXT_PUBLIC_CDN_URL` domain returning 403
   for `/src/*`.
3. Verify:
   - `curl -I "$NEXT_PUBLIC_CDN_URL/src/anything"` -> 403
   - `curl -I "$NEXT_PUBLIC_CDN_URL/bundled/<a real id>.html"` -> 200
4. Re-run the step 1 smoke tests. They must still pass — they now read through
   signed URLs rather than the public CDN.

## Backfill (optional, separate, not required)

Components published before this change still have source at public paths and
are unaffected by the rule. Closing that exposure means copying their source
objects under `src/` and updating `code`, `demo_code`,
`tailwind_config_extension` and `global_css_extension` on the matching rows.
That is a data migration and can run any time afterwards.

## Guardrail

`apps/web/lib/__tests__/r2-read.test.ts` pins that every key shape the publish
flows write is one the reader recognises as private. If the writer and reader
prefixes drift, that test fails — otherwise the drift would silently turn signed
reads back into unsigned ones.
