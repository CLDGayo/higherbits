# Home category discovery fixture

Run from `apps/web`:

```sh
./node_modules/.bin/playwright test --config e2e/home-category-discovery.fixture.config.ts
```

The dedicated config starts a loopback server on `127.0.0.1:3217`. It does not
start Next or load `.env` files. Its bundle includes the real `app/page.tsx`,
`LandingPageLayout`, `CatalogueChipRow`, `CatalogueCarouselRow`, and
`ComponentCatalogue`. Catalogue data is synthetic. The header, unrelated
landing sections, card body, and `/?tab=home` browser are stubs. The local
`/s/[slug]` responses prove anchor navigation only; they do not represent live
category results.

The server checks the bundle's input list for all five real source files and
rejects provider or environment modules. It disables outbound Node client
networking, serves only loopback GETs, and sets a restrictive content security
policy. The Playwright spec aborts any non-local browser request and fails if
one occurs. The spec file ends in `.fixture.ts`, so the normal Next-backed
Playwright config does not select it.

This fixture checks grouped links and names, carousel row wiring and direction,
full-catalogue reachability, local category navigation, responsive overflow,
keyboard focus, light/dark presentation, and accessibility of the category
navigation. Its screenshots and JSON report are written to
`/tmp/higherbits-home-category-results/`.

It does not establish production or staging data availability, anonymous
provider permissions, the real header's search behavior, or the full card UI.
