# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /public-dashboard has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:43:11

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 222

- Array []
+ Array [
+   Object {
+     "description": "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds",
+     "help": "Elements must meet minimum color contrast ratio thresholds",
+     "helpUrl": "https://dequeuniversity.com/rules/axe/4.12/color-contrast?application=playwright",
+     "id": "color-contrast",
+     "impact": "serious",
+     "nodes": Array [
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ede9f6",
+               "contrastRatio": 4.41,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "12.0pt (16px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<body class=\"__variable_f367f3 __variable_472caf __variable_13fb82 __variable_572227 font-sans [scrollbar-gutter:stable]\">",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-muted-foreground\">View all authors receiving payouts in HigherBits.dev</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-2 > p",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#efebf1",
+               "contrastRatio": 4.47,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   "thead > .bg-muted\\/50",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"clay-surface rounded-cushion bg-card text-card-foreground shadow-clay-md overflow-hidden p-6\">",
+                 "target": Array [
+                   ".overflow-hidden",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"flex items-center\">Author</div>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".text-left > .items-center.flex",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#efebf1",
+               "contrastRatio": 4.47,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   "thead > .bg-muted\\/50",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"clay-surface rounded-cushion bg-card text-card-foreground shadow-clay-md overflow-hidden p-6\">",
+                 "target": Array [
+                   ".overflow-hidden",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"flex items-center justify-end\">Components</div>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "th:nth-child(2) > .justify-end.items-center.flex",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#efebf1",
+               "contrastRatio": 4.47,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   "thead > .bg-muted\\/50",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"clay-surface rounded-cushion bg-card text-card-foreground shadow-clay-md overflow-hidden p-6\">",
+                 "target": Array [
+                   ".overflow-hidden",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"flex items-center justify-end\">",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "th:nth-child(3) > .justify-end.items-center.flex",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#efebf1",
+               "contrastRatio": 4.47,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   "thead > .bg-muted\\/50",
+                 ],
+               },
+               Object {
+                 "html": "<div class=\"clay-surface rounded-cushion bg-card text-card-foreground shadow-clay-md overflow-hidden p-6\">",
+                 "target": Array [
+                   ".overflow-hidden",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.47 (foreground color: #78695e, background color: #efebf1, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<div class=\"flex items-center justify-end\">Potential Earnings</div>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "th:nth-child(4) > .justify-end.items-center.flex",
+         ],
+       },
+     ],
+     "tags": Array [
+       "cat.color",
+       "wcag2aa",
+       "wcag143",
+       "TTv5",
+       "TT13.c",
+       "EN-301-549",
+       "EN-9.1.4.3",
+       "ACT",
+       "RGAAv4",
+       "RGAA-3.2.1",
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
          - heading "Public Payouts Dashboard" [level=1] [ref=e8]
          - paragraph [ref=e9]: View all authors receiving payouts in HigherBits.dev
        - generic [ref=e10]:
          - generic [ref=e11]:
            - generic [ref=e12]: Total Usage
            - generic [ref=e13]: "0"
          - generic [ref=e14]:
            - generic [ref=e15]: Potential Earnings
            - generic [ref=e16]: $0.00
          - generic [ref=e17]:
            - generic [ref=e18]: Components
            - generic [ref=e19]: "0"
          - generic [ref=e20]:
            - generic [ref=e21]:
              - generic [ref=e22]: Unlock everything
              - paragraph [ref=e23]: Go Pro for full access to every component.
            - link "Support Us!" [ref=e24] [cursor=pointer]:
              - /url: /support
        - generic [ref=e25]:
          - generic [ref=e26]:
            - generic [ref=e27]: Top authors by usage
            - img [ref=e31]
          - generic [ref=e34]:
            - generic [ref=e35]: Earnings share
            - img [ref=e39]
        - generic [ref=e40]:
          - generic [ref=e41]:
            - generic [ref=e43]:
              - textbox "Search by username or name..." [ref=e44]
              - img [ref=e45]
            - combobox "Rows per page" [ref=e49] [cursor=pointer]:
              - generic: 10 rows
              - img [ref=e50]
          - table [ref=e54]:
            - rowgroup [ref=e55]:
              - row "Author Components Total Usage Potential Earnings" [ref=e56]:
                - columnheader "Author" [ref=e57] [cursor=pointer]:
                  - generic [ref=e58]: Author
                - columnheader "Components" [ref=e59] [cursor=pointer]:
                  - generic [ref=e60]: Components
                - columnheader "Total Usage" [ref=e61] [cursor=pointer]:
                  - generic [ref=e62]:
                    - text: Total Usage
                    - img [ref=e63]
                - columnheader "Potential Earnings" [ref=e65] [cursor=pointer]:
                  - generic [ref=e66]: Potential Earnings
            - rowgroup [ref=e67]:
              - row [ref=e68]:
                - cell [ref=e69]
                - cell [ref=e75]
                - cell [ref=e77]
                - cell [ref=e79]
              - row [ref=e81]:
                - cell [ref=e82]
                - cell [ref=e88]
                - cell [ref=e90]
                - cell [ref=e92]
              - row [ref=e94]:
                - cell [ref=e95]
                - cell [ref=e101]
                - cell [ref=e103]
                - cell [ref=e105]
              - row [ref=e107]:
                - cell [ref=e108]
                - cell [ref=e114]
                - cell [ref=e116]
                - cell [ref=e118]
              - row [ref=e120]:
                - cell [ref=e121]
                - cell [ref=e127]
                - cell [ref=e129]
                - cell [ref=e131]
            - rowgroup [ref=e133]:
              - row "Total 0 0 $0.00" [ref=e134]:
                - cell "Total" [ref=e135]
                - cell "0" [ref=e136]
                - cell "0" [ref=e137]
                - cell "$0.00" [ref=e138]
    - region "Notifications alt+T"
  - alert [ref=e139]
  - button "Open Next.js Dev Tools" [ref=e145] [cursor=pointer]:
    - img [ref=e146]
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