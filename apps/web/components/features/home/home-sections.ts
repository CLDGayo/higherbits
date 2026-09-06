import { DemoWithComponent, SortOption } from "@/types/global"

export interface HomeSection {
  id: "featured" | "newest" | "popular"
  title: string
  items: DemoWithComponent[]
  targetSort: SortOption
}

interface HomeSectionData {
  featured: DemoWithComponent[]
  latest: DemoWithComponent[]
  popular: DemoWithComponent[]
}

// Homepage rows represent independent browse criteria, not mutually-exclusive curation buckets.
export function buildHomeSections({
  featured,
  latest,
  popular,
}: HomeSectionData): HomeSection[] {
  return [
    {
      id: "featured",
      title: "Featured",
      items: featured,
      targetSort: "recommended",
    },
    {
      id: "newest",
      title: "Newest",
      items: latest,
      targetSort: "date",
    },
    {
      id: "popular",
      title: "Popular",
      items: popular,
      targetSort: "downloads",
    },
  ]
}
