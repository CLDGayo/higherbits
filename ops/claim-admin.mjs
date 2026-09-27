#!/usr/bin/env node
// Admin tool for claim/takedown of a single component. DRY-RUN BY DEFAULT.
//
//   node ops/claim-admin.mjs transfer --component <id> --to-user <userId> [--execute]
//   node ops/claim-admin.mjs delist   --component <id> [--execute]
//
// transfer: reassigns components.user_id AND demos.user_id (every demo of that
//   component) to an existing user. Exactly one component per run; there is no
//   vendor-wide or bulk mode by design.
// delist:   sets components.is_public = false. The row is never deleted, so the
//   component can be re-listed or re-claimed later.
//
// KNOWN LIMITATION (accepted, SPEC AC16): transfer does NOT move R2 objects.
// Existing source objects stay under the old owner's key prefix. assertOwnsR2Path
// authorizes R2 writes by that prefix, so the new owner cannot overwrite or
// delete the old vendor-keyed objects in place; they must upload at their own
// path going forward. Reads are unaffected.
//
// Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY. Whoever holds
// those credentials is the authorization boundary; this is never exposed via HTTP.
import { parseArgs } from "node:util"
import { createRequire } from "node:module"
import { fileURLToPath } from "node:url"
import path from "node:path"

const USAGE = `Usage:
  node ops/claim-admin.mjs transfer --component <id> --to-user <userId> [--execute]
  node ops/claim-admin.mjs delist   --component <id> [--execute]

Dry-run by default: prints the planned change and writes nothing.
Limitation: transfer does not move R2 objects; they stay under the old owner's
key prefix, which assertOwnsR2Path still treats as the R2 write owner.`

export async function run(argv, { supabase, log = console.log, error = console.error }) {
  const fail = (msg) => {
    error(`[ERROR] ${msg}`)
    return 1
  }

  let parsed
  try {
    parsed = parseArgs({
      args: argv,
      allowPositionals: true,
      strict: true,
      options: {
        component: { type: "string", multiple: true },
        "to-user": { type: "string", multiple: true },
        execute: { type: "boolean", default: false },
        help: { type: "boolean", default: false },
      },
    })
  } catch (e) {
    return fail(`${e.message}\n${USAGE}`)
  }
  const { values, positionals } = parsed
  if (values.help) {
    log(USAGE)
    return 0
  }
  const [command] = positionals
  if (positionals.length !== 1 || !["transfer", "delist"].includes(command)) {
    return fail(USAGE)
  }
  if (values.component?.length !== 1) {
    return fail("exactly one --component <id> is required")
  }
  const componentId = Number(values.component[0])
  if (!Number.isInteger(componentId) || componentId <= 0) {
    return fail(`invalid --component id: ${values.component[0]}`)
  }
  const execute = values.execute
  const mode = execute ? "EXECUTE" : "DRY-RUN"

  const { data: component, error: compErr } = await supabase
    .from("components")
    .select("id, name, component_slug, user_id, is_public")
    .eq("id", componentId)
    .maybeSingle()
  if (compErr) return fail(`component lookup failed: ${compErr.message}`)
  if (!component) return fail(`component ${componentId} not found`)

  if (command === "delist") {
    log(
      `[${mode}] delist component ${component.id} (${component.component_slug}): ` +
        `is_public ${component.is_public} -> false`,
    )
    if (execute) {
      const { error: e } = await supabase
        .from("components")
        .update({ is_public: false })
        .eq("id", component.id)
      if (e) return fail(`delist failed: ${e.message}`)
      log(`[AUDIT] component ${component.id} is_public ${component.is_public} -> false`)
    }
    return 0
  }

  // transfer
  if (values["to-user"]?.length !== 1 || !values["to-user"][0].trim()) {
    return fail("exactly one --to-user <userId> is required for transfer")
  }
  const toUser = values["to-user"][0].trim()

  const { data: target, error: userErr } = await supabase
    .from("users")
    .select("id, username")
    .eq("id", toUser)
    .maybeSingle()
  if (userErr) return fail(`target user lookup failed: ${userErr.message}`)
  if (!target) return fail(`target user ${toUser} not found; nothing written`)

  const oldOwner = component.user_id
  if (oldOwner === target.id) {
    log(`[${mode}] component ${component.id} already owned by ${target.id}; nothing to do`)
    return 0
  }

  const { data: demos, error: demoErr } = await supabase
    .from("demos")
    .select("id, user_id")
    .eq("component_id", component.id)
  if (demoErr) return fail(`demo lookup failed: ${demoErr.message}`)

  log(
    `[${mode}] transfer component ${component.id} (${component.component_slug}): ` +
      `user_id ${oldOwner} -> ${target.id} (${target.username ?? "no username"}); ` +
      `${demos.length} demo row(s) would be reassigned`,
  )
  log("[NOTE] R2 objects are not moved; see --help for the accepted limitation.")

  if (execute) {
    // supabase-js has no client transaction: components first, then demos,
    // reverting components if the demos update fails.
    const { error: e1 } = await supabase
      .from("components")
      .update({ user_id: target.id })
      .eq("id", component.id)
    if (e1) return fail(`component update failed, nothing written: ${e1.message}`)

    const { error: e2 } = await supabase
      .from("demos")
      .update({ user_id: target.id })
      .eq("component_id", component.id)
    if (e2) {
      const { error: e3 } = await supabase
        .from("components")
        .update({ user_id: oldOwner })
        .eq("id", component.id)
      return fail(
        e3
          ? `demos update failed (${e2.message}) AND rollback failed (${e3.message}); ` +
              `component ${component.id} now owned by ${target.id}, demos by old owners — fix manually`
          : `demos update failed, component ownership rolled back: ${e2.message}`,
      )
    }
    log(
      `[AUDIT] component ${component.id} user_id ${oldOwner} -> ${target.id}; ` +
        `demos reassigned: ${demos.map((d) => d.id).join(", ") || "none"}`,
    )
  }
  return 0
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2)
  const wantsHelp = argv.includes("--help")
  let supabase = null
  if (!wantsHelp) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      console.error("[FATAL] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
      process.exit(1)
    }
    const requireFromWeb = createRequire(
      path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "apps", "web", "package.json"),
    )
    const { createClient } = requireFromWeb("@supabase/supabase-js")
    supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  run(argv, { supabase }).then(
    (code) => process.exit(code),
    (e) => {
      console.error("[FATAL]", e)
      process.exit(1)
    },
  )
}
