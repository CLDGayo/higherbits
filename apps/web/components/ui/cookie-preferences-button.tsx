"use client"

import { setConsent } from "@/lib/consent"

/**
 * Client leaf so the landing footer can reopen the consent choice without
 * becoming a client component itself.
 *
 * `footer-marketing.tsx` is deliberately a server component (see its header
 * comment), but the control the privacy page promises must exist on the
 * most-visited route. Clearing the stored consent value re-arms
 * `ConsentBanner`, which renders again whenever the choice is unknown — the
 * same mechanism `components/ui/footer.tsx` uses. The label is kept identical
 * to that footer's and to the privacy page's wording on purpose.
 */
export function CookiePreferencesButton({ className }: { className?: string }) {
  return (
    <button type="button" onClick={() => setConsent(null)} className={className}>
      Cookie preferences
    </button>
  )
}
