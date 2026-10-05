export async function prepareCreatorReview<T>(
  demoIds: readonly number[],
  transition: () => Promise<T>,
  request: typeof fetch = fetch,
): Promise<T> {
  if (!demoIds.length || demoIds.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    throw new Error("Every review submission needs a saved demo")
  }

  for (const demoId of demoIds) {
    const response = await request("/api/sandbox/prepare-ghl-review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ demoId }),
    })
    if (!response.ok) throw new Error("GoHighLevel output could not be saved")
  }

  return transition()
}
