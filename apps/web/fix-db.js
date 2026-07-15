const { Client } = require('pg');

async function main() {
  const client = new Client({ connectionString: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL });
  try {
    await client.connect();
    console.log("Connected to DB.");

    // 1. Create component_analytics if it doesn't exist just in case
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.component_analytics (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        component_id INTEGER REFERENCES public.components(id) ON DELETE CASCADE,
        activity_type VARCHAR,
        user_id UUID,
        anon_id VARCHAR
      );
    `);

    // 2. Create the materialized view
    console.log("Creating materialized view...");
    await client.query(`
      CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_component_analytics AS
      SELECT component_id, activity_type, count(*) as count
      FROM public.component_analytics
      GROUP BY component_id, activity_type;
    `);

    // 3. Create index
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_component_analytics_unique 
      ON public.mv_component_analytics (component_id, activity_type);
    `).catch(e => console.log("Index already exists or error:", e.message));

    // 4. Reload PostgREST schema cache
    console.log("Reloading schema cache...");
    await client.query(`NOTIFY pgrst, 'reload schema';`);
    
    console.log("Database fixed successfully!");
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await client.end();
  }
}

main();
