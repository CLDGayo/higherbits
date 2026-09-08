"use client"

import {
  useFeaturedDemos,
  useMainDemosExcludingFeatured,
  useLatestDemos,
  useLeaderboardDemosForHome,
} from "@/lib/queries"
import { HorizontalSlider } from "./horizontal-slider"
import { DemoWithComponent, SortOption } from "@/types/global"
import { buildHomeSections, HomeSection } from "./home-sections"
import { useMemo, useEffect, useState, useRef } from "react"
import { useNavigation } from "@/hooks/use-navigation"
import { useRouter } from "next/navigation"
import { shouldHideLeaderboardRankings } from "@/lib/utils"
import { toast } from "sonner"
import { useClerkSupabaseClient } from "@/lib/clerk"
import { useUser } from "@clerk/nextjs"
import { useQueryClient } from "@tanstack/react-query"

interface HomeTabLayoutProps {
  sortBy?: SortOption
}

type SliderGroup = HomeSection & {
  isLoading: boolean
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

  const sliderGroups = useMemo(() => {
    return buildHomeSections({
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
      targetTab: "components",
    }))
  }, [
    featuredDemosQuery.data,
    featuredDemosQuery.isLoading,
    popularDemosQuery.isLoading,
    latestDemosQuery.data,
    latestDemosQuery.isLoading,
    randomizedLeaderboardItems,
    leaderboardDemosQuery.isLoading,
  ])

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
    <div className="space-y-8">
      {sliderGroups.map((group) => (
        <HorizontalSlider
          key={group.id}
          title={group.title}
          items={group.items || []}
          isLoading={group.isLoading}
          onViewAll={() => handleViewAll(group)}
          viewAllUrl={group.viewAllUrl}
          isLeaderboard={group.isLeaderboard}
          onVote={group.isLeaderboard ? handleVote : undefined}
        />
      ))}
    </div>
  )
}
