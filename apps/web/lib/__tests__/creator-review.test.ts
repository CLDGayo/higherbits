import { expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { join } from "node:path"
import { prepareCreatorReview } from "@/lib/creator-review"

it("U-GHL-01: saves GHL for every submitted demo before the review transition", async () => {
  const order: string[] = []
  const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { demoId: number }
    order.push(`ghl:${body.demoId}`)
    return new Response(null, { status: 200 })
  })
  const transition = vi.fn(async () => { order.push("submission:on_review"); return "saved" })

  await expect(prepareCreatorReview([11, 12], transition, request as typeof fetch)).resolves.toBe("saved")

  expect(order).toEqual(["ghl:11", "ghl:12", "submission:on_review"])
  expect(transition).toHaveBeenCalledOnce()
})

it("U-GHL-01: leaves the version out of review if any demo output fails", async () => {
  const request = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body)) as { demoId: number }
    return new Response(null, { status: body.demoId === 12 ? 503 : 200 })
  })
  const transition = vi.fn(async () => "submitted")

  await expect(prepareCreatorReview([11, 12, 13], transition, request as typeof fetch))
    .rejects.toThrow("GoHighLevel output could not be saved")

  expect(request).toHaveBeenCalledTimes(2)
  expect(transition).not.toHaveBeenCalled()
})

it("U-GHL-01: refuses an empty or invalid submitted demo set", async () => {
  const request = vi.fn()
  const transition = vi.fn()

  await expect(prepareCreatorReview([], transition, request as typeof fetch)).rejects.toThrow("Every review submission needs a saved demo")
  await expect(prepareCreatorReview([11, 0], transition, request as typeof fetch)).rejects.toThrow("Every review submission needs a saved demo")
  expect(request).not.toHaveBeenCalled()
  expect(transition).not.toHaveBeenCalled()
})

it("U-GHL-01: /publish invokes review only after the complete demo-save loop", async () => {
  const source = await readFile(join(process.cwd(), "components/features/publish/publish-layout.tsx"), "utf8")
  const loopStart = source.indexOf("for (const demo of data.demos)")
  const recordedDemo = source.indexOf("submittedDemoIds.push(insertedDemo.id)", loopStart)
  const loopEnd = source.indexOf("\n        }\n\n        if (!data.is_public)", recordedDemo)
  const review = source.indexOf("await prepareCreatorReview(submittedDemoIds", loopEnd)
  const submission = source.indexOf('.from("submissions")', review)

  expect(loopStart).toBeGreaterThanOrEqual(0)
  expect(recordedDemo).toBeGreaterThan(loopStart)
  expect(loopEnd).toBeGreaterThan(recordedDemo)
  expect(review).toBeGreaterThan(loopEnd)
  expect(submission).toBeGreaterThan(review)
})

it("U-GHL-01: /publish invokes review only after the complete demo-save loop", async () => {
  const source = await readFile(join(process.cwd(), "components/features/publish/publish-layout.tsx"), "utf8")
  const loopStart = source.indexOf("for (const demo of data.demos)")
  const recordedDemo = source.indexOf("submittedDemoIds.push(insertedDemo.id)", loopStart)
  const loopEnd = source.indexOf("\n        }\n\n        if (!data.is_public)", recordedDemo)
  const review = source.indexOf("await prepareCreatorReview(submittedDemoIds", loopEnd)
  const submission = source.indexOf('.from("submissions")', review)

  expect(loopStart).toBeGreaterThanOrEqual(0)
  expect(recordedDemo).toBeGreaterThan(loopStart)
  expect(loopEnd).toBeGreaterThan(recordedDemo)
  expect(review).toBeGreaterThan(loopEnd)
  expect(submission).toBeGreaterThan(review)
})
