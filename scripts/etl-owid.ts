/**
 * scripts/etl-owid.ts
 * Downloads OWID CO2 dataset CSV → 27 indicators → country_data
 * Run: npx tsx --env-file=.env.local scripts/etl-owid.ts
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
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const CSV_URL = 'https://owid-public.owid.io/data/co2/owid-co2-data.csv';
const CSV_PATH = '/tmp/owid-co2-data.csv';

interface OwidCol {
  csvCol: string;
  code: string;
  name: string;
  unit: string;
}

const OWID_COLUMNS: OwidCol[] = [
  { csvCol: 'co2',                         code: 'OWID.CO2',                         name: 'Annual CO2 emissions',                   unit: 'Mt CO2' },
  { csvCol: 'co2_per_capita',              code: 'OWID.CO2_PER_CAPITA',              name: 'CO2 emissions per capita',               unit: 't CO2/person' },
  { csvCol: 'co2_per_gdp',                 code: 'OWID.CO2_PER_GDP',                 name: 'CO2 per unit GDP',                       unit: 'kg CO2 per $' },
  { csvCol: 'cumulative_co2',              code: 'OWID.CUMULATIVE_CO2',              name: 'Cumulative CO2 emissions',               unit: 'Mt CO2' },
  { csvCol: 'share_global_co2',            code: 'OWID.SHARE_GLOBAL_CO2',            name: 'Share of global CO2 emissions',          unit: '%' },
  { csvCol: 'share_global_cumulative_co2', code: 'OWID.SHARE_GLOBAL_CUMULATIVE_CO2', name: 'Share of global cumulative CO2',         unit: '%' },
  { csvCol: 'consumption_co2',             code: 'OWID.CONSUMPTION_CO2',             name: 'Consumption-based CO2 emissions',        unit: 'Mt CO2' },
  { csvCol: 'consumption_co2_per_capita',  code: 'OWID.CONSUMPTION_CO2_PER_CAPITA',  name: 'Consumption CO2 per capita',             unit: 't CO2/person' },
  { csvCol: 'co2_including_luc',           code: 'OWID.CO2_INCLUDING_LUC',           name: 'CO2 including land-use change',          unit: 'Mt CO2' },
  { csvCol: 'methane',                     code: 'OWID.METHANE',                     name: 'Methane emissions',                      unit: 'Mt CO2e' },
  { csvCol: 'methane_per_capita',          code: 'OWID.METHANE_PER_CAPITA',          name: 'Methane emissions per capita',           unit: 't CO2e/person' },
  { csvCol: 'nitrous_oxide',               code: 'OWID.NITROUS_OXIDE',               name: 'Nitrous oxide emissions',                unit: 'Mt CO2e' },
  { csvCol: 'nitrous_oxide_per_capita',    code: 'OWID.NITROUS_OXIDE_PER_CAPITA',    name: 'Nitrous oxide per capita',               unit: 't CO2e/person' },
  { csvCol: 'total_ghg',                   code: 'OWID.TOTAL_GHG',                   name: 'Total GHG emissions',                    unit: 'Mt CO2e' },
  { csvCol: 'total_ghg_excluding_lucf',    code: 'OWID.TOTAL_GHG_EXCLUDING_LUCF',    name: 'Total GHG excl. land-use change',        unit: 'Mt CO2e' },
  { csvCol: 'ghg_per_capita',              code: 'OWID.GHG_PER_CAPITA',              name: 'GHG emissions per capita',               unit: 't CO2e/person' },
  { csvCol: 'temperature_change_from_co2', code: 'OWID.TEMPERATURE_CHANGE_FROM_CO2', name: 'Temperature change from CO2',            unit: '°C' },
  { csvCol: 'temperature_change_from_ghg', code: 'OWID.TEMPERATURE_CHANGE_FROM_GHG', name: 'Temperature change from GHGs',           unit: '°C' },
  { csvCol: 'temperature_change_from_ch4', code: 'OWID.TEMPERATURE_CHANGE_FROM_CH4', name: 'Temperature change from CH4',            unit: '°C' },
  { csvCol: 'temperature_change_from_n2o', code: 'OWID.TEMPERATURE_CHANGE_FROM_N2O', name: 'Temperature change from N2O',            unit: '°C' },
  { csvCol: 'coal_co2',                    code: 'OWID.COAL_CO2',                    name: 'CO2 from coal',                          unit: 'Mt CO2' },
  { csvCol: 'oil_co2',                     code: 'OWID.OIL_CO2',                     name: 'CO2 from oil',                           unit: 'Mt CO2' },
  { csvCol: 'gas_co2',                     code: 'OWID.GAS_CO2',                     name: 'CO2 from gas',                           unit: 'Mt CO2' },
  { csvCol: 'cement_co2',                  code: 'OWID.CEMENT_CO2',                  name: 'CO2 from cement',                        unit: 'Mt CO2' },
  { csvCol: 'flaring_co2',                 code: 'OWID.FLARING_CO2',                 name: 'CO2 from flaring',                       unit: 'Mt CO2' },
  { csvCol: 'energy_per_capita',           code: 'OWID.ENERGY_PER_CAPITA',           name: 'Energy consumption per capita',          unit: 'kWh/person' },
  { csvCol: 'energy_per_gdp',              code: 'OWID.ENERGY_PER_GDP',              name: 'Energy consumption per unit GDP',         unit: 'kWh/$' },
];

async function downloadCsv(): Promise<void> {
  if (existsSync(CSV_PATH)) {
    console.log('CSV already cached at', CSV_PATH);
    return;
  }
  console.log('Downloading OWID CO2 CSV…');
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

async function upsertIndicators(): Promise<void> {
  const rows = OWID_COLUMNS.map(c => ({
    code: c.code,
    name: c.name,
    unit: c.unit,
    source: 'OWID',
    category: 'emissions',
    domain: 'Climate',
  }));
  const { error } = await supabase
    .from('indicators')
    .upsert(rows, { onConflict: 'code' });
  if (error) {
    console.error('Failed to upsert indicators:', error.message);
    process.exit(1);
  }
  console.log(`✓ Upserted ${rows.length} OWID indicator rows`);
}

async function main() {
  await upsertIndicators();
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

  const colISO  = header.indexOf('iso_code');
  const colYear = header.indexOf('year');
  if (colISO < 0 || colYear < 0) {
    console.error('Required columns iso_code or year not found in CSV');
    process.exit(1);
  }

  // Map CSV column names to header indices
  const cols: { idx: number; code: string }[] = [];
  for (const c of OWID_COLUMNS) {
    const idx = header.indexOf(c.csvCol);
    if (idx >= 0) cols.push({ idx, code: c.code });
    else console.warn(`  Column not in CSV: ${c.csvCol}`);
  }
  console.log(`Found ${cols.length}/${OWID_COLUMNS.length} OWID columns in CSV header`);

  interface Row { country_iso3: string; indicator_code: string; year: number; value: number; source: string }
  const rows: Row[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const csvCols = parseCSVLine(line);

    const isoRaw = csvCols[colISO]?.trim();
    // Filter: exactly 3 uppercase letters (excludes OWID_* aggregates)
    if (!isoRaw || !/^[A-Z]{3}$/.test(isoRaw)) continue;
    if (!validIso3.has(isoRaw)) continue;

    const year = parseInt(csvCols[colYear], 10);
    if (isNaN(year) || year < 2000 || year > 2023) continue;

    for (const { idx, code } of cols) {
      const rawVal = csvCols[idx]?.trim();
      if (!rawVal || rawVal === '') continue;
      const val = parseFloat(rawVal);
      if (isNaN(val)) continue;
      rows.push({ country_iso3: isoRaw, indicator_code: code, year, value: val, source: 'OWID CO2' });
    }
  }

  const countrySet = new Set(rows.map(r => r.country_iso3));
  console.log(`Parsed ${rows.length} rows for ${countrySet.size} countries`);

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
    if (i % 20000 === 0 && i > 0) console.log(`  Progress: ${i}/${rows.length}`);
  }

  console.log(`\n✅ Done. Upserted ${upserted} OWID rows for ${countrySet.size} countries.`);
}

main().catch(err => { console.error(err); process.exit(1); });
