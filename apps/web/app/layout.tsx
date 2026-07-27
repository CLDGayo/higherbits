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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Suppress React DevTools and Clerk dev warnings
              const originalWarn = console.warn;
              const originalLog = console.log;
              const originalInfo = console.info;

              function suppressMessages(originalFn) {
                return function(...args) {
                  if (typeof args[0] === 'string' && (
                    args[0].includes('Clerk has been loaded with development keys') ||
                    args[0].includes('Download the React DevTools')
                  )) {
                    return;
                  }
                  originalFn.apply(console, args);
                };
              }

              console.warn = suppressMessages(originalWarn);
              console.log = suppressMessages(originalLog);
              console.info = suppressMessages(originalInfo);

              // Fix Radix UI handleScroll Node contains error when interacting with iframes
              if (typeof Node !== 'undefined' && Node.prototype && Node.prototype.contains) {
                const originalContains = Node.prototype.contains;
                Node.prototype.contains = function(node) {
                  if (node && !(node instanceof Node)) {
                    return false;
                  }
                  return originalContains.call(this, node);
                };
              }
            `,
          }}
        />
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
