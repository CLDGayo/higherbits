"use client"

import { useState, useEffect, useRef } from "react"
import { Hero } from "@/components/features/higherbits-mcp/hero"
import { HowItWorks } from "@/components/features/higherbits-mcp/how-it-works"
import { FAQ } from "@/components/features/higherbits-mcp/faq"
import { Footer } from "@/components/ui/footer"
import { SupportedEditors } from "@/components/features/higherbits-mcp/supported-editors"
import { Features } from "@/components/features/higherbits-mcp/features"
import { HigherBitsMcpHeader } from "@/components/features/higherbits-mcp/higherbits-mcp-header"

export function HigherBitsMcpPageClient() {
  const [isScrolled, setIsScrolled] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollElement = scrollRef.current

    const handleScroll = () => {
      if (scrollElement) {
        setIsScrolled(scrollElement.scrollTop > 30)
      }
    }

    if (scrollElement) {
      scrollElement.addEventListener("scroll", handleScroll)
      handleScroll()

      return () => {
        scrollElement.removeEventListener("scroll", handleScroll)
      }
    }
  }, [])

  return (
    <div
      ref={scrollRef}
      className="absolute inset-0 min-h-screen w-full overflow-auto bg-background text-foreground"
    >
      <HigherBitsMcpHeader isScrolled={isScrolled} />

      <main className="relative w-full">
        <Hero />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SupportedEditors />
          <Features />
          <HowItWorks />
          <FAQ />
        </div>
        <Footer isOpenSource={false} className="border-none" />
      </main>
    </div>
  )
}
