/**
 * Presentation helpers for studio template rows.
 *
 * Free of React and of Prisma so they run under the repo's node-environment
 * vitest setup.
 */

/**
 * Price as shown on a card.
 *
 * `0` is the column default and means the template is free - showing "$0.00"
 * would read as a broken price rather than a deliberate one.
 *
 * Takes a `number`, never a Prisma `Decimal`: a Decimal cannot cross the
 * server-to-client boundary, so it must already have been converted upstream.
 */
export function formatTemplatePrice(price: number): string {
  if (!Number.isFinite(price) || price <= 0) return "Free"

  return `$${price.toFixed(2)}`
}

/** Thousands separated by spaces, matching the components table. */
export function formatTemplateCount(count: number | null | undefined): string {
  const safe = Number.isFinite(count as number) ? (count as number) : 0
  return safe.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

/** The fields template search reads. */
export interface SearchableTemplate {
  name?: string | null
  description?: string | null
  template_slug?: string | null
}

export function templateMatchesSearch(
  template: SearchableTemplate,
  query: string,
): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [template.name, template.description, template.template_slug].some(
    (field) => !!field && field.toLowerCase().includes(q),
  )
}
