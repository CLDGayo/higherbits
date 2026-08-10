/**
 * Shared between the server-only fetcher (`studio-counts.ts`) and the client
 * context that reads it. Kept in its own module with no imports: pulling these
 * from the fetcher would drag `server-only` and the service-role Supabase client
 * into the client bundle, which fails the build (but not `tsc`).
 *
 * `null` means "could not determine" and renders no badge. A real `0` renders.
 */
export interface StudioNavCounts {
  components: number | null
  libraries: number | null
  templates: number | null
}

export const EMPTY_STUDIO_NAV_COUNTS: StudioNavCounts = {
  components: null,
  libraries: null,
  templates: null,
}
