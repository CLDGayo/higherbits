# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /magic has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:43:11

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 233

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
+               "fontSize": "13.5pt (18px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 13.5pt (18px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground\">",
+                 "target": Array [
+                   ".overflow-auto",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 13.5pt (18px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"mt-4 text-lg text-muted-foreground\">Use Magic with your favorite IDEs</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mb-8 > .mt-4",
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
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground\">",
+                 "target": Array [
+                   ".overflow-auto",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"text-sm text-muted-foreground\">Cursor</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[href$=\"cursor.com\"] > .text-muted-foreground.text-sm",
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
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground\">",
+                 "target": Array [
+                   ".overflow-auto",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"text-sm text-muted-foreground\">Windsurf</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           "a[href$=\"windsurf.ai/\"] > .text-muted-foreground.text-sm",
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
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<div class=\"absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground\">",
+                 "target": Array [
+                   ".overflow-auto",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<span class=\"text-sm text-muted-foreground\">VS Code + Cline</span>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".col-span-2 > .text-muted-foreground.text-sm",
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
+                 "html": "<div class=\"absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground\">",
+                 "target": Array [
+                   ".overflow-auto",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 13.5pt (18px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"mt-4 text-lg text-muted-foreground\">Create beautiful UI components in three simple steps</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".pt-10 > .text-center > .mt-4",
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
+                 "html": "<div class=\"absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground\">",
+                 "target": Array [
+                   ".overflow-auto",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 13.5pt (18px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"jsx-5938f6032460e552 mt-4 text-lg text-muted-foreground\">Everything you need to know about HigherBits AI</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".mt-4.jsx-5938f6032460e552",
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
          - generic [ref=e21]:
            - paragraph [ref=e22]: Introducing HigherBits AI
            - heading "AI Agent That Builds Beautiful UI Components" [level=1] [ref=e23]:
              - generic [ref=e24]:
                - generic [ref=e25]: AI Agent That Builds
                - generic [ref=e26]:
                  - generic [ref=e27]: Beautiful
                  - generic [ref=e29]: UI Components
            - paragraph [ref=e30]:
              - text: Empower your IDE with an AI extension that creates stunning, production-ready components inspired by
              - link "HigherBits.dev" [ref=e31] [cursor=pointer]:
                - /url: https://higherbits.dev
            - generic [ref=e32]:
              - generic [ref=e33]:
                - button "Get Started" [ref=e34] [cursor=pointer]:
                  - text: Get Started
                  - generic:
                    - img
                - link "5.5k" [ref=e35] [cursor=pointer]:
                  - /url: https://github.com/21st-dev/magic-mcp
                  - img
                  - generic [ref=e36]: 5.5k
              - generic [ref=e38]:
                - generic [ref=e39]:
                  - link "YL" [ref=e40] [cursor=pointer]:
                    - /url: https://x.com/stuffyokodraws
                    - generic [ref=e42]: YL
                  - link "MV" [ref=e43] [cursor=pointer]:
                    - /url: https://x.com/donvito
                    - generic [ref=e45]: MV
                  - link "G" [ref=e46] [cursor=pointer]:
                    - /url: https://x.com/gilgNYC
                    - generic [ref=e48]: G
                - generic [ref=e49]:
                  - img "20,114" [ref=e50]:
                    - generic [ref=e53]:
                      - generic [ref=e55]: "2"
                      - generic [ref=e57]: "0"
                      - generic [ref=e59]: ","
                      - generic [ref=e61]: "1"
                      - generic [ref=e63]: "1"
                      - generic [ref=e65]: "4"
                  - text: + people using HigherBits AI
            - img "HigherBits AI Demo" [ref=e70] [cursor=pointer]
          - generic [ref=e71]:
            - generic [ref=e72]:
              - generic [ref=e73]:
                - heading "Supported IDEs" [level=2] [ref=e74]
                - paragraph [ref=e75]: Use Magic with your favorite IDEs
              - generic [ref=e77]:
                - link "Cursor Cursor" [ref=e78] [cursor=pointer]:
                  - /url: https://cursor.com
                  - img "Cursor" [ref=e80]
                  - generic [ref=e86]: Cursor
                - link "Windsurf" [ref=e87] [cursor=pointer]:
                  - /url: https://windsurf.ai/
                  - img [ref=e88]
                  - generic [ref=e91]: Windsurf
                - link "+ Cline VS Code + Cline" [ref=e92] [cursor=pointer]:
                  - /url: https://cline.bot/
                  - generic [ref=e93]:
                    - img [ref=e94]
                    - generic [ref=e103]: +
                    - img "Cline" [ref=e105]
                  - generic [ref=e106]: VS Code + Cline
            - generic [ref=e107]:
              - generic [ref=e108]:
                - heading "Powerful Features" [level=2] [ref=e109]
                - paragraph [ref=e110]: Everything you need to build modern UI components
              - generic [ref=e111]:
                - generic [ref=e112]:
                  - img "Add New Components" [ref=e115]
                  - heading "Add New Components" [level=3] [ref=e117]
                  - paragraph [ref=e118]: Create UI components by describing what you need. HigherBits AI generates production-ready code instantly.
                - generic [ref=e119]:
                  - img "Enhance Existing UI" [ref=e122]
                  - heading "Enhance Existing UI" [level=3] [ref=e124]
                  - paragraph [ref=e125]: Improve components with advanced features and animations. Upgrade without starting from scratch.
                - generic [ref=e126]:
                  - link "SVGL Integration" [ref=e127] [cursor=pointer]:
                    - /url: https://svgl.app
                    - img [ref=e128]:
                      - img [ref=e131]
                    - generic [ref=e133]: SVGL Integration
                  - img "Access Logo Library" [ref=e136]
                  - heading "Access Logo Library" [level=3] [ref=e138]
                  - paragraph [ref=e139]: Integrate company logos and icons via SVGL. Access a vast collection of professional brand assets.
            - generic [ref=e140]:
              - generic [ref=e141]:
                - heading "How It Works" [level=2] [ref=e142]
                - paragraph [ref=e143]: Create beautiful UI components in three simple steps
              - generic [ref=e144]:
                - generic [ref=e145]:
                  - img "Describe Your Vision" [ref=e148]
                  - heading "Describe Your Vision" [level=3] [ref=e149]
                  - paragraph [ref=e150]: Simply tell the AI Agent what component you need by typing /ui and describing your idea - whether it's a pricing table, contact form, or navigation menu.
                - generic [ref=e151]:
                  - img "Choose from Options" [ref=e154]
                  - heading "Choose from Options" [level=3] [ref=e155]
                  - paragraph [ref=e156]: HigherBits AI generates three unique variations of your component. Review them and select the one that best matches your needs and design preferences.
                - generic [ref=e157]:
                  - img "Instant Integration" [ref=e160]
                  - heading "Instant Integration" [level=3] [ref=e161]
                  - paragraph [ref=e162]: Your IDE's AI Agent automatically integrates the chosen component into your project, handling all the necessary files and dependencies seamlessly.
            - generic [ref=e163]:
              - generic [ref=e164]:
                - heading "Frequently Asked Questions" [level=2] [ref=e165]
                - paragraph [ref=e166]: Everything you need to know about HigherBits AI
              - generic [ref=e168]:
                - heading "How does HigherBits AI work?" [level=3] [ref=e170]:
                  - button "How does HigherBits AI work?" [ref=e171] [cursor=pointer]:
                    - text: How does HigherBits AI work?
                    - img [ref=e172]
                - heading "How does HigherBits AI handle my codebase?" [level=3] [ref=e175]:
                  - button "How does HigherBits AI handle my codebase?" [ref=e176] [cursor=pointer]:
                    - text: How does HigherBits AI handle my codebase?
                    - img [ref=e177]
                - heading "Can I customize the generated components?" [level=3] [ref=e180]:
                  - button "Can I customize the generated components?" [ref=e181] [cursor=pointer]:
                    - text: Can I customize the generated components?
                    - img [ref=e182]
                - heading "Who owns the generated components?" [level=3] [ref=e185]:
                  - button "Who owns the generated components?" [ref=e186] [cursor=pointer]:
                    - text: Who owns the generated components?
                    - img [ref=e187]
                - heading "How does revenue sharing work with component authors?" [level=3] [ref=e190]:
                  - button "How does revenue sharing work with component authors?" [ref=e191] [cursor=pointer]:
                    - text: How does revenue sharing work with component authors?
                    - img [ref=e192]
                - heading "What happens if I run out of generations?" [level=3] [ref=e195]:
                  - button "What happens if I run out of generations?" [ref=e196] [cursor=pointer]:
                    - text: What happens if I run out of generations?
                    - img [ref=e197]
                - heading "How soon do new components get added to HigherBits.dev's library?" [level=3] [ref=e200]:
                  - button "How soon do new components get added to HigherBits.dev's library?" [ref=e201] [cursor=pointer]:
                    - text: How soon do new components get added to HigherBits.dev's library?
                    - img [ref=e202]
                - heading "Is there a limit to component complexity?" [level=3] [ref=e205]:
                  - button "Is there a limit to component complexity?" [ref=e206] [cursor=pointer]:
                    - text: Is there a limit to component complexity?
                    - img [ref=e207]
                - heading "How can I get help with HigherBits AI?" [level=3] [ref=e210]:
                  - button "How can I get help with HigherBits AI?" [ref=e211] [cursor=pointer]:
                    - text: How can I get help with HigherBits AI?
                    - img [ref=e212]
          - generic [ref=e216]:
            - generic [ref=e217]: Higher Bits Labs Inc.
            - navigation [ref=e218]:
              - link "Our Story" [ref=e219] [cursor=pointer]:
                - /url: /our-story
              - link "Terms" [ref=e220] [cursor=pointer]:
                - /url: /terms
              - link "Privacy" [ref=e221] [cursor=pointer]:
                - /url: /privacy
              - link "Refunds" [ref=e222] [cursor=pointer]:
                - /url: /refunds
              - link "Contact" [ref=e223] [cursor=pointer]:
                - /url: mailto:support@higherbits.dev
              - link "Discord" [ref=e224] [cursor=pointer]:
                - /url: https://discord.gg/Qx4rFunHfm
    - region "Notifications alt+T"
  - alert [ref=e225]
  - button "Open Next.js Dev Tools" [ref=e231] [cursor=pointer]:
    - img [ref=e232]
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