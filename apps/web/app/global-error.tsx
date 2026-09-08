"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[app/global-error] Fatal layout error:", error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
          backgroundColor: "#09090b",
          color: "#fafafa",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            width: "90%",
            margin: "24px auto",
            padding: "32px",
            backgroundColor: "#18181b",
            border: "1px solid #27272a",
            borderRadius: "16px",
            textAlign: "center",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              backgroundColor: "rgba(239, 68, 68, 0.15)",
              color: "#ef4444",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
              fontSize: "24px",
              fontWeight: "bold",
            }}
          >
            !
          </div>

          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            Critical System Error
          </h1>

          <p
            style={{
              fontSize: "14px",
              lineHeight: "1.6",
              color: "#a1a1aa",
              margin: "0 0 24px",
            }}
          >
            A critical error occurred while loading the application shell.
            We have captured this incident for immediate resolution.
          </p>

          {error.digest && (
            <div
              style={{
                padding: "8px 12px",
                backgroundColor: "#27272a",
                borderRadius: "8px",
                fontSize: "12px",
                fontFamily: "monospace",
                color: "#71717a",
                marginBottom: "24px",
                wordBreak: "break-all",
              }}
            >
              Digest: <span style={{ color: "#e4e4e7" }}>{error.digest}</span>
            </div>
          )}

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                flex: "1",
                minWidth: "140px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "#fafafa",
                color: "#09090b",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => (window.location.href = "/")}
              style={{
                flex: "1",
                minWidth: "140px",
                padding: "10px 16px",
                fontSize: "14px",
                fontWeight: "600",
                backgroundColor: "transparent",
                color: "#fafafa",
                border: "1px solid #3f3f46",
                borderRadius: "10px",
                cursor: "pointer",
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
