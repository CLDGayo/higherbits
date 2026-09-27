import { test } from "node:test"
import assert from "node:assert/strict"
import { run } from "../claim-admin.mjs"

// Minimal chainable supabase mock. Records every write; reads come from `db`.
function mockSupabase({ db, failUpdate = {} } = {}) {
  const writes = []
  const client = {
    writes,
    from(table) {
      const q = { table, op: "select", filters: {}, payload: null }
      const builder = {
        select() { return builder },
        update(payload) { q.op = "update"; q.payload = payload; return builder },
        delete() { q.op = "delete"; return builder },
        insert() { q.op = "insert"; return builder },
        upsert() { q.op = "upsert"; return builder },
        eq(col, val) { q.filters[col] = val; return builder },
        maybeSingle() {
          const rows = match()
          return Promise.resolve({ data: rows[0] ?? null, error: null })
        },
        then(resolve, reject) {
          if (q.op === "select") return Promise.resolve({ data: match(), error: null }).then(resolve, reject)
          const key = `${table}:${q.op}`
          const shouldFail = typeof failUpdate[key] === "function" ? failUpdate[key](q) : failUpdate[key]
          if (shouldFail) return Promise.resolve({ data: null, error: { message: `${key} rejected` } }).then(resolve, reject)
          writes.push({ table, op: q.op, payload: q.payload, filters: { ...q.filters } })
          return Promise.resolve({ data: null, error: null }).then(resolve, reject)
        },
      }
      const match = () =>
        (db[table] ?? []).filter((r) => Object.entries(q.filters).every(([k, v]) => r[k] === v))
      return builder
    },
  }
  return client
}

const seed = () => ({
  components: [{ id: 7, name: "Button", component_slug: "button", user_id: "user_vendor", is_public: true }],
  users: [
    { id: "user_vendor", username: "vendor" },
    { id: "user_claimant", username: "claimant" },
  ],
  demos: [
    { id: 70, component_id: 7, user_id: "user_vendor" },
    { id: 71, component_id: 7, user_id: "user_vendor" },
    { id: 99, component_id: 8, user_id: "user_vendor" },
  ],
})

const exec = async (argv, supabase) => {
  const out = []
  const err = []
  const code = await run(argv, { supabase, log: (m) => out.push(m), error: (m) => err.push(m) })
  return { code, out: out.join("\n"), err: err.join("\n") }
}

test("transfer dry-run makes zero writes and prints the plan", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["transfer", "--component", "7", "--to-user", "user_claimant"], sb)
  assert.equal(r.code, 0)
  assert.equal(sb.writes.length, 0)
  assert.match(r.out, /DRY-RUN/)
  assert.match(r.out, /user_vendor -> user_claimant/)
  assert.match(r.out, /2 demo row\(s\)/)
})

test("delist dry-run makes zero writes", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["delist", "--component", "7"], sb)
  assert.equal(r.code, 0)
  assert.equal(sb.writes.length, 0)
  assert.match(r.out, /is_public true -> false/)
})

test("--execute transfer updates components.user_id and the component's demos", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["transfer", "--component", "7", "--to-user", "user_claimant", "--execute"], sb)
  assert.equal(r.code, 0, r.err)
  assert.deepEqual(sb.writes, [
    { table: "components", op: "update", payload: { user_id: "user_claimant" }, filters: { id: 7 } },
    { table: "demos", op: "update", payload: { user_id: "user_claimant" }, filters: { component_id: 7 } },
  ])
  assert.match(r.out, /\[AUDIT\].*user_vendor -> user_claimant.*70, 71/)
})

test("--execute delist sets is_public=false and never deletes", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["delist", "--component", "7", "--execute"], sb)
  assert.equal(r.code, 0, r.err)
  assert.deepEqual(sb.writes, [
    { table: "components", op: "update", payload: { is_public: false }, filters: { id: 7 } },
  ])
  assert.ok(!sb.writes.some((w) => w.op === "delete"))
})

test("E4: nonexistent --to-user exits non-zero with zero writes", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["transfer", "--component", "7", "--to-user", "user_ghost", "--execute"], sb)
  assert.equal(r.code, 1)
  assert.equal(sb.writes.length, 0)
  assert.match(r.err, /user_ghost not found/)
})

test("E4: DB rejecting the component update (FK-style) exits non-zero with zero writes", async () => {
  const sb = mockSupabase({ db: seed(), failUpdate: { "components:update": true } })
  const r = await exec(["transfer", "--component", "7", "--to-user", "user_claimant", "--execute"], sb)
  assert.equal(r.code, 1)
  assert.equal(sb.writes.length, 0)
})

test("demos update failure rolls component ownership back", async () => {
  const sb = mockSupabase({ db: seed(), failUpdate: { "demos:update": true } })
  const r = await exec(["transfer", "--component", "7", "--to-user", "user_claimant", "--execute"], sb)
  assert.equal(r.code, 1)
  assert.deepEqual(
    sb.writes.map((w) => w.payload),
    [{ user_id: "user_claimant" }, { user_id: "user_vendor" }],
  )
  assert.match(r.err, /rolled back/)
})

test("refuses more than one --component (no bulk reassignment)", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["transfer", "--component", "7", "--component", "8", "--to-user", "user_claimant", "--execute"], sb)
  assert.equal(r.code, 1)
  assert.equal(sb.writes.length, 0)
})

test("rejects unknown flags such as --vendor-account", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["transfer", "--vendor-account", "user_vendor", "--to-user", "user_claimant"], sb)
  assert.equal(r.code, 1)
  assert.equal(sb.writes.length, 0)
})

test("missing component exits non-zero", async () => {
  const sb = mockSupabase({ db: seed() })
  const r = await exec(["delist", "--component", "404", "--execute"], sb)
  assert.equal(r.code, 1)
  assert.equal(sb.writes.length, 0)
})

test("--help documents the R2 limitation", async () => {
  const r = await exec(["--help"], null)
  assert.equal(r.code, 0)
  assert.match(r.out, /does not move R2 objects/)
})
