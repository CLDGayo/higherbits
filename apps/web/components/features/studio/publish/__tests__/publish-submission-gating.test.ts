import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { join } from "node:path"

const addComponentToLibraryAction = vi.fn(
  async (_args: { collectionId: string; componentId: number }) => ({
    success: true,
  }),
)

vi.mock("@/lib/api/collections", () => ({
  addComponentToLibraryAction: (args: {
    collectionId: string
    componentId: number
  }) => addComponentToLibraryAction(args),
}))

vi.mock("sonner", () => ({
  toast: { warning: vi.fn(), error: vi.fn(), success: vi.fn() },
}))

import { _stepManageSandboxLinkAndSubmission, assertReviewRetryAllowed } from "../hooks/use-submit-component"

type Op = { table: string; op: string; payload?: unknown }
const order: string[] = []

// Minimal stand-in for the postgrest chain. `.eq()` terminates some calls and
// continues others, so the chain object is itself thenable.
const makeSupabase = (
  existingSubmission: { id: number; status: string } | null,
) => {
  const ops: Op[] = []

  const from = (table: string) => {
    const chain: Record<string, unknown> = {
      select: (_cols?: string) => {
        ops.push({ table, op: "select" })
        return chain
      },
      insert: (payload: unknown) => {
        ops.push({ table, op: "insert", payload })
        if (table === "submissions") order.push("submission:on_review")
        return Promise.resolve({ error: null })
      },
      update: (payload: unknown) => {
        ops.push({ table, op: "update", payload })
        return chain
      },
      eq: () => chain,
      maybeSingle: () => Promise.resolve({ data: existingSubmission, error: null }),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve({ error: null }).then(resolve, reject),
    }
    return chain
  }

  return { client: { from } as never, ops }
}

const makeContext = (
  supabase: never,
  form: { submit_for_featuring?: boolean; library_id?: string },
) =>
  ({
    supabase,
    form,
    sandboxId: "sandbox-1",
    setPublishProgress: () => {},
  }) as never

const makeState = (overrides: Record<string, unknown> = {}) =>
  ({
    componentIdToUse: 42,
    // already linked, so the sandbox-link branches stay quiet by default
    sandboxData: { component_id: 42 },
    existingDemoId: null,
    finalComponent: null,
    finalDemo: { id: 2 },
    isNewComponent: false,
    ...overrides,
  }) as never

const submissionOps = (ops: Op[]) => ops.filter((o) => o.table === "submissions")

it("U-GHL-01: rejects a resubmission while an existing review version is pending", () => {
  expect(() => assertReviewRetryAllowed("on_review", true)).toThrow(
    "This version is already awaiting review; its saved demos and GHL outputs were left unchanged.",
  )
  expect(() => assertReviewRetryAllowed("on_review", false)).not.toThrow()
  expect(() => assertReviewRetryAllowed("rejected", true)).not.toThrow()
})

it("U-GHL-01: pending-review guard runs before Studio file uploads and component/demo writes", async () => {
  const source = await readFile(join(process.cwd(), "components/features/studio/publish/hooks/use-submit-component.ts"), "utf8")
  const guard = source.indexOf("assertReviewRetryAllowed(\n        existingSubmission?.status")
  const fetchStep = source.indexOf("submissionState = await _stepFetchSandboxAndExistingInfo(")
  const uploadStep = source.indexOf("submissionState = await _stepUploadFiles(")
  const componentWrite = source.indexOf("submissionState = await _stepUpsertComponent(")
  const demoWrite = source.indexOf("submissionState = await _stepUpsertDemo(")

  expect(guard).toBeGreaterThanOrEqual(0)
  expect(fetchStep).toBeGreaterThan(guard)
  expect(uploadStep).toBeGreaterThan(fetchStep)
  expect(componentWrite).toBeGreaterThan(uploadStep)
  expect(demoWrite).toBeGreaterThan(componentWrite)
})

beforeEach(() => {
  addComponentToLibraryAction.mockClear()
  order.length = 0
  vi.stubGlobal("fetch", vi.fn(async () => { order.push("ghl:saved"); return new Response("{}", { status: 200 }) }))
})
afterEach(() => vi.unstubAllGlobals())

describe("G7.4 - submit_for_featuring gates the submissions write", () => {
  it("writes nothing to submissions when featuring is off", async () => {
    const { client, ops } = makeSupabase(null)

    await _stepManageSandboxLinkAndSubmission(
      makeContext(client, { submit_for_featuring: false }),
      makeState(),
    )

    expect(submissionOps(ops)).toEqual([])
  })

  it("inserts an on_review submission when featuring is on and none exists", async () => {
    const { client, ops } = makeSupabase(null)

    await _stepManageSandboxLinkAndSubmission(
      makeContext(client, { submit_for_featuring: true }),
      makeState(),
    )

    expect(submissionOps(ops)).toEqual([
      { table: "submissions", op: "select" },
      {
        table: "submissions",
        op: "insert",
        payload: { component_id: 42, status: "on_review" },
      },
    ])
    expect(order.indexOf("ghl:saved")).toBeGreaterThanOrEqual(0)
    expect(order.indexOf("ghl:saved")).toBeLessThan(order.indexOf("submission:on_review"))
    expect(fetch).toHaveBeenCalledWith("/api/sandbox/prepare-ghl-review", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ demoId: 2 }),
    }))
  })

  it("U-GHL-01 leaves submission out of review when GHL save fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })))
    const { client, ops } = makeSupabase(null)
    await expect(_stepManageSandboxLinkAndSubmission(
      makeContext(client, { submit_for_featuring: true }), makeState(),
    )).rejects.toThrow("GoHighLevel output could not be saved")
    expect(submissionOps(ops)).toEqual([])
  })

  it("U-GHL-01 preserves an existing on_review submission and saved demo fingerprint when retry preparation fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 503 })))
    const priorDemo = {
      id: 2,
      ghl_html_content: "<div>previous matching output</div>",
      ghl_source_fingerprint: "previous-matching-fingerprint",
    }
    const priorSubmission = { id: 7, status: "on_review" }
    const { client, ops } = makeSupabase(priorSubmission)

    await expect(_stepManageSandboxLinkAndSubmission(
      makeContext(client, { submit_for_featuring: true }),
      makeState({ finalDemo: priorDemo }),
    )).rejects.toThrow("GoHighLevel output could not be saved")

    expect(priorDemo).toEqual({
      id: 2,
      ghl_html_content: "<div>previous matching output</div>",
      ghl_source_fingerprint: "previous-matching-fingerprint",
    })
    expect(priorSubmission).toEqual({ id: 7, status: "on_review" })
    expect(submissionOps(ops).filter(operation => operation.op === "insert" || operation.op === "update")).toEqual([])
  })

  it("updates the existing submission back to on_review when featuring is on", async () => {
    const { client, ops } = makeSupabase({ id: 7, status: "rejected" })

    await _stepManageSandboxLinkAndSubmission(
      makeContext(client, { submit_for_featuring: true }),
      makeState(),
    )

    expect(submissionOps(ops)).toEqual([
      { table: "submissions", op: "select" },
      {
        table: "submissions",
        op: "update",
        payload: { status: "on_review", moderators_feedback: null },
      },
    ])
  })

  it("treats an undefined flag as off, so the write is opt-in at this layer", async () => {
    const { client, ops } = makeSupabase(null)

    await _stepManageSandboxLinkAndSubmission(
      makeContext(client, {}),
      makeState(),
    )

    expect(submissionOps(ops)).toEqual([])
  })
})

describe("G7.5 - library linkage is optional", () => {
  it("performs no library write when no library is selected", async () => {
    const { client } = makeSupabase(null)

    await _stepManageSandboxLinkAndSubmission(
      makeContext(client, { submit_for_featuring: true }),
      makeState(),
    )

    expect(addComponentToLibraryAction).not.toHaveBeenCalled()
  })

  it("links to the selected library using the resolved component id", async () => {
    const { client } = makeSupabase(null)

    await _stepManageSandboxLinkAndSubmission(
      makeContext(client, {
        submit_for_featuring: false,
        library_id: "lib-123",
      }),
      makeState(),
    )

    expect(addComponentToLibraryAction).toHaveBeenCalledTimes(1)
    expect(addComponentToLibraryAction).toHaveBeenCalledWith({
      collectionId: "lib-123",
      componentId: 42,
    })
  })

  it("does not fail the publish when the library link throws", async () => {
    const { client } = makeSupabase(null)
    addComponentToLibraryAction.mockRejectedValueOnce(new Error("boom") as never)

    await expect(
      _stepManageSandboxLinkAndSubmission(
        makeContext(client, { library_id: "lib-123" }),
        makeState(),
      ),
    ).resolves.toBeDefined()
  })
})

describe("component id precondition", () => {
  it("throws rather than writing anything when the component id is missing", async () => {
    const { client, ops } = makeSupabase(null)

    await expect(
      _stepManageSandboxLinkAndSubmission(
        makeContext(client, { submit_for_featuring: true, library_id: "lib-1" }),
        makeState({ componentIdToUse: null }),
      ),
    ).rejects.toThrow("Component ID is missing after create/update.")

    expect(ops).toEqual([])
    expect(addComponentToLibraryAction).not.toHaveBeenCalled()
  })
})
