import { GoogleAnalytics } from "@next/third-parties/google"
import { Metadata } from "next"

import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ThemeProvider } from "next-themes"
import { cn } from "@/lib/utils"
import { AppProviders } from "./providers"
import SessionRecorder from "./SessionRecorder"

import "./globals.css"
import { SITE_NAME, SITE_SLOGAN, BASE_KEYWORDS } from "@/lib/constants"

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  ),
  title: {
    default: `${SITE_NAME} - ${SITE_SLOGAN}`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
  openGraph: {
    title: `${SITE_NAME} - ${SITE_SLOGAN}`,
    description:
      "Ship polished UIs faster with ready-to-use React Tailwind components inspired by shadcn/ui.",
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
}: {
  children: React.ReactNode
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
              </AppProviders>
            </TooltipProvider>
            <Toaster />
          </ThemeProvider>
        </div>
      </body>
      <GoogleAnalytics gaId="G-X7C2K3V7GX" />
    </html>
  )
}
