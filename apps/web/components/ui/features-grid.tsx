import React from "react"

export function FeaturesGrid() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Features
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
            Everything you need to build sophisticated UIs.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Stub for feature cards */}
          <div className="p-6 rounded-2xl bg-muted/50 border flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 mb-2" />
            <h3 className="text-xl font-semibold">Premium Components</h3>
            <p className="text-muted-foreground">Copy and paste beautiful, accessible components.</p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/50 border flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 mb-2" />
            <h3 className="text-xl font-semibold">Modern Design</h3>
            <p className="text-muted-foreground">Built with Tailwind CSS and Radix UI primitives.</p>
          </div>
          <div className="p-6 rounded-2xl bg-muted/50 border flex flex-col gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 mb-2" />
            <h3 className="text-xl font-semibold">Fully Customizable</h3>
            <p className="text-muted-foreground">Easily adapt themes and layouts to match your brand.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
