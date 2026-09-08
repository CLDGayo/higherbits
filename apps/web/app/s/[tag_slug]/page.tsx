import { Metadata } from "next"
import { redirect } from "next/navigation"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import { TagPageContent } from "./page.client"
import { SortOption } from "@/types/global"
import { cookies } from "next/headers"
import { validateRouteParams } from "@/lib/utils/validateRouteParams"
import { unstable_cache } from "next/cache"
import { BASE_KEYWORDS, SITE_TITLE } from "@/lib/constants"
import { JsonLd } from "@/components/seo/json-ld"

interface TagPageProps {
  params: Promise<{
    tag_slug: string
  }>
}

const getCachedTagInfo = unstable_cache(
  async (tagSlug: string) => {
    const { data, error } = await supabaseWithAdminAccess
      .from("tags")
      .select("*")
      .eq("slug", tagSlug)
      .single()

    if (error) {
      throw error
    }

    return data
  },
  ["tag-info"],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ["tag-info"],
  },
)

async function getTagInfo(tagSlug: string) {
  return getCachedTagInfo(tagSlug)
}

/**
 * `mainEntity` is deliberately absent.
 *
 * It used to carry an ItemList whose `itemListElement` was a bare string, which
 * is invalid - the property takes an array of ListItem. That went unnoticed
 * because the markup was inert: it was emitted through `metadata.other`, which
 * only ever produces a `<meta>` tag, never a script.
 *
 * It is not repaired in place, because a CollectionPage's ItemList must describe
 * items the reader can actually see, and this route still fetches its component
 * list after hydration - so any list here would document content missing from
 * the HTML. That is the same policy problem `lib/seo/faq.ts` exists to make
 * impossible. Add the ItemList when the visible list is server-rendered, built
 * from that same data rather than a second source.
 */
const tagJsonLd = (tagName: string, tagSlug: string) => ({
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: `${tagName} Components | ${SITE_TITLE}`,
  description: `Ready-to-use ${tagName.toLowerCase()} React components inspired by shadcn/ui.`,
  url: `${process.env.NEXT_PUBLIC_APP_URL}/s/${tagSlug}`,
})

export default async function TagPage(props: TagPageProps) {
  const params = await props.params
  if (!validateRouteParams(params)) {
    redirect("/")
  }

  const cookieStore = await cookies()
  const tagSlug = params.tag_slug

  try {
    const tagInfo = await getTagInfo(tagSlug)
    if (!tagInfo) {
      redirect("/")
    }

    const savedSortBy = cookieStore.get("saved_sort_by")?.value as
      | SortOption
      | undefined

    const defaultSortBy: SortOption = "recommended"
    const sortByPreference: SortOption = savedSortBy?.length
      ? (savedSortBy as SortOption)
      : defaultSortBy

    return (
      <div className="min-h-screen flex flex-col">
        <JsonLd data={tagJsonLd(tagInfo.name, tagSlug)} />
        <Header />
        <div className="flex-1">
          <TagPageContent
            tagName={tagInfo.name}
            tagSlug={tagSlug}
            initialSortBy={sortByPreference}
          />
        </div>
        <Footer />
      </div>
    )
  } catch (error) {
    console.error("Error in tag page:", error)
    redirect("/")
  }
}

export async function generateMetadata(props: TagPageProps): Promise<Metadata> {
  const params = await props.params
  try {
    const tagInfo = await getTagInfo(params.tag_slug)
    if (!tagInfo) {
      redirect("/")
    }

    return {
      title: `${tagInfo.name} Components`,
      description: `Discover and share ${tagInfo.name.toLowerCase()} components. Ready-to-use React Tailwind components inspired by shadcn/ui.`,
      openGraph: {
          title: `${tagInfo.name} Components | ${SITE_TITLE}`,
        description: `Ready-to-use ${tagInfo.name.toLowerCase()} React Tailwind components inspired by shadcn/ui.`,
      },
      keywords: [
        `${tagInfo.name.toLowerCase()} components`,
        `${tagInfo.name.toLowerCase()} shadcn/ui`,
        `${tagInfo.name.toLowerCase()}`,
        ...BASE_KEYWORDS,
      ],
    }
  } catch (error) {
    redirect("/")
  }
}
