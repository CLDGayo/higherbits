/** @vitest-environment jsdom */
import React from "react"
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { render, screen, act, fireEvent } from "@testing-library/react"

const mockSearchParams = new URLSearchParams()
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useSearchParams: () => mockSearchParams,
}))

import {
  NavigationProgressBar,
  startNavigationProgress,
  stopNavigationProgress,
  useNavigationProgress,
} from "../navigation-progress"

describe("NavigationProgressBar", () => {
  beforeEach(() => {
    stopNavigationProgress(true)
    vi.useFakeTimers()
  })

  afterEach(() => {
    stopNavigationProgress(true)
    vi.useRealTimers()
  })

  it("does not render when idle", () => {
    render(<NavigationProgressBar />)
    expect(screen.queryByTestId("navigation-progress")).toBeNull()
  })

  it("renders when startNavigationProgress() is called and unmounts on stopNavigationProgress()", () => {
    render(<NavigationProgressBar />)

    act(() => {
      startNavigationProgress()
    })
    expect(screen.getByTestId("navigation-progress")).toBeDefined()

    act(() => {
      stopNavigationProgress(true)
    })
    expect(screen.queryByTestId("navigation-progress")).toBeNull()
  })

  it("triggers on internal link clicks", () => {
    render(
      <div>
        <NavigationProgressBar />
        <a href="/studio/clarence.gayo/components" data-testid="internal-link">
          Studio
        </a>
        <a href="#section" data-testid="hash-link">
          Hash
        </a>
      </div>,
    )

    // Hash link click should not trigger progress
    act(() => {
      fireEvent.click(screen.getByTestId("hash-link"))
    })
    expect(screen.queryByTestId("navigation-progress")).toBeNull()

    // Internal navigation link click should trigger progress
    act(() => {
      fireEvent.click(screen.getByTestId("internal-link"))
    })
    expect(screen.getByTestId("navigation-progress")).toBeDefined()
  })

  it("automatically times out after 8 seconds of inactivity", () => {
    render(<NavigationProgressBar />)

    act(() => {
      startNavigationProgress()
    })
    expect(screen.getByTestId("navigation-progress")).toBeDefined()

    act(() => {
      vi.advanceTimersByTime(8500)
    })
    expect(screen.queryByTestId("navigation-progress")).toBeNull()
  })

  it("allows control via useNavigationProgress hook", () => {
    function TestController() {
      const { isActive, start, stop } = useNavigationProgress()
      return (
        <div>
          <NavigationProgressBar />
          <button data-testid="btn-start" onClick={() => start()}>
            Start
          </button>
          <button data-testid="btn-stop" onClick={() => stop(true)}>
            Stop
          </button>
          <span data-testid="status">{isActive ? "active" : "inactive"}</span>
        </div>
      )
    }

    render(<TestController />)
    expect(screen.getByTestId("status").textContent).toBe("inactive")

    act(() => {
      fireEvent.click(screen.getByTestId("btn-start"))
    })
    expect(screen.getByTestId("status").textContent).toBe("active")
    expect(screen.getByTestId("navigation-progress")).toBeDefined()

    act(() => {
      fireEvent.click(screen.getByTestId("btn-stop"))
    })
    expect(screen.getByTestId("status").textContent).toBe("inactive")
    expect(screen.queryByTestId("navigation-progress")).toBeNull()
  })
})
