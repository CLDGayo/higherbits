"use client"

import { studioHardNavigate } from "@/components/features/studio/nav-config"
import { useSidebar } from "@/components/ui/sidebar"
import { SheetTitle } from "@/components/ui/sheet"
import { useNavigation } from "@/hooks/use-navigation"
import {
  AppSection,
  sortByAtom,
  librariesSearchAtom,
  librariesCategoryAtom,
  librariesScopeAtom,
  librariesSortAtom,
  librariesViewModeAtom,
} from "@/lib/atoms"
import { LIBRARY_CATEGORIES } from "@/lib/data/libraries-data"
import { sidebarCategories, aiBuilderNavItem } from "@/lib/navigation"
import { userStateAtom } from "@/lib/store/user-store"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { useCategoryTagCounts } from "@/lib/queries"
import { useAtom } from "jotai"
import {
  ArrowDown,
  AudioLines,
  BarChart2,
  BookOpen,
  Bookmark,
  Bot,
  Box,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Clock,
  Component,
  Crown,
  FileInput,
  FolderOpen,
  Globe,
  Home,
  KeyRound,
  Layers,
  LayoutGrid,
  LayoutTemplate,
  List,
  Loader2,
  Megaphone,
  Orbit,
  Package,
  Palette,
  PenLine,
  Search,
  Shapes,
  ShoppingCart,
  Smartphone,
  Sparkles,
  Swords,
  Terminal,
  Trophy,
  Users,
  Video,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import * as React from "react"
import { Help } from "./help"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"


export function MainSidebar() {
  const { isMobile, openMobile, setOpenMobile } = useSidebar()
  const [searchAfterClose, setSearchAfterClose] = React.useState(false)
  const wasMobileOpen = React.useRef(false)
  const searchTimer = React.useRef<number | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user: clerkUser } = useUser()
  const [userState] = useAtom(userStateAtom)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [expandedItems, setExpandedItems] = React.useState<string[]>([]) // Start with Magic menu closed

  // Use our custom tabs navigation hook
  const { activeTab, currentSection, navigateToTab } = useNavigation()
  const [sortBy, setSortBy] = useAtom(sortByAtom)

  // Get the current tab from URL when available
  const urlTab = searchParams.get("tab") as Exclude<AppSection, "higherbits-mcp"> | null
  const routeQuery = searchParams.toString()

  React.useEffect(() => {
    if (!isMobile) return
    if (openMobile && searchTimer.current !== null) {
      window.clearTimeout(searchTimer.current)
      searchTimer.current = null
    }
    if (wasMobileOpen.current && !openMobile) {
      wasMobileOpen.current = false
      if (searchAfterClose) {
        setSearchAfterClose(false)
        // The mobile sheet has a 300 ms closing animation; wait until its focus trap exits.
        searchTimer.current = window.setTimeout(() => {
          searchTimer.current = null
          document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
        }, 300)
        return
      }
      document.querySelector<HTMLElement>('[data-sidebar="trigger"]')?.focus()
    }
    wasMobileOpen.current = openMobile
  }, [isMobile, openMobile, searchAfterClose])

  React.useEffect(() => () => {
    if (searchTimer.current !== null) window.clearTimeout(searchTimer.current)
  }, [])

  // Libraries filter state
  const [librariesSearch, setLibrariesSearch] = useAtom(librariesSearchAtom)
  const [librariesCategory, setLibrariesCategory] = useAtom(librariesCategoryAtom)
  const [librariesScope, setLibrariesScope] = useAtom(librariesScopeAtom)
  const [librariesSort, setLibrariesSort] = useAtom(librariesSortAtom)
  const [librariesViewMode, setLibrariesViewMode] = useAtom(librariesViewModeAtom)
  const librariesSearchRef = React.useRef<HTMLInputElement>(null)

  // Drill-down route states
  const isLibraryRoute =
    pathname.startsWith("/community/libraries") ||
    pathname.startsWith("/libraries") ||
    urlTab === "libraries" ||
    (currentSection === "libraries" && activeTab === "libraries")

  const isComponentRoute =
    !isLibraryRoute &&
    (pathname.startsWith("/s/") ||
      urlTab === "components" ||
      (currentSection === "components" && activeTab === "components"))

  const [sidebarView, setSidebarView] = React.useState<
    "main" | "components" | "libraries"
  >("main")

  React.useEffect(() => {
    if (isLibraryRoute) {
      setSidebarView("libraries")
    } else if (isComponentRoute) {
      setSidebarView("components")
    } else {
      setSidebarView("main")
    }
  }, [isLibraryRoute, isComponentRoute])

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case "design-system":
        return <Palette className="h-3.5 w-3.5 shrink-0" />
      case "marketing":
        return <Megaphone className="h-3.5 w-3.5 shrink-0" />
      case "ai":
        return <Bot className="h-3.5 w-3.5 shrink-0" />
      case "forms":
        return <FileInput className="h-3.5 w-3.5 shrink-0" />
      case "motion":
        return <Orbit className="h-3.5 w-3.5 shrink-0" />
      case "charts":
        return <BarChart2 className="h-3.5 w-3.5 shrink-0" />
      case "icons":
        return <Shapes className="h-3.5 w-3.5 shrink-0" />
      case "ecommerce":
        return <ShoppingCart className="h-3.5 w-3.5 shrink-0" />
      case "auth":
        return <KeyRound className="h-3.5 w-3.5 shrink-0" />
      case "text-editor":
        return <PenLine className="h-3.5 w-3.5 shrink-0" />
      case "video":
        return <Video className="h-3.5 w-3.5 shrink-0" />
      case "audio":
        return <AudioLines className="h-3.5 w-3.5 shrink-0" />
      case "loaders":
        return <Loader2 className="h-3.5 w-3.5 shrink-0" />
      case "three-d":
        return <Boxes className="h-3.5 w-3.5 shrink-0" />
      case "docs":
        return <BookOpen className="h-3.5 w-3.5 shrink-0" />
      case "terminal":
        return <Terminal className="h-3.5 w-3.5 shrink-0" />
      case "react-native":
        return <Smartphone className="h-3.5 w-3.5 shrink-0" />
      case "general":
      default:
        return <Component className="h-3.5 w-3.5 shrink-0" />
    }
  }

  const [searchQuery, setSearchQuery] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)

  const marketingItems = sidebarCategories[0]?.items ?? []
  const uiItems = sidebarCategories[1]?.items ?? []

  const filteredMarketingItems = React.useMemo(() => {
    if (!searchQuery.trim()) return marketingItems
    const query = searchQuery.toLowerCase().trim()
    return marketingItems.filter((item) =>
      item.title.toLowerCase().includes(query),
    )
  }, [marketingItems, searchQuery])

  const filteredUiItems = React.useMemo(() => {
    if (!searchQuery.trim()) return uiItems
    const query = searchQuery.toLowerCase().trim()
    return uiItems.filter((item) =>
      item.title.toLowerCase().includes(query),
    )
  }, [uiItems, searchQuery])

  // Toggle item expansion (like AI Component Builder)
  const toggleExpandItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  const [helpOpen, setHelpOpen] = React.useState(false)

  // Add keyboard event handler
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const isInput =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable

      // Add handler for slash key using code
      if ((e.code === "Slash" || e.code === "IntlRo") && !isInput) {
        e.preventDefault()
        if (sidebarView === "components" && searchInputRef.current) {
          searchInputRef.current.focus()
        } else if (sidebarView === "libraries" && librariesSearchRef.current) {
          librariesSearchRef.current.focus()
        } else {
          setHelpOpen((prev) => !prev)
        }
        return
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [sidebarView])

  const { isAdmin: isHookAdmin } = useIsAdmin()
  const { data: tagCounts } = useCategoryTagCounts()
  const isAdmin = mounted ? Boolean(clerkUser && isHookAdmin) : false
  const username =
    userState?.profile?.display_username ||
    userState?.profile?.username ||
    clerkUser?.username ||
    clerkUser?.externalAccounts?.[0]?.username

  const tabHref = (tab: string, sort?: string) =>
    `/?tab=${tab}${sort ? `&sort=${sort}` : ""}`

  const navigateTab = (
    event: React.MouseEvent<HTMLAnchorElement>,
    tab: Exclude<AppSection, "higherbits-mcp">,
    sort?: "recommended" | "date",
  ) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return
    event.preventDefault()
    if (sort) {
      router.push(tabHref(tab, sort))
    } else {
      navigateToTab(tab)
    }
    if (tab === "components") setSidebarView("components")
    if (tab === "libraries") setSidebarView("libraries")
    if (isMobile) setOpenMobile(false)
  }

  const categoryRow = (item: (typeof sidebarCategories)[number]["items"][number]) => {
    const Icon = item.icon || Box
    const isActive = !item.comingSoon && pathname === item.href
    const tagSlug = item.href.startsWith("/s/") ? item.href.slice(3) : ""
    const count = tagSlug ? tagCounts?.[tagSlug] : undefined
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton asChild isActive={isActive} className="h-auto min-h-8 rounded-md px-2 text-sm disabled:opacity-100 md:min-h-8 max-md:min-h-11">
          {item.comingSoon ? (
            <button type="button" disabled aria-label={`${item.title}, Coming soon`} className="flex w-full items-center gap-2 text-left text-muted-foreground disabled:cursor-not-allowed disabled:opacity-100">
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              <span className="shrink-0 rounded border border-border px-1 py-0.5 text-[10px] leading-none">Coming soon</span>
            </button>
          ) : (
            <Link
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className="flex w-full items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return
                e.preventDefault()
                window.location.href = item.href
                if (isMobile) setOpenMobile(false)
              }}
            >
              <Icon className="size-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{item.title}</span>
              {typeof count === "number" && count > 0 && <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{count}</span>}
            </Link>
          )}
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const tabRow = (title: string, tab: Exclude<AppSection, "higherbits-mcp">, Icon: typeof Home) => {
    const selected = pathname === "/" && (urlTab || "home") === tab
    return (
      <SidebarMenuItem key={title}>
        <SidebarMenuButton asChild isActive={selected} className="h-auto min-h-8 px-2 text-sm max-md:min-h-11">
          <Link href={tabHref(tab, tab === "components" ? "recommended" : undefined)} aria-current={selected ? "page" : undefined} onClick={(e) => navigateTab(e, tab, tab === "components" ? "recommended" : undefined)} className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring">
            <Icon className="size-4 shrink-0" /><span>{title}</span>
            {tab === "components" && <ChevronRight className="ml-auto size-4" />}
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  }

  const soonRow = (title: string, Icon: typeof Home) => (
    <SidebarMenuItem key={title}>
      <SidebarMenuButton asChild className="h-auto min-h-8 px-2 text-sm disabled:opacity-100 max-md:min-h-11">
        <button type="button" disabled aria-label={`${title}, Coming soon`} className="flex w-full items-center gap-2 text-left text-muted-foreground disabled:cursor-not-allowed disabled:opacity-100">
          <Icon className="size-4 shrink-0" /><span className="min-w-0 flex-1 truncate">{title}</span>
          <span className="shrink-0 rounded border border-border px-1 py-0.5 text-[10px] leading-none">Coming soon</span>
        </button>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )

  React.useEffect(() => {
    if (pathname !== "/" || urlTab !== "components") return
    const requested = new URLSearchParams(routeQuery).get("sort")
    const nextSort = requested === "date" || requested === "downloads" || requested === "likes" || requested === "bookmarks"
      ? requested
      : "recommended"
    setSortBy((current) => current === nextSort ? current : nextSort)
  }, [pathname, urlTab, routeQuery, setSortBy])

  return (
    <Sidebar className="hidden md:flex top-14 h-[calc(100svh-3.5rem)] border-t">
      <SidebarContent className="min-h-0 flex-1 pb-2">
        {isMobile && (
          <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-sidebar px-3 py-2">
            <SheetTitle className="text-sm font-semibold">HigherBits navigation</SheetTitle>
            <button type="button" aria-label="Close navigation" onClick={() => setOpenMobile(false)} className="flex size-11 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:ring-ring">
              <X className="size-5" />
            </button>
          </div>
        )}
        {sidebarView === "libraries" ? (
          <>
            {/* Header with back button */}
            <div className="flex items-center px-3 py-2 border-b border-border/40 mb-1">
              <button
                type="button"
                onClick={() => {
                  setSidebarView("components")
                  navigateToTab("components")
                }}
                className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors py-1 px-1 -ml-1 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Libraries</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="px-3 pt-1 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  ref={librariesSearchRef}
                  type="text"
                  aria-label="Search libraries"
                  placeholder="Search libraries"
                  value={librariesSearch}
                  onChange={(e) => setLibrariesSearch(e.target.value)}
                  className="h-8 w-full bg-muted/40 pl-8 pr-7 text-xs rounded-md border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-4 select-none items-center rounded border border-border/60 bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                  /
                </kbd>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="px-3 pb-2">
              <div className="flex h-8 items-center rounded-md border border-border/60 bg-foreground/5 p-0.5">
                <button
                  type="button"
                  aria-pressed={librariesViewMode === "grid"}
                  onClick={() => setLibrariesViewMode("grid")}
                  className={cn(
                    "flex h-6.5 flex-1 items-center justify-center gap-1.5 rounded-sm text-xs transition-colors",
                    librariesViewMode === "grid"
                      ? "bg-background text-foreground shadow-xs font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LayoutGrid className="size-3.5 shrink-0" />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  aria-pressed={librariesViewMode === "list"}
                  onClick={() => setLibrariesViewMode("list")}
                  className={cn(
                    "flex h-6.5 flex-1 items-center justify-center gap-1.5 rounded-sm text-xs transition-colors",
                    librariesViewMode === "list"
                      ? "bg-background text-foreground shadow-xs font-medium"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <List className="size-3.5 shrink-0" />
                  <span>List</span>
                </button>
              </div>
            </div>

            {/* Scope selection: On HigherBits (139) / shadcn directory (308) */}
            <div className="px-2 pb-1 flex flex-col gap-0.5">
              <button
                type="button"
                aria-pressed={librariesScope === "higherbits" && librariesCategory === "all"}
                onClick={() => {
                  setLibrariesScope("higherbits")
                  setLibrariesCategory("all")
                }}
                className={cn(
                  "flex w-full items-center h-8 rounded-md px-2 text-xs transition-colors",
                  librariesScope === "higherbits" && librariesCategory === "all"
                    ? "bg-foreground/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <Boxes className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>On HigherBits</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground/70">
                  139
                </span>
              </button>

              <button
                type="button"
                aria-pressed={librariesScope === "shadcn"}
                onClick={() => {
                  setLibrariesScope("shadcn")
                }}
                className={cn(
                  "flex w-full items-center h-8 rounded-md px-2 text-xs transition-colors",
                  librariesScope === "shadcn"
                    ? "bg-foreground/10 text-foreground font-medium"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                )}
              >
                <Globe className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>shadcn directory</span>
                <span className="ml-auto text-xs tabular-nums text-muted-foreground/70">
                  308
                </span>
              </button>
            </div>

            {/* Sort section */}
            <div className="px-2 pt-3 pb-1">
              <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground/70">
                Sort
              </p>
              <div className="flex flex-col gap-0.5">
                {[
                  { value: "views", label: "Views", hasArrow: true },
                  { value: "components", label: "Components" },
                  { value: "updated", label: "Recently updated" },
                  { value: "newest", label: "Newest" },
                  { value: "name", label: "Name" },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    aria-pressed={librariesSort === s.value}
                    onClick={() => setLibrariesSort(s.value as any)}
                    className={cn(
                      "flex w-full items-center h-7 rounded-md px-2 text-xs transition-colors",
                      librariesSort === s.value
                        ? "bg-foreground/10 text-foreground font-medium"
                        : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                    )}
                  >
                    <span className="truncate">{s.label}</span>
                    {s.hasArrow && librariesSort === s.value && (
                      <ArrowDown className="ml-auto size-3.5 text-muted-foreground/70" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories section */}
            <div className="px-2 pt-3 pb-4">
              <p className="px-2 pb-1 text-[11px] font-medium text-muted-foreground/70">
                Categories
              </p>
              <div className="flex flex-col gap-0.5">
                {LIBRARY_CATEGORIES.map((cat) => {
                  const isCatActive =
                    librariesCategory === cat.slug && librariesScope === "higherbits"
                  return (
                    <button
                      key={cat.slug}
                      type="button"
                      aria-pressed={isCatActive}
                      onClick={() => {
                        setLibrariesScope("higherbits")
                        setLibrariesCategory(
                          isCatActive ? "all" : cat.slug,
                        )
                      }}
                      className={cn(
                        "flex w-full items-center h-8 rounded-md px-2 text-xs transition-colors",
                        isCatActive
                          ? "bg-foreground/10 text-foreground font-medium"
                          : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground",
                      )}
                    >
                      <span className="mr-2 text-muted-foreground">
                        {getCategoryIcon(cat.slug)}
                      </span>
                      <span className="truncate">{cat.name}</span>
                      <span className="ml-auto pl-2 text-[11px] tabular-nums text-muted-foreground/70">
                        {cat.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        ) : sidebarView === "components" ? (
          <>
            {/* Header with back button */}
            <div className="flex items-center px-3 py-2 border-b border-border/40 mb-1">
              <button
                type="button"
                onClick={() => setSidebarView("main")}
                aria-label="Back to main navigation"
                className="flex items-center gap-2 text-sm font-semibold text-foreground hover:text-foreground/80 transition-colors py-1 px-1 -ml-1 rounded-md"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Components</span>
              </button>
            </div>

            {/* Search Input */}
            <div className="px-3 pt-1 pb-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  aria-label="Search components"
                  placeholder="Search components"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-8 w-full bg-muted/40 pl-8 pr-7 text-xs rounded-md border-border/50 focus-visible:ring-1 focus-visible:ring-ring"
                />
                <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-4 select-none items-center rounded border border-border/60 bg-muted px-1 font-mono text-[10px] font-medium text-muted-foreground">
                  /
                </kbd>
              </div>
            </div>

            {!searchQuery.trim() && (
              <SidebarGroup className="px-2 py-1">
                <SidebarGroupContent><SidebarMenu className="gap-0.5">
                  {([
                    { title: "Featured", icon: Sparkles, tab: "components", sort: "recommended" },
                    { title: "Newest", icon: Clock, tab: "components", sort: "date" },
                    { title: "Creators", icon: Users, tab: "authors" },
                    { title: "Libraries", icon: Layers, tab: "libraries" },
                  ] as const).map(({ title, icon: Icon, tab, ...option }) => {
                    const sort = "sort" in option ? option.sort : undefined
                    const selected = pathname === "/" && urlTab === tab && (tab !== "components" || sortBy === sort)
                    return (
                      <SidebarMenuItem key={title}>
                        <SidebarMenuButton asChild isActive={selected} className="h-auto min-h-8 px-2 text-sm max-md:min-h-11">
                          <Link href={tabHref(tab, sort)} aria-current={selected ? "page" : undefined} onClick={(e) => navigateTab(e, tab, sort)} className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring">
                            <Icon className="size-4 shrink-0" /><span>{title}</span>
                            {tab === "libraries" && <ChevronRight className="ml-auto size-4" />}
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}

            {filteredMarketingItems.length > 0 && (
              <SidebarGroup className="py-1 px-2">
                <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">Marketing Blocks</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu className="gap-0.5">{filteredMarketingItems.map(categoryRow)}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}
            {filteredUiItems.length > 0 && (
              <SidebarGroup className="py-1 px-2">
                <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">UI Components</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu className="gap-0.5">{filteredUiItems.map(categoryRow)}</SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}

            {filteredMarketingItems.length === 0 && filteredUiItems.length === 0 && (
              <div className="px-4 py-8 text-center text-xs text-muted-foreground">
                No components found matching &ldquo;{searchQuery}&rdquo;
              </div>
            )}
          </>
        ) : (
          <>
            <SidebarGroup className="px-2 py-2">
              <SidebarGroupContent><SidebarMenu className="gap-0.5">
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="h-auto min-h-8 px-2 text-sm max-md:min-h-11">
                    <button type="button" onClick={() => {
                      if (isMobile) {
                        setSearchAfterClose(true)
                        setOpenMobile(false)
                      } else {
                        document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }))
                      }
                    }} className="flex w-full items-center gap-2 text-left focus-visible:ring-2 focus-visible:ring-ring">
                      <Search className="size-4" /><span>Search</span><kbd className="ml-auto text-[10px] text-muted-foreground">⌘ K</kbd>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                {tabRow("Home", "home", Home)}
              </SidebarMenu></SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="px-2 py-1">
              <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">Explore</SidebarGroupLabel>
              <SidebarGroupContent><SidebarMenu className="gap-0.5">
                {tabRow("Components", "components", Component)}
                {soonRow("Themes", Palette)}
                {isAdmin && tabRow("Templates", "templates", LayoutTemplate)}
                {soonRow("Apps", Boxes)}
                {soonRow("Icons", Shapes)}
                {soonRow("Video", Video)}
                {mounted && clerkUser && username && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === `/${username}` && searchParams.get("tab") === "bookmarks"} className="h-auto min-h-8 px-2 text-sm max-md:min-h-11">
                      <Link href={`/${username}?tab=bookmarks`} aria-current={pathname === `/${username}` && searchParams.get("tab") === "bookmarks" ? "page" : undefined} className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; if (isMobile) setOpenMobile(false) }}>
                        <Bookmark className="size-4" />Bookmarks
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {tabRow("Creators", "authors", Users)}
                {tabRow("Collections", "collections", FolderOpen)}
              </SidebarMenu></SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup className="px-2 py-1">
              <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">Build</SidebarGroupLabel>
              <SidebarGroupContent><SidebarMenu className="gap-0.5">
                {mounted && clerkUser && (
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname.startsWith("/studio")} className="h-auto min-h-8 px-2 text-sm max-md:min-h-11">
                      <Link href={username ? `/studio/${username}/components` : "/studio"} aria-current={pathname.startsWith("/studio") ? "page" : undefined} className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; e.preventDefault(); if (username) studioHardNavigate(`/studio/${username}/components`); else router.push("/studio"); if (isMobile) setOpenMobile(false) }}>
                        <PenLine className="size-4" />Creator Studio
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )}
                {soonRow("HigherBits AI", Sparkles)}
                {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton type="button" aria-expanded={expandedItems.includes("higherbits-mcp")} aria-controls="higherbits-mcp-links" onClick={() => toggleExpandItem("higherbits-mcp")} className="h-auto min-h-8 px-2 text-sm max-md:min-h-11">
                      <div className="flex w-full items-center gap-2"><Terminal className="size-4" />HigherBits MCP<ChevronRight className={cn("ml-auto size-4 transition-transform motion-reduce:transition-none", expandedItems.includes("higherbits-mcp") && "rotate-90")} /></div>
                    </SidebarMenuButton>
                    <div id="higherbits-mcp-links" hidden={!expandedItems.includes("higherbits-mcp")} className="ml-6">
                      {aiBuilderNavItem.subitems.filter((item) => item.title !== "HigherBits AI Waitlist").map((item) => (
                        <Link key={item.title} href={item.href} target={item.externalLink ? "_blank" : undefined} rel={item.externalLink ? "noopener noreferrer" : undefined} aria-current={pathname === item.href ? "page" : undefined} className="flex min-h-8 items-center rounded-md px-2 text-sm text-muted-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring max-md:min-h-11" onClick={(e) => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return; if (isMobile) setOpenMobile(false) }}>{item.title}</Link>
                      ))}
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu></SidebarGroupContent>
            </SidebarGroup>

            {isAdmin && (
              <SidebarGroup className="px-2 py-1">
                <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">Catalog tools</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu className="gap-0.5">
                  {tabRow("Bundles", "bundles", Package)}
                  {tabRow("Premium Stores", "pro", Crown)}
                  <SidebarMenuItem><SidebarMenuButton asChild className="h-auto min-h-8 px-2 text-sm max-md:min-h-11"><Link href="/magic-chat" className="flex items-center gap-2 focus-visible:ring-2 focus-visible:ring-ring"><Bot className="size-4" />HigherBits AI Waitlist</Link></SidebarMenuButton></SidebarMenuItem>
                </SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}

            {isAdmin && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold text-foreground">
                Contest
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === "/contest"}
                      onClick={() => {
                        router.push("/contest")
                        if (isMobile) setOpenMobile(false)
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Swords className="mr-2 h-4 w-4" />
                        Overview
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      isActive={pathname === "/contest/leaderboard"}
                      onClick={() => {
                        window.location.href = "/contest/leaderboard"
                        if (isMobile) setOpenMobile(false)
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Trophy className="mr-2 h-4 w-4" />
                        Leaderboard
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            )}

            {mounted && Boolean(clerkUser) && isAdmin && (
              <SidebarGroup className="px-2 py-1">
                <SidebarGroupLabel className="px-2 text-xs font-medium text-muted-foreground">You</SidebarGroupLabel>
                <SidebarGroupContent><SidebarMenu className="gap-0.5">
                  {soonRow("Purchased Bundles", Package)}
                </SidebarMenu></SidebarGroupContent>
              </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="shrink-0 flex flex-row items-center justify-between border-t px-3 py-2">
        <Help open={helpOpen} onOpenChange={setHelpOpen} />
        {mounted && clerkUser && (
          <button type="button" onClick={() => { if (username) studioHardNavigate(`/studio/${username}/components?new=true`); else router.push("/studio?new=true"); if (isMobile) setOpenMobile(false) }} className="inline-flex min-h-8 items-center gap-2 rounded-md px-2 text-sm font-medium text-foreground hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring max-md:min-h-11">
            <PenLine className="size-4" />Publish
          </button>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
