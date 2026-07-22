import { Metadata } from "next"
import { Header } from "@/components/ui/header.client"
import { Footer } from "@/components/ui/footer"
import { FounderPhotos } from "./founder-photos"
import { LinkPreview } from "@/components/ui/link-preview"

export const metadata: Metadata = {
  title: "Our Story - HigherBits.dev",
  description: "The story behind HigherBits.dev and how it all began",
}

export default function OurStoryPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="container mx-auto max-w-6xl py-6 px-4 sm:py-16 pt-20 sm:px-8">
          <div className="relative mb-16">
            {/* Notion-style page title with emoji */}
            <div className="pt-40 flex items-center gap-3">
              <h1 className="text-2xl sm:text-[36px] leading-tight font-bold space-y-10">
                Our Story
              </h1>
            </div>

            {/* Notion-style content layout */}
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
              {/* Main content */}
              <div className="flex-1 space-y-6">
                <div className="prose prose-quoteless prose-neutral dark:prose-invert">
                  <div className="text-2xl sm:text-[36px] leading-tight font-bold text-muted-foreground space-y-10">
                    <p>
                      I'm{" "}
                      <LinkPreview
                        url="https://clarence.gayo-sphere.cloud"
                        isStatic={true}
                        imageSrc="/story/clarence.png"
                        className="text-foreground font-bold"
                      >
                        Clarence
                      </LinkPreview>
                      , and I started{" "}
                      <LinkPreview
                        url="https://higherbits.dev/"
                        isStatic={true}
                        imageSrc="/story/higherbits-dev.png"
                        className="text-foreground font-bold"
                      >
                        HigherBits.dev
                      </LinkPreview>{" "}
                      because I'm a fan of{" "}
                      <LinkPreview
                        url="https://21st.dev/"
                        isStatic={true}
                        imageSrc="/story/21st-dev.png"
                        className="text-foreground font-bold"
                      >
                        21st.dev
                      </LinkPreview>{" "}
                      and, at heart, a <span className="text-foreground">vibe coder</span>.
                    </p>

                    <p>
                      At first, thanks to{" "}
                      <LinkPreview
                        url="https://aiautomation.ph/"
                        isStatic={true}
                        imageSrc="/story/kuys-rj.png"
                        className="text-foreground font-bold"
                      >
                        "Kuys RJ"
                      </LinkPreview>{" "}
                      and his{" "}
                      <LinkPreview
                        url="https://www.facebook.com/groups/1506890286852088"
                        isStatic={true}
                        imageSrc="/story/tech-va-community.png"
                        className="text-foreground font-bold"
                      >
                        Tech VA Community
                      </LinkPreview>{" "}
                      (now the{" "}
                      <LinkPreview
                        url="https://learn.taraai.ph/"
                        isStatic={true}
                        imageSrc="/story/tara-ai.png"
                        className="text-foreground font-bold"
                      >
                        TARA AI
                      </LinkPreview>
                      ), I was able to create my very first web portfolio using Lovable.dev. Eventually, I upgraded to a Claude Pro subscription to push my development further. But over time, I noticed the generic outputs coming from standard AI tools were just a bit too plain—what the community calls <span className="text-foreground">"AI slop."</span> I needed better UI.
                    </p>

                    <p>
                      I started searching the web for inspiration, taking screenshots of beautiful designs to feed back into Claude. Then, during a random scroll on Facebook, I stumbled across a post about{" "}
                      <LinkPreview
                        url="https://21st.dev/"
                        isStatic={true}
                        imageSrc="/story/21st-dev.png"
                        className="text-foreground font-bold"
                      >
                        21st.dev
                      </LinkPreview>
                      . I was truly amazed by its vast component library and modern aesthetic.
                    </p>

                    <p>
                      Around the same time, I discovered other incredible libraries like{" "}
                      <LinkPreview
                        url="https://aceternity.com"
                        className="text-foreground font-bold"
                      >
                        Aceternity
                      </LinkPreview>
                      ,{" "}
                      <LinkPreview
                        url="https://reactbits.dev/"
                        isStatic={true}
                        imageSrc="/story/reactbits-dev.png"
                        className="text-foreground font-bold"
                      >
                        ReactBits.dev
                      </LinkPreview>
                      , and{" "}
                      <LinkPreview
                        url="https://motionsites.ai"
                        className="text-foreground font-bold"
                      >
                        MotionSites.ai
                      </LinkPreview>
                      . They were beautiful—but scattered across different
                      sites, hard to find, and easy to miss.
                    </p>

                    <p>
                      More importantly, as I was studying{" "}
                      <LinkPreview
                        url="https://www.gohighlevel.com/"
                        isStatic={true}
                        imageSrc="/story/gohighlevel.png"
                        className="text-foreground font-bold"
                      >
                        GoHighLevel
                      </LinkPreview>{" "}
                      funnel building, I realized a major roadblock: none of these amazing React-based components were natively compatible with GoHighLevel's JavaScript code blocks.
                    </p>

                    <p>
                      I thought: <span className="text-foreground">what if there was a place where agencies, business owners, and my fellow Technical Virtual Assistants could access premium UI components specifically engineered for GoHighLevel alongside modern web frameworks?</span>
                    </p>

                    <p>
                      That idea became the seed for{" "}
                      <LinkPreview
                        url="https://higherbits.dev/"
                        isStatic={true}
                        imageSrc="/story/higherbits-dev.png"
                        className="text-foreground font-bold"
                      >
                        HigherBits.dev
                      </LinkPreview>
                      .
                    </p>

                    <p>
                      I decided to fork the open-source{" "}
                      <LinkPreview
                        url="https://21st.dev/"
                        isStatic={true}
                        imageSrc="/story/21st-dev.png"
                        className="text-foreground font-bold"
                      >
                        21st.dev
                      </LinkPreview>{" "}
                      repository to build my own vision. I started building the first version alongside my partner,{" "}
                      <LinkPreview
                        url="https://gwyneth.gayo-sphere.cloud"
                        isStatic={true}
                        imageSrc="/story/gwyneth.png"
                        className="text-foreground font-bold"
                      >
                        Gwyneth Sarigumba
                      </LinkPreview>
                      . She helped me curate the initial components and design our first GoHighLevel funnel templates, and together, we keep building and refining the platform.
                    </p>

                    <p>
                      We're building <span className="text-foreground">the best way to discover UI components</span>, and{" "}
                      <LinkPreview
                        url="https://higherbits.dev/"
                        isStatic={true}
                        imageSrc="/story/higherbits-dev.png"
                        className="text-foreground font-bold"
                      >
                        HigherBits.dev
                      </LinkPreview>{" "}
                      is the home to share and evolve them.
                    </p>

                    <p>
                      For <span className="text-foreground">vibe coders</span>. For <span className="text-foreground">design engineers</span>. For <span className="text-foreground">Technical Virtual Assistants</span>.<br />
                      For anyone shaping the web.
                    </p>

                    <p>And we're just getting started.</p>
                  </div>
                </div>
              </div>

              {/* Founder photos component */}
              <div className="lg:w-[350px] hidden lg:block lg:min-h-screen pt-40 ">
                <FounderPhotos />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
