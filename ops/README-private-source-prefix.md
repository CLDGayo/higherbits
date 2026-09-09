# Serving paid component source privately (audit blocker B2)

**Operator action required at the bottom.** Nothing in the shipped code prevents
public reads on its own.

> **CORRECTED 2026-09-09.** An earlier version of this file said
> `NEXT_PUBLIC_CDN_URL` is "a custom domain bound to the bucket" and that the
> remaining work was one Cloudflare rule. Both were wrong. See
> §Why the original plan does not work. Verified findings and evidence:
> `../HigherBits.dev Second Brain/process/features/production-readiness/active/production-readiness_08-09-26/`.

## Current exposure scope (measured 2026-09-09)

**B2 is latent, not live.** All 62 components in the production sitemap return
`200` from `GET /api/r/{owner}/{slug}` with source inline — because
`isComponentPaid` is false for every one of them. **There are zero paid
components in production**, so no paid source is currently leaking.

`isComponentPaid` (`apps/web/lib/api/server/bundle_purchases.ts`) is purely
"is this component in any `bundle_items` row". That is set *after* publish. So
the risk is a scheduling one: the moment a component is added to a bundle it
becomes paid, but its already-published, publicly readable
`registry.*.json` — written at publish time with **full source inline** — does
not move. **Fix this before the first paid component ships**, or budget a
backfill at that moment.

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
change keep resolving from their old public paths.

## Why the original plan does not work

Four independent reasons. Each was verified; commands are given so they can be
re-run.

**1. The CDN is not a custom domain.** Production `NEXT_PUBLIC_CDN_URL` is
`https://pub-353b490c6d7c464882ea009a7dd96eb7.r2.dev` — R2's Cloudflare-managed
*public development URL*.

**2. Cloudflare rules cannot be applied to it.** Cloudflare documents this
verbatim at https://developers.cloudflare.com/r2/buckets/public-buckets/ :

> To use features like WAF custom rules, caching, access controls, or Bot
> Management, you must configure your bucket behind a custom domain. **These
> capabilities are not available when using the `r2.dev` development url.**

    curl -sS -L https://developers.cloudflare.com/r2/buckets/public-buckets/index.md \
      | grep -n "not available when using"

**3. `higherbits.dev` is not on Cloudflare at all**, so "bind a custom domain"
is itself blocked behind a DNS migration of a live production domain:

    dig +short NS higherbits.dev        # -> apollo/athena.dns-parking.com (Hostinger)
    curl -sI https://higherbits.dev/ | grep -i 'cf-ray\|^server'   # no CF-RAY; server: nginx

**4. A `/src/*` rule would not close the hole even if it could be applied.**
`registry.*.json` is public *by design* in the table above and **embeds the
complete source inline**:

    curl -s "$CDN/cozy_downloads/spiral/registry.1788335836338.json" \
      | python3 -c "import json,sys; print(len(json.load(sys.stdin)['files'][0]['content']))"
    # -> 14625, byte-identical to code.1788335836337.tsx

Confirming no rule is live today (a rule would return 403 regardless of whether
the object exists):

    curl -s -o /dev/null -w '%{http_code}\n' "$CDN/src/probe-nonexistent"   # 404
    curl -s -o /dev/null -w '%{http_code}\n' "$CDN/probe-nonexistent"       # 404 (control)

## Also unresolved: the page hands out more than `code`

`apps/web/app/[username]/[component_slug]/page.tsx` blanks only `component.code`
and `demo.demo_code` for non-purchasers, then passes `component={component}` —
**the whole DB row** (line 309). Every other column ships in the flight payload,
including `registry_url`. These props are passed unconditionally:

    tailwindConfig={tailwindConfigResult?.data}      # table above calls this paid source
    globalCss={globalCssResult?.data}                # table above calls this paid source
    registryDependencies={registryDependenciesFiles} # dependency source code

Because the server reads these with credentials and hands the content to the
client, **no CDN rule can close this path.** It must be gated in the page.

## What would actually close B2

In order. Steps 1-2 are code and can land now; 3-5 are operator work.

1. Gate `tailwindConfig`, `globalCss`, `registryDependencies` and
   `index_css_url` on `hasPurchased` in the component detail page and in the
   `@modal` route, the same way `code`/`demoCode` already are. Blank
   `registry_url` on the row before passing it.
2. Stop writing full source into the public `registry.*.json`, or write it under
   `src/` and serve the CLI exclusively from
   `GET /api/r/{owner}/{slug}` — which already gates correctly on
   `isComponentPaid` + `hasUserComponentAccess` (route.ts:224-250).
3. Onboard `higherbits.dev` to Cloudflare (full or partial/CNAME setup).
4. Bind a custom domain to the bucket, repoint `NEXT_PUBLIC_CDN_URL`, and
   **backfill every persisted absolute URL** (see below) before cutting over.
5. **Disable the r2.dev public development URL.** Cloudflare: "If you do not
   disable public access, your bucket will remain publicly available through
   your `r2.dev` subdomain." A rule on the custom domain does not close r2.dev.

## Backfill

Asset URLs are persisted as **full absolute URLs** built from
`NEXT_PUBLIC_CDN_URL` at upload time (`apps/web/lib/r2.ts:157`,
`apps/backend/src/r2.ts:44`). So steps 4-5 are a data migration, not a config
flip: every row holding an R2 URL must be rewritten, or every published asset
404s the moment the development URL is disabled.

Columns on `components` holding R2 URLs: `code`, `demo_code`, `preview_url`,
`video_url`, `tailwind_config_extension`, `global_css_extension`,
`compiled_css`, `registry_url`, `index_css_url`, `pro_preview_image_url`; plus
`bundle_html_url` on demos.

## Guardrail

`apps/web/lib/__tests__/r2-read.test.ts` pins that every key shape the publish
flows write is one the reader recognises as private. If the writer and reader
prefixes drift, that test fails — otherwise the drift would silently turn signed
reads back into unsigned ones. **It does not cover `registry.*.json`.**
