import React from "react"
import { AnimatedGlowingSearchBar } from "./animated-glowing-search-bar"

export function HeroVisual() {
  return (
    <div className="w-full flex flex-col items-center justify-center py-12">
      <div className="relative w-full max-w-5xl aspect-video rounded-xl border bg-muted/20 shadow-2xl overflow-hidden flex flex-col items-center justify-center">
        {/* Placeholder for the complex hero interactive visual */}
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:32px_32px]" />
        <div className="z-10 flex flex-col items-center gap-8 w-full px-4">
          <AnimatedGlowingSearchBar />
          
          {/* The four "Widget N" placeholder tiles that used to sit here were
              removed: this is the site's only server-rendered surface, so
              placeholder copy was the text crawlers ingested. Drop a real
              visual in when one exists. */}
          <div
            aria-hidden
            className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-8"
          >
            <div className="h-24 rounded-lg bg-background border shadow-sm" />
            <div className="h-24 rounded-lg bg-background border shadow-sm" />
            <div className="h-24 rounded-lg bg-background border shadow-sm hidden md:block" />
            <div className="h-24 rounded-lg bg-background border shadow-sm hidden md:block" />
          </div>
        </div>
      </div>
    </div>
  )
}
