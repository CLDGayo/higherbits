import { beforeEach, describe, expect, it, vi } from "vitest"

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

import { _stepManageSandboxLinkAndSubmission } from "../hooks/use-submit-component"

type Op = { table: string; op: string; payload?: unknown }

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
    finalDemo: null,
    isNewComponent: false,
    ...overrides,
  }) as never

const submissionOps = (ops: Op[]) => ops.filter((o) => o.table === "submissions")

beforeEach(() => {
  addComponentToLibraryAction.mockClear()
})

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
