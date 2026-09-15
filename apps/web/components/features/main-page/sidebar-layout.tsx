"use client"

import { Icons } from "@/components/icons"
import { SidebarHeader, useSidebar } from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useNavigation } from "@/hooks/use-navigation"
import {
  AppSection,
  librariesSearchAtom,
  librariesCategoryAtom,
  librariesScopeAtom,
  librariesSortAtom,
  librariesViewModeAtom,
} from "@/lib/atoms"
import { LIBRARY_CATEGORIES } from "@/lib/data/libraries-data"
import {
  categories as defaultCategories,
  magicNavItem,
  mainNavigationItems,
} from "@/lib/navigation"
import { useFilteredNavigation } from "@/lib/navigation-with-magic"
import { userStateAtom } from "@/lib/store/user-store"
import { cn } from "@/lib/utils"
import { useUser } from "@clerk/nextjs"
import { useIsAdmin } from "@/components/features/publish/hooks/use-is-admin"
import { useCategoryTagCounts } from "@/lib/queries"
import { useAtom } from "jotai"
import {
  ArrowDown,
  ArrowUpRight,
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
  FolderKanban,
  FolderOpen,
  Globe,
  Group,
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
  Presentation,
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
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { AnimatePresence, motion } from "motion/react"
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

// Import types from navigation-with-magic.tsx
import { Button } from "@/components/ui/button"
import { ClayCard } from "@/components/ui/clay-card"
import { TextShimmer } from "@/components/ui/text-shimmer"
import type {
  NavigationCategory,
  NavigationItem,
} from "@/lib/navigation-with-magic"

export function MainSidebar() {
  const { toggleSidebar, state, isMobile, setOpenMobile } = useSidebar()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user: clerkUser } = useUser()
  const [userState] = useAtom(userStateAtom)
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const [showTrigger, setShowTrigger] = React.useState(true)
  const [hoveredItem, setHoveredItem] = React.useState<string | null>(null)
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>(
    [],
  )
  const [expandedItems, setExpandedItems] = React.useState<string[]>([]) // Start with Magic menu closed

  // Use our custom tabs navigation hook
  const { activeTab, currentSection, navigateToTab, sortBy, handleSortChange } = useNavigation()

  // Use the filtered navigation that checks if Magic onboarding is completed
  const filteredCategories = useFilteredNavigation()

  // Fall back to default categories if filteredCategories is not available (SSR)
  // Hydration fix: only use filteredCategories after mounting to avoid mismatch with SSR
  const categories = mounted ? (filteredCategories || defaultCategories) : defaultCategories

  // Get the current tab from URL when available
  const urlTab = searchParams.get("tab") as Exclude<AppSection, "magic"> | null

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

  const marketingCategory = categories.find(
    (c: NavigationCategory) => c.title === "Marketing Blocks",
  )
  const uiCategory = categories.find(
    (c: NavigationCategory) => c.title === "UI Components",
  )

  const marketingItems =
    marketingCategory?.items || defaultCategories[0]?.items || []
  const uiItems = uiCategory?.items || defaultCategories[1]?.items || []

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

  // Toggle category expansion
  const toggleCategory = (categoryId: string) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    )
  }

  // Toggle item expansion (like AI Component Builder)
  const toggleExpandItem = (id: string) => {
    setExpandedItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    )
  }

  // Map navigation value to icon component
  const getIconForNavItem = (value: string) => {
    const item = mainNavigationItems.find((item) => item.value === value)
    if (item) {
      const Icon = item.icon
      return <Icon className="mr-2 h-4 w-4" />
    }
    // Fallbacks
    switch (value) {
      case "home":
        return <Home className="mr-2 h-4 w-4" />
      case "components":
        return <Component className="mr-2 h-4 w-4" />
      case "templates":
        return <LayoutTemplate className="mr-2 h-4 w-4" />
      case "categories":
        return <FolderKanban className="mr-2 h-4 w-4" />
      case "authors":
        return <Users className="mr-2 h-4 w-4" />
      case "pro":
        return <Crown className="mr-2 h-4 w-4" />
      case "collections":
        return <FolderOpen className="mr-2 h-4 w-4" />
      default:
        return <Box className="mr-2 h-4 w-4" />
    }
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

  // Add a useEffect to automatically open Magic menu after 1 second if admin
  React.useEffect(() => {
    if (!isAdmin) return
    const timer = setTimeout(() => {
      setExpandedItems((prev) =>
        prev.includes("magic") ? prev : [...prev, "magic"],
      )
    }, 1000)

    return () => clearTimeout(timer)
  }, [isAdmin])

  return (
    <Sidebar className="hidden md:flex top-14 h-[calc(100svh-3.5rem)] border-t">
      <SidebarContent className="pb-14">
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

            {/* Quick Links */}
            {!searchQuery.trim() && (
              <SidebarGroup className="py-1">
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={
                          currentSection !== "magic" &&
                          !pathname.startsWith("/s/") &&
                          urlTab === "components" &&
                          sortBy === "recommended"
                        }
                        onClick={() => {
                          navigateToTab("components")
                          handleSortChange("recommended")
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                        <div className="flex items-center w-full">
                          <Sparkles className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Featured</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={
                          currentSection !== "magic" &&
                          !pathname.startsWith("/s/") &&
                          urlTab === "components" &&
                          sortBy === "date"
                        }
                        onClick={() => {
                          navigateToTab("components")
                          handleSortChange("date")
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Newest</span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={activeTab === "authors" || urlTab === "authors"}
                        onClick={() => {
                          navigateToTab("authors")
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                        <div className="flex items-center w-full">
                          <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                          <span>Authors</span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>

                    <SidebarMenuItem>
                      <SidebarMenuButton
                        isActive={
                          activeTab === "libraries" ||
                          urlTab === "libraries"
                        }
                        onClick={() => {
                          setSidebarView("libraries")
                          navigateToTab("libraries")
                          if (isMobile) setOpenMobile(false)
                        }}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center">
                            <Layers className="mr-2 h-4 w-4 text-muted-foreground" />
                            <span>Libraries</span>
                            <span className="ml-2 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 text-[10px] leading-none font-medium">
                              Updated
                            </span>
                          </div>
                          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* Marketing Blocks */}
            {filteredMarketingItems.length > 0 && (
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="text-xs font-semibold text-foreground px-3 py-1">
                  Marketing Blocks
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {filteredMarketingItems.map((item) => {
                      const tagSlug = item.href.startsWith("/s/")
                        ? item.href.replace("/s/", "")
                        : ""
                      const liveCount =
                        tagCounts && tagSlug ? (tagCounts[tagSlug] ?? 0) : 0
                      const isActive =
                        pathname === item.href ||
                        Boolean(tagSlug && pathname === `/s/${tagSlug}`)
                      const Icon = item.icon || Box

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center justify-between w-full text-xs py-1.5",
                                isActive
                                  ? "bg-accent-lavender text-accent-lavender-foreground font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                              )}
                              onClick={(e) => {
                                if (item.externalLink) return
                                if (
                                  e.metaKey ||
                                  e.ctrlKey ||
                                  e.shiftKey ||
                                  e.button === 1
                                )
                                  return
                                e.preventDefault()
                                window.location.href = item.href
                                if (isMobile) setOpenMobile(false)
                              }}
                              onMouseEnter={() => setHoveredItem(item.title)}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <span className="flex items-center min-w-0 truncate">
                                <Icon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{item.title}</span>
                                {item.isNew && (
                                  <span className="ml-2 shrink-0 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 text-[10px] leading-none font-medium">
                                    New
                                  </span>
                                )}
                              </span>
                              {liveCount > 0 && (
                                <span
                                  className={cn(
                                    "text-xs text-muted-foreground shrink-0 ml-2",
                                    hoveredItem === item.title &&
                                      "text-accent-foreground",
                                  )}
                                >
                                  {liveCount}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}

            {/* UI Components */}
            {filteredUiItems.length > 0 && (
              <SidebarGroup className="py-1">
                <SidebarGroupLabel className="text-xs font-semibold text-foreground px-3 py-1">
                  UI Components
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu className="gap-0.5">
                    {filteredUiItems.map((item) => {
                      const tagSlug = item.href.startsWith("/s/")
                        ? item.href.replace("/s/", "")
                        : ""
                      const liveCount =
                        tagCounts && tagSlug ? (tagCounts[tagSlug] ?? 0) : 0
                      const isActive =
                        pathname === item.href ||
                        Boolean(tagSlug && pathname === `/s/${tagSlug}`)
                      const Icon = item.icon || Box

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild isActive={isActive}>
                            <Link
                              href={item.href}
                              className={cn(
                                "flex items-center justify-between w-full text-xs py-1.5",
                                isActive
                                  ? "bg-accent-lavender text-accent-lavender-foreground font-medium"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                              )}
                              onClick={(e) => {
                                if (item.externalLink) return
                                if (
                                  e.metaKey ||
                                  e.ctrlKey ||
                                  e.shiftKey ||
                                  e.button === 1
                                )
                                  return
                                e.preventDefault()
                                window.location.href = item.href
                                if (isMobile) setOpenMobile(false)
                              }}
                              onMouseEnter={() => setHoveredItem(item.title)}
                              onMouseLeave={() => setHoveredItem(null)}
                            >
                              <span className="flex items-center min-w-0 truncate">
                                <Icon className="mr-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span className="truncate">{item.title}</span>
                                {item.isNew && (
                                  <span className="ml-2 shrink-0 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 px-1.5 py-0.5 text-[10px] leading-none font-medium">
                                    New
                                  </span>
                                )}
                              </span>
                              {liveCount > 0 && (
                                <span
                                  className={cn(
                                    "text-xs text-muted-foreground shrink-0 ml-2",
                                    hoveredItem === item.title &&
                                      "text-accent-foreground",
                                  )}
                                >
                                  {liveCount}
                                </span>
                              )}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
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
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {/* Home and Components first */}
                  {mainNavigationItems
                    .filter((item) => ["home", "components"].includes(item.value))
                    .map((item) => (
                      <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton
                          isActive={
                            currentSection !== "magic" &&
                            !pathname.startsWith("/s/") &&
                            ((item.value === "home" &&
                              (urlTab === "home" ||
                                (!urlTab && pathname === "/"))) ||
                              (item.value === "components" &&
                                urlTab === "components") ||
                              (item.value !== "home" &&
                                item.value !== "components" &&
                                activeTab === item.value))
                          }
                          onClick={() => {
                            if (item.value === "components") {
                              setSidebarView("components")
                            }
                            navigateToTab(
                              item.value as Exclude<AppSection, "magic"> | "home",
                            )
                            if (isMobile) setOpenMobile(false)
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center">
                              {getIconForNavItem(item.value)}
                              {item.title}
                              {item.isNew && (
                                <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                                  New
                                </span>
                              )}
                            </div>
                            {item.value === "components" && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}

                  {/* AI Component Builder collapsible menu */}
                  {isAdmin && (
                  <SidebarMenuItem className="group/menu-item relative">
                    <SidebarMenuButton
                      isActive={false}
                      onClick={() => toggleExpandItem("magic")}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center">
                          <Sparkles className="mr-2 h-4 w-4" />
                          {magicNavItem.title}
                        </div>
                        <ChevronRight
                          className={cn(
                            "h-4 w-4 transition-transform",
                            expandedItems.includes("magic") &&
                              "transform rotate-90",
                          )}
                        />
                      </div>
                    </SidebarMenuButton>

                    <AnimatePresence mode="wait">
                      {expandedItems.includes("magic") && (
                        <motion.div
                          key="magic-menu"
                          initial={{
                            height: 0,
                            opacity: 0,
                            marginTop: 0,
                            marginBottom: 0,
                          }}
                          animate={{
                            height: "auto",
                            opacity: 1,
                            marginTop: 4,
                            marginBottom: 4,
                          }}
                          exit={{
                            height: 0,
                            opacity: 0,
                            marginTop: 0,
                            marginBottom: 0,
                          }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className="overflow-hidden ml-6 w-auto"
                          style={{ paddingBottom: 0 }}
                        >
                          <div className="flex flex-col gap-0.5">
                            {magicNavItem.subitems.map((subitem, itemIndex) => {
                              const isActive =
                                pathname === subitem.href ||
                                (currentSection === "magic" &&
                                  pathname === subitem.href)

                              // Calculate staggered delay
                              const staggerDelay = Math.min(itemIndex * 0.02, 0.15)

                              return (
                                <motion.div
                                  key={subitem.title}
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -5 }}
                                  transition={{
                                    duration: 0.15,
                                    delay: staggerDelay,
                                    ease: "easeOut",
                                  }}
                                >
                                  <div className="mb-0">
                                    <SidebarMenuButton asChild isActive={isActive}>
                                      <Link
                                        href={subitem.href}
                                        className={cn(
                                          "flex items-center justify-between w-full",
                                          isActive
                                            ? "bg-accent-lavender text-accent-lavender-foreground font-medium"
                                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                                        )}
                                        onClick={(e) => {
                                          if (subitem.externalLink) return
                                          if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
                                          e.preventDefault()
                                          window.location.href = subitem.href
                                          if (isMobile) setOpenMobile(false)
                                        }}
                                        target={
                                          subitem.externalLink
                                            ? "_blank"
                                            : undefined
                                        }
                                        rel={
                                          subitem.externalLink
                                            ? "noopener noreferrer"
                                            : undefined
                                        }
                                      >
                                        <span className="flex items-center">
                                          {subitem.title}
                                          {subitem.isNew && (
                                            <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                                              New
                                            </span>
                                          )}
                                        </span>
                                        {subitem.externalLink && (
                                          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                                        )}
                                      </Link>
                                    </SidebarMenuButton>
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </SidebarMenuItem>
                  )}

                  {/* Templates and other items */}
                  {mainNavigationItems
                    .filter((item) => !["home", "components"].includes(item.value))
                    .filter((item) => {
                      return (
                        isAdmin ||
                        !["bundles", "templates", "pro"].includes(item.value)
                      )
                    })
                    .map((item) => (
                      <SidebarMenuItem key={item.value}>
                        <SidebarMenuButton
                          isActive={
                            currentSection !== "magic" &&
                            !pathname.startsWith("/s/") &&
                            activeTab === item.value
                          }
                          onClick={() => {
                            navigateToTab(
                              item.value as Exclude<AppSection, "magic">,
                            )
                            if (isMobile) setOpenMobile(false)
                          }}
                        >
                          <div className="flex items-center w-full">
                            {getIconForNavItem(item.value)}
                            {item.title}
                            {item.isNew && (
                              <span className="ml-2 rounded-md bg-[#adfa1d] px-1.5 py-0.5 text-xs leading-none text-[#000000]">
                                New
                              </span>
                            )}
                          </div>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

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

            {/* Add You section */}
            {mounted && Boolean(clerkUser) && (
            <SidebarGroup>
              <SidebarGroupLabel className="text-sm font-semibold text-foreground">
                You
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (userState.profile?.display_username) {
                          router.push(
                            `/${userState.profile.display_username}?tab=bookmarks`,
                          )
                        } else if (clerkUser?.username) {
                          router.push(`/${clerkUser.username}?tab=bookmarks`)
                        } else if (clerkUser?.externalAccounts?.[0]?.username) {
                          router.push(
                            `/${clerkUser.externalAccounts[0].username}?tab=bookmarks`,
                          )
                        }
                          if (isMobile) setOpenMobile(false)
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Bookmark className="mr-2 h-4 w-4" />
                        Bookmarks
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {isAdmin && (
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        if (userState.profile?.display_username) {
                          router.push(
                            `/${userState.profile.display_username}?tab=purchased_bundles`,
                          )
                        } else if (clerkUser?.username) {
                          router.push(
                            `/${clerkUser.username}?tab=purchased_bundles`,
                          )
                        } else if (clerkUser?.externalAccounts?.[0]?.username) {
                          router.push(
                            `/${clerkUser.externalAccounts[0].username}?tab=purchased_bundles`,
                          )
                        }
                          if (isMobile) setOpenMobile(false)
                      }}
                    >
                      <div className="flex items-center w-full">
                        <Package className="mr-2 h-4 w-4" />
                        Purchased Bundles
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            )}
          </>
        )}
      </SidebarContent>
      <SidebarFooter className="flex flex-col justify-start pl-4 border-t py-2">
        {isAdmin && state !== "collapsed" && (
          <ClayCard className="bg-accent-pink text-accent-pink-foreground mr-4 flex flex-col justify-between p-4">
            <div>
              <div className="flex items-center gap-2 font-cozy text-sm font-medium">
                <Crown className="h-4 w-4" />
                Unlock everything
              </div>
              <p className="mt-1 text-sm">
                Go Pro for full access to every component.
              </p>
            </div>
            <Link
              href="/support"
              className="mt-3 inline-block"
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return
                e.preventDefault()
                router.push("/support")
                if (isMobile) setOpenMobile(false)
              }}
            >
              <span className="font-medium underline underline-offset-4">
                Support Us!
              </span>
            </Link>
          </ClayCard>
        )}
        <Help open={helpOpen} onOpenChange={setHelpOpen} />
      </SidebarFooter>
    </Sidebar>
  )
}
