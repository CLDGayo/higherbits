import { readFileSync, readdirSync, statSync } from "node:fs"
import path from "node:path"
import { describe, expect, it } from "vitest"

const repoRoot = path.resolve(__dirname, "../../../..")
const readRepo = (file: string) => readFileSync(path.join(repoRoot, file), "utf8")

/**
 * Checked-in inventory for every application/database reader named by RP-04e.
 * Entries marked `live-only` are intentionally recorded as unverified, not
 * counted as source-level passes: source mocks cannot prove deployed grants.
 */
const READER_CENSUS = [
  ["publisher", "apps/web/app/api/admin/auto-index/publish/route.ts", "finalize_auto_index_candidate"],
  ["snapshot", "apps/web/lib/api/server/auto-index-snapshot.ts", "auto_index_component_has_current_approval"],
  ["search", "apps/web/lib/api/server/auto-index-search.ts", "currentApprovedAutoIndexComponentIds"],
  ["GHL HTML", "apps/web/app/api/ghl-embed/[demoId]/route.ts", "auto_index_component_has_current_approval"],
  ["bundle HTML", "apps/web/app/api/bundle/route.ts", "approvedAutoIndexSnapshot"],
  ["landing catalogue", "apps/web/lib/landing-catalogue-rows.ts", "currentApprovedAutoIndexComponentIds"],
  ["landing authors", "apps/web/lib/landing-authors.ts", "currentApprovedAutoIndexComponentIds"],
  ["featured", "apps/web/lib/landing-featured-example.ts", "currentApprovedAutoIndexComponentIds"],
  ["sitemap", "apps/web/app/sitemap.ts", "currentApprovedAutoIndexComponentIds"],
  ["profile aggregate", "apps/web/app/[username]/page.tsx", "auto_index_components_with_current_approval"],
  ["profile OG aggregate", "apps/web/app/[username]/opengraph-image.tsx", "currentApprovedAutoIndexComponentIds"],
  ["component detail", "apps/web/app/[username]/[component_slug]/page.tsx", "approvedAutoIndexSnapshot"],
  ["component demo list", "apps/web/lib/queries.ts", "auto_index_components_with_current_approval"],
  ["component OG", "apps/web/app/[username]/[component_slug]/opengraph-image.tsx", "currentApprovedAutoIndexComponentIds"],
  ["demo OG", "apps/web/app/[username]/[component_slug]/[demo_slug]/opengraph-image.tsx", "currentApprovedAutoIndexComponentIds"],
  ["marketplace, profiles, bookmarks, liked, hunt", "supabase/rpc-functions.sql", "auto_index_component_has_current_approval"],
  ["embedding RPCs", "supabase/search-functions.sql", "auto_index_component_has_current_approval"],
  ["public full-code views", "supabase/views.sql", "auto_index_public_component_ids"],
  ["author listing", "apps/web/app/actions/authors.ts", "currentApprovedAutoIndexComponentIds"],
  ["platform aggregate", "apps/web/app/api/platform/stats/route.ts", "currentApprovedAutoIndexComponentIds"],
  ["author aggregate", "apps/web/app/api/author/stats/route.ts", "currentApprovedAutoIndexComponentIds"],
  ["studio earnings aggregate", "apps/web/components/features/studio/overview/overview-data.ts", "getToken({ template: \"supabase\" })"],
  ["category preview replacement", "apps/web/app/actions/public-catalogue.ts", "getPublicCategoryPreviews"],
  ["collection component replacement", "apps/web/app/actions/public-catalogue.ts", "getPublicCollectionDemos"],
] as const

const RPC_FUNCTIONS = [
  "get_user_profile_demo_list",
  "get_user_profile_demo_list_v2",
  "get_user_components_counts",
  "get_user_state",
  "get_user_bookmarks_list",
  "get_daily_user_earnings_v2",
  "get_demos_list_v2",
  "get_demos_submissions",
  "get_admin_demos_submissions",
  "get_admin_liked_demos_v1",
  "get_collections_v1",
  "get_hunt_demos_list_v2",
] as const

const VIEW_NAMES = [
  "auto_index_public_component_ids",
  "components_with_username",
  "component_dependencies_graph_view_v3",
  "demo_hunt_leaderboard",
] as const

const UNVERIFIED_LIVE_GATES = [
  "Deployed function definitions and effective/default ACLs for legacy RPCs; migration revokes any overloads of get_active_authors_with_top_components, get_section_previews, get_collection_components_v1, and search_demos_ai if present.",
  "The checked-in source does not define legacy search_demos_ai; its deployed definition, caller inventory, and ACLs remain unknown.",
  "No isolated/disposable SQL target or safe migration/readback procedure is proven; SQL semantics, role membership, locks, and atomicity remain unverified.",
  "AUTO_INDEX_STAGE_DATABASE_URL and AUTO_INDEX_REVIEWER_DATABASE_URL are not provisioned/proven as distinct deployed login identities; owner/editor audit evidence is missing.",
  "Author-stats and studio earnings reads now use the requester's Clerk Supabase JWT and database-backed owner/admin checks; live JWT-template behavior and deployed owner/admin data still require verification.",
] as const

function collectSourceFiles(directory: string): string[] {
  const absolute = path.join(repoRoot, directory)
  return readdirSync(absolute).flatMap((entry) => {
    if (entry === "node_modules" || entry.startsWith(".next")) return []
    const child = path.join(absolute, entry)
    const relative = path.relative(repoRoot, child)
    if (statSync(child).isDirectory()) return collectSourceFiles(relative)
    return /\.(?:ts|tsx)$/.test(entry) && !/\.(?:test|spec)\.(?:ts|tsx)$/.test(entry)
      ? [relative]
      : []
  })
}

const DIRECT_SUPABASE_SELECT_CALLSITES: Record<string, number> = {
  "apps/web/app/[username]/[component_slug]/page.client.tsx": 2,
  "apps/web/app/[username]/page.tsx": 2,
  "apps/web/app/actions/authors.ts": 2,
  "apps/web/app/actions/public-catalogue.ts": 4,
  "apps/web/app/api/admin/auto-index/route.ts": 2,
  "apps/web/app/api/admin/submissions/route.ts": 2,
  "apps/web/app/api/author/stats/route.ts": 1,
  "apps/web/app/api/bundle/route.ts": 1,
  "apps/web/app/api/ghl-embed/[demoId]/route.ts": 2,
  "apps/web/app/api/platform/stats/route.ts": 1,
  "apps/web/app/api/studio/preprocess-component/route.ts": 1,
  "apps/web/app/sitemap.ts": 1,
  "apps/web/app/studio/[username]/components/page.tsx": 1,
  "apps/web/components/features/admin/hooks/useSubmissions.ts": 2,
  "apps/web/components/features/publish/hooks/use-is-check-slug-available.ts": 3,
  "apps/web/components/features/studio/editor/utils/component-lookup.ts": 1,
  "apps/web/components/features/studio/overview/overview-data.ts": 1,
  "apps/web/components/features/studio/publish/hooks/use-component-data.ts": 2,
  "apps/web/components/features/studio/publish/hooks/use-is-check-slug-available.ts": 3,
  "apps/web/components/features/studio/publish/hooks/use-submit-component.ts": 1,
  "apps/web/components/features/studio/sandbox/components/add-registry-modal.tsx": 1,
  "apps/web/hooks/use-compile-css.ts": 1,
  "apps/web/lib/api/server/auto-index-search.ts": 1,
  "apps/web/lib/api/server/copy-source.ts": 3,
  "apps/web/lib/landing-authors.ts": 1,
  "apps/web/lib/landing-catalogue-rows.ts": 3,
  "apps/web/lib/landing-featured-example.ts": 1,
  "apps/web/lib/queries.ts": 7,
  "apps/web/lib/registry.ts": 1,
  "apps/web/scripts/backfill-ghl.ts": 2,
  "apps/web/scripts/capture-thumbnails.ts": 1,
  "apps/web/scripts/compile-missing-bundles.ts": 2,
  "apps/web/scripts/compile-missing-demos.ts": 2,
  "apps/web/scripts/generate-embeddings.ts": 2,
  "supabase/functions/generate-embeddings/index.ts": 4,
  "supabase/functions/notify/index.ts": 1,
  "supabase/functions/search-embeddings/index.ts": 2,
}

const SQL_DIRECT_BASE_TABLE_READERS: Record<string, string[]> = {
  "supabase/rpc-functions.sql": [
    "get_user_profile_demo_list", "get_user_profile_demo_list_v2", "get_user_components_counts",
    "get_user_state", "get_user_bookmarks_list", "get_daily_user_earnings_v2", "get_demos_list_v2",
    "get_demos_submissions", "get_admin_demos_submissions", "get_admin_liked_demos_v1",
    "get_collections_v1", "get_hunt_demos_list_v2", "purchase_component", "record_mcp_component_usage",
  ],
  "supabase/search-functions.sql": ["match_embeddings_with_details", "search_demos_ai_oai_extended"],
  "supabase/views.sql": [
    "auto_index_public_component_ids", "components_with_username",
    "component_dependencies_graph_view_v3", "demo_hunt_leaderboard",
  ],
}

function sqlFunctionBlock(source: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const matches = source.match(new RegExp(`CREATE(?: OR REPLACE)? FUNCTION public\\.${escaped}\\b[\\s\\S]*?\\$\\$;`, "i"))
  return matches?.[0] ?? null
}

function sqlViewBlock(source: string, name: string): string | null {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const matches = source.match(new RegExp(`CREATE OR REPLACE VIEW public\\.${escaped}\\b[\\s\\S]*?;`, "i"))
  return matches?.[0] ?? null
}

function collectDirectSelectCallsites(directories: string[]): Record<string, number> {
  const callsites: Record<string, number> = {}
  const directSelect = /\.from\(\s*["'](?:components|demos)["']\s*\)\s*\.select\s*\(/g
  for (const directory of directories) {
    for (const file of collectSourceFiles(directory)) {
      const matches = readRepo(file).match(directSelect)
      if (matches?.length) callsites[file] = matches.length
    }
  }
  return callsites
}

function collectSqlReaders(file: string, kind: "function" | "view"): string[] {
  const source = readRepo(file)
  const expression = kind === "function"
    ? /CREATE(?: OR REPLACE)? FUNCTION public\.([\w]+)\b[\s\S]*?\$\$;/gi
    : /CREATE OR REPLACE VIEW public\.([\w]+)\b[\s\S]*?;/gi
  return Array.from(source.matchAll(expression))
    .filter((match) => /\b(?:FROM|JOIN)\s+public\.(?:components|demos)\b/i.test(match[0]))
    .flatMap((match) => match[1] ? [match[1]] : [])
    .sort()
}

describe("auto-index public reader census", () => {
  it("records every planned reader surface and its source-level guard", () => {
    for (const [surface, file, proof] of READER_CENSUS) {
      const source = readRepo(file)
      expect(source, `${surface} source file exists`).toBeTruthy()
      expect(source, `${surface} is tied to its expected admission boundary`).toContain(proof)
    }

    expect(UNVERIFIED_LIVE_GATES).toHaveLength(5)
    expect(UNVERIFIED_LIVE_GATES.join("\n")).toContain("effective/default ACLs")
    expect(UNVERIFIED_LIVE_GATES.join("\n")).toContain("isolated/disposable SQL target")
  })

  it("keeps every checked-in reader RPC definition byte-for-byte aligned with the additive migration", () => {
    const source = readRepo("supabase/rpc-functions.sql")
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")

    for (const name of RPC_FUNCTIONS) {
      const definition = sqlFunctionBlock(source, name)
      expect(definition, `${name} is checked into the source bundle`).not.toBeNull()
      expect(sqlFunctionBlock(migration, name), `${name} is in the migration`).toBe(definition)
    }
    const earnings = sqlFunctionBlock(source, "get_daily_user_earnings_v2") ?? ""
    expect(earnings).toContain("p_user_id = public.requesting_user_id()")
    expect(earnings).toContain("requester.is_admin = true")
    expect(readRepo("apps/web/app/api/author/stats/route.ts")).toContain(
      "Authorization: `Bearer ${supabaseJwt}`",
    )
    expect(readRepo("apps/web/components/features/studio/overview/overview-data.ts")).toContain(
      "Authorization: `Bearer ${supabaseJwt}`",
    )
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.get_admin_demos_submissions")
    expect(migration).toContain("TO service_role;")
  })

  it("keeps full-code views and embedding RPCs provenance-gated in source and migration", () => {
    const viewSource = readRepo("supabase/views.sql")
    const searchSource = readRepo("supabase/search-functions.sql")
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")

    for (const name of VIEW_NAMES) {
      const definition = sqlViewBlock(viewSource, name)
      expect(definition, `${name} source view`).not.toBeNull()
      expect(sqlViewBlock(migration, name), `${name} migration view`).toBe(definition)
    }
    for (const name of ["match_embeddings_with_details", "search_demos_ai_oai_v2", "search_demos_ai_oai_extended"]) {
      const definition = sqlFunctionBlock(searchSource, name)
      expect(definition, `${name} source RPC`).not.toBeNull()
      expect(sqlFunctionBlock(migration, name), `${name} migration RPC`).toBe(definition)
    }
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.match_embeddings(vector,double precision,integer,text,text)")
    for (const name of ["match_embeddings_with_details", "search_demos_ai_oai_extended"]) {
      const definition = sqlFunctionBlock(searchSource, name) ?? ""
      expect(definition).not.toContain("to_jsonb(c.*)")
      expect(definition).toContain("'description', c.description")
      expect(definition).toContain("'code', c.code")
      expect(definition).toContain("'registry', c.registry")
      expect(definition).toContain("'direct_registry_dependencies', c.direct_registry_dependencies")
      expect(definition).toContain("'component_slug', c.component_slug")
      expect(definition).toContain("'display_username', u.display_username")
      expect(definition).toContain("LEAST(GREATEST(coalesce(match_threshold,0.33),0.33),0.95)")
      expect(sqlFunctionBlock(migration, name)).toBe(definition)
    }
    expect(sqlFunctionBlock(searchSource, "match_embeddings_with_details")).toContain(
      "LIMIT LEAST(GREATEST(coalesce(match_count,0),0),20)",
    )
  })

  it("fails if an app caller reintroduces an undocumented public-row RPC", () => {
    const forbidden = [
      "get_active_authors_with_top_components",
      "get_section_previews",
      "get_collection_components_v1",
    ]
    const files = ["apps/web/app", "apps/web/components", "apps/web/lib"]
      .flatMap(collectSourceFiles)

    for (const file of files) {
      const source = readRepo(file)
      for (const name of forbidden) {
        expect(source, `${file} must not call undocumented ${name}`).not.toContain(`.rpc("${name}"`)
        expect(source, `${file} must not call undocumented ${name}`).not.toContain(`.rpc('${name}'`)
      }
    }
  })

  it("classifies every checked-in direct component/demo SELECT callsite", () => {
    expect(collectDirectSelectCallsites(["apps/web/app", "apps/web/components", "apps/web/lib", "apps/web/hooks", "apps/web/scripts", "supabase/functions"]))
      .toEqual(DIRECT_SUPABASE_SELECT_CALLSITES)

    for (const [file, expected] of Object.entries(SQL_DIRECT_BASE_TABLE_READERS)) {
      const actual = collectSqlReaders(file, file.endsWith("views.sql") ? "view" : "function")
      expect(actual, `${file} base-table reader inventory`).toEqual([...expected].sort())
    }
  })

  it("keeps direct REST reads behind owner-preserving current-provenance RLS guards", () => {
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")
    const restore = readRepo("supabase/restore-authenticated-grants.sql")
    const verifier = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.verify.sql")

    for (const source of [migration, restore]) {
      expect(source).toContain("CREATE POLICY auto_index_public_provenance_guard ON public.components AS RESTRICTIVE")
      expect(source).toContain("CREATE POLICY auto_index_public_provenance_guard ON public.demos AS RESTRICTIVE")
      expect(source).toContain("user_id=auth.jwt()->>'sub' OR public.auto_index_component_public_select_allowed")
    }
    const helper = sqlFunctionBlock(migration, "auto_index_component_public_select_allowed") ?? ""
    expect(helper).toContain("component.is_public IS DISTINCT FROM true")
    expect(helper).toContain("component.registry IS DISTINCT FROM 'auto-index'")
    expect(helper).toContain("auto_index_component_has_current_approval")
    expect(migration).toContain("REVOKE SELECT ON public.components,public.demos FROM PUBLIC,anon")
    expect(verifier).toContain("auto_index_component_public_select_allowed")
    expect(verifier).toContain("NOT policy.polpermissive")
  })

  it("preserves the public component card reader with column-limited access and provenance RLS", () => {
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")
    const verifier = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.verify.sql")

    expect(migration).toContain("CREATE POLICY components_anon_public_select ON public.components AS PERMISSIVE")
    expect(migration).toContain("CREATE POLICY components_anon_public_provenance_guard ON public.components AS RESTRICTIVE")
    expect(migration).toContain("FOR SELECT TO anon USING (public.auto_index_component_public_select_allowed(id))")
    expect(migration).toContain("GRANT SELECT ON public.components_with_username TO anon,authenticated,service_role")
    expect(migration).toContain("video_url\n) ON public.components TO anon")
    expect(verifier).toContain("components_anon_public_select")
    expect(verifier).toContain("components_anon_public_provenance_guard")
    expect(verifier).toContain("has_column_privilege('anon','public.components','code','SELECT')")
    expect(verifier).toContain("public.components_with_username','SELECT')")
    expect(verifier).toContain("NOT has_function_privilege('anon','public.auto_index_component_public_select_allowed(bigint)','EXECUTE')")
  })

  it("bridges only the pre-migration public legacy set while requiring provenance for new approvals", () => {
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")
    const verifier = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.verify.sql")
    const approval = sqlFunctionBlock(migration, "auto_index_component_has_current_approval") ?? ""
    const decisionGuard = sqlFunctionBlock(migration, "auto_index_decision_guard") ?? ""
    const publicationGuard = sqlFunctionBlock(migration, "auto_index_publication_review_provenance_guard") ?? ""

    expect(migration).toContain("CREATE TABLE public.auto_index_legacy_publication_bridge")
    expect(migration).toContain("INSERT INTO public.auto_index_legacy_publication_bridge")
    expect(migration).toContain("component.is_public IS TRUE")
    expect(migration).toContain("source.opted_out IS FALSE")
    expect(migration).toContain("publication.delisted_at IS NULL AND publication.superseded_at IS NULL")
    expect(migration).toContain("decision.review_provenance_id IS NULL")
    expect(migration).toContain("BEFORE INSERT OR UPDATE OR DELETE ON public.auto_index_legacy_publication_bridge")

    expect(approval).toContain("source.opted_out")
    expect(approval).toContain("IF decision.review_provenance_id IS NULL THEN")
    expect(approval).toContain("public.auto_index_legacy_publication_bridge")
    expect(approval).toContain("component.is_public IS TRUE")
    expect(approval).toContain("component.registry='auto-index'")
    expect(decisionGuard).toContain("approved decision requires valid reviewer provenance")
    expect(publicationGuard).toContain("decision.review_provenance_id IS NOT NULL")
    expect(migration).toContain("BEFORE INSERT ON public.auto_index_publications")
    expect(verifier).toContain("public.auto_index_legacy_publication_bridge")
    expect(verifier).toContain("approved decision requires valid reviewer provenance")
  })

  it("preserves old publication payload and serializes reviewer retries", () => {
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")
    const publicationGuards = readRepo("supabase/migrations/20260929_auto_indexer.sql")
    const verifier = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.verify.sql")
    const finalizer = sqlFunctionBlock(migration, "finalize_auto_index_candidate") ?? ""
    const review = sqlFunctionBlock(migration, "auto_index_record_human_review") ?? ""

    expect(migration).toContain("CREATE TABLE public.auto_index_publication_supersessions")
    expect(migration).toContain("PRIMARY KEY (legacy_source_id,legacy_item_key,legacy_approved_decision_id)")
    expect(migration).toContain("BEFORE INSERT OR UPDATE OR DELETE ON public.auto_index_publication_supersessions")
    expect(migration).not.toContain("DROP INDEX IF EXISTS public.auto_index_one_active_publication")
    expect(migration).toContain("legacy.delisted_at IS NOT NULL OR legacy.superseded_at IS NULL")
    expect(verifier).toContain("CREATE UNIQUE INDEX%ON public.auto_index_publications USING btree (source_id, item_key)%WHERE%delisted_at IS NULL%superseded_at IS NULL%")
    expect(finalizer).toContain("INSERT INTO public.auto_index_publication_supersessions")
    expect(finalizer).toContain("UPDATE public.auto_index_publications publication SET superseded_at=clock_timestamp()")
    expect(finalizer.indexOf("UPDATE public.auto_index_publications publication SET superseded_at=clock_timestamp()")).toBeLessThan(
      finalizer.indexOf("INSERT INTO public.auto_index_publications"),
    )
    expect(finalizer.indexOf("INSERT INTO public.auto_index_publications")).toBeLessThan(
      finalizer.indexOf("INSERT INTO public.auto_index_publication_supersessions"),
    )
    expect(finalizer).not.toContain("UPDATE public.demos")
    expect(finalizer).toContain("lower(c.license_spdx),false) RETURNING id INTO component_id")
    expect(finalizer).toContain("UPDATE public.components SET is_public=true WHERE id=component_id AND NOT is_public")
    expect(finalizer.indexOf("INSERT INTO public.auto_index_publications")).toBeLessThan(
      finalizer.indexOf("UPDATE public.components SET is_public=true"),
    )
    expect(publicationGuards).toContain("TG_OP='INSERT' AND NOT x.is_public")
    expect(publicationGuards).toContain("auto_index_component_visibility_insert_guard BEFORE INSERT ON public.components")
    expect(finalizer).not.toContain("DELETE FROM public.auto_index_copy_prompts")
    expect(finalizer).toContain("publication_component_slug:=left(meta.component_slug,58)||'-r'||d.id::text")
    expect(review.indexOf("FOR UPDATE")).toBeLessThan(review.indexOf("WHERE idempotency_key=p_idempotency_key"))
    const reviewRoute = readRepo("apps/web/app/api/admin/auto-index/review/[candidateId]/route.ts")
    const finalizeRoute = readRepo("apps/web/app/api/admin/auto-index/finalize/route.ts")
    const reviewerDatabase = readRepo("apps/web/lib/auto-index/reviewer-database.ts")
    expect(reviewRoute).toContain("const admin = await requireAutoIndexAdmin()")
    expect(reviewRoute).toContain('process.env.NEXT_PUBLIC_APP_URL || SITE_URL')
    expect(reviewRoute).toContain("${admin.userId}::text")
    expect(reviewRoute).toContain("getAutoIndexReviewerDatabase()")
    expect(reviewRoute).not.toContain("review.reviewerUserId")
    expect(finalizeRoute).toContain("const admin = await requireAutoIndexAdmin()")
    expect(finalizeRoute).toContain('process.env.NEXT_PUBLIC_APP_URL || SITE_URL')
    expect(finalizeRoute).toContain("getAutoIndexReviewerDatabase()")
    expect(reviewerDatabase).toContain('process.env.AUTO_INDEX_REVIEWER_DATABASE_URL')
    expect(reviewerDatabase).not.toContain('process.env.DATABASE_URL')
    expect(reviewerDatabase).not.toContain('supabaseWithAdminAccess')
    const reviewUi = readRepo("apps/web/app/admin/auto-index/page.tsx")
    expect(reviewUi).toContain("idempotencyKey: reviewIdempotencyKey")
    expect(reviewUi).toContain("sessionStorage.getItem(storageKey)")
    expect(reviewUi).toContain("sessionStorage.setItem(storageKey, key)")
  })

  it("rejects changes or deletion of reviewed component and demo payloads", () => {
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")
    const verifier = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.verify.sql")
    const guard = sqlFunctionBlock(migration, "auto_index_reviewed_payload_guard") ?? ""

    expect(guard).toContain("SECURITY DEFINER")
    expect(guard).toContain("FROM public.auto_index_publications publication")
    expect(guard).toContain("publication.component_id=OLD.id")
    expect(guard).toContain("publication.component_id=NEW.component_id")
    expect(guard).toContain("publication.component_id IN (OLD.component_id,NEW.component_id)")
    expect(guard).toContain("to_jsonb(OLD)")
    expect(guard).toContain("to_jsonb(NEW)")
    expect(guard).toContain("reviewed auto-index component payload is immutable")
    expect(guard).toContain("reviewed auto-index demo payload is immutable")
    expect(guard).toContain("reviewed auto-index component payload cannot be deleted")
    expect(guard).toContain("reviewed auto-index demo payload cannot be deleted")
    expect(guard).toContain("unreviewed demo cannot be added to a reviewed auto-index component")
    expect(migration).toContain("BEFORE UPDATE OF id,created_at,component_names")
    expect(migration).toContain("BEFORE INSERT OR UPDATE OF id,created_at,component_id")
    expect(verifier).toContain("reviewed component/demo payload freeze contract is missing")
    expect(verifier).toContain("auto_index_reviewed_component_payload_guard")
    expect(verifier).toContain("auto_index_reviewed_demo_payload_guard")
    expect(verifier).toContain("publication.component_idin(old.component_id,new.component_id)")
    expect(verifier).toContain("unreviewed demo cannot be added to a reviewed auto-index component")
    expect(verifier).toContain("(trigger.tgtype & 4)=4")
  })

  it("verifies exact stage/reviewer role capabilities, membership closure, and object ownership", () => {
    const verifier = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.verify.sql")
    for (const fragment of [
      "rolcanlogin", "rolsuper", "rolinherit", "rolcreatedb", "rolcreaterole", "rolreplication", "rolbypassrls",
      "has_schema_privilege('auto_index_stage','public','CREATE')",
      "has_schema_privilege('auto_index_reviewer','public','CREATE')",
      "WITH RECURSIVE membership_closure", "WITH RECURSIVE granted_to_closure",
      "member.rolname='postgres' AND grantor.rolname='supabase_admin'",
      "edge.admin_option AND NOT edge.inherit_option AND NOT edge.set_option",
      "whens.kind=''custom_manifest''andlower(s.owner_label)=''vgpu''then''vgpu''",
      "elsifs.kind=''official_registry''andp_preview_asset_slug=v_emitter||''-''||p_component_slug",
      "membership.roleid=closure.member_oid", "'postgres'", "'supabase_admin'", "'authenticator'", "'service_role'",
      "protected.relowner", "protected.proowner", "auto_index_publication_supersessions",
      "auto_index_publication_guard", "auto_index_publication_visibility",
      "auto_index_component_visibility_guard", "auto_index_history_immutable", "auto_index_claim_owner_guard",
      "auto_index_reviewed_payload_guard",
    ]) expect(verifier).toContain(fragment)
  })

  it("keeps reviewer and decision sequences private after authenticated grants are restored", () => {
    const migration = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.sql")
    const restore = readRepo("supabase/restore-authenticated-grants.sql")
    const verifier = readRepo("supabase/migrations/20261008_auto_index_reviewer_provenance.verify.sql")
    const broadGrant = restore.indexOf("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated")
    const protectedRevoke = restore.indexOf("REVOKE ALL ON SEQUENCE public.auto_index_review_provenance_id_seq")
    expect(broadGrant).toBeGreaterThanOrEqual(0)
    expect(protectedRevoke).toBeGreaterThan(broadGrant)
    expect(restore.slice(protectedRevoke, protectedRevoke + 240)).toContain("public.auto_index_decisions_id_seq")
    expect(migration).toContain("REVOKE ALL ON SEQUENCE public.auto_index_decisions_id_seq FROM PUBLIC,anon,authenticated")
    expect(verifier).toContain("has_sequence_privilege('authenticated','public.auto_index_review_provenance_id_seq'")
    expect(verifier).toContain("has_sequence_privilege('authenticated','public.auto_index_decisions_id_seq'")
  })
})
