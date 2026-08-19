import React from "react"

export function Testimonials() {
  return (
    <section className="py-24 relative overflow-hidden bg-muted/30">
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex flex-col items-center justify-center text-center gap-4 mb-16">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Loved by Developers
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl">
            See what others are saying about our UI components.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stub for testimonial cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-6 rounded-2xl bg-background border shadow-sm flex flex-col gap-4">
              <p className="text-muted-foreground">
                "This library has completely transformed the way we build our frontend. Highly recommended!"
              </p>
              <div className="flex items-center gap-3 mt-4">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex flex-col">
                  <span className="font-semibold text-sm">Developer {i}</span>
                  <span className="text-xs text-muted-foreground">Frontend Engineer</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
