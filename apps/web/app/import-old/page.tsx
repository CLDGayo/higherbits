import { SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs"
import { Metadata } from "next"
import { Suspense } from "react"
import { Header } from "@/components/ui/header.client"
import ImportPageClient from "./page.client"

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
