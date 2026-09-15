export const connectToSandbox = async (
  shortSandboxId: string,
): Promise<{
  startData: any
  sandbox: any
  previewToken?: string | null
} | null> => {
  let retries = 3
  let lastError: unknown = null

  while (retries > 0) {
    try {
      const res = await fetch(`/api/sandbox/connect`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ shortSandboxId }),
      })

      if (!res.ok) {
        let errorMsg = `Server error ${res.status}`
        let isNonRetryable =
          res.status === 400 ||
          res.status === 401 ||
          res.status === 402 ||
          res.status === 403 ||
          res.status === 404

        try {
          const body = await res.json()
          if (body?.error) errorMsg = body.error
          if (body?.code === "WORKSPACE_FROZEN") {
            isNonRetryable = true
          }
        } catch {
          // not JSON
        }

        const err = new Error(errorMsg)
        if (isNonRetryable) {
          console.error(
            `Non-retryable sandbox connection error (${res.status}):`,
            errorMsg,
          )
          throw err
        }
        throw err
      }

      return await res.json()
    } catch (error: any) {
      lastError = error
      const isFrozen =
        error?.message?.includes?.("frozen") ||
        error?.message?.includes?.("spending limit")
      const isNonRetryable =
        isFrozen ||
        error?.message?.includes?.("400") ||
        error?.message?.includes?.("401") ||
        error?.message?.includes?.("402") ||
        error?.message?.includes?.("403") ||
        error?.message?.includes?.("404")

      if (isNonRetryable) {
        throw error
      }

      retries--
      if (retries === 0) {
        console.error("Failed to load existing sandbox (no retries left):", error)
        throw error
      }
      console.error(
        `Failed to load existing sandbox (${retries} retries left):`,
        error,
      )
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }

  if (lastError) throw lastError
  return null
}

export const getSandboxInfo = async (
  shortSandboxId: string,
): Promise<{ sandbox: any } | null> => {
  let retries = 3
  while (retries > 0) {
    try {
      const res = await fetch(`/api/sandbox/info?id=${shortSandboxId}`)

      if (!res.ok) throw new Error(await res.text())
      return await res.json()
    } catch (error) {
      console.error(
        `Failed to load sandbox info (${retries} retries left):`,
        error,
      )
      retries--
      if (retries === 0) return null
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  return null
}

export const createNewSandbox = async (
  userId: string,
): Promise<{
  sandboxId: string
}> => {
  const res = await fetch("/api/sandbox/new", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId }),
  })

  if (!res.ok) {
    let message = "Failed to create sandbox"
    try {
      const body = await res.json()
      if (body?.error) message = body.error
    } catch {
      // response body was not JSON — keep the default message
    }
    throw new Error(message)
  }
  const response = await res.json()

  return { sandboxId: response.shortSandboxId }
}

export const publishSandbox = async (
  shortSandboxId: string,
): Promise<{ success: boolean }> => {
  const res = await fetch("/api/sandbox/publish", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shortSandboxId }),
  })

  if (!res.ok) throw new Error(await res.text())
  const response = await res.json()

  return { success: response.success }
}

export const editSandbox = async (
  shortSandboxId: string,
  updateData: Record<string, any>,
): Promise<{ success: boolean }> => {
  const res = await fetch("/api/sandbox/edit", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ shortSandboxId, ...updateData }),
  })

  if (!res.ok) throw new Error(await res.text())
  const response = await res.json()

  return { success: response.success }
}
