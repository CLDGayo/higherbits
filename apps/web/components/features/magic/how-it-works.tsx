"use client"

import Image from "next/image"

const steps = [
  {
    title: "Search components",
    description:
      "Ask your connected coding assistant to search the HigherBits catalogue for a component by describing what you need.",
    image: "/how-it-works-1.png",
  },
  {
    title: "Review matches",
    description:
      "The MCP server returns matching component names and descriptions. Your assistant can show those results so you can choose one.",
    image: "/how-it-works-3.png",
  },
  {
    title: "Retrieve source",
    description:
      "Request the chosen component's source separately. HigherBits checks your account's access and copy allowance, then returns files with attribution details.",
    image: "/how-it-works-2.png",
  },
]

export function HowItWorks() {
  return (
    <section className="pt-10 pb-10 lg:pb-24 overflow-hidden">
      <div className="text-center">
        <h2 className="text-5xl sm:text-[3.9rem]/16 pb-2 font-bold tracking-tighter text-pretty bg-clip-text text-transparent bg-gradient-to-t from-foreground/70 to-foreground sm:text-balance">
          How It Works
        </h2>
        <p className="mt-4 text-lg text-muted-foreground">
          HigherBits AI provides catalogue search and authorized source through
          HigherBits MCP
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group relative rounded-lg border border-border bg-card/85 p-8 shadow-soft"
          >
            <div className="relative w-full">
              <div className="relative w-full aspect-[21/5]">
                <Image
                  src={step.image}
                  alt={step.title}
                  fill
                  className="object-cover object-left-top"
                />
              </div>
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              {step.title}
            </h3>
            <p className="mt-2 text-muted-foreground leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
