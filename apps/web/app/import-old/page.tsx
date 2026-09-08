import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import { Metadata } from "next"
import { Suspense } from "react"
import { Header } from "@/components/ui/header.client"
import ImportPageClient from "./page.client"

// INTENTIONALLY-UNLINKED INTERNAL ROUTE — reachable by direct URL only; deliberately
// absent from the main nav. Not orphaned by accident and not a candidate for removal.
// See process/features/supabase-interconnect/.../phase-04-navigation_PLAN_25-07-26.md (Step C1).

export const metadata: Metadata = {
  title: "Import Component | HigherBits.dev",
}

export default function ImportPage() {
  return (
    <>
      <SignedIn>
        <Suspense fallback={null}>
          <Header variant="publish" />
        </Suspense>
        <div className="flex flex-row items-center h-screen w-full">
          <ImportPageClient />
        </div>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
