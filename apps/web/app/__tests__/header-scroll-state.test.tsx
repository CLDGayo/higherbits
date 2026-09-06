/** @vitest-environment jsdom */
/**
 * Phase 02 — header scroll state (AC1, AC2, AC3, AC4, AC7).
 *
 * jsdom gate for the threshold boundary, the class swap either side of it, the
 * transition property list, and reversibility. Its sibling
 * `header-scroll-state-ssr.test.tsx` carries the SSR gate: vitest resolves its
 * environment per FILE, so a windowless SSR gate cannot live in this file.
 *
 * Mock set extends `components/ui/__tests__/header-smoke.test.tsx`, plus
 * `SignUpButton` — without it `LandingAuthModals` throws once RTL's `render()`
 * flushes the `mounted` effect (that missing export is the pre-existing
 * header-smoke failure).
 *
 * Note: `header-smoke.test.tsx` mocks "framer-motion", but this component
 * imports `useAnimation` from "motion/react" — a different package. That mock
 * is a no-op there and is deliberately not copied forward.
 */
import React from "react"
import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest"
import { render, waitFor, cleanup } from "@testing-library/react"
import { Header } from "@/components/ui/header.client"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}))

vi.mock("@clerk/nextjs", () => ({
  SignInButton: ({ children }: any) => <div>{children}</div>,
  SignUpButton: ({ children }: any) => <div>{children}</div>,
  SignedIn: ({ children }: any) => <div data-testid="signed-in">{children}</div>,
  SignedOut: ({ children }: any) => <div data-testid="signed-out">{children}</div>,
  useClerk: () => ({ signOut: vi.fn() }),
  useUser: () => ({ user: null }),
  useAuth: () => ({ userId: null, isLoaded: true }),
  useSession: () => ({ session: { getToken: vi.fn(), id: "test-session" } }),
}))
vi.mock("jotai", () => ({
  atom: () => ({}),
  useAtom: () => [false, vi.fn()],
  useSetAtom: () => vi.fn(),
}))
vi.mock("next-themes", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}))
vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: null, isLoading: false }),
}))
vi.mock("@/components/ui/sidebar", () => ({
  useSidebar: () => ({ toggleSidebar: vi.fn(), state: "expanded", isMobile: false }),
  SidebarTrigger: () => <button data-testid="sidebar-trigger">Sidebar</button>,
}))

/**
 * jsdom ships `window.scrollTo` as an unimplemented stub ("Not implemented:
 * Window's scrollTo() method") that never updates `window.scrollY`, so the
 * event-driven pattern needs a minimal shim to be usable at all. The shim only
 * supplies the coordinate bookkeeping jsdom omits; the production listener is
 * still driven by a real dispatched `scroll` event, not by poking React state.
 */
beforeAll(() => {
  Object.defineProperty(window, "scrollY", {
    value: 0,
    writable: true,
    configurable: true,
  })
  window.scrollTo = ((x?: unknown, y?: unknown) => {
    const next =
      typeof y === "number"
        ? y
        : typeof x === "object" && x !== null && "top" in (x as any)
          ? Number((x as any).top)
          : 0
    ;(window as unknown as { scrollY: number }).scrollY = next
  }) as typeof window.scrollTo
})

beforeEach(() => {
  cleanup()
  window.scrollTo(0, 0)
})

function headerEl(container: HTMLElement): HTMLElement {
  const el = container.ownerDocument.querySelector("header")
  if (!el) throw new Error("no <header> rendered")
  return el as HTMLElement
}

async function scrollTo(y: number) {
  window.scrollTo(0, y)
  window.dispatchEvent(new Event("scroll"))
}

describe("Header scroll state (transparentAtTop)", () => {
  it("AC1: is transparent with no backdrop filter at scrollY 0", async () => {
    const { container } = render(<Header variant="default" transparentAtTop />)
    const header = headerEl(container)
    await waitFor(() => {
      expect(header.className).toContain("bg-transparent")
    })
    expect(header.className).toContain("border-transparent")
    expect(header.className).not.toContain("backdrop-blur-md")
    expect(header.className).not.toContain("bg-background/70")
  })

  it("AC1: is still transparent AT the 10px threshold (boundary is > 10, not >= 10)", async () => {
    const { container } = render(<Header variant="default" transparentAtTop />)
    const header = headerEl(container)
    await scrollTo(10)
    await waitFor(() => {
      expect(header.className).toContain("bg-transparent")
    })
    expect(header.className).not.toContain("bg-background/70")
  })

  it("AC2: swaps to bg-background/70 + backdrop-blur-md + border-border/50 past 10px", async () => {
    const { container } = render(<Header variant="default" transparentAtTop />)
    const header = headerEl(container)
    await scrollTo(11)
    await waitFor(() => {
      expect(header.className).toContain("bg-background/70")
    })
    expect(header.className).toContain("backdrop-blur-md")
    expect(header.className).toContain("border-border/50")
    expect(header.className).not.toContain("bg-transparent")
  })

  it("AC2: stays in the scrolled state far down the page (600px)", async () => {
    const { container } = render(<Header variant="default" transparentAtTop />)
    const header = headerEl(container)
    await scrollTo(600)
    await waitFor(() => {
      expect(header.className).toContain("bg-background/70")
    })
  })

  it("AC4: reverses back to transparent when scrolled back above the threshold", async () => {
    const { container } = render(<Header variant="default" transparentAtTop />)
    const header = headerEl(container)
    await scrollTo(600)
    await waitFor(() => {
      expect(header.className).toContain("bg-background/70")
    })
    await scrollTo(0)
    await waitFor(() => {
      expect(header.className).toContain("bg-transparent")
    })
    expect(header.className).not.toContain("bg-background/70")
  })

  it("AC3: transitions for 300ms on exactly background-color, border-color, backdrop-filter", async () => {
    const { container } = render(<Header variant="default" transparentAtTop />)
    const header = headerEl(container)
    await waitFor(() => {
      expect(header.className).toContain(
        "transition-[background-color,border-color,backdrop-filter]",
      )
    })
    expect(header.className).toContain("duration-300")
    // Not `transition-all` — the property list is exhaustive by construction.
    expect(header.className).not.toContain("transition-all")
  })

  it("AC5: without transparentAtTop the header keeps its always-opaque classes at every scroll position", async () => {
    const { container } = render(<Header variant="default" />)
    const header = headerEl(container)
    expect(header.className).toContain("bg-background/95")
    expect(header.className).toContain("backdrop-blur-sm")
    expect(header.className).toContain("border-border/40")
    expect(header.className).not.toContain("bg-transparent")
    expect(header.className).not.toContain(
      "transition-[background-color,border-color,backdrop-filter]",
    )
    await scrollTo(600)
    await new Promise((r) => setTimeout(r, 50))
    expect(header.className).toContain("bg-background/95")
    expect(header.className).not.toContain("bg-background/70")
  })

  it("initialises from the real scroll position on mount, not from zero", async () => {
    window.scrollTo(0, 400)
    const { container } = render(<Header variant="default" transparentAtTop />)
    const header = headerEl(container)
    await waitFor(() => {
      expect(header.className).toContain("bg-background/70")
    })
  })
})
