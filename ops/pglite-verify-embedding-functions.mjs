#!/usr/bin/env node
/**
 * ops/pglite-verify-embedding-functions.mjs
 *
 * Local verification harness for supabase-interconnect Phase 02.
 *
 * Runs the REAL supabase/migrations/0001_embedding_functions.sql file through an
 * in-memory @electric-sql/pglite instance (real Postgres compiled to WASM) with the
 * pgvector extension, then exercises all 4 authored functions against seeded fixtures.
 *
 * This is the step that converts AC5-b from "mechanisms proven in isolation" (the
 * 26-07-26 feasibility probe used isomorphic mirrors) to "the actual migration file
 * is proven". A parse-only check would be a vacuous green and does NOT satisfy AC5-b.
 *
 * NEVER connects to the live Supabase database. Pure local WASM, no container,
 * no network. Ops-time-only tooling — never imported by apps/web app code.
 *
 * Usage:  node ops/pglite-verify-embedding-functions.mjs
 * Exit:   0 = all checks pass, 1 = any check failed
 */

import { readFile } from "node:fs/promises"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import { PGlite } from "@electric-sql/pglite"
import { vector } from "@electric-sql/pglite-pgvector"

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const MIGRATION_PATH = resolve(
  REPO_ROOT,
  "supabase/migrations/0001_embedding_functions.sql",
)

const DIMS = 1536
const results = []

function record(name, ok, detail) {
  results.push({ name, ok, detail })
  console.log(`=== ${name}: ${ok ? "PASS" : "FAIL"} ===`)
  if (detail !== undefined) console.log(detail)
  console.log("")
}

async function check(name, fn) {
  try {
    record(name, true, await fn())
  } catch (err) {
    record(name, false, `ERROR: ${err?.message ?? String(err)}`)
  }
}

/** A deterministic 1536-dim pgvector literal, e.g. "[0,1,2,...]". */
function testVector(seed = 0) {
  return `[${Array.from({ length: DIMS }, (_, i) => (i + seed) % 7).join(",")}]`
}

/**
 * Fixture schema. The live Supabase schema is untracked (dashboard-created), so the
 * harness reconstructs the minimum surface the migration touches, using the column
 * types recorded in apps/web/types/supabase.ts.
 */
const FIXTURE_SCHEMA = `
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE public.components (
  id   integer PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE public.demos (
  id           integer PRIMARY KEY,
  name         text NOT NULL,
  component_id integer
);

CREATE TABLE public.usage_embeddings (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id           integer NOT NULL,
  item_type         text    NOT NULL,
  embedding         vector(${DIMS}) NOT NULL,
  usage_description text,
  metadata          jsonb,
  created_at        timestamptz DEFAULT now()
);

CREATE TABLE public.code_embeddings (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id    integer NOT NULL,
  item_type  text    NOT NULL,
  embedding  vector(${DIMS}) NOT NULL,
  metadata   jsonb,
  created_at timestamptz DEFAULT now()
);
`

/**
 * pglite starts with no roles beyond the connecting user — Supabase's service_role /
 * authenticated / anon do NOT pre-exist. Any GRANT ... TO <role> in the migration fails
 * with `role "<role>" does not exist` unless the harness bootstraps it first. Rather than
 * hardcoding service_role, scan the migration for every granted role (closes feasibility
 * probe known-gap 3: "additional Supabase roles the migration references").
 */
function rolesReferencedBy(sql) {
  const roles = new Set()
  for (const m of sql.matchAll(/\bGRANT\b[\s\S]*?\bTO\s+([a-zA-Z_][a-zA-Z0-9_]*)/g)) {
    const role = m[1]
    if (role.toLowerCase() !== "public") roles.add(role)
  }
  return [...roles]
}

async function main() {
  const migrationSql = await readFile(MIGRATION_PATH, "utf8")
  const db = new PGlite({ extensions: { vector } })

  await check("0_fixture_schema", async () => {
    await db.exec(FIXTURE_SCHEMA)
    const { rows } = await db.query(
      `SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' ORDER BY table_name`,
    )
    return JSON.stringify(rows.map((r) => r.table_name))
  })

  await check("0b_bootstrap_roles", async () => {
    const roles = rolesReferencedBy(migrationSql)
    if (roles.length === 0) throw new Error("migration grants EXECUTE to no role")
    for (const role of roles) await db.exec(`CREATE ROLE ${role};`)
    return `bootstrapped roles referenced by the migration: ${JSON.stringify(roles)}`
  })

  // --- C0b(a): run the REAL migration file end to end -----------------------
  await check("1_real_migration_file_applies", async () => {
    await db.exec(migrationSql)
    const { rows } = await db.query(
      `SELECT proname FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public'
          AND proname IN ('vec_dim','get_missing_usage_embedding_items',
                          'insert_embedding','insert_code_embedding')
        ORDER BY proname`,
    )
    if (rows.length !== 4) {
      throw new Error(`expected 4 functions created, found ${rows.length}`)
    }
    return `${MIGRATION_PATH.replace(REPO_ROOT + "/", "")} applied; functions: ${JSON.stringify(
      rows.map((r) => r.proname),
    )}`
  })

  // --- C0b(b): pgvector surface the migration actually uses -----------------
  await check("1b_pgvector_surface_used_by_migration", async () => {
    const usesSimilarityOp = /<=>|<->|<#>/.test(migrationSql)
    const usesAnnIndex = /\b(hnsw|ivfflat)\b/i.test(migrationSql)
    if (usesSimilarityOp || usesAnnIndex) {
      throw new Error(
        "migration uses similarity operators / ANN index types that this harness " +
          "does not exercise — extend the harness before trusting this gate",
      )
    }
    const { rows } = await db.query(
      `SELECT udt_name FROM information_schema.columns
        WHERE table_name = 'usage_embeddings' AND column_name = 'embedding'`,
    )
    return (
      "migration uses no similarity operator (<=>) and no ANN index type " +
      `(hnsw/ivfflat) — only vector columns + vector_dims(). embedding udt: ${rows[0]?.udt_name}`
    )
  })

  // --- C2: get_missing_usage_embedding_items UNIONs BOTH source tables ------
  await check("2_get_missing_returns_both_tables", async () => {
    await db.exec(`
      INSERT INTO public.components (id, name) VALUES (101, 'seed-component');
      INSERT INTO public.demos (id, name, component_id) VALUES (201, 'seed-demo', 101);
    `)
    const { rows } = await db.query(
      `SELECT * FROM public.get_missing_usage_embedding_items()
        ORDER BY item_type, item_id`,
    )
    const got = rows.map((r) => `${r.item_type}:${r.item_id}`)
    const want = ["component:101", "demo:201"]
    if (JSON.stringify(got) !== JSON.stringify(want)) {
      throw new Error(`expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`)
    }
    return `${JSON.stringify(rows)}  (both source tables represented — UNION fix proven)`
  })

  // --- C3: insert_embedding really UPSERTS ----------------------------------
  await check("3_insert_embedding_upserts", async () => {
    await db.query(
      `SELECT public.insert_embedding($1::bigint, $2, $3::vector, $4, $5::jsonb)`,
      [101, "component", testVector(0), "first description", '{"pass":1}'],
    )
    await db.query(
      `SELECT public.insert_embedding($1::bigint, $2, $3::vector, $4, $5::jsonb)`,
      [101, "component", testVector(3), "second description", '{"pass":2}'],
    )
    const { rows } = await db.query(
      `SELECT usage_description, metadata, vec_dim(embedding) AS dims,
              (embedding = $1::vector) AS holds_second_vector
         FROM public.usage_embeddings
        WHERE item_id = 101 AND item_type = 'component'`,
      [testVector(3)],
    )
    if (rows.length !== 1) {
      throw new Error(`expected exactly 1 row after 2 inserts, got ${rows.length}`)
    }
    if (rows[0].usage_description !== "second description") {
      throw new Error(`row not updated: ${JSON.stringify(rows[0])}`)
    }
    if (rows[0].holds_second_vector !== true) {
      throw new Error("embedding column was not updated to the second vector")
    }
    return `1 row, updated in place: ${JSON.stringify(rows)}`
  })

  await check("4_insert_code_embedding_upserts", async () => {
    await db.query(
      `SELECT public.insert_code_embedding($1::bigint, $2, $3::vector, $4::jsonb)`,
      [201, "demo", testVector(0), '{"pass":1}'],
    )
    await db.query(
      `SELECT public.insert_code_embedding($1::bigint, $2, $3::vector, $4::jsonb)`,
      [201, "demo", testVector(5), '{"pass":2}'],
    )
    const { rows } = await db.query(
      `SELECT metadata, vec_dim(embedding) AS dims,
              (embedding = $1::vector) AS holds_second_vector
         FROM public.code_embeddings
        WHERE item_id = 201 AND item_type = 'demo'`,
      [testVector(5)],
    )
    if (rows.length !== 1) {
      throw new Error(`expected exactly 1 row after 2 inserts, got ${rows.length}`)
    }
    if (rows[0].holds_second_vector !== true) {
      throw new Error("embedding column was not updated to the second vector")
    }
    return `1 row, updated in place: ${JSON.stringify(rows)}`
  })

  // --- get_missing must now exclude the item that gained an embedding -------
  await check("5_get_missing_excludes_embedded_item", async () => {
    const { rows } = await db.query(
      `SELECT * FROM public.get_missing_usage_embedding_items()
        ORDER BY item_type, item_id`,
    )
    const got = rows.map((r) => `${r.item_type}:${r.item_id}`)
    // component:101 now has a usage_embeddings row; demo:201 only has a code embedding.
    if (JSON.stringify(got) !== JSON.stringify(["demo:201"])) {
      throw new Error(`expected ["demo:201"], got ${JSON.stringify(got)}`)
    }
    return `${JSON.stringify(rows)}  (embedded component correctly excluded)`
  })

  // --- C4: vec_dim ----------------------------------------------------------
  await check("6_vec_dim_returns_1536", async () => {
    const { rows } = await db.query(`SELECT public.vec_dim($1::vector) AS dims`, [
      testVector(0),
    ])
    if (rows[0].dims !== DIMS) {
      throw new Error(`expected ${DIMS}, got ${rows[0].dims}`)
    }
    return JSON.stringify(rows)
  })

  // --- Security-1: no PUBLIC EXECUTE on any of the 4 functions --------------
  await check("7_no_public_execute_grant", async () => {
    const fns = [
      "vec_dim",
      "get_missing_usage_embedding_items",
      "insert_embedding",
      "insert_code_embedding",
    ]
    const { rows } = await db.query(
      `SELECT p.proname,
              has_function_privilege('public', p.oid, 'EXECUTE')       AS public_execute,
              has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_execute
         FROM pg_proc p
         JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = ANY($1)
        ORDER BY p.proname`,
      [fns],
    )
    if (rows.length !== fns.length) {
      throw new Error(`expected ${fns.length} functions, found ${rows.length}`)
    }
    const leaked = rows.filter((r) => r.public_execute === true)
    if (leaked.length > 0) {
      throw new Error(
        `PUBLIC still has EXECUTE on: ${leaked.map((r) => r.proname).join(", ")}`,
      )
    }
    const ungranted = rows.filter((r) => r.service_role_execute !== true)
    if (ungranted.length > 0) {
      throw new Error(
        `service_role missing EXECUTE on: ${ungranted.map((r) => r.proname).join(", ")}`,
      )
    }
    return JSON.stringify(rows)
  })

  // --- fail-closed unique index --------------------------------------------
  await check("8_unique_index_rejects_duplicates", async () => {
    try {
      await db.query(
        `INSERT INTO public.usage_embeddings (item_id, item_type, embedding)
         VALUES (101, 'component', $1::vector)`,
        [testVector(9)],
      )
    } catch (err) {
      return `duplicate (item_id, item_type) correctly rejected: ${err.message}`
    }
    throw new Error("duplicate (item_id, item_type) insert was NOT rejected")
  })

  await db.close()

  console.log("=== FINAL SUMMARY ===")
  for (const r of results) console.log(`${r.name}: ${r.ok ? "PASS" : "FAIL"}`)
  const failed = results.filter((r) => !r.ok)
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
  if (failed.length > 0) process.exit(1)
}

main().catch((err) => {
  console.error("HARNESS ERROR:", err)
  process.exit(1)
})
