# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /api-access has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:43:11

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 338

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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-muted-foreground text-sm sm:text-base\">Semantic UI Component API for AI-Powered Development</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".sm\\:text-base",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground\">Natural language component search for AI code editors</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".grid-cols-1 > .space-y-1:nth-child(1) > p:nth-child(2)",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground\">Growing collection of community components, verified for quality and reliability</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-1:nth-child(2) > p:nth-child(2)",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<h3 class=\"text-sm font-medium text-muted-foreground\">Request</h3>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(2) > h3:nth-child(2)",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<h3 class=\"text-sm font-medium text-muted-foreground\">Success Response</h3>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(2) > h3:nth-child(5)",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<h3 class=\"text-sm font-medium text-muted-foreground\">Error Responses</h3>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(2) > h3:nth-child(8)",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<h3 class=\"text-sm font-medium text-muted-foreground\">Request</h3>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(3) > h3:nth-child(2)",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<h3 class=\"text-sm font-medium text-muted-foreground\">Success Response</h3>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(3) > h3:nth-child(5)",
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
+                 "html": "<div class=\"min-h-screen flex flex-col bg-background\">",
+                 "target": Array [
+                   ".min-h-screen.flex-col.bg-background",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<h3 class=\"text-sm font-medium text-muted-foreground\">Error Responses</h3>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(3) > h3:nth-child(8)",
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
          - generic [ref=e8]:
            - button "Toggle Sidebar" [ref=e9] [cursor=pointer]:
              - img
              - generic [ref=e10]: Toggle Sidebar
            - link "HigherBits" [ref=e12] [cursor=pointer]:
              - /url: /
              - generic [ref=e13]:
                - img [ref=e14]
                - generic [ref=e16]: HigherBits
          - button "Global search... ⌘ K" [ref=e19] [cursor=pointer]:
            - generic [ref=e20]: Global search...
            - generic:
              - generic: ⌘
              - text: K
          - generic [ref=e21]:
            - link "Support Us!" [ref=e22] [cursor=pointer]:
              - /url: /support
              - paragraph [ref=e23]: Support Us!
            - button "Sign up" [ref=e24] [cursor=pointer]
        - main [ref=e25]:
          - generic [ref=e27]:
            - generic [ref=e28]:
              - generic [ref=e29]:
                - heading "API Access" [level=1] [ref=e30]
                - paragraph [ref=e31]: Semantic UI Component API for AI-Powered Development
              - generic [ref=e32]:
                - generic [ref=e33]:
                  - paragraph [ref=e34]: Semantic Search
                  - paragraph [ref=e35]: Natural language component search for AI code editors
                - generic [ref=e36]:
                  - paragraph [ref=e37]: Community-Driven Library
                  - paragraph [ref=e38]: Growing collection of community components, verified for quality and reliability
            - alert [ref=e39]:
              - img [ref=e40]
              - heading "Important Notice" [level=5] [ref=e42]
              - generic [ref=e43]:
                - text: To help us better understand how you're using our API and provide better support, please reach out to us! Contact Serafim
                - link "on Twitter" [ref=e44] [cursor=pointer]:
                  - /url: https://twitter.com/serafimcloud
                - text: or email our support at
                - link "support@higherbits.dev" [ref=e45] [cursor=pointer]:
                  - /url: mailto:support@higherbits.dev
                - text: . We'd love to learn about your project and ensure you have the best possible experience with our API.
            - generic [ref=e46]:
              - generic [ref=e47]:
                - heading "Authentication" [level=2] [ref=e48]
                - button "Click to copy code" [ref=e49] [cursor=pointer]:
                  - code [ref=e56]:
                    - generic [ref=e57]: "x-api-key: your_api_key_here"
              - generic [ref=e58]:
                - heading "Search API" [level=2] [ref=e59]
                - heading "Request" [level=3] [ref=e60]
                - button "Click to copy code" [ref=e61] [cursor=pointer]:
                  - code [ref=e68]:
                    - generic [ref=e69]: // POST /api/search
                    - generic [ref=e70]: "{"
                    - generic [ref=e71]: "\"search\": \"hero section\", // Required: search query"
                    - generic [ref=e72]: "\"page\": 1, // Optional: page number (default: 1)"
                    - generic [ref=e73]: "\"per_page\": 20 // Optional: results per page (default: 20)"
                    - generic [ref=e74]: "}"
                - heading "Success Response" [level=3] [ref=e75]
                - button "Click to copy code" [ref=e76] [cursor=pointer]:
                  - code [ref=e83]:
                    - generic [ref=e84]: "{"
                    - generic [ref=e85]: "\"results\": [{"
                    - generic [ref=e86]: "\"name\": \"Default\","
                    - generic [ref=e87]: "\"preview_url\": \"https://cdn.HigherBits.dev/...\","
                    - generic [ref=e88]: "\"video_url\": \"https://cdn.HigherBits.dev/...\","
                    - generic [ref=e89]: "\"demo_id\": 123, // Use this ID for prompt generation"
                    - generic [ref=e90]: "\"component_data\": {"
                    - generic [ref=e91]: "\"name\": \"Animated hero\","
                    - generic [ref=e92]: "\"description\": \"Animated hero with text and two shadcn/ui buttons\","
                    - generic [ref=e93]: "\"code\": \"https://cdn.HigherBits.dev/...\","
                    - generic [ref=e94]: "\"install_command\": \"pnpm dlx shadcn@latest add \"https://higherbits.dev/r/...\"\""
                    - generic [ref=e95]: "},"
                    - generic [ref=e96]: "\"component_user_data\": {"
                    - generic [ref=e97]: "\"name\": \"serafim\","
                    - generic [ref=e98]: "\"username\": \"serafimcloud\","
                    - generic [ref=e99]: "\"image_url\": \"https://img.clerk.com/...\""
                    - generic [ref=e100]: "},"
                    - generic [ref=e101]: "\"usage_count\": 1621"
                    - generic [ref=e102]: "}],"
                    - generic [ref=e103]: "\"metadata\": {"
                    - generic [ref=e104]: "\"plan\": \"free\", // Current API plan"
                    - generic [ref=e105]: "\"requests_remaining\": 80, // Remaining API requests"
                    - generic [ref=e106]: "\"pagination\": {"
                    - generic [ref=e107]: "\"total\": 45, // Total number of results"
                    - generic [ref=e108]: "\"page\": 1, // Current page"
                    - generic [ref=e109]: "\"per_page\": 20, // Results per page"
                    - generic [ref=e110]: "\"total_pages\": 3 // Total number of pages"
                    - generic [ref=e111]: "}"
                    - generic [ref=e112]: "}"
                    - generic [ref=e113]: "}"
                - heading "Error Responses" [level=3] [ref=e114]
                - button "Click to copy code" [ref=e115] [cursor=pointer]:
                  - code [ref=e122]:
                    - generic [ref=e123]: // 401 Unauthorized
                    - generic [ref=e124]: "{"
                    - generic [ref=e125]: "\"error\": \"API key is required\""
                    - generic [ref=e126]: "}"
                    - generic [ref=e127]: // or
                    - generic [ref=e128]: "{"
                    - generic [ref=e129]: "\"error\": \"Invalid API key\""
                    - generic [ref=e130]: "}"
                    - generic [ref=e131]: // 400 Bad Request
                    - generic [ref=e132]: "{"
                    - generic [ref=e133]: "\"error\": \"Search query is required\""
                    - generic [ref=e134]: "}"
                    - generic [ref=e135]: // 500 Internal Server Error
                    - generic [ref=e136]: "{"
                    - generic [ref=e137]: "\"error\": \"Internal server error\","
                    - generic [ref=e138]: "\"details\": \"Error message details\""
                    - generic [ref=e139]: "}"
              - generic [ref=e140]:
                - heading "Generate Prompt API" [level=2] [ref=e141]
                - heading "Request" [level=3] [ref=e142]
                - button "Click to copy code" [ref=e143] [cursor=pointer]:
                  - code [ref=e150]:
                    - generic [ref=e151]: // POST /api/prompts
                    - generic [ref=e152]: "{"
                    - generic [ref=e153]: "\"prompt_type\": \"basic\", // Required: one of [\"sitebrew\",\"v0\",\"lovable\",\"bolt\",\"extended\",\"replit\",\"magic_patterns\"]"
                    - generic [ref=e154]: "\"demo_id\": \"123\" // Required: demo ID from search results"
                    - generic [ref=e155]: "}"
                - heading "Success Response" [level=3] [ref=e156]
                - button "Click to copy code" [ref=e157] [cursor=pointer]:
                  - code [ref=e164]:
                    - generic [ref=e165]: "{"
                    - generic [ref=e166]: "\"prompt\": \"Copy-paste this component to /components/ui folder:\\n```tsx\\ncomponent.tsx\\n// Component code here...\\n\\ndemo.tsx\\n// Demo code here...\\n```\\n\""
                    - generic [ref=e167]: "}"
                - heading "Error Responses" [level=3] [ref=e168]
                - button "Click to copy code" [ref=e169] [cursor=pointer]:
                  - code [ref=e176]:
                    - generic [ref=e177]: // 401 Unauthorized
                    - generic [ref=e178]: "{"
                    - generic [ref=e179]: "\"error\": \"API key is required\""
                    - generic [ref=e180]: "}"
                    - generic [ref=e181]: // or
                    - generic [ref=e182]: "{"
                    - generic [ref=e183]: "\"error\": \"Invalid API key\""
                    - generic [ref=e184]: "}"
                    - generic [ref=e185]: // 400 Bad Request
                    - generic [ref=e186]: "{"
                    - generic [ref=e187]: "\"error\": \"prompt_type and demo_id are required\""
                    - generic [ref=e188]: "}"
                    - generic [ref=e189]: // or
                    - generic [ref=e190]: "{"
                    - generic [ref=e191]: "\"error\": \"Demo or component code is missing\""
                    - generic [ref=e192]: "}"
                    - generic [ref=e193]: // 404 Not Found
                    - generic [ref=e194]: "{"
                    - generic [ref=e195]: "\"error\": \"Demo not found\""
                    - generic [ref=e196]: "}"
                    - generic [ref=e197]: // or
                    - generic [ref=e198]: "{"
                    - generic [ref=e199]: "\"error\": \"Component data not found\""
                    - generic [ref=e200]: "}"
                    - generic [ref=e201]: // 500 Internal Server Error
                    - generic [ref=e202]: "{"
                    - generic [ref=e203]: "\"error\": \"Internal server error\","
                    - generic [ref=e204]: "\"details\": \"Error message details\""
                    - generic [ref=e205]: "}"
            - generic [ref=e207]:
              - generic [ref=e209]: Your API Key
              - alert [ref=e210]:
                - img [ref=e211]
                - generic [ref=e213]: Sign in to create and manage your API keys
              - link "Sign In" [ref=e215] [cursor=pointer]:
                - /url: https://accounts.HigherBits.dev/sign-in
        - generic [ref=e218]:
          - generic [ref=e219]: Higher Bits Labs Inc.
          - generic [ref=e221]:
            - text: The source code is available on
            - link "GitHub" [ref=e222] [cursor=pointer]:
              - /url: https://github.com/CLDGayo/higherbits
          - navigation [ref=e223]:
            - link "Our Story" [ref=e224] [cursor=pointer]:
              - /url: /our-story
            - link "Terms" [ref=e225] [cursor=pointer]:
              - /url: /terms
            - link "Privacy" [ref=e226] [cursor=pointer]:
              - /url: /privacy
            - link "Refunds" [ref=e227] [cursor=pointer]:
              - /url: /refunds
            - link "Contact" [ref=e228] [cursor=pointer]:
              - /url: mailto:support@higherbits.dev
            - link "Discord" [ref=e229] [cursor=pointer]:
              - /url: https://discord.gg/Qx4rFunHfm
    - region "Notifications alt+T"
  - alert [ref=e230]
  - button "Open Next.js Dev Tools" [ref=e236] [cursor=pointer]:
    - img [ref=e237]
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