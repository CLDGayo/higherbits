/**
 * Single source of truth for how a studio row's moderation state is derived,
 * labelled, coloured and filtered.
 *
 * Deliberately free of React: the repo's vitest runs with `environment: "node"`,
 * so keeping the predicates here is what makes them testable at all.
 */

/** The `submission_status` enum, verbatim. There is no `withdrawn` member. */
export const DB_STATUSES = [
  "on_review",
  "featured",
  "posted",
  "rejected",
] as const

/**
 * `draft` is NOT a database value. It is synthesized in JS for unlinked
 * sandboxes at `app/studio/[username]/components/page.tsx` from
 * `sandboxes.component_id IS NULL`. `none` is likewise synthetic — see
 * {@link resolveStatus}.
 */
export const KNOWN_STATUSES = [
  ...DB_STATUSES,
  "draft",
  "none",
  // `studio_artifacts.status`, which is its own two-member enum
  // (`draft` | `published`) and shares nothing with `submission_status`. Listed
  // here so the artifact sections render the same pill as every other section
  // instead of the plain grey text they carried until Phase 11 §8.6. `draft`
  // is deliberately shared: it means the same thing in both.
  "published",
] as const

export type KnownStatus = (typeof KNOWN_STATUSES)[number]

// `string & {}` keeps autocomplete for the known members while still admitting
// an enum value added to the database ahead of this file.
export type StudioStatus = KnownStatus | (string & {})

/** The only field this module needs off a row. */
export interface StatusBearingRow {
  submission_status?: string | null
}

/**
 * Resolve a row's status honestly.
 *
 * `get_user_profile_demo_list_v2` LEFT JOINs `submissions`, so a component that
 * was never submitted arrives with a NULL `submission_status`. That is not
 * "featured" — it means there is no submission. Both this codebase's transform
 * and this table used to coerce it to `"featured"`, which showed owners a green
 * Featured pill for unsubmitted work. `none` is the truthful answer.
 */
export function resolveStatus(row: StatusBearingRow): StudioStatus {
  return row.submission_status || "none"
}

const STATUS_LABELS: Record<KnownStatus, string> = {
  on_review: "In review",
  featured: "Featured",
  posted: "Published",
  // Renamed from "Rejected": `rejected` is the only enum member that means
  // "the moderator wants changes", and it is what the Needs changes tab keys on.
  rejected: "Needs changes",
  draft: "Draft",
  none: "No submission",
  published: "Published",
}

export function statusLabel(status: StudioStatus): string {
  const known = STATUS_LABELS[status as KnownStatus]
  if (known) return known

  // An enum member added to the database ahead of this file still renders
  // legibly rather than blank.
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}

/**
 * Pill classes. Semantic where a token exists, explicit dark: variants
 * everywhere else — the studio chrome is dark (`bg-[#121214]`), and the
 * previous light-only palette numerics rendered badly on it.
 */
const STATUS_PILL: Record<KnownStatus, string> = {
  on_review:
    "border-amber-500/25 bg-amber-500/15 text-amber-700 dark:text-amber-300",
  featured:
    "border-emerald-500/25 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  posted: "border-primary/25 bg-primary/15 text-primary",
  rejected:
    "border-red-500/25 bg-red-500/15 text-red-700 dark:text-red-300",
  draft: "border-border bg-muted text-muted-foreground",
  none: "border-dashed border-border bg-transparent text-muted-foreground",
  // Same treatment as `posted`, which is the submission enum's word for it.
  published: "border-primary/25 bg-primary/15 text-primary",
}

export function statusPillClass(status: StudioStatus): string {
  return STATUS_PILL[status as KnownStatus] ?? STATUS_PILL.none
}

/**
 * The tab row.
 *
 * Note that `All` is a true no-op filter, so it is a strict superset of the
 * other three by exactly the number of featured/posted rows. That is correct —
 * published work has no other tab — and it means the All count will legitimately
 * exceed the sum of its siblings.
 */
export const STUDIO_TABS = [
  { id: "all", label: "All", match: () => true },
  {
    id: "in_review",
    label: "In review",
    match: (s: StudioStatus) => s === "on_review",
  },
  {
    id: "needs_changes",
    label: "Needs changes",
    match: (s: StudioStatus) => s === "rejected",
  },
  { id: "drafts", label: "Drafts", match: (s: StudioStatus) => s === "draft" },
] as const

export type StudioTabId = (typeof STUDIO_TABS)[number]["id"]

export function filterByTab<T extends StatusBearingRow>(
  rows: readonly T[],
  tabId: StudioTabId,
): T[] {
  const tab = STUDIO_TABS.find((t) => t.id === tabId) ?? STUDIO_TABS[0]
  return rows.filter((row) => tab.match(resolveStatus(row)))
}

/**
 * Counts for every tab in one pass over the already-fetched array. No extra
 * query: `submission_status` is present on every row the page already holds.
 */
export function countByTab(
  rows: readonly StatusBearingRow[],
): Record<StudioTabId, number> {
  const counts = { all: 0, in_review: 0, needs_changes: 0, drafts: 0 }

  for (const row of rows) {
    const status = resolveStatus(row)
    for (const tab of STUDIO_TABS) {
      if (tab.match(status)) counts[tab.id] += 1
    }
  }

  return counts
}

/** The fields search reads. Structural so tests need no fixtures. */
export interface SearchableRow {
  name?: string | null
  component?: { name?: string | null; component_slug?: string | null } | null
}

export function matchesSearch(row: SearchableRow, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true

  return [row.component?.name, row.name, row.component?.component_slug].some(
    (field) => !!field && field.toLowerCase().includes(q),
  )
}
