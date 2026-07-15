# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /templates has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:42:11

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 128

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
+         "html": "<span>Back to HigherBits.dev</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "span",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ede9f6",
+               "contrastRatio": 4.41,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "15.0pt (20px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 15.0pt (20px), font weight: normal). Expected contrast ratio of 4.5:1",
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
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 15.0pt (20px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-xl text-muted-foreground\">Collection of crafted website templates built with shadcn/ui components, Framer Motion animations and Tailwind CSS by design engineers.</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".text-xl",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ede9f6",
+               "contrastRatio": 4.41,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "13.5pt (18px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 13.5pt (18px), font weight: normal). Expected contrast ratio of 4.5:1",
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
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 13.5pt (18px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-lg text-muted-foreground\">No templates found</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".text-lg",
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
        - link "Back to HigherBits.dev" [ref=e7] [cursor=pointer]:
          - /url: /
          - img [ref=e8]
          - generic [ref=e10]: Back to HigherBits.dev
        - generic [ref=e11]:
          - heading "shadcn/ui Templates" [level=1] [ref=e12]
          - paragraph [ref=e13]: Collection of crafted website templates built with shadcn/ui components, Framer Motion animations and Tailwind CSS by design engineers.
        - paragraph [ref=e15]: No templates found
    - region "Notifications alt+T"
  - alert [ref=e16]
  - generic [ref=e21] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e22]:
      - img [ref=e23]
    - generic [ref=e26]:
      - button "Open issues overlay" [ref=e27]:
        - generic [ref=e28]:
          - generic [ref=e29]: "1"
          - generic [ref=e30]: "2"
        - generic [ref=e31]:
          - text: Issue
          - generic [ref=e32]: s
      - button "Collapse issues badge" [ref=e33]:
        - img [ref=e34]
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
  13 | ]
  14 | 
  15 | async function auditRoute(page: Page, route: string, theme: "light" | "dark") {
  16 |   if (theme === "dark") {
  17 |     await page.addInitScript(() => {
  18 |       window.localStorage.setItem("theme", "dark")
  19 |       document.documentElement.classList.add("dark")
  20 |     })
  21 |   }
  22 | 
  23 |   await page.goto(route)
  24 |   await page.waitForLoadState("networkidle")
  25 | 
  26 |   if (theme === "dark") {
  27 |     await page.evaluate(() => {
  28 |       document.documentElement.classList.add("dark")
  29 |     })
  30 |   }
  31 | 
  32 |   const results = await new AxeBuilder({ page })
  33 |     .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
  34 |     .analyze()
  35 | 
> 36 |   expect(results.violations).toEqual([])
     |                              ^ Error: expect(received).toEqual(expected) // deep equality
  37 | }
  38 | 
  39 | test.describe("accessibility", () => {
  40 |   for (const route of routes) {
  41 |     for (const theme of ["light", "dark"] as const) {
  42 |       test(`${route} has no WCAG A/AA violations in ${theme} mode`, async ({
  43 |         page,
  44 |       }) => {
  45 |         await auditRoute(page, route, theme)
  46 |       })
  47 |     }
  48 |   }
  49 | })
  50 | 
```