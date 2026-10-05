"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import PublishComponentForm from "@/components/features/publish/publish-layout"
import { LoadingSpinnerPage } from "@/components/ui/loading-spinner"

interface ComponentData {
  code: string
  tailwindConfig?: string | null
  globalCss?: string | null
  component: any
}

function AddDemoContent() {
  const searchParams = useSearchParams()
  const componentId = searchParams.get("componentId")
  const [componentData, setComponentData] = useState<ComponentData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchComponentData() {
      try {
        if (!componentId) {
          setError("No componentId provided")
          return
        }

        const componentIdNum = parseInt(componentId, 10)

        if (isNaN(componentIdNum)) {
          setError("Invalid component ID")
          return
        }

        // Owner-checked metadata and source come from one server snapshot.
        const sourceResponse = await fetch("/api/component-source/editor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ componentId: componentIdNum }),
        })

        if (!sourceResponse.ok) {
          console.error(
            "Failed to fetch component code:",
            sourceResponse.status,
          )
          setError(
            sourceResponse.status === 403
              ? "You do not have access to this component's code"
              : "Failed to fetch component code",
          )
          return
        }

        const source = await sourceResponse.json()
        const codeResult = { data: source.code, error: null }
        const tailwindConfigResult = { data: source.tailwindConfig, error: null }
        const globalCssResult = { data: source.globalCss, error: null }

        if (!codeResult.data) {
          console.error("Component code was empty")
          setError("Failed to fetch component code")
          return
        }

        setComponentData({
          code: codeResult.data!,
          tailwindConfig: tailwindConfigResult.data,
          globalCss: globalCssResult.data,
          component: {
            ...source.component,
            code: codeResult.data!,
          },
        })
      } catch (err) {
        console.error("Error fetching files:", err)
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setIsLoading(false)
      }
    }

    fetchComponentData()
  }, [componentId])

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <div className="text-red-500 text-lg font-medium">Error</div>
        <div className="text-muted-foreground">{error}</div>
      </div>
    )
  }

  if (isLoading || !componentData) {
    return <LoadingSpinnerPage size="lg" />
  }

  return (
    <PublishComponentForm
      mode="add-demo"
      existingComponent={componentData.component}
      initialStep="demoCode"
      initialCode={componentData.code}
      initialTailwindConfig={componentData.tailwindConfig}
      initialGlobalCss={componentData.globalCss}
    />
  )
}

export default function AddDemoPage() {
  return (
    <Suspense fallback={<LoadingSpinnerPage size="lg" />}>
      <AddDemoContent />
    </Suspense>
  )
}
