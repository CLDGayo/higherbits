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
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mt-8">
            <div className="h-24 rounded-lg bg-background border shadow-sm flex items-center justify-center text-xs text-muted-foreground">Widget 1</div>
            <div className="h-24 rounded-lg bg-background border shadow-sm flex items-center justify-center text-xs text-muted-foreground">Widget 2</div>
            <div className="h-24 rounded-lg bg-background border shadow-sm flex items-center justify-center text-xs text-muted-foreground hidden md:flex">Widget 3</div>
            <div className="h-24 rounded-lg bg-background border shadow-sm flex items-center justify-center text-xs text-muted-foreground hidden md:flex">Widget 4</div>
          </div>
        </div>
      </div>
    </div>
  )
}
