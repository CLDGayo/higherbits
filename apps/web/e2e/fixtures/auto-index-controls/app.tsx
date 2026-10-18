import React, { useRef, useState } from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "jotai"
import { AutoIndexControls } from "../../../components/features/controls/auto-index-controls"
import { useAutoIndexControls } from "../../../hooks/use-auto-index-controls"

function Preview() {
  const [bundle, setBundle] = useState("controls-fixture")
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const controls = useAutoIndexControls({ demoId: bundle, bundleUrl: `/auto-index/${bundle}.html`, rawCode: "", iframeRef, tags: bundle === "background-fixture" ? [{ slug: "backgrounds", name: "Backgrounds" }] : [] })
  return <main className="fixture-layout">
    <section>
      <label>Component <select aria-label="Component" value={bundle} onChange={event => setBundle(event.target.value)}>
        <option value="controls-fixture">Deterministic React component</option>
        <option value="background-fixture">Full-bleed background</option>
        <option value="edilozi-accordion">Ingested accordion</option>
      </select></label>
      <iframe key={bundle} ref={iframeRef} title="Component preview" sandbox="allow-scripts" src={controls.useInjectedPreviewDocument ? undefined : `/auto-index/${bundle}.html`} srcDoc={controls.isAutoIndex ? controls.previewDocument ?? undefined : undefined} onLoad={controls.onFrameLoad} style={controls.previewStyle} />
      <output data-testid="control-state" hidden>{JSON.stringify(controls.activeControls)}</output>
    </section>
    <aside>
      <h1>Controls</h1>
      {controls.autoControls && <AutoIndexControls controls={controls.autoControls} />}
      {controls.unavailableReason && <p role="alert">{controls.unavailableReason}</p>}
      <button type="button" onClick={controls.onReset}>Reset all</button>
    </aside>
  </main>
}

createRoot(document.getElementById("app")!).render(<Provider><Preview /></Provider>)
