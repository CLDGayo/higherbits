# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> / has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:43:11

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -  1
+ Received  + 84

- Array []
+ Array [
+   Object {
+     "description": "Ensure links have discernible text",
+     "help": "Links must have discernible text",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/link-name?application=playwright",
+     "id": "link-name",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": null,
+             "id": "has-visible-text",
+             "impact": "serious",
+             "message": "Element does not have text that is visible to screen readers",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-label",
+             "impact": "serious",
+             "message": "aria-label attribute does not exist or is empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": null,
+             "id": "aria-labelledby",
+             "impact": "serious",
+             "message": "aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty",
+             "relatedNodes": Array [],
+           },
+           Object {
+             "data": Object {
+               "messageKey": "noAttr",
+             },
+             "id": "non-empty-title",
+             "impact": "serious",
+             "message": "Element has no title attribute",
+             "relatedNodes": Array [],
+           },
+         ],
+         "failureSummary": "Fix all of the following:
+   Element is in tab order and does not have accessible text
+
+ Fix any of the following:
+   Element does not have text that is visible to screen readers
+   aria-label attribute does not exist or is empty
+   aria-labelledby attribute does not exist, references elements that do not exist or references elements that are empty
+   Element has no title attribute",
+         "html": "<a target=\"_blank\" rel=\"noreferrer\" class=\"flex items-center gap-1.5 text-sm text-foreground/90 hover:text-foreground transition-colors\" href=\"https://github.com/CLDGayo/higherbits\">",
+         "impact": "serious",
+         "none": Array [
+           Object {
+             "data": null,
+             "id": "focusable-no-name",
+             "impact": "serious",
+             "message": "Element is in tab order and does not have accessible text",
+             "relatedNodes": Array [],
+           },
+         ],
+         "target": Array [
+           ".gap-1\\.5",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.name-role-value",
+       "wcag2a",
+       "wcag244",
+       "wcag412",
+       "section508",
+       "section508.22.a",
+       "TTv5",
+       "TT6.a",
+       "EN-301-549",
+       "EN-9.2.4.4",
+       "EN-9.4.1.2",
+       "ACT",
+       "RGAAv4",
+       "RGAA-6.2.1",
+     ],
+   },
+ ]
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - main [ref=e4]:
      - generic [ref=e6]:
        - generic [ref=e7]:
          - generic:
            - main:
              - generic [ref=e10]:
                - navigation [ref=e12]:
                  - generic [ref=e15]: HigherBits.dev
                  - generic [ref=e17]:
                    - link "Explore" [ref=e18] [cursor=pointer]:
                      - /url: /?tab=home
                    - link "API" [ref=e19] [cursor=pointer]:
                      - /url: /api-access
                    - link "Magic MCP" [ref=e20] [cursor=pointer]:
                      - /url: /magic
                    - link [ref=e21] [cursor=pointer]:
                      - /url: https://github.com/CLDGayo/higherbits
                      - img [ref=e22]
                - generic [ref=e27]:
                  - generic [ref=e29]: Cozy UI, freshly baked
                  - heading "Discover, share & remix the best UI components" [level=1] [ref=e30]
                  - heading "Built by design engineers, loved by vibe coders." [level=2] [ref=e31]
                  - generic [ref=e32]:
                    - button "Browse components" [ref=e33] [cursor=pointer]:
                      - text: Browse components
                      - generic [ref=e34]:
                        - img
                    - link "Integrate in IDE AI Agent" [ref=e35] [cursor=pointer]:
                      - /url: /magic
                      - text: Integrate in IDE AI Agent
                      - img
                  - generic [ref=e37]:
                    - paragraph [ref=e38]: Optimized for
                    - generic [ref=e39]:
                      - generic [ref=e40]:
                        - generic [ref=e41]:
                          - generic:
                            - generic "Cursor video logo animation"
                          - img [ref=e42]
                        - img [ref=e46]
                        - generic [ref=e50]:
                          - img [ref=e51]
                          - generic [ref=e60]: +
                          - img "Cline" [ref=e62]
                      - generic [ref=e63]:
                        - img [ref=e65]
                        - img [ref=e68]
                        - generic [ref=e72]:
                          - img [ref=e73]
                          - generic [ref=e90]: lovable
                        - img [ref=e92]
        - generic [ref=e105]:
          - generic [ref=e106]: Higher Bits Labs Inc.
          - generic [ref=e108]:
            - text: The source code is available on
            - link "GitHub" [ref=e109] [cursor=pointer]:
              - /url: https://github.com/CLDGayo/higherbits
          - navigation [ref=e110]:
            - link "Our Story" [ref=e111] [cursor=pointer]:
              - /url: /our-story
            - link "Terms" [ref=e112] [cursor=pointer]:
              - /url: /terms
            - link "Privacy" [ref=e113] [cursor=pointer]:
              - /url: /privacy
            - link "Refunds" [ref=e114] [cursor=pointer]:
              - /url: /refunds
            - link "Contact" [ref=e115] [cursor=pointer]:
              - /url: mailto:support@higherbits.dev
            - link "Discord" [ref=e116] [cursor=pointer]:
              - /url: https://discord.gg/Qx4rFunHfm
    - region "Notifications alt+T"
  - alert [ref=e117]
  - button "Open Next.js Dev Tools" [ref=e123] [cursor=pointer]:
    - img [ref=e124]
```

# Test source

```ts
  1  | import AxeBuilder from "@axe-core/playwright"
  2  | import { expect, test, type Page } from "@playwright/test"
  3  | 
  4  | const routes = [
  5  |   "/",
  6  |   "/magic",
  7  |   "/magic-chat",
  8  |   "/studio",
  9  |   "/api-access",
  10 |   "/contest",
  11 |   "/our-story",
  12 |   "/templates",
  13 |   "/public-dashboard",
  14 | ]
  15 | 
  16 | async function auditRoute(page: Page, route: string, theme: "light" | "dark") {
  17 |   if (theme === "dark") {
  18 |     await page.addInitScript(() => {
  19 |       window.localStorage.setItem("theme", "dark")
  20 |       document.documentElement.classList.add("dark")
  21 |     })
  22 |   }
  23 | 
  24 |   await page.goto(route)
  25 |   await page.waitForLoadState("networkidle")
  26 | 
  27 |   if (theme === "dark") {
  28 |     await page.evaluate(() => {
  29 |       document.documentElement.classList.add("dark")
  30 |     })
  31 |   }
  32 | 
  33 |   const results = await new AxeBuilder({ page })
  34 |     .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  35 |     .analyze()
  36 | 
> 37 |   expect(results.violations).toEqual([])
     |                              ^ Error: expect(received).toEqual(expected) // deep equality
  38 | }
  39 | 
  40 | test.describe("accessibility", () => {
  41 |   for (const route of routes) {
  42 |     for (const theme of ["light", "dark"] as const) {
  43 |       test(`${route} has no WCAG A/AA violations in ${theme} mode`, async ({
  44 |         page,
  45 |       }) => {
  46 |         await auditRoute(page, route, theme)
  47 |       })
  48 |     }
  49 |   }
  50 | })
  51 | 
```