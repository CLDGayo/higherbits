"use client"
import { PublishComponentPreview } from "@/components/features/publish/components/preview"

export function ThumbnailClient({
  code,
  demoCode,
  dependencies,
  registryDependencies,
  tailwindConfig,
  globalCss,
}: any) {
  return (
    <div style={{ width: "100vw", height: "100vh", overflow: "hidden", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <PublishComponentPreview
        code={code}
        demoCode={demoCode}
        dependencies={dependencies}
        registryDependencies={registryDependencies}
        tailwindConfig={tailwindConfig}
        globalCss={globalCss}
      />
    </div>
  )
}
