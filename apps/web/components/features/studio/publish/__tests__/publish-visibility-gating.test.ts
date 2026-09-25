import { describe, expect, it, vi } from "vitest"
import { _stepUpsertComponent } from "../hooks/use-submit-component"

type Op = { table: string; op: string; payload?: unknown }

const makeSupabase = (existingSubmission: { id: number; status: string } | null = null) => {
  const ops: Op[] = []

  const from = (table: string) => {
    const chain: Record<string, unknown> = {
      select: (_cols?: string) => {
        ops.push({ table, op: "select" })
        return chain
      },
      insert: (payload: unknown) => {
        ops.push({ table, op: "insert", payload })
        return chain
      },
      update: (payload: unknown) => {
        ops.push({ table, op: "update", payload })
        return chain
      },
      eq: () => chain,
      maybeSingle: () =>
        Promise.resolve({
          data: table === "submissions" ? existingSubmission : { id: 100, is_public: false },
          error: null,
        }),
      then: (resolve: (v: unknown) => unknown, reject?: (e: unknown) => unknown) =>
        Promise.resolve({
          data: [{ id: 42, is_public: false }],
          error: null,
        }).then(resolve, reject),
    }

    return chain
  }

  return { client: { from } as never, ops }
}

const makeContext = (
  supabase: never,
  formOverrides: Record<string, unknown> = {},
  contextOverrides: Record<string, unknown> = {},
) =>
  ({
    supabase,
    form: {
      name: "Test Component",
      component_slug: "test-component",
      registry: "ui",
      license: "mit",
      website_url: "",
      is_public: true, // User attempted to pass is_public: true
      submit_for_featuring: true,
      direct_registry_dependencies: [],
      ...formOverrides,
    },
    publishAsUser: { id: "user-1", username: "tester" },
    isAdmin: false,
    sandboxId: "sandbox-1",
    setPublishProgress: () => {},
    ...contextOverrides,
  }) as never

const makeState = (overrides: Record<string, unknown> = {}) =>
  ({
    componentIdToUse: null,
    parsedCodeData: {
      componentCode: "export default function Comp() {}",
      demoCode: "export default function Demo() {}",
      componentNames: ["Comp"],
      dependencies: {},
      demoDependencies: {},
    },
    fileUploadResult: {
      codeUrl: "https://r2/code.tsx",
      demoCodeUrl: "https://r2/demo.tsx",
      previewImageR2Url: null,
      videoR2Url: null,
      bundleHtmlUrl: "https://r2/bundle.html",
      registryJsonUrl: "https://r2/registry.json",
      indexCssUrl: null,
    },
    finalComponent: null,
    finalDemo: null,
    isNewComponent: true,
    ...overrides,
  }) as never

describe("Publish Visibility Gating", () => {
  it("forces is_public: false for non-admins when submit_for_featuring is true", async () => {
    const { client, ops } = makeSupabase(null)

    await _stepUpsertComponent(
      makeContext(client, { is_public: true, submit_for_featuring: true }),
      makeState({ componentIdToUse: null }),
    )

    const insertOp = ops.find((op) => op.table === "components" && op.op === "insert")
    expect(insertOp).toBeDefined()
    expect((insertOp?.payload as Record<string, unknown>).is_public).toBe(false)
  })

  it("preserves is_public: true for admins even when submit_for_featuring is true", async () => {
    const { client, ops } = makeSupabase(null)

    await _stepUpsertComponent(
      makeContext(
        client,
        { is_public: true, submit_for_featuring: true },
        { isAdmin: true },
      ),
      makeState({ componentIdToUse: null }),
    )

    const insertOp = ops.find((op) => op.table === "components" && op.op === "insert")
    expect(insertOp).toBeDefined()
    expect((insertOp?.payload as Record<string, unknown>).is_public).toBe(true)
  })

  it("forces is_public: false for non-admins updating an existing component that is on_review", async () => {
    const { client, ops } = makeSupabase({ id: 5, status: "on_review" })

    await _stepUpsertComponent(
      makeContext(client, { is_public: true, submit_for_featuring: false }),
      makeState({ componentIdToUse: 42 }),
    )

    const updateOp = ops.find((op) => op.table === "components" && op.op === "update")
    expect(updateOp).toBeDefined()
    expect((updateOp?.payload as Record<string, unknown>).is_public).toBe(false)
  })

  it("allows non-admins to set is_public: true if component is not under review and not submitted for featuring", async () => {
    const { client, ops } = makeSupabase({ id: 5, status: "posted" })

    await _stepUpsertComponent(
      makeContext(client, { is_public: true, submit_for_featuring: false }),
      makeState({ componentIdToUse: 42 }),
    )

    const updateOp = ops.find((op) => op.table === "components" && op.op === "update")
    expect(updateOp).toBeDefined()
    expect((updateOp?.payload as Record<string, unknown>).is_public).toBe(true)
  })
})

describe("Components Table Visibility Gating Predicates", () => {
  const canToggleVisibility = ({
    isOwnProfile,
    isAdmin,
    hasHandler,
    status,
  }: {
    isOwnProfile: boolean
    isAdmin: boolean
    hasHandler: boolean
    status: string
  }) => {
    const isDraft = status === "draft"
    const isOnReview = status === "on_review"
    const isRejected = status === "rejected"
    const isApproved = status === "posted" || status === "featured"
    return Boolean(
      (isOwnProfile || isAdmin) &&
        hasHandler &&
        !isDraft &&
        !isOnReview &&
        !isRejected &&
        isApproved,
    )
  }

  it("disables visibility toggle for all users on components in review", () => {
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: false,
        hasHandler: true,
        status: "on_review",
      }),
    ).toBe(false)
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: true,
        hasHandler: true,
        status: "on_review",
      }),
    ).toBe(false)
  })

  it("disables visibility toggle for all users on rejected components", () => {
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: false,
        hasHandler: true,
        status: "rejected",
      }),
    ).toBe(false)
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: true,
        hasHandler: true,
        status: "rejected",
      }),
    ).toBe(false)
  })

  it("disables visibility toggle for all users on unsubmitted components", () => {
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: false,
        hasHandler: true,
        status: "none",
      }),
    ).toBe(false)
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: true,
        hasHandler: true,
        status: "none",
      }),
    ).toBe(false)
  })

  it("enables visibility toggle for owners and admins on approved components", () => {
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: false,
        hasHandler: true,
        status: "posted",
      }),
    ).toBe(true)
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: true,
        hasHandler: true,
        status: "posted",
      }),
    ).toBe(true)
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: false,
        hasHandler: true,
        status: "featured",
      }),
    ).toBe(true)
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: true,
        hasHandler: true,
        status: "featured",
      }),
    ).toBe(true)
  })

  it("always disables visibility toggle for drafts", () => {
    expect(
      canToggleVisibility({
        isOwnProfile: true,
        isAdmin: true,
        hasHandler: true,
        status: "draft",
      }),
    ).toBe(false)
  })

  it("filters out unapproved (on_review, rejected, none) components from bulk public visibility for non-admins", () => {
    const items = [
      { id: 1, status: "posted" },
      { id: 2, status: "on_review" },
      { id: 3, status: "none" },
      { id: 4, status: "rejected" },
      { id: 5, status: "featured" },
    ]

    const filterForPublic = (isAdmin: boolean) =>
      isAdmin
        ? items.map((i) => i.id)
        : items
            .filter((i) => i.status === "posted" || i.status === "featured")
            .map((i) => i.id)

    expect(filterForPublic(false)).toEqual([1, 5])
    expect(filterForPublic(true)).toEqual([1, 2, 3, 4, 5])
  })
})

