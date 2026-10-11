"use client"

import Image from "next/image"
const features = [
  {
    title: "Search the catalogue",
    description:
      "Find matching components by describing the UI you need. Search returns catalogue metadata and does not spend a source-copy allowance.",
    image: "/features-1.svg",
  },
  {
    title: "Retrieve authorized source",
    description:
      "Ask your connected coding assistant to retrieve source for a matching component. Access is checked against your HigherBits account and copy allowance.",
    image: "/features-2.svg",
  },
  {
    title: "Keep attribution with source",
    description:
      "Source responses include the component files, dependencies, and the attribution or license notice needed to use the component.",
    image: "/features-3.svg",
  },
]

export function Features() {
  return (
    <section className="pt-24 pb-10 lg:pb-24 overflow-hidden relative">
      <div className="absolute inset-0 pointer-events-none bg-grid-white" />
      <div className="text-center">
        <h2 className="text-5xl sm:text-[3.9rem]/16 pb-2 font-bold tracking-tighter text-pretty bg-clip-text text-transparent bg-gradient-to-t from-foreground/70 to-foreground sm:text-balance">
          Powerful Features
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          Catalogue search and authorized source retrieval for your coding
          assistant
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 z-10">
        {features.map((feature, index) => (
          <div
            key={index}
            className="group relative rounded-lg border border-border bg-card/85 p-8 shadow-soft z-10 backdrop-blur-sm"
          >
            <div className="relative w-full">
              <div className="relative w-full aspect-[21/5]">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover object-left-top"
                />
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              {feature.title === "Enhance Existing UI"}
            </div>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
