"use client"

import React, { useEffect, useState } from "react"
import NumberFlow from "@number-flow/react"

import { AccentWord } from "@/components/ui/accent-word"
import { WorksWithStrip } from "@/components/ui/works-with-strip"

/**
 * Landing social-proof headline: the real `users` row count from
 * `/api/platform/stats`, animated through NumberFlow.
 *
 * Fetched client-side on mount, copying the only existing consumer of this
 * endpoint (`app/studio/page.tsx`). Deliberately NOT server-rendered: unlike the
 * catalogue and the FAQ, this decorative counter carries no crawler-visibility
 * or structured-data obligation.
 *
 * There is no default-to-zero fallback anywhere in this file, and no literal
 * count in the headline: until a real response arrives with a real `.users`
 * field, `users` stays `undefined` and the headline renders nothing.
 * Rendering a fake `0` would be a fabricated stat, not a loading state.
 *
 * Copy degrades gracefully at low counts ("— and counting") rather than
 * implying scale the database cannot back.
 */
export function SocialProofCounter() {
  const [users, setUsers] = useState<number | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    fetch("/api/platform/stats")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data || data.error) return
        if (typeof data.users !== "number") return
        setUsers(data.users)
      })
      .catch(() => {
        // fail-soft: the headline simply stays unrendered
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="flex flex-col items-start">
      {users !== undefined ? (
        <h2 className="text-4xl md:text-5xl font-semibold tracking-tight">
          Used by <NumberFlow value={users} /> <AccentWord>builders</AccentWord>
          <span className="block mt-3 text-lg md:text-xl font-normal text-muted-foreground">
            — and counting. From first component to shipped product.
          </span>
        </h2>
      ) : null}
      <WorksWithStrip />
    </div>
  )
}
