/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import {
  librariesSearchAtom,
  librariesCategoryAtom,
  librariesScopeAtom,
  librariesSortAtom,
  librariesViewModeAtom,
} from "@/lib/atoms"

const mockState = {
  search: "",
  category: "all",
  scope: "higherbits",
  sort: "views",
  viewMode: "grid",
}

vi.mock("jotai", () => ({
  useAtom: (atom: any) => {
    if (atom === librariesSearchAtom) return [mockState.search, (v: any) => { mockState.search = v }]
    if (atom === librariesCategoryAtom) return [mockState.category, (v: any) => { mockState.category = v }]
    if (atom === librariesScopeAtom) return [mockState.scope, (v: any) => { mockState.scope = v }]
    if (atom === librariesSortAtom) return [mockState.sort, (v: any) => { mockState.sort = v }]
    if (atom === librariesViewModeAtom) return [mockState.viewMode, (v: any) => { mockState.viewMode = v }]
    return ["", vi.fn()]
  },
  atom: (v: unknown) => v,
}))

import { LibrariesList } from "../libraries-list"
import { LibraryCard } from "../library-card"
import { LIBRARIES_DATA } from "@/lib/data/libraries-data"

describe("LibrariesList", () => {
  beforeEach(() => {
    mockState.search = ""
    mockState.category = "all"
    mockState.scope = "higherbits"
    mockState.sort = "views"
    mockState.viewMode = "grid"
  })

  it("renders the heading and library items count", () => {
    render(<LibrariesList />)
    expect(screen.getByText("UI Component Libraries")).toBeDefined()
    expect(screen.getByText(String(LIBRARIES_DATA.length))).toBeDefined()
  })

  it("renders library cards with names and authors", () => {
    render(<LibrariesList />)
    expect(screen.getByText("Aceternity UI")).toBeDefined()
    expect(screen.getByText("Kokonut UI")).toBeDefined()
  })

  it("renders grid view mode toggle buttons", () => {
    render(<LibrariesList />)
    const gridBtn = screen.getByTitle("Grid View")
    const listBtn = screen.getByTitle("List View")
    expect(gridBtn).toBeDefined()
    expect(listBtn).toBeDefined()
  })

  it("filters libraries by search query", () => {
    mockState.search = "Aceternity"
    render(<LibrariesList />)
    expect(screen.getByText("Aceternity UI")).toBeDefined()
    expect(screen.queryByText("Kokonut UI")).toBeNull()
  })

  it("shows empty state when no matches found", () => {
    mockState.search = "NonExistentLibraryXYZ123"
    render(<LibrariesList />)
    expect(screen.getByText("No libraries found")).toBeDefined()
  })
})

describe("LibraryCard", () => {
  const sampleLibrary = LIBRARIES_DATA[0]!

  it("renders library details in grid mode", () => {
    render(<LibraryCard library={sampleLibrary} viewMode="grid" />)
    expect(screen.getByText(sampleLibrary.name)).toBeDefined()
    expect(screen.getByText(sampleLibrary.author)).toBeDefined()
    expect(screen.getByText(sampleLibrary.componentsCount)).toBeDefined()
  })

  it("renders library details in list mode", () => {
    render(<LibraryCard library={sampleLibrary} viewMode="list" />)
    expect(screen.getByText(sampleLibrary.name)).toBeDefined()
    expect(screen.getByText(sampleLibrary.author)).toBeDefined()
    expect(screen.getByText(sampleLibrary.componentsCount)).toBeDefined()
  })

  it("handles copy install command", async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    })

    render(<LibraryCard library={sampleLibrary} viewMode="grid" />)
    const copyBtn = screen.getByRole("button")
    fireEvent.click(copyBtn)
    expect(writeTextMock).toHaveBeenCalledWith(
      expect.stringContaining("npx higherbits add"),
    )
  })
})
