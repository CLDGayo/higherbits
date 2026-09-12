"use client"

import { useEffect } from "react"
import Link from "next/link"
import { HigherBitsIcon } from "@/components/icons/higherbits-logo"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app/error] Unhandled route error:", error)
  }, [error])

  return (
    <main className="min-h-[80vh] w-full flex items-center justify-center p-4 sm:p-6 md:p-12">
      <div className="w-full max-w-lg bg-card text-card-foreground border border-border/60 rounded-cushion shadow-cushion p-6 sm:p-8 flex flex-col items-center text-center space-y-6">
        <div className="relative flex items-center justify-center size-16 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20">
          <HigherBitsIcon className="size-8 opacity-20 absolute" />
          <AlertTriangle className="size-7 relative z-10" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            An unexpected error occurred while loading this page. Your session and
            data remain safe. If you contact support, quote the reference ID below.
          </p>
        </div>

        {error.digest && (
          <div className="w-full py-2 px-3 bg-muted/60 border border-border/40 rounded-lg text-xs font-mono text-muted-foreground break-all select-all">
            <span className="opacity-70">Reference ID: </span>
            <span className="text-foreground">{error.digest}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full pt-2">
          <Button
            onClick={() => reset()}
            className="w-full sm:flex-1 gap-2 rounded-cushion"
          >
            <RefreshCw className="size-4" />
            Try again
          </Button>
          <Button
            asChild
            variant="outline"
            className="w-full sm:flex-1 gap-2 rounded-cushion"
          >
            <Link href="/">
              <Home className="size-4" />
              Return Home
            </Link>
          </Button>
        </div>
      </div>
    </main>
  )
}
