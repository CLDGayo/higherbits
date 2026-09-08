import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Terms of Service – HigherBits.dev",
  description: "Terms of service for HigherBits.dev",
}

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-6 py-12 md:py-20">
        <article className="prose dark:prose-invert max-w-none">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground">
            Terms of Service
          </h1>

          <div className="text-sm text-muted-foreground mb-12">
            Last updated: 04/24/2025
          </div>

          <div className="space-y-16">
            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                1. Introduction
              </h2>
              <p className="text-muted-foreground leading-7">
                These Terms of Service ("Terms") govern your access to and use
                of HigherBits.dev ("we", "our", or "us"), operated by Higher Bits Labs Inc. By accessing or using HigherBits.dev, you agree to be bound
                by these Terms.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                2. Intellectual Property Rights
              </h2>
              <p className="text-muted-foreground leading-7">
                All code, content, and materials published on HigherBits.dev,
                including but not limited to components, documentation, metadata (such as names and descriptions), and all associated media assets (such as images, videos, and thumbnails), are the sole and exclusive property of their
                respective authors and HigherBits.dev. Users are granted access to
                view and use the content solely through the official HigherBits.dev
                platform in accordance with these Terms.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                3. Prohibited Activities
              </h2>
              <p className="text-muted-foreground mb-4 leading-7">
                Users are strictly prohibited from:
              </p>
              <ul className="list-none space-y-3 text-muted-foreground pl-6">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Scraping or automatically collecting data from HigherBits.dev
                    through web scraping, bots, crawlers, or any other automated
                    means without explicit written consent from HigherBits.dev
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Using any content, code, or data from HigherBits.dev to train
                    artificial intelligence models, machine learning systems, or
                    similar technologies without explicit written consent from
                    HigherBits.dev
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Redistributing, selling, or licensing any content from
                    HigherBits.dev without authorization
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Republishing or reusing media assets (such as images, GIFs, and video previews) or structured metadata (titles, descriptions, tags) from HigherBits.dev, including manual or automated means, without explicit written permission
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Copying and redistributing components originally published
                    on HigherBits.dev to other websites, social media platforms, or
                    any other medium without providing a clear and visible link
                    back to the original component page on HigherBits.dev
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Attempting to circumvent any technical measures implemented
                    to protect our content
                  </span>
                </li>
              </ul>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                4. DMCA & Copyright Infringement Policy
              </h2>
              <p className="text-muted-foreground mb-4 leading-7">
                HigherBits.dev respects the intellectual property rights of others and complies with the Digital Millennium Copyright Act (DMCA, 17 U.S.C. § 512). As an open platform and component registry, we respond expeditiously to legitimate notices of alleged copyright infringement.
              </p>
              <h3 className="text-lg font-medium mb-3 text-foreground">
                Filing a Takedown Notice
              </h3>
              <p className="text-muted-foreground mb-3 leading-7">
                If you are a copyright owner or authorized agent and believe content hosted on HigherBits.dev infringes your copyright, send a written Notice of Claimed Infringement to our designated agent at <span className="font-semibold text-foreground">support@higherbits.dev</span> with the subject line <span className="font-semibold text-foreground">"DMCA Takedown Notice"</span> containing:
              </p>
              <ul className="list-none space-y-2 text-muted-foreground pl-6 mb-4">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">A physical or electronic signature of a person authorized to act on behalf of the copyright owner.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Identification of the copyrighted work claimed to have been infringed, or a representative list of works.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Identification of the material claimed to be infringing, including the exact URL(s) on HigherBits.dev.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">Your contact information: full name, address, telephone number, and email address.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">A statement that you have a good faith belief that use of the material is not authorized by the copyright owner, its agent, or the law.</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">A statement under penalty of perjury that the information in the notification is accurate and you are authorized to act on behalf of the owner.</span>
                </li>
              </ul>
              <h3 className="text-lg font-medium mb-3 text-foreground">
                Counter-Notification & Repeat Infringers
              </h3>
              <p className="text-muted-foreground leading-7">
                If your content was removed and you believe this was due to mistake or misidentification, you may submit a counter-notification to the same email address meeting statutory DMCA requirements. In accordance with Section 512(i) of the DMCA, HigherBits.dev maintains a policy that provides for the termination in appropriate circumstances of user accounts who are repeat infringers.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                5. Enforcement
              </h2>
              <p className="text-muted-foreground mb-4 leading-7">
                We reserve the right to:
              </p>
              <ul className="list-none space-y-3 text-muted-foreground pl-6">
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Take appropriate legal action against violations of these
                    Terms
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Terminate or suspend access to our services for violations
                  </span>
                </li>
                <li className="flex items-start">
                  <span className="mr-3 text-primary">•</span>
                  <span className="leading-7">
                    Remove or disable access to any content that violates these
                    Terms
                  </span>
                </li>
              </ul>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                6. Changes to Terms
              </h2>
              <p className="text-muted-foreground leading-7">
                We reserve the right to modify these Terms at any time. Changes
                will be effective immediately upon posting on HigherBits.dev. Your
                continued use of the platform after changes constitutes
                acceptance of the modified Terms.
              </p>
            </section>

            <section className="group">
              <h2 className="text-2xl font-semibold tracking-tight mb-6 text-foreground group-hover:text-primary">
                7. Contact Information
              </h2>
              <p className="text-muted-foreground leading-7">
                For any questions regarding these Terms, please contact:
                <br />
                Higher Bits Labs Inc.
                <br />
                Samson St. Purok 3, Barangay 3,
                <br />
                San Francisco,
                <br />
                Agusan del Sur,
                <br />
                Philippines 8501
                <br />
                Phone: +81 070 8986 1692
                <br />
                Email: support@higherbits.dev
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  )
}
