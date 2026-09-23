import { Metadata } from "next"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"
import { AppProviders } from "./providers"
import SessionRecorder from "./SessionRecorder"
import { ConsentBanner } from "@/components/analytics/consent-banner"
import { GoogleAnalyticsGate } from "@/components/analytics/google-analytics-gate"

import "./globals.css"
import {
  SITE_NAME,
  SITE_URL,
  SITE_SLOGAN,
  SITE_DESCRIPTION,
  BASE_KEYWORDS,
} from "@/lib/constants"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: `${SITE_NAME} - ${SITE_SLOGAN}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    SITE_DESCRIPTION,
  openGraph: {
    title: `${SITE_NAME} - ${SITE_SLOGAN}`,
    description:
      SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - ${SITE_SLOGAN}`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} - ${SITE_SLOGAN}`,
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
  },
  keywords: BASE_KEYWORDS,
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export default function RootLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  // Next 15's generated LayoutProps types parallel-route slots as required
  // React.ReactNode; marking `modal` optional made the layout fail to satisfy
  // that constraint. The slot is always supplied by the router.
  modal: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn("font-sans [scrollbar-gutter:stable]")}>
        <div className="h-full">
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            enableColorScheme={false}
          >
            <TooltipProvider>
              <AppProviders>
                <SessionRecorder />
                {children}
                {modal}
                <ConsentBanner />
              </AppProviders>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </div>
        {/* Google Analytics only mounts after an explicit Accept, and only when
            a measurement id is configured — there is no fallback id. */}
        <GoogleAnalyticsGate />
      </body>
    </html>
  )
}
