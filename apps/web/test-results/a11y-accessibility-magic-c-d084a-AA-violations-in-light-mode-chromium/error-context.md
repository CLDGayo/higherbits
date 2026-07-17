# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /magic-chat has no WCAG A/AA violations in light mode
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
+         "html": "<a href=\"https://github.com/2...\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"inline-flex items-ce...\">",
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
+           ".px-2\\.5",
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
      - generic [ref=e5]:
        - generic [ref=e6]:
          - generic [ref=e7]:
            - generic "Right-click for brand assets menu" [ref=e8] [cursor=pointer]:
              - img [ref=e10]
            - generic [ref=e12]: Magic by HigherBits.dev
          - generic [ref=e13]:
            - link "5.5k" [ref=e14] [cursor=pointer]:
              - /url: https://github.com/21st-dev/magic-mcp
              - img
              - generic [ref=e15]: 5.5k
            - link "Pricing" [ref=e16] [cursor=pointer]:
              - /url: /pricing
            - button "Sign up" [ref=e17] [cursor=pointer]
        - main [ref=e18]:
          - generic [ref=e22]:
            - paragraph [ref=e23]: Introducing Magic Chat
            - heading "Create standout components" [level=1] [ref=e24]:
              - generic [ref=e26]: Create standout components
            - paragraph [ref=e27]: Start with a prompt, iterate in chat, and draw inspiration from the best works of HigherBits.dev's top design engineers
            - generic [ref=e30]:
              - textbox "Enter your email" [ref=e31]
              - button "Join Waitlist" [disabled]
            - img "Magic Chat Demo" [ref=e36] [cursor=pointer]
          - generic [ref=e39]:
            - generic [ref=e40]: Higher Bits Labs Inc.
            - navigation [ref=e41]:
              - link "Our Story" [ref=e42] [cursor=pointer]:
                - /url: /our-story
              - link "Terms" [ref=e43] [cursor=pointer]:
                - /url: /terms
              - link "Privacy" [ref=e44] [cursor=pointer]:
                - /url: /privacy
              - link "Refunds" [ref=e45] [cursor=pointer]:
                - /url: /refunds
              - link "Contact" [ref=e46] [cursor=pointer]:
                - /url: mailto:support@higherbits.dev
              - link "Discord" [ref=e47] [cursor=pointer]:
                - /url: https://discord.gg/Qx4rFunHfm
    - region "Notifications alt+T"
  - alert [ref=e48]
  - button "Open Next.js Dev Tools" [ref=e54] [cursor=pointer]:
    - img [ref=e55]
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