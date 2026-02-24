/**
 * Create ndc_targets table via direct PostgreSQL connection
 * Run: npx tsx --env-file=.env.local scripts/create-ndc-table.ts
 */
import pg from 'pg';

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('Missing DATABASE_URL');
    process.exit(1);
  }

  const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to PostgreSQL');

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.ndc_targets (
      iso3 char(3) PRIMARY KEY,
      country_name text NOT NULL,
      target_year int NOT NULL DEFAULT 2030,
      target_pct_reduction numeric,
      target_abs_mtco2e numeric,
      reference_year int,
      base_year_value numeric,
      submission_status text NOT NULL DEFAULT 'not_submitted',
      source_url text,
      updated_at timestamptz DEFAULT now()
    );
  `);
  console.log('Table created');

  await client.query(`ALTER TABLE public.ndc_targets ENABLE ROW LEVEL SECURITY;`);
  await client.query(`DROP POLICY IF EXISTS public_read_ndc ON public.ndc_targets;`);
  await client.query(`CREATE POLICY public_read_ndc ON public.ndc_targets FOR SELECT USING (true);`);
  await client.query(`DROP POLICY IF EXISTS service_all_ndc ON public.ndc_targets;`);
  await client.query(`CREATE POLICY service_all_ndc ON public.ndc_targets FOR ALL USING (true) WITH CHECK (true);`);
  console.log('RLS policies created');

  await client.query(`NOTIFY pgrst, 'reload schema';`);
  console.log('Schema cache reload notified');

  await client.end();
  console.log('Done');
}

main().catch(err => { console.error(err); process.exit(1); });
