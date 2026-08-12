/**
 * How a library's public identity is derived.
 *
 * Phase 05 adds no columns to `collections` (umbrella decision D2-R): the
 * namespace comes from the owner's handle, and the install command is built
 * from namespace + slug rather than stored. Keeping that here, free of React
 * and of Prisma, is what makes it testable under the repo's node-environment
 * vitest setup.
 */

/** Only the handle fields this module reads. */
export interface LibraryOwner {
  username?: string | null
  display_username?: string | null
}

/**
 * Derive a URL-safe slug from a library name.
 *
 * Idempotent: feeding a slug back in returns it unchanged, which matters
 * because the create dialog keeps deriving while the user types and stops the
 * moment they edit the slug by hand.
 */
export function deriveSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFKD")
    // Delete combining marks rather than letting the next pass turn them into
    // separators. NFKD puts the mark *after* its base letter, so "Über" would
    // otherwise split into "u-ber".
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * The `@handle` a library is published under.
 *
 * `display_username` wins because it is what the rest of the app shows, but
 * both columns are nullable, so this can legitimately be null. Callers must
 * render the library without an identifier rather than printing "@null".
 */
export function libraryNamespace(owner: LibraryOwner | null): string | null {
  return owner?.display_username || owner?.username || null
}

/** `@namespace/slug`, or just the slug when the owner has no handle. */
export function libraryIdentifier(
  namespace: string | null,
  slug: string,
): string {
  return namespace ? `@${namespace}/${slug}` : slug
}

/**
 * Matches the component convention already in the app
 * (`npx higherbits add {component_slug}`, intercepted-demo-modal.tsx:147).
 */
export function libraryInstallCommand(identifier: string): string {
  return `npx higherbits add ${identifier}`
}

/** Slugs must survive a URL path segment and round-trip through deriveSlug. */
export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= 100 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)
}
