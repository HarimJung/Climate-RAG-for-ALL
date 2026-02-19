/**
 * scripts/etl-ember.ts
 * Downloads OWID Energy CSV (Ember-sourced columns) → country_data
 * Run: npx tsx --env-file=.env.local scripts/etl-ember.ts
 */

import { createClient } from '@supabase/supabase-js';
import { createWriteStream, existsSync, readFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const CSV_URL = 'https://nyc3.digitaloceanspaces.com/owid-public/data/energy/owid-energy-data.csv';
const CSV_PATH = '/tmp/owid-energy-data.csv';

const INDICATOR_MAP: Record<string, string> = {
  renewables_share_elec:  'EMBER.RENEWABLE.PCT',
  fossil_share_elec:      'EMBER.FOSSIL.PCT',
  carbon_intensity_elec:  'EMBER.CARBON.INTENSITY',
};

async function downloadCsv(): Promise<void> {
  if (existsSync(CSV_PATH)) {
    console.log('CSV already cached at', CSV_PATH);
    return;
  }
  console.log('Downloading OWID Energy CSV (~50MB)…');
  const res = await fetch(CSV_URL);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const ws = createWriteStream(CSV_PATH);
  await pipeline(Readable.fromWeb(res.body as import('stream/web').ReadableStream), ws);
  console.log('Download complete.');
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuotes = !inQuotes; continue; }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
    current += ch;
  }
  result.push(current);
  return result;
}

async function main() {
  await downloadCsv();

  // Load valid iso3 from countries table
  const { data: countries, error: cErr } = await supabase.from('countries').select('iso3');
  if (cErr || !countries) { console.error('Cannot load countries:', cErr?.message); process.exit(1); }
  const validIso3 = new Set(countries.map((c: { iso3: string }) => c.iso3.trim().toUpperCase()));
  console.log(`Loaded ${validIso3.size} valid iso3 codes`);

  console.log('Parsing CSV…');
  const raw = readFileSync(CSV_PATH, 'utf-8');
  const lines = raw.split('\n');
  const header = parseCSVLine(lines[0]);

  const colISO = header.indexOf('iso_code');
  const colYear = header.indexOf('year');
  const emberCols: { col: number; indicatorCode: string }[] = [];
  for (const [csvCol, indCode] of Object.entries(INDICATOR_MAP)) {
    const idx = header.indexOf(csvCol);
    if (idx >= 0) emberCols.push({ col: idx, indicatorCode: indCode });
  }

  if (colISO < 0 || colYear < 0 || emberCols.length === 0) {
    console.error('Required columns not found in CSV header');
    process.exit(1);
  }

  console.log(`Ember columns found: ${emberCols.map(c => c.indicatorCode).join(', ')}`);

  interface Row { country_iso3: string; indicator_code: string; year: number; value: number; source: string }
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const cols = parseCSVLine(line);
    const iso3 = cols[colISO]?.trim().toUpperCase();
    if (!iso3 || iso3.length !== 3 || !validIso3.has(iso3)) continue;
    const year = parseInt(cols[colYear], 10);
    if (isNaN(year) || year < 2000 || year > 2023) continue;

    for (const { col, indicatorCode } of emberCols) {
      const raw = cols[col]?.trim();
      if (!raw || raw === '') continue;
      const val = parseFloat(raw);
      if (isNaN(val)) continue;
      rows.push({ country_iso3: iso3, indicator_code: indicatorCode, year, value: val, source: 'Ember/OWID' });
    }
  }

  console.log(`Parsed ${rows.length} rows for ${new Set(rows.map(r => r.country_iso3)).size} countries`);

  // Upsert in batches of 500
  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await supabase
      .from('country_data')
      .upsert(batch, { onConflict: 'country_iso3,indicator_code,year' });
    if (error) console.warn(`Batch error: ${error.message}`);
    else upserted += batch.length;
    if (i % 5000 === 0) process.stdout.write(`  Progress: ${i}/${rows.length}\r`);
  }

  console.log(`\n✅ Done. Upserted ${upserted} Ember rows.`);
}

main().catch(err => { console.error(err); process.exit(1); });
