import * as React from "react"
import { createRoot } from "react-dom/client"
import HomePage from "../../../app/page"

function Fixture() {
  const [page, setPage] = React.useState<React.ReactNode>(null)
  const [dark, setDark] = React.useState(false)

  React.useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get("tab")
    HomePage({ searchParams: Promise.resolve(tab ? { tab } : {}) }).then(setPage)
  }, [])

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", dark)
  }, [dark])

  return (
    <>
      <aside className="fixture-banner">
        <span>ISOLATED HOME FIXTURE — real Home page, layout, category rows, carousel logic, and catalogue with synthetic data. Other sections are stubs.</span>
        <button type="button" onClick={() => setDark((value) => !value)}>
          {dark ? "Use light theme" : "Use dark theme"}
        </button>
      </aside>
      {page}
    </>
  )
}

createRoot(document.getElementById("root")!).render(<Fixture />)
