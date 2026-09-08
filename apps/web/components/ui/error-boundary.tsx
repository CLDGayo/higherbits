"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { Button } from "./button"
import { cn } from "@/lib/utils"

export interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((props: { error: Error; reset: () => void }) => ReactNode)
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  onReset?: () => void
  title?: string
  description?: string
  className?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
    }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    } else {
      console.error("[ErrorBoundary] Caught error:", error, errorInfo)
    }
  }

  reset = (): void => {
    if (this.props.onReset) {
      this.props.onReset()
    }
    this.setState({
      hasError: false,
      error: null,
    })
  }

  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === "function") {
        return this.props.fallback({
          error: this.state.error,
          reset: this.reset,
        })
      }

      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          role="alert"
          className={cn(
            "w-full rounded-cushion border border-destructive/20 bg-destructive/5 p-6 flex flex-col items-center justify-center text-center gap-3 text-card-foreground my-2",
            this.props.className
          )}
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive border border-destructive/20">
            <AlertTriangle className="size-5" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-semibold tracking-tight text-foreground">
              {this.props.title || "Failed to load component"}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm">
              {this.props.description ||
                "An unexpected error occurred while rendering this section."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={this.reset}
            className="gap-1.5 text-xs h-8 px-3 rounded-cushion mt-1"
          >
            <RefreshCw className="size-3.5" />
            Try again
          </Button>
        </div>
      )
    }

    return this.props.children
  }
}
