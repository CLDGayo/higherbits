import React from "react"
import Link from "next/link"
import { Hexagon } from "lucide-react"
import { SignInButton } from "@clerk/nextjs"

import { SITE_NAME } from "@/lib/constants"
import { cn } from "@/lib/utils"

/**
 * Section 11 — the landing-only marketing footer, rebuilt on the capture's
 * measured geometry (`references/21st.dev-capture_19-08-26/11-footer-cta/
 * 01-footer.webp`, 2880x1800 @ DPR 2, bottom-scrolled so shot device y maps to
 * absolute CSS y as `y/2 + 5390`).
 *
 * ── What the capture actually measures ────────────────────────────────────
 * Anchor: the full-bleed rule at shot device y 968 (peak luminance 30 against a
 * ground of 9) is the FAQ's own bottom border — absolute CSS y 5874. The page
 * ends at 6290, so the footer band is exactly 416 CSS tall.
 *
 *   band height        416   = 64 + (20 + 20 + 164) + 64 + 20 + 64
 *   padding            64/64 (rule -> first cap top 70 CSS, minus a 13px/20px
 *                      line box's 5.3 CSS cap inset = 64.7; bottom 63.6)
 *   column ink starts  CSS x 168, 477, 686, 895, 1104.5 -> rel 0, 308.5, 517.5,
 *                      726.5, 936 with a pitch of 209.2.  The capture's content
 *                      box is 168.5..1271.5 (1103 wide, macOS overlay
 *                      scrollbars); ours is 168.5..1256.5 (1088, max-w-6xl
 *                      px-8) -- the LEFT edges coincide and only the right is
 *                      15px short, which is the program's already-deferred
 *                      container-width item.  Fitting the same five START
 *                      positions inside 1088 gives col1 251, cols 152, gap 57
 *                      == 5fr + 4x3fr with gap-x-[57px] (max error 1.5 CSS).
 *   cap heights        19 device px for headings, links AND the brand line;
 *                      18 for the copyright.
 *   row pitch          72 device = 36 CSS  ==  leading-5 (20) + gap-4 (16)
 *   heading -> link 1  78 device = 39 CSS  ==  leading-5 (20) + gap-5 (20),
 *                      1 CSS proud of the capture; not worth a magic number.
 *   copyright block    64 CSS below the tallest column  ==  mt-16
 *
 * Font size comes from cap height, never from a nominal em ratio. This render
 * lays down ~1.5 device px of cap per CSS font-px at DPR 2 (measured here: our
 * previous 14px heading capped at exactly 21 device px). 19 / 1.5 = 12.7, so
 * 13px is the size that lands within half a device pixel; 12px would miss by a
 * full one.
 *
 * Weight is measured by stem width at a 50% crossing of a per-row MAX profile
 * (a per-row MEAN profile splits a `P` into bowl and stem and reads neither).
 * The capture's `P` stem is 3 device px in BOTH the headings and the links —
 * they are the same weight, and the headings read heavier only because they are
 * pure white (255,255,255) against the links' (150,149,154). So both carry
 * `font-medium` here and the headings are distinguished by colour alone. This
 * render measures 4 device px at font-semibold/14px, 3 at font-medium/13px and
 * 2 at font-normal/13px: semibold was a full device pixel too heavy and normal
 * one too light.
 *
 * ── Deliberate departures from the capture, all content not geometry ───────
 *   - No `border-t`. The rule at this boundary already exists: Section 10 gave
 *     `faq-section` a full-bleed `border-y`. Keeping the footer's own border
 *     rendered TWO adjacent 1px rules where the capture has exactly one.
 *   - "Icons" and "Themes" stay ABSENT rather than faked: no icon library
 *     exists, and `/studio/{username}/themes` is authenticated and user-scoped,
 *     not a public catalogue. The smoke test asserts their absence.
 *   - The trademark disclaimer has no counterpart in the capture but is real
 *     legal copy. It moved into the otherwise-empty first column: left on the
 *     copyright row it wraps to a second line and the band measures 436 rather
 *     than 416.
 *   - The brand column renders the `Hexagon` mark directly instead of `<Logo>`:
 *     `logo.tsx` is a `"use client"` component carrying Lottie, a portal and a
 *     brand-assets menu. This footer is a server component and stays one.
 *
 * `data-testid` is load-bearing: "Product" is a live substring of the hero's
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

/**
 * 13px/20px — the measured link size (`text-[13px]` sets no line-height, hence
 * the explicit `leading-5`). `font-medium` is measured, not decorative: the
 * capture's link stems are 3 device px at a 50% crossing, and this render puts
 * font-normal at 2 and font-medium at 3.
 */
const LINK_CLASS =
  "text-[13px] font-medium leading-5 text-muted-foreground hover:text-foreground hover:underline underline-offset-4"

export function FooterMarketing({ className }: { className?: string }) {
  return (
    <footer
      data-testid="footer-marketing"
      className={cn("w-full bg-background", className)}
    >
      <div className="mx-auto w-full max-w-6xl px-8 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-[5fr_repeat(4,3fr)] md:gap-x-10 lg:gap-x-[57px]">
          {/* Capture col 1: a 14px mark and the wordmark on one 20px line. */}
          <div className="col-span-2 flex flex-col gap-5 md:col-span-1">
            <div className="flex items-center gap-2">
              <Hexagon className="h-[14px] w-[14px] shrink-0 text-[#B19AEF]" />
              <span className="text-[13px] font-medium leading-5 text-muted-foreground">
                {SITE_NAME}
              </span>
            </div>
            {/*
              The trademark disclaimer has no counterpart in the capture. It
              lives here rather than on the copyright row because col 1 is
              otherwise empty below the wordmark — putting it on the copyright
              row wraps to a second line and makes the band 436 CSS tall
              against the capture's measured 416.

              No alpha modifier on the colour. At 11px this needs 4.5:1, and
              `/70` measured 2.95:1 in light — a `color-contrast` node axe
              reports on `/`. It passed in dark (4.60:1), which is exactly why
              it survived: a single-theme check would have called it clean.
              Full-opacity `--muted-foreground` is 5.38:1 light / 7.98:1 dark.
            */}
            <p className="text-[11px] leading-[18px] text-muted-foreground">
              All product names, logos, and brands are property of their
              respective owners. Use of these names, logos, and brands does not
              imply endorsement.
            </p>
          </div>

          {COLUMNS.map((column) => (
            <div key={column.heading} className="flex flex-col gap-5">
              <h3 className="text-[13px] font-medium leading-5 text-foreground">
                {column.heading}
              </h3>
              <nav className="flex flex-col gap-4">
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

        <div className="mt-16 text-[12px] leading-5 text-muted-foreground">
          © {new Date().getFullYear()} Higher Bits Labs Inc.
        </div>
      </div>
    </footer>
  )
}
