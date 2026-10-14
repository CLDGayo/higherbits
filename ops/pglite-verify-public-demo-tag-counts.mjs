#!/usr/bin/env node
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const db = new PGlite()
try {
  await db.exec(`
    CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
    CREATE TABLE public.public_profiles (id integer PRIMARY KEY);
    CREATE TABLE public.components (id integer PRIMARY KEY, user_id integer, is_public boolean, registry text);
    CREATE TABLE public.demos (id integer PRIMARY KEY, component_id integer, user_id integer);
    CREATE TABLE public.tags (id integer PRIMARY KEY, slug text);
    CREATE TABLE public.demo_tags (demo_id integer, tag_id integer);
    CREATE TABLE public.approved_components (component_id integer);
    CREATE FUNCTION public.auto_index_component_has_current_approval(component_id integer)
    RETURNS boolean LANGUAGE sql STABLE AS $$
      SELECT EXISTS (SELECT 1 FROM public.approved_components a WHERE a.component_id = $1)
    $$;
  `)
  await db.exec(await readFile(resolve('supabase/migrations/20261013_public_demo_tag_counts.sql'), 'utf8'))
  await db.exec(await readFile(resolve('supabase/migrations/20261013_public_demo_tag_counts.verify.sql'), 'utf8'))
  const { rows } = await db.query('SELECT * FROM public.get_public_demo_tag_counts() ORDER BY slug')
  if (JSON.stringify(rows) !== JSON.stringify([{ slug: 'gradients', demo_count: 1 }, { slug: 'hero', demo_count: 2 }])) {
    throw new Error(`Wrong public counts: ${JSON.stringify(rows)}`)
  }
  const privileges = await db.query(`SELECT
    has_function_privilege('anon','public.get_public_demo_tag_counts()','EXECUTE') AS anon,
    has_function_privilege('authenticated','public.get_public_demo_tag_counts()','EXECUTE') AS authenticated,
    has_function_privilege('service_role','public.get_public_demo_tag_counts()','EXECUTE') AS service`)
  if (privileges.rows[0]?.anon || privileges.rows[0]?.authenticated || !privileges.rows[0]?.service) {
    throw new Error(`Wrong EXECUTE grants: ${JSON.stringify(privileges.rows[0])}`)
  }
  console.log('Public demo tag counts and service-only EXECUTE: PASS')
} finally {
  await db.close()
}
