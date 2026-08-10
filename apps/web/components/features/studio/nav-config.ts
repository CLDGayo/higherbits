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
    comingSoon: true,
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

export function studioBasePath(username: string): string {
  return `/studio/${username}`
}

export function studioNavHref(basePath: string, item: StudioNavItem): string {
  return item.segment ? `${basePath}/${item.segment}` : basePath
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
