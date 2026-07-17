# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /contest has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:43:11

# Error details

```
Error: expect(received).toEqual(expected) // deep equality

- Expected  -   1
+ Received  + 549

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
+               "bgColor": "#e8e4f2",
+               "contrastRatio": 4.22,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   ".space-y-4:nth-child(3) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50",
+                 ],
+               },
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
+   Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<th class=\"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]\">Phase</th>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(3) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50 > th:nth-child(1)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#e8e4f2",
+               "contrastRatio": 4.22,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   ".space-y-4:nth-child(3) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50",
+                 ],
+               },
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
+   Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<th class=\"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]\">What Happens</th>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(3) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50 > th:nth-child(2)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#e8e4f2",
+               "contrastRatio": 4.22,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   ".space-y-4:nth-child(3) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50",
+                 ],
+               },
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
+   Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<th class=\"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]\">Pacific Time (PT)</th>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(3) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50 > th:nth-child(3)",
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
+                 "html": "<body class=\"__variable_f367f3 __variable_472caf __variable_13fb82 __variable_572227 font-sans [scrollbar-gutter:stable]\">",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground italic\">All counters reset at the start of each round.</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(3) > .italic:nth-child(3)",
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
+                 "html": "<body class=\"__variable_f367f3 __variable_472caf __variable_13fb82 __variable_572227 font-sans [scrollbar-gutter:stable]\">",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground italic\">Note: From Monday to Friday, entries are shown in random order with hidden vote counts. Rankings become visible only on weekends (Saturday and Sunday).</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".italic:nth-child(4)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#e8e4f2",
+               "contrastRatio": 4.22,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   ".space-y-4:nth-child(7) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50",
+                 ],
+               },
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
+   Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<th class=\"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]\">Tier</th>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(7) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50 > th:nth-child(1)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#e8e4f2",
+               "contrastRatio": 4.22,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   ".space-y-4:nth-child(7) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50",
+                 ],
+               },
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
+   Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<th class=\"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]\">Prize</th>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(7) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50 > th:nth-child(2)",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#e8e4f2",
+               "contrastRatio": 4.22,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#78695e",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+             "relatedNodes": Array [
+               Object {
+                 "html": "<tr class=\"border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-muted/50\">",
+                 "target": Array [
+                   ".space-y-4:nth-child(7) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50",
+                 ],
+               },
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
+   Element has insufficient color contrast of 4.22 (foreground color: #78695e, background color: #e8e4f2, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<th class=\"h-10 px-2 text-left align-middle font-medium text-muted-foreground [&amp;:has([role=checkbox])]:pr-0 [&amp;&gt;[role=checkbox]]:translate-y-[2px]\">Notes</th>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(7) > .border-border.rounded-lg.border > .overflow-auto.relative.w-full > table > thead > .bg-muted\\/50 > th:nth-child(3)",
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
+                 "html": "<body class=\"__variable_f367f3 __variable_472caf __variable_13fb82 __variable_572227 font-sans [scrollbar-gutter:stable]\">",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground italic\">Overlap allowed: the same component can take multiple prizes (e.g., Global 🥈 + Seasonal 🥇).</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(7) > .italic",
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
+                 "html": "<body class=\"__variable_f367f3 __variable_472caf __variable_13fb82 __variable_572227 font-sans [scrollbar-gutter:stable]\">",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground\">Have ideas for how we should evolve the contests? Share your thoughts in our <a href=\"https://discord.gg/Qx4rFunHfm\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-primary underline underline-offset-4\">Discord community</a>.</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(9) > p",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ede9f6",
+               "contrastRatio": 2.3,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#a490df",
+               "fontSize": "10.5pt (14px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.3 (foreground color: #a490df, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
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
+   Element has insufficient color contrast of 2.3 (foreground color: #a490df, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<a href=\"https://discord.gg/Qx4rFunHfm\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-primary underline underline-offset-4\">Discord community</a>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-4:nth-child(9) > p > .text-primary.underline[rel=\"noopener noreferrer\"]",
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
+                 "html": "<body class=\"__variable_f367f3 __variable_472caf __variable_13fb82 __variable_572227 font-sans [scrollbar-gutter:stable]\">",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground\">Direct upvotes from community members</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-2.text-center.p-4:nth-child(1) > p",
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
+                 "html": "<body class=\"__variable_f367f3 __variable_472caf __variable_13fb82 __variable_572227 font-sans [scrollbar-gutter:stable]\">",
+                 "target": Array [
+                   "body",
+                 ],
+               },
+             ],
+           },
+         ],
+         "failureSummary": "Fix any of the following:
+   Element has insufficient color contrast of 4.41 (foreground color: #78695e, background color: #ede9f6, font size: 10.5pt (14px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<p class=\"text-sm text-muted-foreground\">Number of times a component has been downloaded</p>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".space-y-2.text-center.p-4:nth-child(2) > p",
+         ],
+       },
+       Object {
+         "all": Array [],
+         "any": Array [
+           Object {
+             "data": Object {
+               "bgColor": "#ede9f6",
+               "contrastRatio": 2.3,
+               "expectedContrastRatio": "4.5:1",
+               "fgColor": "#a490df",
+               "fontSize": "12.0pt (16px)",
+               "fontWeight": "normal",
+               "messageKey": null,
+             },
+             "id": "color-contrast",
+             "impact": "serious",
+             "message": "Element has insufficient color contrast of 2.3 (foreground color: #a490df, background color: #ede9f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1",
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
+   Element has insufficient color contrast of 2.3 (foreground color: #a490df, background color: #ede9f6, font size: 12.0pt (16px), font weight: normal). Expected contrast ratio of 4.5:1",
+         "html": "<a href=\"https://discord.gg/Qx4rFunHfm\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-primary underline underline-offset-4\">Hop into our Discord</a>",
+         "impact": "serious",
+         "none": Array [],
+         "target": Array [
+           ".leading-7.text-base > .text-primary.underline[rel=\"noopener noreferrer\"]",
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
    - generic [ref=e3]:
      - generic [ref=e7]:
        - generic [ref=e8]:
          - list [ref=e11]:
            - listitem [ref=e12]:
              - button "Home" [ref=e13] [cursor=pointer]:
                - generic [ref=e14]:
                  - img [ref=e15]
                  - text: Home
            - listitem [ref=e18]:
              - button "Components" [ref=e19] [cursor=pointer]:
                - generic [ref=e20]:
                  - img [ref=e21]
                  - text: Components
            - listitem [ref=e26]:
              - button "Creators" [ref=e27] [cursor=pointer]:
                - generic [ref=e28]:
                  - img [ref=e29]
                  - text: Creators
            - listitem [ref=e34]:
              - button "Collections" [ref=e35] [cursor=pointer]:
                - generic [ref=e36]:
                  - img [ref=e37]
                  - text: Collections
          - generic [ref=e39]:
            - generic [ref=e40]: You
            - list [ref=e42]:
              - listitem [ref=e43]:
                - button "Bookmarks" [ref=e44] [cursor=pointer]:
                  - generic [ref=e45]:
                    - img [ref=e46]
                    - text: Bookmarks
          - generic [ref=e48]:
            - generic [ref=e49]: Explore
            - list [ref=e51]:
              - listitem [ref=e52]:
                - button "Marketing Blocks" [ref=e53] [cursor=pointer]:
                  - generic [ref=e54]:
                    - generic [ref=e55]:
                      - img [ref=e56]
                      - text: Marketing Blocks
                    - img [ref=e59]
              - listitem [ref=e61]:
                - button "UI Components" [ref=e62] [cursor=pointer]:
                  - generic [ref=e63]:
                    - generic [ref=e64]:
                      - img [ref=e65]
                      - text: UI Components
                    - img [ref=e72]
        - button "Help menu" [ref=e75] [cursor=pointer]:
          - img
      - main [ref=e76]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - generic [ref=e81]:
              - button "Toggle Sidebar" [ref=e82] [cursor=pointer]:
                - img
                - generic [ref=e83]: Toggle Sidebar
              - link "HigherBits" [ref=e85] [cursor=pointer]:
                - /url: /
                - generic [ref=e86]:
                  - img [ref=e87]
                  - generic [ref=e89]: HigherBits
            - button "Global search... ⌘ K" [ref=e92] [cursor=pointer]:
              - generic [ref=e93]: Global search...
              - generic:
                - generic: ⌘
                - text: K
            - generic [ref=e94]:
              - link "Support Us!" [ref=e95] [cursor=pointer]:
                - /url: /support
                - paragraph [ref=e96]: Support Us!
              - button "Sign up" [ref=e97] [cursor=pointer]
          - generic [ref=e99]:
            - generic [ref=e100]:
              - generic [ref=e101]:
                - heading "Contest" [level=2] [ref=e102]
                - link "View Leaderboard" [ref=e103] [cursor=pointer]:
                  - /url: /contest/leaderboard
              - paragraph [ref=e104]: A fast-paced, week-long contest that rewards the best open-source components published on HigherBits.dev. Winners are chosen by a blend of direct community votes and real-world usage data collected during the week.
            - generic [ref=e106]:
              - heading "🗓️ Weekly Cycle" [level=2] [ref=e107]
              - table [ref=e110]:
                - rowgroup [ref=e111]:
                  - row "Phase What Happens Pacific Time (PT)" [ref=e112]:
                    - columnheader "Phase" [ref=e113]
                    - columnheader "What Happens" [ref=e114]
                    - columnheader "Pacific Time (PT)" [ref=e115]
                - rowgroup [ref=e116]:
                  - row "Launch New round opens; you can submit components and start voting Monday 00:00 PT" [ref=e117]:
                    - cell "Launch" [ref=e118]
                    - cell "New round opens; you can submit components and start voting" [ref=e119]
                    - cell "Monday 00:00 PT" [ref=e120]
                  - row "Upload & Vote Publish components, gather votes & installs Mon 00:00 → Fri 23:59" [ref=e121]:
                    - cell "Upload & Vote" [ref=e122]
                    - cell "Publish components, gather votes & installs" [ref=e123]
                    - cell "Mon 00:00 → Fri 23:59" [ref=e124]
                  - row "Voting-Only Window Submissions close; voting & installs continue Sat 00:00 → Sun 23:59" [ref=e125]:
                    - cell "Voting-Only Window" [ref=e126]
                    - cell "Submissions close; voting & installs continue" [ref=e127]
                    - cell "Sat 00:00 → Sun 23:59" [ref=e128]
                  - row "Winners Announced Results posted; new round kicks off Monday 08:00 PT" [ref=e129]:
                    - cell "Winners Announced" [ref=e130]
                    - cell "Results posted; new round kicks off" [ref=e131]
                    - cell "Monday 08:00 PT" [ref=e132]
              - paragraph [ref=e133]: All counters reset at the start of each round.
              - paragraph [ref=e134]: "Note: From Monday to Friday, entries are shown in random order with hidden vote counts. Rankings become visible only on weekends (Saturday and Sunday)."
            - generic [ref=e136]:
              - heading "🏷️ Categories" [level=2] [ref=e137]
              - paragraph [ref=e138]: 1. Global Leaderboard – All components compete for the top 10 positions.
              - paragraph [ref=e139]: 2. Seasonal Category – Rotating theme each week with bonus prizes (see roadmap below).
            - generic [ref=e141]:
              - heading "💰 Awards & Budget ($2 000 / week)" [level=2] [ref=e142]
              - table [ref=e145]:
                - rowgroup [ref=e146]:
                  - row "Tier Prize Notes" [ref=e147]:
                    - columnheader "Tier" [ref=e148]
                    - columnheader "Prize" [ref=e149]
                    - columnheader "Notes" [ref=e150]
                - rowgroup [ref=e151]:
                  - row "Global Awards (10) 🥇 $700 • 🥈 $400 • 🥉 $250 • 4th-10th $50 each Top performers across all submissions" [ref=e152]:
                    - cell "Global Awards (10)" [ref=e153]
                    - cell "🥇 $700 • 🥈 $400 • 🥉 $250 • 4th-10th $50 each" [ref=e154]
                    - cell "Top performers across all submissions" [ref=e155]
                  - row "Seasonal Awards (3) 🥇 $150 • 🥈 $100 • 🥉 $50 Best components in the weekly seasonal theme" [ref=e156]:
                    - cell "Seasonal Awards (3)" [ref=e157]
                    - cell "🥇 $150 • 🥈 $100 • 🥉 $50" [ref=e158]
                    - cell "Best components in the weekly seasonal theme" [ref=e159]
                  - row "Total Weekly Payout $2 000" [ref=e160]:
                    - cell "Total Weekly Payout" [ref=e161]
                    - cell "$2 000" [ref=e162]
                    - cell [ref=e163]
              - paragraph [ref=e164]: "Overlap allowed: the same component can take multiple prizes (e.g., Global 🥈 + Seasonal 🥇)."
              - link "View Current Leaderboard" [ref=e166] [cursor=pointer]:
                - /url: /contest/leaderboard
                - img
                - text: View Current Leaderboard
            - generic [ref=e168]:
              - heading "⏸️ Planned Pause After Week 3" [level=2] [ref=e169]
              - paragraph [ref=e171]: After Week 3, we'll be taking a short pause to evaluate the contest format and gather community feedback. During this time, we'll be planning improvements and considering new directions for future contests. Stay tuned for announcements about the next phase of HigherBits.dev contests!
              - paragraph [ref=e172]:
                - text: Have ideas for how we should evolve the contests? Share your thoughts in our
                - link "Discord community" [ref=e173] [cursor=pointer]:
                  - /url: https://discord.gg/Qx4rFunHfm
                - text: .
            - generic [ref=e175]:
              - heading "📊 How We Rank Components" [level=2] [ref=e176]
              - paragraph [ref=e177]: Components are ranked primarily based on community voting, with real-world usage providing additional weight. In our current formula, one vote equals 10 installs.
              - generic [ref=e178]:
                - generic [ref=e179]:
                  - generic [ref=e180]: Votes
                  - paragraph [ref=e181]: Direct upvotes from community members
                - generic [ref=e182]:
                  - generic [ref=e183]: Installs
                  - paragraph [ref=e184]: Number of times a component has been downloaded
              - paragraph [ref=e186]: "Fair Visibility Policy: To ensure all components get equal exposure regardless of submission time, rankings and vote counts are hidden on weekdays (Monday through Friday) and all submissions are displayed in random order. Rankings and vote counts only become visible on weekends (Saturday and Sunday), giving all submissions equal opportunity for visibility."
              - link "See The Leaderboard" [ref=e188] [cursor=pointer]:
                - /url: /contest/leaderboard
                - img
                - text: See The Leaderboard
            - generic [ref=e189]:
              - heading "💬 Join the conversation" [level=2] [ref=e190]
              - paragraph [ref=e191]:
                - text: Got questions or want instant feedback?
                - link "Hop into our Discord" [ref=e192] [cursor=pointer]:
                  - /url: https://discord.gg/Qx4rFunHfm
                - text: and connect with the rest of the HigherBits.dev community.
          - generic [ref=e195]:
            - generic [ref=e196]: Higher Bits Labs Inc.
            - generic [ref=e198]:
              - text: The source code is available on
              - link "GitHub" [ref=e199] [cursor=pointer]:
                - /url: https://github.com/CLDGayo/higherbits
            - navigation [ref=e200]:
              - link "Our Story" [ref=e201] [cursor=pointer]:
                - /url: /our-story
              - link "Terms" [ref=e202] [cursor=pointer]:
                - /url: /terms
              - link "Privacy" [ref=e203] [cursor=pointer]:
                - /url: /privacy
              - link "Refunds" [ref=e204] [cursor=pointer]:
                - /url: /refunds
              - link "Contact" [ref=e205] [cursor=pointer]:
                - /url: mailto:support@higherbits.dev
              - link "Discord" [ref=e206] [cursor=pointer]:
                - /url: https://discord.gg/Qx4rFunHfm
    - region "Notifications alt+T"
  - alert [ref=e207]
  - button "Open Next.js Dev Tools" [ref=e213] [cursor=pointer]:
    - img [ref=e214]
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