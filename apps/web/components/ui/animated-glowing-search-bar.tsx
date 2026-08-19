import React from "react"
import { Search } from "lucide-react"

export function AnimatedGlowingSearchBar() {
  return (
    <div className="relative w-full max-w-xl mx-auto group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-blue-600 rounded-full blur opacity-30 group-hover:opacity-70 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex items-center bg-background rounded-full border px-4 py-3 shadow-sm">
        <Search className="w-5 h-5 text-muted-foreground mr-3" />
        <input 
          type="text"
          placeholder="Search for components, templates, and more..."
          className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground"
        />
        <div className="flex items-center gap-1">
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
            <span className="text-xs">⌘</span>K
          </kbd>
        </div>
      </div>
    </div>
  )
}
