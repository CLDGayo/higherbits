export async function prepareCreatorReview<T>(
  demoIds: readonly number[],
  transition: () => Promise<T>,
  request: typeof fetch = fetch,
): Promise<T> {
  if (!demoIds.length || demoIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("Every review submission needs a saved demo")
  }

  for (const demoId of demoIds) {
    for (const [path, errorMessage] of [
      ["/api/sandbox/prepare-ghl-review", "GoHighLevel output could not be saved"],
      ["/api/sandbox/prepare-copy-prompts-review", "Copy prompts could not be saved"],
    ] as const) {
      const response = await request(path, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ demoId }),
      })
      if (!response.ok) throw new Error(errorMessage)
    }
  }

  return transition()
}
