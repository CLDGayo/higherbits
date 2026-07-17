import React from "react"
import { Metadata } from "next"

import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { HeroSection } from "@/components/ui/hero-section"
import { NewsletterDialog } from "@/components/ui/newsletter-dialog"
import { HomePageClient } from "./page.client"
import { SITE_NAME, SITE_SLOGAN, BASE_KEYWORDS } from "@/lib/constants"
export const dynamic = "force-dynamic"

export const generateMetadata = async (): Promise<Metadata> => {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: `${SITE_NAME} - ${SITE_SLOGAN}`,
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL}/q/{search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    keywords: BASE_KEYWORDS,
  }

  return {
    title: `${SITE_NAME} – ${SITE_SLOGAN}`,
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
    keywords: [...BASE_KEYWORDS],
    openGraph: {
      title: `${SITE_NAME} - ${SITE_SLOGAN}`,
      description:
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
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
      title: `${SITE_NAME} - ${SITE_SLOGAN}`,
      description:
        "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
      images: [`${process.env.NEXT_PUBLIC_APP_URL}/og-image.png`],
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams

  // The marketing landing page owns the bare root URL; tabs opt into the browser.
  if (!tab) {
    return (
      <div className="min-h-screen flex flex-col bg-background min-w-0 overflow-x-hidden">
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <div className="flex flex-col min-w-0">
            <HeroSection />
          </div>
          <NewsletterDialog />
        </div>
        <Footer />
      </div>
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
