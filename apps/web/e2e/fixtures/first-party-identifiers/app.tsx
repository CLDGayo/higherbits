import { useEffect } from "react"
import { createRoot } from "react-dom/client"
import { useSupabaseAnalytics } from "@/hooks/use-analytics"
import { getConsent, setConsent } from "@/lib/consent"
import { readOnboardingState, writeOnboardingState, clearOnboardingState } from "@/lib/higherbits-mcp-storage"
import { AnalyticsActivityType } from "@/types/global"

function Fixture() {
  const { capture } = useSupabaseAnalytics()
  useEffect(() => {
    Object.assign(window, {
      phase02: {
        capture: (userId?: string, activity = AnalyticsActivityType.COMPONENT_VIEW) => capture(2026, activity, userId),
        getConsent,
        setConsent,
        read: readOnboardingState,
        write: writeOnboardingState,
        clear: clearOnboardingState,
        unmount: () => root.unmount(),
        mount: () => { root = createRoot(container!); root.render(<Fixture />) },
      },
    })
  }, [capture])
  return <main><h1>Phase 02 storage fixture</h1><output>Actual production hook, consent and MCP storage helper</output></main>
}

const container = document.getElementById("app")
if (!container) throw new Error("Missing Phase 02 fixture container")
if (!Reflect.has(window, "__supabaseAnalyticsClient")) throw new Error("Missing pre-mount Phase 02 analytics recorder")
let root = createRoot(container)
root.render(<Fixture />)
