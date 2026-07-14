const postgres = require('postgres');

const sql = postgres(process.env.DIRECT_DATABASE_URL);

async function main() {
  const policies = await sql`SELECT tablename, policyname, qual, with_check FROM pg_policies WHERE tablename IN ('components', 'demos', 'submissions', 'users')`;
  console.log(policies);
  process.exit(0);
}
main();
