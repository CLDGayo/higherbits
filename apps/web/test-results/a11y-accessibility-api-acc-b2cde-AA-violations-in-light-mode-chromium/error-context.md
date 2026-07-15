# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /api-access has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:42:11

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
            - link "HigherBits" [ref=e11] [cursor=pointer]:
              - /url: /
              - link "HigherBits" [ref=e13]:
                - /url: /?tab=home
                - generic [ref=e14]:
                  - img [ref=e15]
                  - generic [ref=e17]: HigherBits
          - button "Global search... ⌘ K" [ref=e20] [cursor=pointer]:
            - generic [ref=e21]: Global search...
            - generic:
              - generic: ⌘
              - text: K
          - generic [ref=e22]:
            - link "Get Pro" [ref=e23] [cursor=pointer]:
              - /url: /pricing
              - paragraph [ref=e24]: Get Pro
            - button "Sign up" [ref=e25] [cursor=pointer]
        - main [ref=e26]:
          - generic [ref=e28]:
            - generic [ref=e29]:
              - generic [ref=e30]:
                - heading "API Access" [level=1] [ref=e31]
                - paragraph [ref=e32]: Semantic UI Component API for AI-Powered Development
              - generic [ref=e33]:
                - generic [ref=e34]:
                  - paragraph [ref=e35]: Semantic Search
                  - paragraph [ref=e36]: Natural language component search for AI code editors
                - generic [ref=e37]:
                  - paragraph [ref=e38]: Community-Driven Library
                  - paragraph [ref=e39]: Growing collection of community components, verified for quality and reliability
            - alert [ref=e40]:
              - img [ref=e41]
              - heading "Important Notice" [level=5] [ref=e43]
              - generic [ref=e44]:
                - text: To help us better understand how you're using our API and provide better support, please reach out to us! Contact Serafim
                - link "on Twitter" [ref=e45] [cursor=pointer]:
                  - /url: https://twitter.com/serafimcloud
                - text: or email our support at
                - link "support@higherbits.dev" [ref=e46] [cursor=pointer]:
                  - /url: mailto:support@higherbits.dev
                - text: . We'd love to learn about your project and ensure you have the best possible experience with our API.
            - generic [ref=e47]:
              - generic [ref=e48]:
                - heading "Authentication" [level=2] [ref=e49]
                - button "Click to copy code" [ref=e50] [cursor=pointer]:
                  - code [ref=e57]:
                    - generic [ref=e58]: "x-api-key: your_api_key_here"
              - generic [ref=e59]:
                - heading "Search API" [level=2] [ref=e60]
                - heading "Request" [level=3] [ref=e61]
                - button "Click to copy code" [ref=e62] [cursor=pointer]:
                  - code [ref=e69]:
                    - generic [ref=e70]: // POST /api/search
                    - generic [ref=e71]: "{"
                    - generic [ref=e72]: "\"search\": \"hero section\", // Required: search query"
                    - generic [ref=e73]: "\"page\": 1, // Optional: page number (default: 1)"
                    - generic [ref=e74]: "\"per_page\": 20 // Optional: results per page (default: 20)"
                    - generic [ref=e75]: "}"
                - heading "Success Response" [level=3] [ref=e76]
                - button "Click to copy code" [ref=e77] [cursor=pointer]:
                  - code [ref=e84]:
                    - generic [ref=e85]: "{"
                    - generic [ref=e86]: "\"results\": [{"
                    - generic [ref=e87]: "\"name\": \"Default\","
                    - generic [ref=e88]: "\"preview_url\": \"https://cdn.HigherBits.dev/...\","
                    - generic [ref=e89]: "\"video_url\": \"https://cdn.HigherBits.dev/...\","
                    - generic [ref=e90]: "\"demo_id\": 123, // Use this ID for prompt generation"
                    - generic [ref=e91]: "\"component_data\": {"
                    - generic [ref=e92]: "\"name\": \"Animated hero\","
                    - generic [ref=e93]: "\"description\": \"Animated hero with text and two shadcn/ui buttons\","
                    - generic [ref=e94]: "\"code\": \"https://cdn.HigherBits.dev/...\","
                    - generic [ref=e95]: "\"install_command\": \"pnpm dlx shadcn@latest add \"https://higherbits.dev/r/...\"\""
                    - generic [ref=e96]: "},"
                    - generic [ref=e97]: "\"component_user_data\": {"
                    - generic [ref=e98]: "\"name\": \"serafim\","
                    - generic [ref=e99]: "\"username\": \"serafimcloud\","
                    - generic [ref=e100]: "\"image_url\": \"https://img.clerk.com/...\""
                    - generic [ref=e101]: "},"
                    - generic [ref=e102]: "\"usage_count\": 1621"
                    - generic [ref=e103]: "}],"
                    - generic [ref=e104]: "\"metadata\": {"
                    - generic [ref=e105]: "\"plan\": \"free\", // Current API plan"
                    - generic [ref=e106]: "\"requests_remaining\": 80, // Remaining API requests"
                    - generic [ref=e107]: "\"pagination\": {"
                    - generic [ref=e108]: "\"total\": 45, // Total number of results"
                    - generic [ref=e109]: "\"page\": 1, // Current page"
                    - generic [ref=e110]: "\"per_page\": 20, // Results per page"
                    - generic [ref=e111]: "\"total_pages\": 3 // Total number of pages"
                    - generic [ref=e112]: "}"
                    - generic [ref=e113]: "}"
                    - generic [ref=e114]: "}"
                - heading "Error Responses" [level=3] [ref=e115]
                - button "Click to copy code" [ref=e116] [cursor=pointer]:
                  - code [ref=e123]:
                    - generic [ref=e124]: // 401 Unauthorized
                    - generic [ref=e125]: "{"
                    - generic [ref=e126]: "\"error\": \"API key is required\""
                    - generic [ref=e127]: "}"
                    - generic [ref=e128]: // or
                    - generic [ref=e129]: "{"
                    - generic [ref=e130]: "\"error\": \"Invalid API key\""
                    - generic [ref=e131]: "}"
                    - generic [ref=e132]: // 400 Bad Request
                    - generic [ref=e133]: "{"
                    - generic [ref=e134]: "\"error\": \"Search query is required\""
                    - generic [ref=e135]: "}"
                    - generic [ref=e136]: // 500 Internal Server Error
                    - generic [ref=e137]: "{"
                    - generic [ref=e138]: "\"error\": \"Internal server error\","
                    - generic [ref=e139]: "\"details\": \"Error message details\""
                    - generic [ref=e140]: "}"
              - generic [ref=e141]:
                - heading "Generate Prompt API" [level=2] [ref=e142]
                - heading "Request" [level=3] [ref=e143]
                - button "Click to copy code" [ref=e144] [cursor=pointer]:
                  - code [ref=e151]:
                    - generic [ref=e152]: // POST /api/prompts
                    - generic [ref=e153]: "{"
                    - generic [ref=e154]: "\"prompt_type\": \"basic\", // Required: one of [\"sitebrew\",\"v0\",\"lovable\",\"bolt\",\"extended\",\"replit\",\"magic_patterns\"]"
                    - generic [ref=e155]: "\"demo_id\": \"123\" // Required: demo ID from search results"
                    - generic [ref=e156]: "}"
                - heading "Success Response" [level=3] [ref=e157]
                - button "Click to copy code" [ref=e158] [cursor=pointer]:
                  - code [ref=e165]:
                    - generic [ref=e166]: "{"
                    - generic [ref=e167]: "\"prompt\": \"Copy-paste this component to /components/ui folder:\\n```tsx\\ncomponent.tsx\\n// Component code here...\\n\\ndemo.tsx\\n// Demo code here...\\n```\\n\""
                    - generic [ref=e168]: "}"
                - heading "Error Responses" [level=3] [ref=e169]
                - button "Click to copy code" [ref=e170] [cursor=pointer]:
                  - code [ref=e177]:
                    - generic [ref=e178]: // 401 Unauthorized
                    - generic [ref=e179]: "{"
                    - generic [ref=e180]: "\"error\": \"API key is required\""
                    - generic [ref=e181]: "}"
                    - generic [ref=e182]: // or
                    - generic [ref=e183]: "{"
                    - generic [ref=e184]: "\"error\": \"Invalid API key\""
                    - generic [ref=e185]: "}"
                    - generic [ref=e186]: // 400 Bad Request
                    - generic [ref=e187]: "{"
                    - generic [ref=e188]: "\"error\": \"prompt_type and demo_id are required\""
                    - generic [ref=e189]: "}"
                    - generic [ref=e190]: // or
                    - generic [ref=e191]: "{"
                    - generic [ref=e192]: "\"error\": \"Demo or component code is missing\""
                    - generic [ref=e193]: "}"
                    - generic [ref=e194]: // 404 Not Found
                    - generic [ref=e195]: "{"
                    - generic [ref=e196]: "\"error\": \"Demo not found\""
                    - generic [ref=e197]: "}"
                    - generic [ref=e198]: // or
                    - generic [ref=e199]: "{"
                    - generic [ref=e200]: "\"error\": \"Component data not found\""
                    - generic [ref=e201]: "}"
                    - generic [ref=e202]: // 500 Internal Server Error
                    - generic [ref=e203]: "{"
                    - generic [ref=e204]: "\"error\": \"Internal server error\","
                    - generic [ref=e205]: "\"details\": \"Error message details\""
                    - generic [ref=e206]: "}"
            - generic [ref=e208]:
              - generic [ref=e210]: Your API Key
              - alert [ref=e211]:
                - img [ref=e212]
                - generic [ref=e214]: Sign in to create and manage your API keys
              - link "Sign In" [ref=e216] [cursor=pointer]:
                - /url: https://accounts.HigherBits.dev/sign-in
        - generic [ref=e219]:
          - generic [ref=e220]: Higher Bits Labs Inc.
          - generic [ref=e222]:
            - text: The source code is available on
            - link "GitHub" [ref=e223] [cursor=pointer]:
              - /url: https://github.com/CLDGayo/higherbits
          - navigation [ref=e224]:
            - link "Our Story" [ref=e225] [cursor=pointer]:
              - /url: /our-story
            - link "Terms" [ref=e226] [cursor=pointer]:
              - /url: /terms
            - link "Privacy" [ref=e227] [cursor=pointer]:
              - /url: /privacy
            - link "Refunds" [ref=e228] [cursor=pointer]:
              - /url: /refunds
            - link "Contact" [ref=e229] [cursor=pointer]:
              - /url: mailto:support@higherbits.dev
            - link "Discord" [ref=e230] [cursor=pointer]:
              - /url: https://discord.gg/Qx4rFunHfm
    - region "Notifications alt+T"
  - alert [ref=e231]
  - generic [ref=e236] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e237]:
      - img [ref=e238]
    - generic [ref=e241]:
      - button "Open issues overlay" [ref=e242]:
        - generic [ref=e243]:
          - generic [ref=e244]: "4"
          - generic [ref=e245]: "5"
        - generic [ref=e246]:
          - text: Issue
          - generic [ref=e247]: s
      - button "Collapse issues badge" [ref=e248]:
        - img [ref=e249]
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