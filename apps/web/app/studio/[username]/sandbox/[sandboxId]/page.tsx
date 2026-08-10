"use client"

import { SandboxHeader } from "@/components/features/studio/sandbox/components/sandbox-header"
import { ServerSandbox } from "@/components/features/studio/sandbox/hooks/use-sandbox"
import { ArrowRight } from "lucide-react"
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation"
import { useState } from "react"
import dynamic from "next/dynamic"
import { SandboxSkeleton } from "@/components/features/studio/sandbox/components/sandbox-skeleton"

const PageClient = dynamic(() => import("./page.client"), {
  ssr: false,
  loading: () => <SandboxSkeleton />,
})
export default function Page() {
  const searchParams = useSearchParams()
  const isEditMode = searchParams.get("mode") === "edit"

  return <PageClient isEditMode={isEditMode} />
}
