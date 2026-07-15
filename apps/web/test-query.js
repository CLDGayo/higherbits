const { Client } = require('pg');
async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL });
  try {
    await client.connect();
    const { rows } = await client.query(`SELECT id, name, is_public, component_slug FROM public.components;`);
    console.log(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
main();
