# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: a11y.spec.ts >> accessibility >> /contest has no WCAG A/AA violations in light mode
- Location: e2e/a11y.spec.ts:42:11

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
+         "html": "<p class=\"text-sm text-muted-foreground\">Have ideas for how we should evolve the contests? Share your thoughts in our<!-- --> <a href=\"https://discord.gg/Qx4rFunHfm\" target=\"_blank\" rel=\"noopener noreferrer\" class=\"text-primary underline underline-offset-4\">Discord community</a>.</p>",
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
+           ".space-y-4:nth-child(9) > p > .text-primary.underline[href$=\"Qx4rFunHfm\"]",
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
+           ".leading-7.text-base > .text-primary.underline[href$=\"Qx4rFunHfm\"]",
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
        - generic [ref=e9]:
          - list [ref=e12]:
            - listitem [ref=e13]:
              - button "Home" [ref=e14] [cursor=pointer]:
                - generic [ref=e15]:
                  - img [ref=e16]
                  - text: Home
            - listitem [ref=e19]:
              - button "Components" [ref=e20] [cursor=pointer]:
                - generic [ref=e21]:
                  - img [ref=e22]
                  - text: Components
            - listitem [ref=e27]:
              - button "AI UI Builder" [ref=e28] [cursor=pointer]:
                - generic [ref=e29]:
                  - generic [ref=e30]:
                    - img [ref=e31]
                    - text: AI UI Builder
                  - img [ref=e33]
              - generic [ref=e36]:
                - link "Magic Chat Waitlist New" [ref=e39] [cursor=pointer]:
                  - /url: /magic-chat
                  - generic [ref=e40]:
                    - text: Magic Chat Waitlist
                    - generic [ref=e41]: New
                - link "Magic MCP" [ref=e44] [cursor=pointer]:
                  - /url: /magic
                  - generic [ref=e45]: Magic MCP
                  - img [ref=e46]
                - link "Onboarding" [ref=e51] [cursor=pointer]:
                  - /url: /magic/onboarding
                  - generic [ref=e52]: Onboarding
                - link "Console" [ref=e55] [cursor=pointer]:
                  - /url: /magic/console
                  - generic [ref=e56]: Console
                - link "Pricing" [ref=e59] [cursor=pointer]:
                  - /url: /pricing
                  - generic [ref=e60]: Pricing
            - listitem [ref=e61]:
              - button "Bundles" [ref=e62] [cursor=pointer]:
                - generic [ref=e63]:
                  - img [ref=e64]
                  - text: Bundles
            - listitem [ref=e68]:
              - button "Templates" [ref=e69] [cursor=pointer]:
                - generic [ref=e70]:
                  - img [ref=e71]
                  - text: Templates
            - listitem [ref=e75]:
              - button "Creators" [ref=e76] [cursor=pointer]:
                - generic [ref=e77]:
                  - img [ref=e78]
                  - text: Creators
            - listitem [ref=e83]:
              - button "Premium Stores" [ref=e84] [cursor=pointer]:
                - generic [ref=e85]:
                  - img [ref=e86]
                  - text: Premium Stores
            - listitem [ref=e88]:
              - button "Collections" [ref=e89] [cursor=pointer]:
                - generic [ref=e90]:
                  - img [ref=e91]
                  - text: Collections
          - generic [ref=e93]:
            - generic [ref=e94]: Contest
            - list [ref=e96]:
              - listitem [ref=e97]:
                - button "Overview" [ref=e98] [cursor=pointer]:
                  - generic [ref=e99]:
                    - img [ref=e100]
                    - text: Overview
              - listitem [ref=e109]:
                - button "Leaderboard" [ref=e110] [cursor=pointer]:
                  - generic [ref=e111]:
                    - img [ref=e112]
                    - text: Leaderboard
          - generic [ref=e118]:
            - generic [ref=e119]: You
            - list [ref=e121]:
              - listitem [ref=e122]:
                - button "Bookmarks" [ref=e123] [cursor=pointer]:
                  - generic [ref=e124]:
                    - img [ref=e125]
                    - text: Bookmarks
              - listitem [ref=e127]:
                - button "Purchased Bundles" [ref=e128] [cursor=pointer]:
                  - generic [ref=e129]:
                    - img [ref=e130]
                    - text: Purchased Bundles
          - generic [ref=e134]:
            - generic [ref=e135]: Explore
            - list [ref=e137]:
              - listitem [ref=e138]:
                - button "Marketing Blocks" [ref=e139] [cursor=pointer]:
                  - generic [ref=e140]:
                    - generic [ref=e141]:
                      - img [ref=e142]
                      - text: Marketing Blocks
                    - img [ref=e145]
              - listitem [ref=e147]:
                - button "UI Components" [ref=e148] [cursor=pointer]:
                  - generic [ref=e149]:
                    - generic [ref=e150]:
                      - img [ref=e151]
                      - text: UI Components
                    - img [ref=e158]
        - button "Help menu" [ref=e161] [cursor=pointer]:
          - img
      - main [ref=e162]:
        - generic [ref=e165]:
          - generic [ref=e166]:
            - generic [ref=e167]:
              - button "Toggle Sidebar" [ref=e168] [cursor=pointer]:
                - img
                - generic [ref=e169]: Toggle Sidebar
              - link "HigherBits" [ref=e170] [cursor=pointer]:
                - /url: /
                - link "HigherBits" [ref=e172]:
                  - /url: /?tab=home
                  - generic [ref=e173]:
                    - img [ref=e174]
                    - generic [ref=e176]: HigherBits
            - button "Global search... ⌘ K" [ref=e179] [cursor=pointer]:
              - generic [ref=e180]: Global search...
              - generic:
                - generic: ⌘
                - text: K
            - generic [ref=e181]:
              - link "Get Pro" [ref=e182] [cursor=pointer]:
                - /url: /pricing
                - paragraph [ref=e183]: Get Pro
              - button "Sign up" [ref=e184] [cursor=pointer]
          - generic [ref=e186]:
            - generic [ref=e187]:
              - generic [ref=e188]:
                - heading "Contest" [level=2] [ref=e189]
                - link "View Leaderboard" [ref=e190] [cursor=pointer]:
                  - /url: /contest/leaderboard
              - paragraph [ref=e191]: A fast-paced, week-long contest that rewards the best open-source components published on HigherBits.dev. Winners are chosen by a blend of direct community votes and real-world usage data collected during the week.
            - generic [ref=e193]:
              - heading "🗓️ Weekly Cycle" [level=2] [ref=e194]
              - table [ref=e197]:
                - rowgroup [ref=e198]:
                  - row "Phase What Happens Pacific Time (PT)" [ref=e199]:
                    - columnheader "Phase" [ref=e200]
                    - columnheader "What Happens" [ref=e201]
                    - columnheader "Pacific Time (PT)" [ref=e202]
                - rowgroup [ref=e203]:
                  - row "Launch New round opens; you can submit components and start voting Monday 00:00 PT" [ref=e204]:
                    - cell "Launch" [ref=e205]
                    - cell "New round opens; you can submit components and start voting" [ref=e206]
                    - cell "Monday 00:00 PT" [ref=e207]
                  - row "Upload & Vote Publish components, gather votes & installs Mon 00:00 → Fri 23:59" [ref=e208]:
                    - cell "Upload & Vote" [ref=e209]
                    - cell "Publish components, gather votes & installs" [ref=e210]
                    - cell "Mon 00:00 → Fri 23:59" [ref=e211]
                  - row "Voting-Only Window Submissions close; voting & installs continue Sat 00:00 → Sun 23:59" [ref=e212]:
                    - cell "Voting-Only Window" [ref=e213]
                    - cell "Submissions close; voting & installs continue" [ref=e214]
                    - cell "Sat 00:00 → Sun 23:59" [ref=e215]
                  - row "Winners Announced Results posted; new round kicks off Monday 08:00 PT" [ref=e216]:
                    - cell "Winners Announced" [ref=e217]
                    - cell "Results posted; new round kicks off" [ref=e218]
                    - cell "Monday 08:00 PT" [ref=e219]
              - paragraph [ref=e220]: All counters reset at the start of each round.
              - paragraph [ref=e221]: "Note: From Monday to Friday, entries are shown in random order with hidden vote counts. Rankings become visible only on weekends (Saturday and Sunday)."
            - generic [ref=e223]:
              - heading "🏷️ Categories" [level=2] [ref=e224]
              - paragraph [ref=e225]: 1. Global Leaderboard – All components compete for the top 10 positions.
              - paragraph [ref=e226]: 2. Seasonal Category – Rotating theme each week with bonus prizes (see roadmap below).
            - generic [ref=e228]:
              - heading "💰 Awards & Budget ($2 000 / week)" [level=2] [ref=e229]
              - table [ref=e232]:
                - rowgroup [ref=e233]:
                  - row "Tier Prize Notes" [ref=e234]:
                    - columnheader "Tier" [ref=e235]
                    - columnheader "Prize" [ref=e236]
                    - columnheader "Notes" [ref=e237]
                - rowgroup [ref=e238]:
                  - row "Global Awards (10) 🥇 $700 • 🥈 $400 • 🥉 $250 • 4th-10th $50 each Top performers across all submissions" [ref=e239]:
                    - cell "Global Awards (10)" [ref=e240]
                    - cell "🥇 $700 • 🥈 $400 • 🥉 $250 • 4th-10th $50 each" [ref=e241]
                    - cell "Top performers across all submissions" [ref=e242]
                  - row "Seasonal Awards (3) 🥇 $150 • 🥈 $100 • 🥉 $50 Best components in the weekly seasonal theme" [ref=e243]:
                    - cell "Seasonal Awards (3)" [ref=e244]
                    - cell "🥇 $150 • 🥈 $100 • 🥉 $50" [ref=e245]
                    - cell "Best components in the weekly seasonal theme" [ref=e246]
                  - row "Total Weekly Payout $2 000" [ref=e247]:
                    - cell "Total Weekly Payout" [ref=e248]
                    - cell "$2 000" [ref=e249]
                    - cell [ref=e250]
              - paragraph [ref=e251]: "Overlap allowed: the same component can take multiple prizes (e.g., Global 🥈 + Seasonal 🥇)."
              - link "View Current Leaderboard" [ref=e253] [cursor=pointer]:
                - /url: /contest/leaderboard
                - img
                - text: View Current Leaderboard
            - generic [ref=e255]:
              - heading "⏸️ Planned Pause After Week 3" [level=2] [ref=e256]
              - paragraph [ref=e258]: After Week 3, we'll be taking a short pause to evaluate the contest format and gather community feedback. During this time, we'll be planning improvements and considering new directions for future contests. Stay tuned for announcements about the next phase of HigherBits.dev contests!
              - paragraph [ref=e259]:
                - text: Have ideas for how we should evolve the contests? Share your thoughts in our
                - link "Discord community" [ref=e260] [cursor=pointer]:
                  - /url: https://discord.gg/Qx4rFunHfm
                - text: .
            - generic [ref=e262]:
              - heading "📊 How We Rank Components" [level=2] [ref=e263]
              - paragraph [ref=e264]: Components are ranked primarily based on community voting, with real-world usage providing additional weight. In our current formula, one vote equals 10 installs.
              - generic [ref=e265]:
                - generic [ref=e266]:
                  - generic [ref=e267]: Votes
                  - paragraph [ref=e268]: Direct upvotes from community members
                - generic [ref=e269]:
                  - generic [ref=e270]: Installs
                  - paragraph [ref=e271]: Number of times a component has been downloaded
              - paragraph [ref=e273]: "Fair Visibility Policy: To ensure all components get equal exposure regardless of submission time, rankings and vote counts are hidden on weekdays (Monday through Friday) and all submissions are displayed in random order. Rankings and vote counts only become visible on weekends (Saturday and Sunday), giving all submissions equal opportunity for visibility."
              - link "See The Leaderboard" [ref=e275] [cursor=pointer]:
                - /url: /contest/leaderboard
                - img
                - text: See The Leaderboard
            - generic [ref=e276]:
              - heading "💬 Join the conversation" [level=2] [ref=e277]
              - paragraph [ref=e278]:
                - text: Got questions or want instant feedback?
                - link "Hop into our Discord" [ref=e279] [cursor=pointer]:
                  - /url: https://discord.gg/Qx4rFunHfm
                - text: and connect with the rest of the HigherBits.dev community.
          - generic [ref=e282]:
            - generic [ref=e283]: Higher Bits Labs Inc.
            - generic [ref=e285]:
              - text: The source code is available on
              - link "GitHub" [ref=e286] [cursor=pointer]:
                - /url: https://github.com/CLDGayo/higherbits
            - navigation [ref=e287]:
              - link "Our Story" [ref=e288] [cursor=pointer]:
                - /url: /our-story
              - link "Terms" [ref=e289] [cursor=pointer]:
                - /url: /terms
              - link "Privacy" [ref=e290] [cursor=pointer]:
                - /url: /privacy
              - link "Refunds" [ref=e291] [cursor=pointer]:
                - /url: /refunds
              - link "Contact" [ref=e292] [cursor=pointer]:
                - /url: mailto:support@higherbits.dev
              - link "Discord" [ref=e293] [cursor=pointer]:
                - /url: https://discord.gg/Qx4rFunHfm
    - region "Notifications alt+T"
  - alert [ref=e294]
  - generic [ref=e299] [cursor=pointer]:
    - button "Open Next.js Dev Tools" [ref=e300]:
      - img [ref=e301]
    - generic [ref=e304]:
      - button "Open issues overlay" [ref=e305]:
        - generic [ref=e306]:
          - generic [ref=e307]: "4"
          - generic [ref=e308]: "5"
        - generic [ref=e309]:
          - text: Issue
          - generic [ref=e310]: s
      - button "Collapse issues badge" [ref=e311]:
        - img [ref=e312]
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