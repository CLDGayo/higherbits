const { Client } = require('pg');
const client = new Client({
  connectionString: process.env.DIRECT_DATABASE_URL,
});

async function main() {
  await client.connect();
  const res = await client.query(`SELECT * FROM pg_policies WHERE tablename = 'users'`);
  console.log(res.rows);
  await client.end();
}
main();
