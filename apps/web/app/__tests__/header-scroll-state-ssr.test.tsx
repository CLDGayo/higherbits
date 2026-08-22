/**
 * REAL SSR GATE for `header.client.tsx` (AC6 + the AC6 useLayoutEffect residual).
 *
 * LOAD-BEARING: this file deliberately declares NO per-file environment
 * docblock. `vitest.config.ts` sets `environment: "node"` as the project
 * default, so this suite runs where `window` is genuinely undefined — exactly
 * like Next's server render. Its sibling `header-scroll-state.test.tsx` opts
 * into jsdom on line 1, which defines a global `window`; a scroll gate and an
 * SSR gate therefore cannot share one file, because vitest resolves the test
 * environment per FILE.
 *
 * Do NOT add a per-file environment docblock here. Careful: vitest scans the
 * FILE TEXT, so even writing that directive inside a comment (to explain it)
 * silently switches this suite to jsdom and disarms the gate — which is why
 * the directive's name is not spelled out anywhere in this file. The
 * `expect(typeof window).toBe("undefined")` assertion below exists so the gate
 * fails loudly if that ever happens.
 *
 * Also: no @testing-library/react, no `render()`, no DOM shims. SSR runs no
 * effects; if a DOM shim seems necessary, the component is doing browser work
 * during render and THAT is the bug this gate exists to catch.
 */
import React from "react"
import { describe, it, expect, vi } from "vitest"
import ReactDOMServer from "react-dom/server"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Header } from "@/components/ui/header.client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

/**
 * External auth boundary only. During a genuine `renderToString` no effects
 * run, so `mounted` stays false and the SignedIn/SignedOut/LandingAuthModals
 * subtree is never constructed — only the hooks called unconditionally above
 * that ternary need mocking.
 */
vi.mock("@clerk/nextjs", () => ({
  useClerk: () => ({ signOut: vi.fn() }),
  useAuth: () => ({ userId: null, isLoaded: true }),
  useUser: () => ({ user: null }),
  useSession: () => ({ session: null }),
}))

/**
 * Environment artifact, not component behavior: the installed `jotai@2.8.0`
 * resolves its own `react@18.3.1` from the hoisted root while this render runs
 * on React 19, so an unmocked `useAtom` throws "Cannot read properties of null
 * (reading 'useContext')" and React silently degrades the subtree to client
 * rendering. That failure is about module resolution under vitest, not about a
 * `window` read during SSR, so it is mocked out the same way the existing
 * `header-smoke.test.tsx` mocks it.
 */
vi.mock("jotai", () => ({
  atom: () => ({}),
  useAtom: () => [false, vi.fn()],
  useSetAtom: () => vi.fn(),
}))

function renderHeaderToString(): string {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ReactDOMServer.renderToString(
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        <Header variant="default" transparentAtTop />
      </SidebarProvider>
    </QueryClientProvider>,
  )
}

describe("header.client.tsx SSR safety", () => {
  it("AC6: server-renders with zero window reference errors, in a genuinely windowless environment", () => {
    expect(typeof window).toBe("undefined")
    const html = renderHeaderToString()
    expect(html.length).toBeGreaterThan(0)
    expect(html).toContain("<header")
  })

  it("AC6: server-renders the transparent (top-of-page) state, never the scrolled state", () => {
    expect(typeof window).toBe("undefined")
    const html = renderHeaderToString()
    expect(html).toContain("bg-transparent")
    expect(html).not.toContain("bg-background/70")
  })

  it("AC6 residual (D2b): emits zero console.error/console.warn while server-rendering the useLayoutEffect-using header", () => {
    expect(typeof window).toBe("undefined")
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    try {
      renderHeaderToString()
      expect(errorSpy.mock.calls).toEqual([])
      expect(warnSpy.mock.calls).toEqual([])
    } finally {
      errorSpy.mockRestore()
      warnSpy.mockRestore()
    }
  })

  it("AC6 residual (D2b) POSITIVE CONTROL: the same spy pattern DOES capture a known React warning, proving it can fire at all", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {})
    let captured = 0
    try {
      // An invalid DOM property (`class` instead of `className`) — a React dev
      // warning entirely independent of useLayoutEffect and of this component.
      // Without this control, a green result above would be indistinguishable
      // from a spy that can never fire.
      ReactDOMServer.renderToString(
        React.createElement("div", { class: "invalid-dom-property" }),
      )
      captured = errorSpy.mock.calls.length + warnSpy.mock.calls.length
    } finally {
      errorSpy.mockRestore()
      warnSpy.mockRestore()
    }
    expect(captured).toBeGreaterThan(0)
  })
})
