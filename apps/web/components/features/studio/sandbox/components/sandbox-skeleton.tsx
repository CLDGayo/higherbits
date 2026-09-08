import { Skeleton } from "@/components/ui/skeleton"

export type SandboxConnectionPhase = "connecting" | "starting-dev-server"

const PHASE_COPY: Record<SandboxConnectionPhase, string> = {
  connecting: "Connecting to sandbox\u2026",
  "starting-dev-server":
    "Starting dev server \u2014 this can take a moment on a hibernated draft\u2026",
}

// `phase` is optional so the route-level / Suspense fallbacks, which have no
// hook state to read, keep rendering the original copy-free skeleton.
export function SandboxSkeleton({ phase }: { phase?: SandboxConnectionPhase }) {
  return (
    <div className="h-[calc(100vh-56px)] w-full flex flex-col bg-background">
      {phase ? (
        <div className="px-4 py-2 text-sm text-muted-foreground border-b border-border">
          {PHASE_COPY[phase]}
        </div>
      ) : null}
      <div className="flex flex-1 min-h-0">
        <div className="w-[20%] p-2 space-y-2 overflow-hidden">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-full" />
          <div className="pl-4 space-y-2">
            <Skeleton className="h-6 w-5/6" />
            <Skeleton className="h-6 w-1/2" />
          </div>
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-6 w-full" />
        </div>

        <div className="w-[1px] bg-border cursor-col-resize flex-shrink-0"></div>

        <div className="w-[40%] flex flex-col overflow-hidden">
          <div className="flex-1 p-4 space-y-2 overflow-y-auto">
            {[85, 72, 95, 78, 90, 82, 70, 88, 76, 93, 80, 74, 91, 86, 77].map((w, i) => (
              <Skeleton
                key={i}
                className="h-4"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>
        </div>

        <div className="w-[1px] bg-border cursor-col-resize flex-shrink-0"></div>

        <div className="w-[40%] bg-muted/30 flex flex-col justify-center p-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-8 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          </div>

          <div className="flex gap-4 mb-6">
            <Skeleton className="h-24 w-24 rounded-md" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-5/6" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <Skeleton className="h-28 w-full rounded-md" />
            <Skeleton className="h-28 w-full rounded-md" />
          </div>

          <div className="flex justify-end gap-3">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-24 rounded-md" />
          </div>
        </div>
      </div>
      <div className="fixed bottom-4 right-4 flex gap-2 z-10">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
    </div>
  )
}
