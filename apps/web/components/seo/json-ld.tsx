import React from "react"

/**
 * Emits a real `<script type="application/ld+json">` tag.
 *
 * The previous approach — `metadata.other = { "script:ld+json": ... }` — does
 * NOT work: Next's `other` field only ever renders `<meta name="..." content="...">`,
 * so every JSON-LD block on the site shipped as an inert meta tag and no parser
 * ever saw it. Structured data has to be rendered from the component body.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // The payload is built server-side from our own data, never from user input
      // that could close the script tag; `<` is escaped defensively regardless.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  )
}
