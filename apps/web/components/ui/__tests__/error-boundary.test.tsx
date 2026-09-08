/** @vitest-environment jsdom */
import React, { useState } from "react"
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { ErrorBoundary } from "../error-boundary"

function ProblemChild({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error("Simulated component failure")
  }
  return <div>Safe child content</div>
}

describe("ErrorBoundary Component", () => {
  const originalConsoleError = console.error

  beforeEach(() => {
    // Suppress console.error output during deliberate throw tests
    console.error = vi.fn()
  })

  afterEach(() => {
    console.error = originalConsoleError
  })

  it("renders children normally when no error occurs", () => {
    render(
      <ErrorBoundary>
        <ProblemChild shouldThrow={false} />
      </ErrorBoundary>
    )
    expect(screen.getByText("Safe child content")).toBeDefined()
  })

  it("catches errors and renders default fallback UI", () => {
    render(
      <ErrorBoundary title="Widget Error" description="Could not load widget">
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.queryByText("Safe child content")).toBeNull()
    expect(screen.getByRole("alert")).toBeDefined()
    expect(screen.getByText("Widget Error")).toBeDefined()
    expect(screen.getByText("Could not load widget")).toBeDefined()
    expect(screen.getByText("Try again")).toBeDefined()
  })

  it("renders a custom ReactNode fallback when provided", () => {
    render(
      <ErrorBoundary fallback={<div data-testid="custom-fallback">Custom Error Message</div>}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(screen.getByTestId("custom-fallback")).toBeDefined()
    expect(screen.getByText("Custom Error Message")).toBeDefined()
  })

  it("renders a function fallback and allows recovery via reset", () => {
    function ResettableContainer() {
      const [hasError, setHasError] = useState(true)
      return (
        <ErrorBoundary
          onReset={() => setHasError(false)}
          fallback={({ error, reset }) => (
            <div>
              <span>Error: {error.message}</span>
              <button onClick={reset}>Recover</button>
            </div>
          )}
        >
          <ProblemChild shouldThrow={hasError} />
        </ErrorBoundary>
      )
    }

    render(<ResettableContainer />)
    expect(screen.getByText("Error: Simulated component failure")).toBeDefined()

    const recoverButton = screen.getByText("Recover")
    fireEvent.click(recoverButton)

    expect(screen.getByText("Safe child content")).toBeDefined()
  })

  it("invokes onError callback with error and errorInfo", () => {
    const onErrorSpy = vi.fn()

    render(
      <ErrorBoundary onError={onErrorSpy}>
        <ProblemChild shouldThrow={true} />
      </ErrorBoundary>
    )

    expect(onErrorSpy).toHaveBeenCalledTimes(1)
    const firstCall = onErrorSpy.mock.calls[0]
    expect(firstCall).toBeDefined()
    expect((firstCall?.[0] as Error).message).toBe("Simulated component failure")
  })
})
