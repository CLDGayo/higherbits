import {
  Layers,
  LayoutDashboard,
  LayoutTemplate,
  Library,
  Palette,
  Sparkles,
  Type,
  Waves,
  type LucideIcon,
} from "lucide-react"

/**
 * The single source of truth for studio navigation.
 *
 * Both the sidebar and the header's mobile dropdown render from this list. They
 * used to carry independent copies of the nav items and of the active-state
 * logic, which is how the header ended up one section behind the sidebar.
 */
export interface StudioNavItem {
  slug: string
  label: string
  icon: LucideIcon
  /**
   * Required, not optional. When the sidebar is collapsed to icons this is the
   * only label a user gets - the previous sidebar omitted it on one item, which
   * rendered as an unlabelled icon with no type error.
   */
  tooltip: string
  /** Path segment appended to /studio/{username}. Empty string = the index route. */
  segment: string
  /**
   * Section has no route and no backing table yet. Renders greyed with a "Soon"
   * pill and does not navigate. Never render a count badge for these - a missing
   * table and an empty table are different states, and "0" asserts the latter.
   */
  comingSoon?: boolean
}

export const STUDIO_NAV_ITEMS: StudioNavItem[] = [
  {
    slug: "overview",
    label: "Overview",
    icon: LayoutDashboard,
    tooltip: "Overview",
    segment: "",
  },
  {
    slug: "components",
    label: "Components",
    icon: Layers,
    tooltip: "Components",
    segment: "components",
  },
  {
    slug: "libraries",
    label: "Libraries",
    icon: Library,
    tooltip: "Libraries",
    segment: "libraries",
  },
  {
    slug: "templates",
    label: "Templates",
    icon: LayoutTemplate,
    tooltip: "Templates",
    segment: "templates",
  },
  {
    slug: "themes",
    label: "Themes",
    icon: Palette,
    tooltip: "Themes",
    segment: "themes",
  },
  {
    slug: "ascii",
    label: "ASCII art",
    icon: Type,
    tooltip: "ASCII art",
    segment: "ascii",
    comingSoon: true,
  },
  {
    slug: "gradients",
    label: "Gradients",
    icon: Waves,
    tooltip: "Gradients",
    segment: "gradients",
    comingSoon: true,
  },
  {
    slug: "shaders",
    label: "Shaders",
    icon: Sparkles,
    tooltip: "Shaders",
    segment: "shaders",
    comingSoon: true,
  },
]

/**
 * `users.username` and `users.display_username` are both nullable, so every
 * caller here passes a possibly-null value. Interpolating that directly - which
 * is what the call sites did before this helper existed - yields the literal
 * path "/studio/null". Falling back to "/studio" instead sends the user to the
 * studio landing page, which resolves the username from Clerk on its own.
 */
export function studioBasePath(username: string | null | undefined): string {
  return username ? `/studio/${username}` : "/studio"
}

export function studioNavHref(basePath: string, item: StudioNavItem): string {
  return item.segment ? `${basePath}/${item.segment}` : basePath
}

/**
 * Enter or move around the studio with a full page load.
 *
 * `app/@modal/(...)[username]/[component_slug]/[demo_slug]` is intercepted from
 * the app root, so it matches ANY three-segment soft navigation whose route
 * carries dynamic segments - which is exactly the shape of
 * /studio/{username}/{section}. When it matches, Next renders the component
 * quick-view modal into the @modal slot and leaves the page underneath
 * untouched: the URL changes and the studio never appears.
 *
 * Interception is matched ahead of normal slot ranking, so nothing added to the
 * slot can outrank it. A `default.tsx`, a catch-all `[...rest]` page, a plain
 * dynamic `[username]/[section]` page and an exact-shape `[username]/components`
 * page were each tried and each lost to the interceptor.
 *
 * A hard navigation sends no `Next-Url` header, so nothing is intercepted. Use
 * this for any /studio/{username}/{section} destination. Two-segment paths such
 * as /studio and /studio/{username} are unaffected and should keep using the
 * router - measured, not assumed.
 */
export function studioHardNavigate(
  href: string,
  { replace = false }: { replace?: boolean } = {},
): void {
  // `replace` mirrors router.replace: the studio landing page resolves your
  // username and forwards, and must not leave that hop in history or Back
  // lands on a page that immediately forwards again.
  if (replace) {
    window.location.replace(href)
    return
  }
  window.location.assign(href)
}

/**
 * Exact match for the index route, prefix match for children.
 *
 * The previous implementation used `pathname.includes("/bundles")` and friends,
 * which also matches the username segment - a user called "templates" would
 * light up the Templates item on every page. Eight sections multiply that.
 */
export function isStudioNavItemActive(
  pathname: string,
  basePath: string,
  item: StudioNavItem,
): boolean {
  const href = studioNavHref(basePath, item)
  if (href === basePath) return pathname === basePath
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function activeStudioNavItem(
  pathname: string,
  basePath: string,
): StudioNavItem | undefined {
  return STUDIO_NAV_ITEMS.find((item) =>
    isStudioNavItemActive(pathname, basePath, item),
  )
}
