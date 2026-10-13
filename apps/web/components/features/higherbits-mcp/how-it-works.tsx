"use client"

const steps = [
  {
    title: "Describe Your Vision",
    description:
      "Ask your MCP-compatible coding assistant to search the HigherBits.dev catalog for a component that fits your project.",
    number: "01",
  },
  {
    title: "Choose from Options",
    description:
      "Review matching components, then retrieve the source for the one you want to use.",
    number: "02",
  },
  {
    title: "Instant Integration",
    description:
      "Use the retrieved source in your project. Your coding assistant can adapt it to your app and workflow.",
    number: "03",
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
          Create beautiful UI components in three simple steps
        </p>
      </div>

      <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((step, index) => (
          <div
            key={index}
            className="group relative rounded-lg border border-border bg-card/85 p-8 shadow-soft"
          >
            <div className="relative w-full">
              <div className="relative flex items-center w-full aspect-[21/5]">
                <span
                  aria-hidden="true"
                  className="text-5xl font-bold tracking-tighter text-foreground/70"
                >
                  {step.number}
                </span>
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
