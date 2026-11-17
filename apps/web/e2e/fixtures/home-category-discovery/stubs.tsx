import * as React from "react"

// Only the category path, layout, carousel, and catalogue stay real in this
// fixture. These stubs remove unrelated auth, providers, and network clients.
export function Header() {
  return <header className="px-8 py-4">Synthetic fixture header</header>
}

export function Footer() {
  return <footer>Fixture footer</footer>
}

export const FooterMarketing = Footer
export const NewsletterDialog = () => null
export const JsonLd = () => null
export const HeroVisual = () => <div>Fixture hero</div>
export const FaqSection = () => <div>Fixture FAQ</div>
export const SocialProofCounter = () => <div>Fixture social proof</div>
export const CopyPromptSection = () => <div>Fixture prompt section</div>
export const AuthorsBand = () => <div>Fixture authors</div>
export const AgentsCtaBand = () => <div>Fixture agents CTA</div>
export const CatalogueRowSection = () => null
export const HomePageClient = () => <main>Synthetic catalogue browser</main>

export function ComponentCard({ demo, decorative }: { demo: { id: number; component: { name: string } }; decorative?: boolean }) {
  return (
    <article data-testid="synthetic-card" className="rounded-lg border p-4" aria-label={demo.component.name}>
      <a href={`/fixture-component/${demo.id}`} tabIndex={decorative ? -1 : undefined}>
        {demo.component.name}
      </a>
    </article>
  )
}

export function Button({ asChild, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }) {
  if (asChild) return <>{children}</>
  return <button {...props}>{children}</button>
}

export const Carousel = ({ children }: { children: React.ReactNode }) => <div>{children}</div>
export const CarouselContent = Carousel
export const CarouselItem = Carousel
export const ComponentCardSkeleton = () => <div>Loading fixture card</div>

export const SITE_NAME = "HigherBits fixture"
export const SITE_TITLE = "HigherBits fixture"
export const SITE_URL = "http://127.0.0.1:3217"
export const SITE_DESCRIPTION = "Isolated synthetic Home page fixture"
export const BASE_KEYWORDS: string[] = []
export const faqPageJsonLd = () => ({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [] })
export const unstable_cache = <T extends (...args: never[]) => unknown>(fn: T) => fn
export const supabaseWithAdminAccess = new Proxy({}, {
  get() { throw new Error("The isolated fixture must not access Supabase") },
})
