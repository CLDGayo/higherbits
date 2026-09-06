"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

interface FooterProps {
  className?: string
  isOpenSource?: boolean
}

export function Footer({ className, isOpenSource = true }: FooterProps) {
  return (
    <footer className={cn("bg-background p-4", className)}>
      <div className="grid gap-4 bg-card text-card-foreground border border-border/60 rounded-cushion shadow-cushion p-8 mx-auto w-full max-w-[3680px]">
        {isOpenSource && (
          <div className="flex md:hidden items-center justify-center pt-4 text-center">
            <span className="text-sm text-muted-foreground">
              The source code is available on{" "}
              <Link
                href="https://github.com/CLDGayo/higherbits"
                target="_blank"
                className="font-medium underline-offset-4 hover:underline"
              >
                GitHub
              </Link>
            </span>
          </div>
        )}
        <div className="flex flex-row h-auto pb-4 mt-2 sm:mt-0 gap-4 text-center items-center justify-between md:h-12 md:py-0">
          <div className="flex items-center text-sm text-muted-foreground">
            Higher Bits Labs Inc.
          </div>
          <div className="hidden md:flex md:items-center md:gap-1 md:text-sm md:text-muted-foreground">
            {isOpenSource && (
              <span className="flex items-center gap-1 whitespace-nowrap">
                The source code is available on{" "}
                <Link
                  href="https://github.com/CLDGayo/higherbits"
                  target="_blank"
                  className="font-medium underline-offset-4 hover:underline"
                >
                  GitHub
                </Link>
              </span>
            )}
          </div>
          <nav className="flex flex-wrap items-center justify-end gap-2 md:gap-4">
            <Link
              href="/our-story"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Our Story
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Privacy
            </Link>
            <Link
              href="/refunds"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Refunds
            </Link>
            <Link
              href="mailto:support@higherbits.dev"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Contact
            </Link>
            <Link
              href="https://discord.gg/Qx4rFunHfm"
              target="_blank"
              className="text-sm text-muted-foreground hover:underline underline-offset-4"
            >
              Discord
            </Link>
          </nav>
        </div>
        {/*
          Full `text-muted-foreground`, not `/60` (Phase 11, §8.3). The token is
          already the app's low-emphasis colour; fading it a further 40% took
          this line to 2.36:1 in light and 3.51:1 in dark, against AA's 4.5:1 -
          and it appears on every page, so it was 14 of the 65 contrast
          failures and the only dark-mode ones. At full strength it measures
          4.77:1 light and 7.15:1 dark. The 10px size already carries the
          de-emphasis this needed.
        */}
        <div className="text-center md:text-left text-[10px] text-muted-foreground border-t border-border/40 pt-4 mt-2">
          All product names, logos, and brands are property of their respective owners. Use of these names, logos, and brands does not imply endorsement.
        </div>
      </div>
    </footer>
  )
}
