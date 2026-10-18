import React, { useState } from "react"

export default function SampleComponent() {
  const [count, setCount] = useState(0)
  return <div className="ghl-component-wrapper"><main className="demo-surface">
    <article className="demo-card">
      <h2>Original heading</h2>
      <p>Original description</p>
      <button type="button" onClick={() => setCount(value => value + 1)}><span aria-hidden="true">✦</span><span>Clicked {count} times</span></button>
      <span className="moving">Animated detail</span>
    </article>
  </main></div>
}
