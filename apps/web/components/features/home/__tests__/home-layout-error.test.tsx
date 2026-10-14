// @vitest-environment jsdom
import React from "react"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const fixture = vi.hoisted(() => ({ popularError: false, popular: [] as unknown[] }))
vi.mock("@/lib/queries", () => ({
  useFeaturedDemos: () => ({ data: { data: [] }, isLoading: false, isError: false, refetch: vi.fn() }),
  useLatestDemos: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
  useMainDemosExcludingFeatured: () => ({ data: fixture.popular, isLoading: false, isError: fixture.popularError, refetch: vi.fn() }),
  useLeaderboardDemosForHome: () => ({ data: null, isLoading: false, roundId: null }),
  useTagDemos: () => ({ data: { data: [], total_count: 0 }, isLoading: false, isError: false, refetch: vi.fn() }),
  useCategoryTagCounts: () => ({ data: {}, isError: false, refetch: vi.fn() }),
}))
vi.mock("@/hooks/use-navigation", () => ({ useNavigation: () => ({ navigateToTab: vi.fn(), handleSortChange: vi.fn() }) }))
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock("@/lib/clerk", () => ({ useClerkSupabaseClient: () => ({ rpc: vi.fn() }) }))
vi.mock("@clerk/nextjs", () => ({ useUser: () => ({ user: null }) }))
vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData: vi.fn() }),
  useQuery: () => ({ data: [], isLoading: false, isError: false, refetch: vi.fn() }),
}))
vi.mock("../horizontal-slider", () => ({ HorizontalSlider: ({ title }: { title: string }) => <h2>{title}</h2> }))
vi.mock("../home-discovery-sections", () => ({
  Categories: () => null, CollectionsPreview: () => null, ComingSoon: () => null,
  LibraryPreview: () => null, TemplatesPreview: () => null,
}))

import { HomeTabLayout } from "../home-layout"

describe("Home feed transitions", () => {
  it("replaces a settled Popular row with retry on query error", () => {
    fixture.popularError = false
    const view = render(<HomeTabLayout />)
    expect(screen.getByRole("heading", { name: "Popular" })).toBeTruthy()
    fixture.popularError = true
    view.rerender(<HomeTabLayout />)
    expect(screen.getByRole("alert").textContent).toContain("Popular could not load")
  })
})
