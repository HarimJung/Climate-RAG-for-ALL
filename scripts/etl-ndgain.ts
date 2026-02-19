/**
 * scripts/etl-ndgain.ts
 * Parses ND-GAIN vulnerability + readiness CSV for ALL countries → country_data
 * Expects local CSV files (download from https://gain.nd.edu/our-work/country-index/download-data/)
 * Place at: /tmp/ndgain/vulnerability.csv and /tmp/ndgain/readiness.csv
 * Run: npx tsx --env-file=.env.local scripts/etl-ndgain.ts
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const YEAR_START = 2000;
const YEAR_END   = 2023;

const FILES = [
  { path: '/tmp/ndgain/vulnerability.csv', code: 'NDGAIN.VULNERABILITY' },
  { path: '/tmp/ndgain/readiness.csv',     code: 'NDGAIN.READINESS'     },
];

// Try alternate paths (data directory)
const ALT_PATHS: Record<string, string> = {
  '/tmp/ndgain/vulnerability.csv': '/Users/harimgemmajung/Documents/visualclimate/data/vulnerability.csv',
  '/tmp/ndgain/readiness.csv':     '/Users/harimgemmajung/Documents/visualclimate/data/readiness.csv',
};

interface Row { country_iso3: string; indicator_code: string; year: number; value: number; source: string }

function parseCsv(filePath: string, indicatorCode: string, validIso3: Set<string>): Row[] {
  const actualPath = existsSync(filePath) ? filePath : (ALT_PATHS[filePath] ?? null);
  if (!actualPath || !existsSync(actualPath)) {
    console.warn(`  File not found: ${filePath} — skipping`);
    return [];
  }

  const raw = readFileSync(actualPath, 'utf-8');
  const lines = raw.trim().split('\n');
  const header = lines[0].replace(/"/g, '').split(',');
  // Expected: ISO3, Name, 1995, 1996, ..., 2022/2023
  const yearIndices: { year: number; col: number }[] = [];
  for (let i = 2; i < header.length; i++) {
    const y = parseInt(header[i].trim());
    if (!isNaN(y) && y >= YEAR_START && y <= YEAR_END) {
      yearIndices.push({ year: y, col: i });
    }
  }

  const rows: Row[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].replace(/"/g, '').split(',');
    const iso3 = cols[0]?.trim().toUpperCase();
    if (!iso3 || iso3.length !== 3 || !validIso3.has(iso3)) continue;

    for (const { year, col } of yearIndices) {
      const val = parseFloat(cols[col]);
      if (isNaN(val)) continue;
      rows.push({ country_iso3: iso3, indicator_code: indicatorCode, year, value: Math.round(val * 1e6) / 1e6, source: 'ND-GAIN' });
    }
  }
  return rows;
}

async function main() {
  const { data: countries, error: cErr } = await supabase.from('countries').select('iso3');
  if (cErr || !countries) { console.error('Cannot load countries:', cErr?.message); process.exit(1); }
  const validIso3 = new Set(countries.map((c: { iso3: string }) => c.iso3.trim().toUpperCase()));
  console.log(`Loaded ${validIso3.size} valid iso3 codes`);

  let allRows: Row[] = [];
  for (const { path, code } of FILES) {
    const rows = parseCsv(path, code, validIso3);
    console.log(`${code}: ${rows.length} rows for ${new Set(rows.map(r => r.country_iso3)).size} countries`);
    allRows = allRows.concat(rows);
  }

  if (allRows.length === 0) {
    console.warn('No ND-GAIN data found. Place CSVs at /tmp/ndgain/*.csv or data/*.csv and re-run.');
    process.exit(0);
  }

  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < allRows.length; i += BATCH) {
    const batch = allRows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('country_data')
      .upsert(batch, { onConflict: 'country_iso3,indicator_code,year' });
    if (error) console.warn(`Batch error: ${error.message}`);
    else upserted += batch.length;
  }

  console.log(`✅ Done. Upserted ${upserted} ND-GAIN rows.`);
}

main().catch(err => { console.error(err); process.exit(1); });
