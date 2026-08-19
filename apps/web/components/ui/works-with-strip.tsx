import React from "react"

import { Icons } from "@/components/icons"

/**
 * G1 — the "works with your favorite tools" strip.
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
 * not imply a customer roster.
 *
 * Treatment is deliberately a compact icon row with no per-item copy, to stay
 * visually distinct from the libraries logo-cloud that pairs each mark with its
 * `prompts.tsx` description.
 */
const MARKS = [
  { label: "Claude", Mark: Icons.claudeLogo },
  { label: "Codex", Mark: Icons.codexLogo },
  { label: "Google Antigravity", Mark: Icons.antigravityLogo },
  { label: "GoHighLevel", Mark: Icons.goHighLevelLogo },
]

export function WorksWithStrip() {
  return (
    <div className="mt-10 flex flex-col items-start gap-4">
      <p className="text-sm text-muted-foreground">
        Works with your favorite tools
      </p>
      <ul className="flex flex-wrap items-center gap-8">
        {MARKS.map(({ label, Mark }) => (
          <li key={label} className="flex items-center" title={label}>
            <Mark className="h-7 w-7 object-contain opacity-80" />
          </li>
        ))}
      </ul>
    </div>
  )
}
