"use client"

import { useQuery } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type GitHubStarsProps = {
  className?: string
  repo?: string
}

const formatNumber = (num: number): string => {
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}k`.replace(".0k", "k")
  }
  return num.toString()
}

export function GitHubStarsBasic({
  className,
  repo = "CLDGayo/higherbits",
}: GitHubStarsProps) {
  const { data: stars, isLoading } = useQuery({
    queryKey: ["github-stars", repo],
    queryFn: async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
        const res = await fetch(`/api/github/stars?repo=${repo}`, {
          signal: controller.signal
        })
        clearTimeout(timeoutId)
        if (!res.ok) return 0
        const data = await res.json()
        return data.stars as number
      } catch (error) {
        return 0
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 0,
  })

  return (
    <span className={cn("inline-flex items-center", className)}>
      {isLoading ? <Skeleton className="h-5 w-8" /> : formatNumber(stars || 0)}
    </span>
  )
}
