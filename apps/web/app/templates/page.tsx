import { permanentRedirect } from "next/navigation"

/**
 * `/templates` is merged into the canonical tab model (`/?tab=templates`).
 *
 * Phase 04 (supabase-interconnect) decision B2: this is a PERMANENT merge, so the
 * route answers 308 via `permanentRedirect()` — not 307 (`redirect()`), which would
 * tell crawlers to keep re-checking this path indefinitely.
 *
 * SEO note: a redirect returns a 3xx with no body, so a `metadata`/`generateMetadata`
 * export here would never reach a crawler. The templates SEO metadata that used to
 * live in this file now lives on the home route's `generateMetadata({ searchParams })`
 * branch (`apps/web/app/page.tsx`), keyed on `tab === "templates"`.
 */
export default function TemplatesPage() {
  permanentRedirect("/?tab=templates")
}
