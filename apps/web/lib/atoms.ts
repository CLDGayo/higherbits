import { atom } from "jotai"

export type AppSection =
  | "home"
  | "components"
  | "templates"
  | "categories"
  | "authors"
  | "pro"
  | "collections"
  | "magic"
  | "bundles"
  | "libraries"

export type MainTabType = Exclude<AppSection, "magic">

export type TabChangeHandler = (tab: MainTabType | "home") => void

export const tabChangeHandlerAtom = atom<TabChangeHandler | null>(null)

export const currentSectionAtom = atom<AppSection>("home")

export const selectedMainTabAtom = atom<MainTabType | "home">("home")

export const getMainPageUrlWithTab = (
  tab: MainTabType | "home",
  sortBy?: string,
): string => {
  const params = new URLSearchParams()
  params.set("tab", tab)
  if (tab === "components" && sortBy) {
    params.set("sort", sortBy)
  }
  return `/?${params.toString()}`
}

// Libraries Directory state
export type LibraryScope = "higherbits" | "shadcn"
export type LibrarySort = "views" | "components" | "updated" | "newest" | "name"
export type LibraryViewMode = "grid" | "list"

export const librariesSearchAtom = atom<string>("")
export const librariesCategoryAtom = atom<string>("all")
export const librariesScopeAtom = atom<LibraryScope>("higherbits")
export const librariesSortAtom = atom<LibrarySort>("views")
export const librariesViewModeAtom = atom<LibraryViewMode>("grid")
