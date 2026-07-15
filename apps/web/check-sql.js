const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL || "postgres://postgres:postgres@127.0.0.1:54322/postgres" });
async function main() {
  await client.connect();
  const res = await client.query(`SELECT table_name FROM information_schema.views WHERE table_name = 'mv_component_analytics'`);
  console.log("views:", res.rows);
  const mviews = await client.query(`SELECT matviewname FROM pg_matviews WHERE matviewname = 'mv_component_analytics'`);
  console.log("mviews:", mviews.rows);
  const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name = 'component_analytics'`);
  console.log("tables:", tables.rows);
  await client.end();
}
main();
