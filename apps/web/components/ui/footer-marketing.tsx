import React from "react"
import Link from "next/link"
import { SignInButton } from "@clerk/nextjs"

import { cn } from "@/lib/utils"

/**
 * Phase 08 — the landing-only 4-column marketing footer.
 *
 * D-1 (locked at INNOVATE): a NEW file, deliberately not a `variant` prop on
 * `components/ui/footer.tsx`. That shared footer has 14 confirmed consumers
 * (13 routes + the landing page); branching it would put all 14 in the blast
 * radius of one UI change, and this program's two route-killing defects so far
 * both came from a shared choke point. `footer.tsx` stays byte-for-byte
 * untouched.
 *
 * Every link below points at a route or mechanism verified to exist. Two of
 * 21st.dev's own footer columns are deliberately ABSENT rather than faked:
 *   - "Icons"  — no icon-library route or feature exists in HigherBits at all.
 *   - "Themes" — `page.client.tsx`'s tab switch has no `case "themes":`;
 *                Creator Studio's `/studio/{username}/themes` is authenticated
 *                and user-scoped, not a public catalogue.
 * No X/Twitter link either — no HigherBits account is verified.
 *
 * Server component on purpose (same reasoning as the other landing sections);
 * Clerk's `SignInButton` carries its own client boundary. Nothing here reads a
 * browser global, so it cannot take the route down at SSR (program traps 5/10).
 *
 * `data-testid` is load-bearing: `"Product"` is a live substring of the hero's
 * "Production UI for developers and agencies", so the smoke test must scope its
 * column-header assertions to this subtree rather than search the whole page.
 */
const COLUMNS: {
  heading: string
  links: { label: string; href: string; external?: boolean }[]
}[] = [
  {
    heading: "Product",
    links: [
      { label: "Components", href: "/?tab=components" },
      { label: "Templates", href: "/?tab=templates" },
      { label: "Pricing", href: "/pricing" },
    ],
  },
  {
    heading: "Resources",
    links: [{ label: "Publish", href: "/publish" }],
  },
  {
    heading: "Company",
    links: [
      { label: "Our Story", href: "/our-story" },
      { label: "Contact", href: "mailto:support@higherbits.dev" },
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refunds" },
    ],
  },
  {
    heading: "Connect",
    links: [
      { label: "Discord", href: "https://discord.gg/Qx4rFunHfm", external: true },
      {
        label: "GitHub",
        href: "https://github.com/CLDGayo/higherbits",
        external: true,
      },
    ],
  },
]

const LINK_CLASS =
  "text-sm text-muted-foreground hover:text-foreground hover:underline underline-offset-4"

export function FooterMarketing({ className }: { className?: string }) {
  return (
    <footer
      data-testid="footer-marketing"
      className={cn("w-full border-t border-border/60 bg-background", className)}
    >
      <div className="container py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {column.heading}
              </h3>
              <nav className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={LINK_CLASS}
                    {...(link.external
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                  >
                    {link.label}
                  </Link>
                ))}
                {/*
                  Sign in is a Clerk modal trigger, not a route — the same
                  mechanism `landing-auth-modals.tsx` already uses. It lives
                  inside the Resources column, matching the capture.
                */}
                {column.heading === "Resources" ? (
                  <SignInButton mode="modal">
                    <button type="button" className={cn(LINK_CLASS, "text-left")}>
                      Sign in
                    </button>
                  </SignInButton>
                ) : null}
              </nav>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border/40 pt-6 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <span>Higher Bits Labs Inc.</span>
          <span className="text-[10px]">
            All product names, logos, and brands are property of their respective
            owners. Use of these names, logos, and brands does not imply
            endorsement.
          </span>
        </div>
      </div>
    </footer>
  )
}
