import React from "react"
import { Metadata } from "next"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { FooterMarketing } from "@/components/ui/footer-marketing"
import { LandingPageLayout } from "@/components/ui/landing-page-layout"
import { NewsletterDialog } from "@/components/ui/newsletter-dialog"
import { HomePageClient } from "./page.client"
import { JsonLd } from "@/components/seo/json-ld"
import type { CatalogueEntry } from "@/components/ui/component-catalogue"
import { faqPageJsonLd } from "@/lib/seo/faq"
import { supabaseWithAdminAccess } from "@/lib/supabase"
import {
  getCatalogueChipPool,
  getLandingCatalogueRows,
} from "@/lib/landing-catalogue-rows"
import { getCachedFeaturedExample } from "@/lib/landing-featured-example"
import { getCachedLandingAuthors } from "@/lib/landing-authors"
import { unstable_cache } from "next/cache"
import {
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  SITE_DESCRIPTION,
  BASE_KEYWORDS,
} from "@/lib/constants"
export const dynamic = "force-dynamic"

/**
 * The catalogue rendered into the landing page's HTML.
 *
 * Cached rather than queried per request: the route is `force-dynamic` (it reads
 * `searchParams`), so without this every crawler hit would run the query afresh.
 */
const getCachedCatalogue = unstable_cache(
  async (): Promise<CatalogueEntry[]> => {
    const { data } = await supabaseWithAdminAccess
      .from("components")
      .select(
        "name, description, component_slug, users!components_user_id_fkey(username)",
      )
      .eq("is_public", true)
      .order("likes_count", { ascending: false })
      .limit(48)

    return (data ?? [])
      .filter((row) => row.users?.username)
      .map((row) => ({
        name: row.name,
        description: row.description,
        component_slug: row.component_slug,
        username: row.users!.username as string,
      }))
  },
  ["landing-catalogue"],
  { revalidate: 300, tags: ["landing-catalogue"] },
)


export const generateMetadata = async ({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}): Promise<Metadata> => {
  const { tab } = await searchParams

  // `/templates` now 308-redirects here (Phase 04 decision B2). A redirect body is
  // never served, so the retired route's SEO metadata is re-hosted on this branch.
  if (tab === "templates") {
    const templatesTitle = `shadcn/ui Templates Collection | ${SITE_NAME}`
    const templatesDescription =
      "Collection of crafted website templates built with shadcn/ui components, Framer Motion animations and Tailwind CSS by design engineers."

    return {
      title: { absolute: templatesTitle },
      description: templatesDescription,
      openGraph: {
        title: templatesTitle,
        description: templatesDescription,
        type: "website",
      },
      keywords: [
        ...BASE_KEYWORDS,
        "website templates",
        "shadcn templates",
        "shadcn/ui templates",
        "shadcn/ui",
        "Framer Motion",
        "Tailwind CSS",
        "React components",
      ],
    }
  }

  return {
    title: { absolute: SITE_TITLE },
    description:
      SITE_DESCRIPTION,
    keywords: [...BASE_KEYWORDS],
    openGraph: {
      title: SITE_TITLE,
      description:
        SITE_DESCRIPTION,
      images: [
        {
          url: `${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description:
        SITE_DESCRIPTION,
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
    },
  }
}

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || SITE_URL

/**
 * WebSite + SoftwareApplication + FAQPage.
 *
 * These used to be handed to `metadata.other["script:ld+json"]`, which renders a
 * `<meta name="script:ld+json">` and nothing else - so the site shipped zero
 * `<script type="application/ld+json">` tags and no parser ever read them.
 */
const homeJsonLd = () => [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/q/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    keywords: BASE_KEYWORDS,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: SITE_NAME,
    url: siteUrl,
    applicationCategory: "DeveloperApplication",
    operatingSystem: "Web",
    description: SITE_DESCRIPTION,
    offers: { "@type": "Offer", priceCurrency: "USD", price: "0" },
    publisher: { "@type": "Organization", name: "Higher Bits Labs Inc." },
  },
  faqPageJsonLd(),
]

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams

  // The marketing landing page owns the bare root URL; tabs opt into the browser.
  if (!tab) {
    const components = await getCachedCatalogue()
    const { mostLoved, newest } = await getLandingCatalogueRows()
    const cataloguePool = await getCatalogueChipPool()
    const featured = await getCachedFeaturedExample()
    const authors = await getCachedLandingAuthors()

    return (
      <>
        {/* The landing branch shipped without a Header, so `/` had no nav, no
            Log in / Sign up, and no way to reach <LandingAuthModals> — which is
            mounted inside the header. LandingPageLayout's pt-24 was reserving
            space for a header that never rendered. */}
        <Header variant="default" transparentAtTop />
        <div className="min-h-screen flex flex-col bg-background min-w-0 overflow-x-hidden">
          {homeJsonLd().map((data) => (
            <JsonLd key={String(data["@type"])} data={data} />
          ))}
          <div className="flex-1 flex flex-col gap-6 min-w-0">
            <div className="flex flex-col min-w-0">
              <LandingPageLayout
                components={components}
                mostLoved={mostLoved}
                cataloguePool={cataloguePool}
                newest={newest}
                featured={featured}
                authors={authors}
              />
            </div>
            <NewsletterDialog />
          </div>
          {/*
            Phase 08 (D-1): the landing branch renders the new 4-column
            marketing footer. The tab branch below deliberately keeps the
            shared <Footer />, which stays byte-for-byte untouched along with
            its 13 other route consumers.
          */}
          <FooterMarketing />
        </div>
      </>
    )
  }

  return (
    <>
      <Header variant="default" />
      <div className="min-h-screen flex flex-col bg-background min-w-0 overflow-x-hidden">
        <div className="flex-1 flex flex-col gap-6 pt-24 min-w-0">
          <div className="relative min-w-0 px-4 md:px-8">
            <HomePageClient />
            <NewsletterDialog />
          </div>
        </div>
        <Footer />
      </div>
    </>
  )
}
