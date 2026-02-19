/**
 * scripts/etl-climatetrace.ts
 * Fetches Climate TRACE v7 sector emissions for all countries → country_data
 * Note: v7 API returns only the most recent available year (currently 2024).
 * 9 sectors + CTRACE.TOTAL (sum) per country.
 * Run: npx tsx --env-file=.env.local scripts/etl-climatetrace.ts
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

const BASE_URL = 'https://api.climatetrace.org/v7';
const PAGE_SIZE = 300;

const SECTORS = [
  'power',
  'manufacturing',
  'transportation',
  'agriculture',
  'fossil_fuel_operations',
  'buildings',
  'waste',
  'forestry_and_land_use',
  'mineral_extraction',
] as const;
type Sector = typeof SECTORS[number];

const INDICATOR_MAP: Record<Sector | 'total', string> = {
  power:                   'CTRACE.POWER',
  manufacturing:           'CTRACE.MANUFACTURING',
  transportation:          'CTRACE.TRANSPORTATION',
  agriculture:             'CTRACE.AGRICULTURE',
  fossil_fuel_operations:  'CTRACE.FOSSIL_FUEL_OPERATIONS',
  buildings:               'CTRACE.BUILDINGS',
  waste:                   'CTRACE.WASTE',
  forestry_and_land_use:   'CTRACE.FORESTRY_AND_LAND_USE',
  mineral_extraction:      'CTRACE.MINERAL_EXTRACTION',
  total:                   'CTRACE.TOTAL',
};

const INDICATOR_META: Record<string, { name: string; unit: string }> = {
  'CTRACE.POWER':                  { name: 'Power sector emissions (Climate TRACE)',                unit: 'tonnes CO2e' },
  'CTRACE.MANUFACTURING':          { name: 'Manufacturing sector emissions (Climate TRACE)',         unit: 'tonnes CO2e' },
  'CTRACE.TRANSPORTATION':         { name: 'Transportation sector emissions (Climate TRACE)',        unit: 'tonnes CO2e' },
  'CTRACE.AGRICULTURE':            { name: 'Agriculture sector emissions (Climate TRACE)',           unit: 'tonnes CO2e' },
  'CTRACE.FOSSIL_FUEL_OPERATIONS': { name: 'Fossil fuel operations emissions (Climate TRACE)',      unit: 'tonnes CO2e' },
  'CTRACE.BUILDINGS':              { name: 'Buildings sector emissions (Climate TRACE)',             unit: 'tonnes CO2e' },
  'CTRACE.WASTE':                  { name: 'Waste sector emissions (Climate TRACE)',                 unit: 'tonnes CO2e' },
  'CTRACE.FORESTRY_AND_LAND_USE':  { name: 'Forestry and land-use emissions (Climate TRACE)',       unit: 'tonnes CO2e' },
  'CTRACE.MINERAL_EXTRACTION':     { name: 'Mineral extraction emissions (Climate TRACE)',          unit: 'tonnes CO2e' },
  'CTRACE.TOTAL':                  { name: 'Total GHG emissions — all sectors (Climate TRACE)',     unit: 'tonnes CO2e' },
};

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

interface CTRanking {
  rank: number;
  country: string;
  name: string;
  gas: string;
  emissionsQuantity: number;
  emissionsPerCapita: number;
  percentage: number;
  emissionsPercentChange: number;
}

interface CTResponse {
  totals: { gas: string; emissionsQuantity: number; start: string; end: string };
  location: { name: string };
  rankings: CTRanking[];
}

async function fetchSector(sector: Sector): Promise<{ year: number; data: Map<string, number> }> {
  const result = new Map<string, number>();
  let dataYear = new Date().getFullYear();
  let page = 1;

  while (true) {
    const url = `${BASE_URL}/rankings/countries?sector=${sector}&size=${PAGE_SIZE}&page=${page}`;
    let res: Response;
    try {
      res = await fetch(url, { headers: { Accept: 'application/json' } });
    } catch (e) {
      console.warn(`  Network error ${sector} p${page}: ${(e as Error).message}`);
      break;
    }

    if (!res.ok) {
      console.warn(`  HTTP ${res.status} for ${sector} p${page}`);
      break;
    }

    let data: CTResponse;
    try {
      data = await res.json() as CTResponse;
    } catch {
      console.warn(`  JSON parse error for ${sector} p${page}`);
      break;
    }

    // Extract year from totals.start (e.g. "2024-01-01" → 2024)
    if (data.totals?.start) {
      dataYear = parseInt(data.totals.start.slice(0, 4), 10);
    }

    const rankings = data.rankings ?? [];
    if (rankings.length === 0) break;

    for (const entry of rankings) {
      const iso3 = entry.country?.trim().toUpperCase();
      if (!iso3 || iso3.length !== 3) continue;
      if (typeof entry.emissionsQuantity !== 'number') continue;
      result.set(iso3, (result.get(iso3) ?? 0) + entry.emissionsQuantity);
    }

    if (rankings.length < PAGE_SIZE) break;
    page++;
    await delay(300);
  }

  return { year: dataYear, data: result };
}

async function upsertIndicators(): Promise<void> {
  const rows = Object.entries(INDICATOR_META).map(([code, meta]) => ({
    code,
    name: meta.name,
    unit: meta.unit,
    source: 'Climate TRACE',
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
  console.log(`✓ Upserted ${rows.length} CTRACE indicator rows`);
}

async function main() {
  await upsertIndicators();

  // Load valid iso3 from countries table
  const { data: countries, error: cErr } = await supabase.from('countries').select('iso3');
  if (cErr || !countries) { console.error('Cannot load countries:', cErr?.message); process.exit(1); }
  const validIso3 = new Set(countries.map((c: { iso3: string }) => c.iso3.trim().toUpperCase()));
  console.log(`Loaded ${validIso3.size} valid iso3 codes`);
  console.log('Note: Climate TRACE v7 API returns only the latest available year.\n');

  interface Row { country_iso3: string; indicator_code: string; year: number; value: number; source: string }
  const allRows: Row[] = [];

  let dataYear: number | null = null;
  const totalsByCountry = new Map<string, number>();

  for (const sector of SECTORS) {
    const { year, data: sectorData } = await fetchSector(sector);
    if (dataYear === null) dataYear = year;
    console.log(`  ${sector}: ${sectorData.size} countries (year=${year})`);

    for (const [iso3, val] of sectorData) {
      if (!validIso3.has(iso3)) continue;
      allRows.push({
        country_iso3:   iso3,
        indicator_code: INDICATOR_MAP[sector],
        year,
        value:          val,
        source:         'Climate TRACE',
      });
      totalsByCountry.set(iso3, (totalsByCountry.get(iso3) ?? 0) + val);
    }

    await delay(800);
  }

  // CTRACE.TOTAL = sum across all sectors per country
  const year = dataYear ?? new Date().getFullYear();
  for (const [iso3, total] of totalsByCountry) {
    allRows.push({
      country_iso3:   iso3,
      indicator_code: 'CTRACE.TOTAL',
      year,
      value:          total,
      source:         'Climate TRACE',
    });
  }
  console.log(`  TOTAL: ${totalsByCountry.size} countries computed`);

  const countrySet = new Set(allRows.map(r => r.country_iso3));
  console.log(`\nCollected ${allRows.length} rows for ${countrySet.size} countries (year=${year})`);

  // Upsert in batches of 500
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

  console.log(`\n✅ Done. Upserted ${upserted} Climate TRACE rows for ${countrySet.size} countries.`);
}

main().catch(err => { console.error(err); process.exit(1); });
