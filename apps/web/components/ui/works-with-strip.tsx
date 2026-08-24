import React from "react"

import { Icons } from "@/components/icons"

/**
 * G1 — the "works with" strip under the social-proof headline.
 *
 * Marks are sourced ONLY from the `@/components/icons` module. The four
 * same-named `.svg` files under the public assets directory are NOT an asset
 * source: they are 80-108 byte ASCII files holding fetch-policy error strings,
 * not vector markup.
 *
 * Copy honesty: this is a capability claim backed by real code
 * (`lib/prompts.tsx` PROMPT_TYPES + `lib/ghl-generator.ts`), not a customer or
 * partner claim. GoHighLevel is a CRM/page-builder that consumes model output,
 * so the label must not describe the set as a whole by that category, and must
 * not imply a customer roster. "Works with:" keeps that reading and matches the
 * capture's own short colon-terminated column heading.
 *
 * Geometry is measured off `references/21st.dev-capture_19-08-26/
 * 05-social-proof/01-used-by-builders.webp`, whose logo block is two columns of
 * icon+label pairs: 19-20px mark, 12px mark-to-label, ~28px between items, 46px
 * row pitch, 16px label at rgb(157,157,159), 14px column heading. We render ONE
 * column of four because we have four real marks and will not fabricate the
 * customer roster the capture's second column is made of.
 *
 * Marks are desaturated to match the capture, which renders every mark as flat
 * muted grey rather than in brand colour.
 */
const MARKS = [
  { label: "Claude", Mark: Icons.claudeLogo },
  { label: "Codex", Mark: Icons.codexLogo },
  { label: "Antigravity", Mark: Icons.antigravityLogo },
  { label: "GoHighLevel", Mark: Icons.goHighLevelLogo },
]

export function WorksWithStrip() {
  return (
    <div
      data-testid="works-with-strip"
      className="mt-16 flex flex-col items-start gap-2"
    >
      <p className="text-sm text-muted-foreground">Works with:</p>
      {/* gap-y is 26px so a wrapped row lands on the capture's 46px pitch. */}
      <ul className="flex flex-wrap items-center gap-x-7 gap-y-[26px]">
        {MARKS.map(({ label, Mark }) => (
          <li key={label} className="flex items-center gap-3">
            <Mark className="h-5 w-5 shrink-0 object-contain grayscale opacity-70" />
            <span className="text-base text-muted-foreground">{label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
