"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"
import { SandboxSkeleton } from "@/components/features/studio/sandbox/components/sandbox-skeleton"

const PageClient = dynamic(() => import("./page.client"), {
  ssr: false,
  loading: () => <SandboxSkeleton />,
})

export default function Page() {
  return (
    <Suspense fallback={<SandboxSkeleton />}>
      <PageClient />
    </Suspense>
  )
}
