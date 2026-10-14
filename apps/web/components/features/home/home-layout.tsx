"use client"

import {
  useFeaturedDemos,
  useMainDemosExcludingFeatured,
  useLatestDemos,
  useLeaderboardDemosForHome,
  useTagDemos,
  useCategoryTagCounts,
} from "@/lib/queries"
import { HorizontalSlider } from "./horizontal-slider"
import { Categories, CollectionsPreview, ComingSoon, LibraryPreview, TemplatesPreview } from "./home-discovery-sections"
import { DemoWithComponent, SortOption } from "@/types/global"
import { buildHomeSections, HomeSection } from "./home-sections"
import { useEffect, useState, useRef } from "react"
import { useNavigation } from "@/hooks/use-navigation"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { shouldHideLeaderboardRankings } from "@/lib/utils"
import { toast } from "sonner"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"
import { useQuery } from "@tanstack/react-query"

interface HomeTabLayoutProps {
  sortBy?: SortOption
}

type SliderGroup = HomeSection & {
  isLoading: boolean
  isError: boolean
  retry: () => void
  targetTab?: "components"
  viewAllUrl?: string
  isLeaderboard?: boolean
}

// Extended type to include leaderboard fields
type LeaderboardDemoWithComponent = DemoWithComponent & {
  global_rank?: number
  votes_count?: number
  has_voted?: boolean
}

// Helper to check if we need to randomize leaderboard
const shouldRandomizeLeaderboard = () => {
  const now = new Date()
  const day = now.getDay() // 0 is Sunday, 1 is Monday, etc.

  // Randomize on weekdays (Monday through Friday)
  // Same logic as shouldHideLeaderboardRankings but reversed
  return !(day === 0 || day === 6)
}

export function HomeTabLayout({ sortBy = "recommended" }: HomeTabLayoutProps) {
  const featuredDemosQuery = useFeaturedDemos()
  const popularDemosQuery = useMainDemosExcludingFeatured()
  const latestDemosQuery = useLatestDemos()
  const leaderboardDemosQuery = useLeaderboardDemosForHome()
  const router = useRouter()
  const supabase = useClerkSupabaseClient()
  const { user } = useUser()
  const queryClient = useQueryClient()
  const categoryCounts = useCategoryTagCounts()
  const heroes = useTagDemos("hero", "date", undefined, 12)
  const gradients = useTagDemos("gradients", "date", undefined, 12)
  const avatars = useTagDemos("avatars", "date", undefined, 12)
  const tabs = useTagDemos("tabs", "date", undefined, 12)
  const aiChats = useTagDemos("ai-chat", "date", undefined, 12)
  const collections = useQuery({
    queryKey: ["collections", "home"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_collections_v1", { p_offset: 0, p_limit: 12, p_include_private: false })
      if (error) throw error
      return data || []
    },
  })
  const templates = useQuery({
    queryKey: ["templates", "home"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_templates_v3", { p_offset: 0, p_limit: 3, p_include_private: false })
      if (error) throw error
      return data || []
    },
  })

  // Keep track of component order by ID
  const leaderboardItemOrderRef = useRef<number[]>([])

  // State to store the already randomized leaderboard items
  const [randomizedLeaderboardItems, setRandomizedLeaderboardItems] = useState<
    LeaderboardDemoWithComponent[]
  >([])

  // Add state to track if initial randomization is done
  const [isRandomizationDone, setIsRandomizationDone] = useState(false)

  // Process leaderboard data once when it arrives
  useEffect(() => {
    if (
      !leaderboardDemosQuery.data ||
      !Array.isArray(leaderboardDemosQuery.data)
    ) {
      setRandomizedLeaderboardItems([])
      return
    }

    // If we already have an order and randomization is done, maintain the order
    if (isRandomizationDone && leaderboardItemOrderRef.current.length > 0) {
      // Create a map for quick lookups
      const itemsMap = new Map(
        leaderboardDemosQuery.data.map((item) => [item.id, item]),
      )

      // Maintain the same order as before, but with updated data
      const orderedItems = leaderboardItemOrderRef.current
        .map((id) => itemsMap.get(id))
        .filter(Boolean) as LeaderboardDemoWithComponent[]

      // Add any new items that might not be in our order yet
      const existingIds = new Set(leaderboardItemOrderRef.current)
      const newItems = leaderboardDemosQuery.data.filter(
        (item) => !existingIds.has(item.id),
      ) as LeaderboardDemoWithComponent[]

      setRandomizedLeaderboardItems([...orderedItems, ...newItems])
      return
    }

    // Initial randomization
    if (shouldRandomizeLeaderboard()) {
      // Create a new array to avoid mutating the original
      const shuffled = [
        ...leaderboardDemosQuery.data,
      ] as LeaderboardDemoWithComponent[]

      // Fisher-Yates shuffle algorithm
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        const temp = shuffled[i]
        shuffled[i] = shuffled[j] as LeaderboardDemoWithComponent
        shuffled[j] = temp as LeaderboardDemoWithComponent
      }

      // Store the order of IDs for future reference
      leaderboardItemOrderRef.current = shuffled.map((item) => item.id)

      setRandomizedLeaderboardItems(shuffled)
    } else {
      // If not randomizing, still store the original order
      leaderboardItemOrderRef.current = leaderboardDemosQuery.data.map(
        (item) => item.id,
      )

      setRandomizedLeaderboardItems(
        leaderboardDemosQuery.data as LeaderboardDemoWithComponent[],
      )
    }

    // Mark randomization as done after initial load
    setIsRandomizationDone(true)
  }, [leaderboardDemosQuery.data, isRandomizationDone])

  const { navigateToTab, handleSortChange } = useNavigation()

  const sliderGroups = buildHomeSections({
      featured: featuredDemosQuery.data?.data || [],
      latest: latestDemosQuery.data || [],
      popular: popularDemosQuery.data || [],
    }).map((group): SliderGroup => ({
      ...group,
      isLoading:
        group.id === "featured"
          ? featuredDemosQuery.isLoading
          : group.id === "newest"
            ? latestDemosQuery.isLoading
            : popularDemosQuery.isLoading,
      isError: group.id === "featured" ? featuredDemosQuery.isError : group.id === "newest" ? latestDemosQuery.isError : popularDemosQuery.isError,
      retry: () => { void (group.id === "featured" ? featuredDemosQuery.refetch() : group.id === "newest" ? latestDemosQuery.refetch() : popularDemosQuery.refetch()) },
      targetTab: "components",
    }))

  const handleViewAll = (group: SliderGroup) => {
    if (group.viewAllUrl) {
      router.push(group.viewAllUrl)
    } else if (group.targetTab && group.targetSort) {
      handleSortChange(group.targetSort)
      navigateToTab(group.targetTab)
    }
  }

  // Handle voting for leaderboard items
  const handleVote = async (demoId: number) => {
    if (!user) {
      toast.error("You must be logged in to vote")
      return
    }

    if (!leaderboardDemosQuery.roundId) {
      toast.error("Could not determine current contest round")
      return
    }

    // Find the demo being voted on
    const demoIndex = randomizedLeaderboardItems.findIndex(
      (demo) => demo.id === demoId,
    )
    if (demoIndex === -1) return

    // Get the current vote state
    const currentItem = randomizedLeaderboardItems[demoIndex]
    if (!currentItem) return

    const currentVoteState = currentItem.has_voted || false

    // Apply optimistic update
    const updatedItems = [...randomizedLeaderboardItems]
    const updatedItem = {
      ...updatedItems[demoIndex],
    } as LeaderboardDemoWithComponent

    updatedItem.has_voted = !currentVoteState
    updatedItem.votes_count =
      (updatedItem.votes_count || 0) + (currentVoteState ? -1 : 1)
    updatedItems[demoIndex] = updatedItem

    setRandomizedLeaderboardItems(updatedItems)

    try {
      // Call the backend API
      const { data, error } = await supabase.rpc("hunt_toggle_demo_vote", {
        p_round_id: leaderboardDemosQuery.roundId,
        p_demo_id: demoId,
      })

      if (error) throw error

      toast.success(currentVoteState ? "Vote removed" : "Upvoted")

      // Custom update approach instead of invalidating query
      // This prevents full re-randomization
      queryClient.setQueryData(
        ["leaderboard-demos-home", leaderboardDemosQuery.roundId],
        (oldData: any) => {
          if (!oldData || !Array.isArray(oldData)) return oldData

          return oldData.map((item) => {
            if (item.id === demoId) {
              return {
                ...item,
                has_voted: !currentVoteState,
                votes_count:
                  (item.votes_count || 0) + (currentVoteState ? -1 : 1),
              }
            }
            return item
          })
        },
      )
    } catch (error) {
      console.error("Error toggling vote:", error)
      toast.error("Failed to update vote")

      // Revert the optimistic update on error
      setRandomizedLeaderboardItems([
        ...((leaderboardDemosQuery.data ||
          []) as LeaderboardDemoWithComponent[]),
      ])
    }
  }

  // Check if we need to hide rankings and votes
  const shouldHideRankings = shouldHideLeaderboardRankings()

  return (
    <div data-testid="home-discovery" className="mx-auto w-full min-w-0 max-w-[1680px] space-y-9 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
      <header className="border-b border-border pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Discover HigherBits</p><h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Find your next building block.</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Explore components, collections, and templates from the HigherBits catalog.</p></header>
      {["popular", "newest"].map((id) => sliderGroups.find((group) => group.id === id)).filter((group): group is SliderGroup => Boolean(group)).map((group) => (
        group.isError ? <p key={group.id} role="alert" className="text-sm">{group.title} could not load. <button type="button" className="underline" onClick={group.retry}>Retry</button></p> : <HorizontalSlider
          key={group.id}
          title={group.id === "newest" ? "New additions" : group.title}
          items={group.items || []}
          isLoading={group.isLoading}
          onViewAll={() => handleViewAll(group)}
          viewAllUrl={group.viewAllUrl}
          isLeaderboard={group.isLeaderboard}
          onVote={group.isLeaderboard ? handleVote : undefined}
        />
      ))}
      <Categories counts={categoryCounts.data} isError={categoryCounts.isError} retry={() => { void categoryCounts.refetch() }} />
      <CollectionsPreview collections={collections.data} isLoading={collections.isLoading} isError={collections.isError} retry={() => { void collections.refetch() }} />
      <LibraryPreview />
      {([ ["More heroes", heroes, "/s/hero"], ["Gradients", gradients, "/s/gradients"] ] as const).map(([title, query, href]) => <section key={title} aria-label={title}>{query.isError ? <p role="alert" className="text-sm">{title} could not load. <button type="button" className="underline" onClick={() => { void query.refetch() }}>Retry</button></p> : <HorizontalSlider title={title} items={query.data?.data} isLoading={query.isLoading} viewAllUrl={href} totalCount={query.data?.total_count} />}{title === "Gradients" && <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground"><span>Create a gradient</span><span className="rounded-full border border-border px-2 py-0.5 text-xs">Coming soon</span><span>Public creation is not available yet.</span></div>}</section>)}
      <TemplatesPreview templates={templates.data} isLoading={templates.isLoading} isError={templates.isError} retry={() => { void templates.refetch() }} />
      {sliderGroups.filter((group) => group.id === "featured").map((group) => group.isError ? <p key={group.id} role="alert" className="text-sm">Featured could not load. <button type="button" className="underline" onClick={group.retry}>Retry</button></p> : <HorizontalSlider key={group.id} title={group.title} items={group.items} isLoading={group.isLoading} onViewAll={() => handleViewAll(group)} />)}
      {([ ["Avatars", avatars, "/s/avatars"], ["Tabs", tabs, "/s/tabs"], ["AI Chats", aiChats, "/s/ai-chat"] ] as const).filter(([, query]) => query.isLoading || query.isError || Boolean(query.data?.data.length)).map(([title, query, href]) => <section key={title} aria-label={title}>{query.isError ? <p role="alert" className="text-sm">{title} could not load. <button type="button" className="underline" onClick={() => { void query.refetch() }}>Retry</button></p> : <HorizontalSlider title={title} items={query.data?.data} isLoading={query.isLoading} viewAllUrl={href} totalCount={query.data?.total_count} />}</section>)}
      <ComingSoon title="ASCII art" description="An ASCII art collection is planned for the catalog." />
      <section className="rounded-2xl border border-border bg-card/50 p-5 sm:p-6"><h2 className="text-lg font-semibold">Explore everything</h2><p className="mt-1 text-sm text-muted-foreground">Browse all public components or choose a category above.</p><Link href="/?tab=components" className="mt-3 inline-flex min-h-11 items-center text-sm font-medium underline focus-visible:ring-2 focus-visible:ring-ring">Browse all components</Link></section>
      <ComingSoon title="Recently viewed" description="Browsing history is not available yet. Explore the catalog to find components now." />
    </div>
  )
}
